import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { generateText, Output, tool, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import dotenv from 'dotenv';
import type { Request, Response } from 'express';

dotenv.config();

const execAsync = promisify(exec);

// ==========================================
// Configuration (Environment Variables)
// ==========================================
const BASE_URL = process.env.STORIES_API_BASE_URL;
const API_KEY = process.env.STORIES_API_KEY;

if (!BASE_URL || !API_KEY) {
  console.error('Error: Missing required environment variables');
  console.error('Please set STORIES_API_BASE_URL and STORIES_API_KEY');
  process.exit(1);
}

const MODEL_NAME = 'gpt-4o';
const META_MODEL_NAME = 'gpt-4o-mini';
const DEFAULT_CONTEXT_WINDOW = 128 * 1024;
const MIN_RESERVE_TOKENS = 4 * 1024;
const DEFAULT_TOOL_TIMEOUT_MS = 20_000;
const MAX_TOOL_TIMEOUT_MS = 120_000;
const TOOL_MAX_BUFFER_BYTES = 4 * 1024 * 1024;
const MAX_AUTO_COMPRESSION_PASSES = 2;
const serverDir = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(serverDir, '..', '..');

const openai = createOpenAI({ baseURL: BASE_URL, apiKey: API_KEY });

// ==========================================
// 1. 核心架构定义 (基于 V5)
// ==========================================
type SceneId = string;
type WindowId = string;
type NodeType = 'user' | 'assistant' | 'tool' | 'system' | 'sentinel';

enum DisplayMode { COLLAPSED = 'COLLAPSED', EXPANDED = 'EXPANDED' }

interface Scene {
    id: SceneId;
    parentId: SceneId | null;
    type: NodeType;
    content: string;
    summary: string;
    tokenCount: number;
}

interface Story { headSceneId: SceneId; }

interface RuntimeModelConfig {
    contextWindow: number;
    reserveTokens: number;
    compressionThreshold: number;
    forkHistoryTargetTokens: number;
    source: 'api' | 'fallback';
}

interface CompressionAction {
    type: 'collapse' | 'recycle';
    wid?: string;
    count?: number;
    reason: string;
}

interface CompressionResult {
    logs: string[];
    applied: boolean;
}

interface ModelMetadataRecord extends Record<string, unknown> {
    id?: string;
}

class StoryGraph {
    public nodes: Map<SceneId, Scene> = new Map();
    addScene(scene: Scene) { this.nodes.set(scene.id, scene); }
    getScene(id: SceneId) { return this.nodes.get(id); }
    resolvePath(headId: SceneId): Scene[] {
        const path: Scene[] = [];
        let currentId: SceneId | null = headId;
        while (currentId) {
            const scene = this.nodes.get(currentId);
            if (!scene) break;
            path.unshift(scene);
            currentId = scene.parentId;
        }
        return path;
    }
}

class ContextWindow {
    public activeStory: Story;
    public sceneStateMap: Map<SceneId, { wid: WindowId; mode: DisplayMode }> = new Map();
    public widCounter: number = 1;
    public windowStartIndex: number = 0;
    public historySummary: string = "";

    constructor(initialStory: Story) { this.activeStory = initialStory; }
    updateStory(newStory: Story) { this.activeStory = newStory; }

    getOrAssignState(sceneId: SceneId) {
        if (!this.sceneStateMap.has(sceneId)) {
            this.sceneStateMap.set(sceneId, { wid: `S${this.widCounter++}`, mode: DisplayMode.EXPANDED });
        }
        return this.sceneStateMap.get(sceneId)!;
    }

    render(graph: StoryGraph): string {
        const fullPath = graph.resolvePath(this.activeStory.headSceneId);
        const visibleScenes = fullPath.slice(this.windowStartIndex);
        let prompt = "";
        if (this.historySummary) prompt += `[GLOBAL HISTORY SUMMARY]\n${this.historySummary}\n\n====================\n\n`;
        
        prompt += visibleScenes
            .filter(scene => scene.type !== 'sentinel')
            .map(scene => {
                const state = this.getOrAssignState(scene.id);
                const prefix = `[${state.wid}] (${scene.type})`;
                if (state.mode === DisplayMode.COLLAPSED) return `${prefix} [SUMMARY]: ${scene.summary}\n(Note: Full content hidden)`;
                return `${prefix}:\n${scene.content}`;
            }).join('\n\n---\n\n');
        return prompt;
    }
}

// ==========================================
// 2. 全局状态初始化
// ==========================================
const graph = new StoryGraph();
const stories = new Map<string, Story>();
const windows = new Map<string, ContextWindow>();
let activeStoryId = 'story_main';

let runtimeModelConfigPromise: Promise<RuntimeModelConfig> | null = null;

const generateHash = (text: string) => crypto.createHash('md5').update(text + Math.random()).digest('hex').substring(0, 8);
// Char/4 remains an estimate, but it is sufficient for lightweight context-budget heuristics in this demo.
const estimateTokenCount = (text: string) => Math.max(1, Math.ceil(text.length / 4));
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function buildRuntimeModelConfig(contextWindow: number, source: 'api' | 'fallback'): RuntimeModelConfig {
    const maxReserveTokens = Math.max(MIN_RESERVE_TOKENS, Math.floor(contextWindow / 2));
    const reserveTokens = clamp(Math.round(contextWindow * 0.15), MIN_RESERVE_TOKENS, maxReserveTokens);
    const compressionThreshold = Math.max(MIN_RESERVE_TOKENS, contextWindow - reserveTokens);
    const forkHistoryTargetTokens = clamp(
        Math.round(contextWindow * 0.25),
        MIN_RESERVE_TOKENS,
        Math.max(MIN_RESERVE_TOKENS, Math.floor(compressionThreshold * 0.6)),
    );

    return {
        contextWindow,
        reserveTokens,
        compressionThreshold,
        forkHistoryTargetTokens,
        source,
    };
}

function getModelsEndpoint(baseUrl: string): string {
    return new URL('models', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
}

function parsePositiveInteger(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.round(value);
    if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return undefined;
}

function extractContextWindow(candidate: unknown, depth = 0): number | undefined {
    if (!candidate || depth > 3 || typeof candidate !== 'object') return undefined;

    const keyCandidates = [
        'context_window',
        'contextWindow',
        'context_length',
        'contextLength',
        'max_context_length',
        'maxContextLength',
        'max_model_len',
        'maxModelLen',
        'input_token_limit',
        'inputTokenLimit',
        'num_ctx',
    ];

    for (const key of keyCandidates) {
        const parsed = parsePositiveInteger((candidate as Record<string, unknown>)[key]);
        if (parsed) return parsed;
    }

    for (const value of Object.values(candidate as Record<string, unknown>)) {
        const nested = extractContextWindow(value, depth + 1);
        if (nested) return nested;
    }

    return undefined;
}

async function discoverModelContextWindow(): Promise<RuntimeModelConfig> {
    try {
        const response = await fetch(getModelsEndpoint(BASE_URL), {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Model discovery failed with HTTP ${response.status}`);
        }

        const payload = await response.json();
        const models: ModelMetadataRecord[] = Array.isArray(payload?.data)
            ? payload.data.filter((model: unknown): model is ModelMetadataRecord => !!model && typeof model === 'object')
            : [];
        const matchingModel = models.find(model => model.id === MODEL_NAME) ?? models[0];
        const discoveredContextWindow = extractContextWindow(matchingModel);

        if (!discoveredContextWindow) {
            throw new Error('Model metadata did not include a context window');
        }

        return buildRuntimeModelConfig(discoveredContextWindow, 'api');
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[stories] Falling back to ${DEFAULT_CONTEXT_WINDOW} tokens for ${MODEL_NAME}: ${message}`);
        return buildRuntimeModelConfig(DEFAULT_CONTEXT_WINDOW, 'fallback');
    }
}

async function getRuntimeModelConfig(): Promise<RuntimeModelConfig> {
    if (!runtimeModelConfigPromise) {
        runtimeModelConfigPromise = discoverModelContextWindow();
    }
    return runtimeModelConfigPromise;
}

function buildAgentSystemPrompt(renderedContext: string, runtimeConfig: RuntimeModelConfig): string {
    return `You are the coding agent running inside Stories. Continue the current task from ${REPO_ROOT}.

Operating rules:
1. Understand the goal first, then inspect the repository, then make changes, then validate them.
2. Treat CURRENT CONTEXT as your primary state. If information is missing, use tools to gather facts instead of guessing.
3. Make purposeful tool calls. Batch related inspection steps when possible and avoid redundant commands.
4. Read the target files before editing. After editing, run the smallest validation that proves the change works.
5. Keep responses concise and action-oriented. Focus on conclusions, next steps, and tool outcomes.

Bash tool guidance:
- The default working directory is ${REPO_ROOT}
- Prefer rg, ls, find, sed -n, and cat for repository inspection
- Prefer reproducible commands or small scripts for edits and avoid destructive commands
- If command output is truncated, rerun a narrower command instead of repeating the same broad command

Runtime budget:
- Primary model: ${MODEL_NAME}
- Maximum context: ~${runtimeConfig.contextWindow} tokens (${runtimeConfig.source === 'api' ? 'API discovery' : '128K fallback'})
- Heuristic compression threshold: ~${runtimeConfig.compressionThreshold} tokens
- Reserved buffer: ~${runtimeConfig.reserveTokens} tokens

========== CURRENT CONTEXT ==========
${renderedContext}
=====================================`;
}

function buildCompressionSystemPrompt(runtimeConfig: RuntimeModelConfig): string {
    return `You are the meta-agent responsible for context compression. Recover context budget for the main agent without breaking task continuity.

Compression policy:
1. Prefer collapsing older verbose assistant or tool output first.
2. Recycle the oldest visible scenes only when collapsing is not enough.
3. Preserve the latest user request, the latest assistant reply, and the most important recent tool results unless there is no alternative.
4. Use as few actions as possible, but ensure the remaining context falls below the threshold.
5. Return schema-compliant actions only. Do not add extra prose.

Current budget:
- Maximum context: ${runtimeConfig.contextWindow} tokens
- Compression threshold: ${runtimeConfig.compressionThreshold} tokens
- Reserved buffer: ${runtimeConfig.reserveTokens} tokens`;
}

function resolveToolCwd(cwd?: string): string {
    const resolved = cwd
        ? (cwd.startsWith('/') ? resolve(cwd) : resolve(REPO_ROOT, cwd))
        : REPO_ROOT;

    if (resolved !== REPO_ROOT && !resolved.startsWith(`${REPO_ROOT}/`)) {
        throw new Error(`cwd must stay inside the repository: ${REPO_ROOT}`);
    }

    return resolved;
}

function truncateToolOutput(output: string, runtimeConfig: RuntimeModelConfig): string {
    const maxChars = clamp(runtimeConfig.reserveTokens * 4, 4_000, 20_000);
    if (output.length <= maxChars) return output;

    const headLength = Math.floor(maxChars * 0.7);
    const tailLength = maxChars - headLength;
    return `${output.slice(0, headLength)}\n\n...[truncated ${output.length - maxChars} chars]...\n\n${output.slice(-tailLength)}`;
}

function getExecErrorDetails(error: unknown): { message: string; stdout: string; stderr: string } {
    if (error instanceof Error) {
        const execError = error as Error & { stdout?: string; stderr?: string };
        return {
            message: error.message,
            stdout: execError.stdout ?? '',
            stderr: execError.stderr ?? '',
        };
    }

    return {
        message: String(error),
        stdout: '',
        stderr: '',
    };
}

function getVisibleScenes(window: ContextWindow): Scene[] {
    return graph
        .resolvePath(window.activeStory.headSceneId)
        .slice(window.windowStartIndex)
        .filter(scene => scene.type !== 'sentinel');
}

function buildCompressionSnapshot(window: ContextWindow) {
    return getVisibleScenes(window).map((scene, index) => {
        const state = window.getOrAssignState(scene.id);
        return {
            index,
            wid: state.wid,
            type: scene.type,
            mode: state.mode,
            tokenCount: scene.tokenCount,
            summary: scene.summary,
        };
    });
}

function appendHistorySummary(window: ContextWindow, scenes: Scene[]): void {
    const addition = scenes
        .map(scene => {
            const state = window.getOrAssignState(scene.id);
            return `[${state.wid}] (${scene.type}) ${scene.summary}`;
        })
        .join('\n');

    if (!addition) return;

    window.historySummary = window.historySummary
        ? `${window.historySummary}\n${addition}`.trim()
        : addition;
}

function recycleOldestScenes(window: ContextWindow, count: number): number {
    const fullPath = graph.resolvePath(window.activeStory.headSceneId);
    let nextIndex = window.windowStartIndex;
    let remaining = Math.max(0, count);
    const scenesToRecycle: Scene[] = [];

    while (nextIndex < fullPath.length && remaining > 0) {
        const scene = fullPath[nextIndex++];
        if (scene.type === 'sentinel') continue;
        scenesToRecycle.push(scene);
        remaining--;
    }

    appendHistorySummary(window, scenesToRecycle);
    window.windowStartIndex = nextIndex;
    return scenesToRecycle.length;
}

async function runMetaCompression(storyId: string, runtimeConfig?: RuntimeModelConfig): Promise<CompressionResult> {
    const storyWindow = windows.get(storyId)!;
    const runtime = runtimeConfig ?? await getRuntimeModelConfig();
    const snapshot = buildCompressionSnapshot(storyWindow);
    const currentPromptTokens = estimateTokenCount(buildAgentSystemPrompt(storyWindow.render(graph), runtime));

    const { output } = await generateText({
        model: openai(META_MODEL_NAME),
        system: buildCompressionSystemPrompt(runtime),
        prompt: `Current window snapshot:\n${JSON.stringify({
            currentPromptTokens,
            compressionThreshold: runtime.compressionThreshold,
            reserveTokens: runtime.reserveTokens,
            scenes: snapshot,
        }, null, 2)}`,
        output: Output.object({
            schema: z.object({
                actions: z.array(z.object({
                    type: z.enum(['collapse', 'recycle']),
                    wid: z.string().optional(),
                    count: z.number().int().positive().optional(),
                    reason: z.string(),
                })),
            }),
        }),
    });

    const logs: string[] = [];

    for (const act of output.actions as CompressionAction[]) {
        if (act.type === 'collapse' && act.wid) {
            const sceneId = Array.from(storyWindow.sceneStateMap.entries()).find(([, value]) => value.wid === act.wid)?.[0];
            const state = sceneId ? storyWindow.sceneStateMap.get(sceneId) : undefined;

            if (state && state.mode !== DisplayMode.COLLAPSED) {
                state.mode = DisplayMode.COLLAPSED;
                logs.push(`折叠了 ${act.wid}: ${act.reason}`);
            }
        } else if (act.type === 'recycle' && act.count) {
            const recycledCount = recycleOldestScenes(storyWindow, act.count);
            if (recycledCount > 0) {
                logs.push(`驱逐了最老的 ${recycledCount} 个 Scene: ${act.reason}`);
            }
        }
    }

    return { logs, applied: logs.length > 0 };
}

// 初始化根节点和第一个哨兵
const rootId = generateHash('root');
graph.addScene({ id: rootId, parentId: null, type: 'system', content: 'Agent Initialized.', summary: 'Root', tokenCount: 2 });
const initialSentinelId = generateHash('sentinel_init');
graph.addScene({ id: initialSentinelId, parentId: rootId, type: 'sentinel', content: '', summary: '', tokenCount: 0 });

stories.set(activeStoryId, { headSceneId: initialSentinelId });
windows.set(activeStoryId, new ContextWindow(stories.get(activeStoryId)!));

// ==========================================
// 3. 核心写入操作 (满足函数式及哨兵规则)
// ==========================================
function appendData(storyId: string, type: NodeType, content: string, summary?: string): SceneId {
    const story = stories.get(storyId)!;
    const window = windows.get(storyId)!;
    const currentSentinel = graph.getScene(story.headSceneId)!;

    // 1. 填充实体节点 (挂载到原哨兵的父节点)
    const entityId = generateHash(content);
        const entityScene: Scene = {
            id: entityId,
            parentId: currentSentinel.parentId,
            type,
            content,
            summary: summary || (content.substring(0, 50) + "..."),
            tokenCount: estimateTokenCount(content)
        };
    graph.addScene(entityScene);

    // 2. 新增哨兵节点
    const newSentinelId = generateHash('sentinel_new');
    graph.addScene({ id: newSentinelId, parentId: entityId, type: 'sentinel', content: '', summary: '', tokenCount: 0 });

    // 3. 推进上下文
    story.headSceneId = newSentinelId;
    window.updateStory(story);
    
    // 强制触发一次 getOrAssignState 为新节点分配 WID
    window.getOrAssignState(entityId);
    return entityId;
}

// ==========================================
// 4. API 路由
// ==========================================
const app = express();
app.use(cors());
app.use(express.json());

// 获取当前全景状态供 UI 渲染
app.get('/api/state', (_req: Request, res: Response) => {
    const story = stories.get(activeStoryId)!;
    const window = windows.get(activeStoryId)!;
    const fullPath = graph.resolvePath(story.headSceneId);

    const viewPath = fullPath.map((scene, index) => {
        if (scene.type === 'sentinel') return null;
        const state = window.getOrAssignState(scene.id);
        return {
            id: scene.id, type: scene.type, content: scene.content,
            summary: scene.summary, wid: state.wid, mode: state.mode,
            isEvicted: index < window.windowStartIndex
        };
    }).filter(Boolean);

    res.json({
        activeStoryId,
        storyIds: Array.from(stories.keys()),
        window: {
            startIndex: window.windowStartIndex,
            historySummary: window.historySummary
        },
        path: viewPath
    });
});

// 主 Agent 对话接口
app.post('/api/chat', async (req: Request, res: Response) => {
    const message = typeof req.body?.message === 'string' ? req.body.message : '';
    if (message) appendData(activeStoryId, 'user', message);

    const window = windows.get(activeStoryId)!;

    try {
        const runtimeConfig = await getRuntimeModelConfig();
        const autoCompressionLogs: string[] = [];
        let renderedContext = window.render(graph);
        let systemPrompt = buildAgentSystemPrompt(renderedContext, runtimeConfig);

        for (let pass = 0; pass < MAX_AUTO_COMPRESSION_PASSES; pass++) {
            if (estimateTokenCount(systemPrompt) <= runtimeConfig.compressionThreshold) break;

            const compression = await runMetaCompression(activeStoryId, runtimeConfig);
            autoCompressionLogs.push(...compression.logs);
            if (!compression.applied) break;

            renderedContext = window.render(graph);
            systemPrompt = buildAgentSystemPrompt(renderedContext, runtimeConfig);
        }

        const { text, steps } = await generateText({
            model: openai(MODEL_NAME),
            system: systemPrompt,
            prompt: 'Continue the task using the latest context. Call tools when needed and avoid idle filler.',
            tools: {
                bash: tool({
                    description: `Execute a bash command inside the repository. Default cwd=${REPO_ROOT}; optional cwd and timeoutMs are supported; output may be truncated.`,
                    inputSchema: z.object({
                        command: z.string(),
                        cwd: z.string().optional(),
                        timeoutMs: z.number().int().positive().max(MAX_TOOL_TIMEOUT_MS).optional(),
                    }),
                    execute: async ({ command, cwd, timeoutMs }) => {
                        const runtime = await getRuntimeModelConfig();
                        const safeCwd = resolveToolCwd(cwd);
                        const safeTimeoutMs = clamp(timeoutMs ?? DEFAULT_TOOL_TIMEOUT_MS, 1_000, MAX_TOOL_TIMEOUT_MS);

                        try {
                            const { stdout, stderr } = await execAsync(command, {
                                cwd: safeCwd,
                                timeout: safeTimeoutMs,
                                maxBuffer: TOOL_MAX_BUFFER_BYTES,
                            });

                            const combinedOutput = truncateToolOutput(
                                `${stdout}${stderr ? `\n[STDERR]\n${stderr}` : ''}`.trim() || '[no output]',
                                runtime,
                            );

                            return { command, cwd: safeCwd, output: combinedOutput };
                        } catch (error: unknown) {
                            const { message, stdout, stderr } = getExecErrorDetails(error);
                            const rawOutput = `${stdout}${stderr ? `\n[STDERR]\n${stderr}` : ''}`.trim();
                            return {
                                command,
                                cwd: safeCwd,
                                output: truncateToolOutput(rawOutput || `[EXECUTION ERROR] ${message}`, runtime),
                                error: message,
                            };
                        }
                    },
                }),
            },
            stopWhen: stepCountIs(8),
        });

        for (const log of autoCompressionLogs) {
            appendData(activeStoryId, 'system', `[自动压缩] ${log}`);
        }

        // 提取并在架构中重构中间步骤
        for (const step of steps) {
            if (step.text.trim()) {
                appendData(activeStoryId, 'assistant', step.text);
            }

            for (const toolCall of step.toolCalls) {
                appendData(
                    activeStoryId,
                    'assistant',
                    `[调用工具] ${toolCall.toolName}: ${JSON.stringify(toolCall.input)}`,
                );
            }

            for (const toolResult of step.toolResults) {
                appendData(activeStoryId, 'tool', JSON.stringify(toolResult.output ?? toolResult));
            }
        }

        if (steps.length === 0 && text.trim()) appendData(activeStoryId, 'assistant', text);
        res.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(error);
        res.status(500).json({ error: message });
    }
});

// 手动操作/工具接口
app.post('/api/action', async (req: Request, res: Response) => {
    const { action, sceneId, count, summary } = req.body;
    const window = windows.get(activeStoryId)!;

    if (action === 'switch_story') {
        const storyId = typeof req.body?.storyId === 'string' ? req.body.storyId : '';
        if (stories.has(storyId)) activeStoryId = storyId;
    }
    else if (action === 'edit_history') {
        window.historySummary = typeof summary === 'string' ? summary : '';
    }
    else if (action === 'recycle') {
        recycleOldestScenes(window, count || 1);
    }
    else if (action === 'collapse') {
        const state = window.sceneStateMap.get(sceneId);
        if (state) {
            state.mode = DisplayMode.COLLAPSED;
            // 如果提供了新的 summary，更新底层的 Scene
            if (summary) {
                const scene = graph.getScene(sceneId);
                if (scene) {
                    // 注意：严格函数式应新建节点，但在 Demo 中为求简便直接覆盖不可变节点的摘要缓存属性（不破坏结构）
                    (scene as any).summary = summary; 
                }
            }
        }
    }
    else if (action === 'expand') {
        const state = window.sceneStateMap.get(sceneId);
        if (state) state.mode = DisplayMode.EXPANDED;
    }
    else if (action === 'meta_compress') {
        const logs = (await runMetaCompression(activeStoryId)).logs;
        res.json({ success: true, logs });
        return;
    }
    else if (action === 'fork') {
        if (typeof sceneId !== 'string') {
            res.status(400).json({ error: 'sceneId is required for fork action' });
            return;
        }
        const newStoryId = `fork_${Date.now()}`;
        const targetSceneId = sceneId;
        const sourceStory = stories.get(activeStoryId)!;
        
        stories.set(newStoryId, { headSceneId: targetSceneId });
        const newWindow = new ContextWindow(stories.get(newStoryId)!);

        if (sourceStory.headSceneId === targetSceneId) {
            // Head Fork: 直接拷贝窗口状态
            newWindow.windowStartIndex = window.windowStartIndex;
            newWindow.historySummary = window.historySummary;
            newWindow.widCounter = window.widCounter;
            newWindow.sceneStateMap = new Map(JSON.parse(JSON.stringify([...window.sceneStateMap])));
        } else {
            const runtimeConfig = await getRuntimeModelConfig();
            // 历史节点 Fork: 贪心重建（保留与模型上下文相关的最近窗口）
            const path = graph.resolvePath(targetSceneId);
            let currentTokens = 0;
            let startIndex = path.length - 1;
            while (startIndex >= 0) {
                currentTokens += path[startIndex].tokenCount;
                if (currentTokens > runtimeConfig.forkHistoryTargetTokens) { startIndex++; break; }
                startIndex--;
            }
            newWindow.windowStartIndex = Math.max(0, startIndex);
        }
        windows.set(newStoryId, newWindow);
        activeStoryId = newStoryId;
    }
    
    res.json({ success: true });
});

app.listen(3001, () => {
    console.log('Agent Backend running on http://localhost:3001');
});
