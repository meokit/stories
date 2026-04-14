import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { generateText, generateObject, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

const execAsync = promisify(exec);

// ==========================================
// 配置区 (Constants)
// ==========================================
const BASE_URL = 'https://api.openai.com/v1'; // 替换为你的 Base URL
const API_KEY = 'sk-xxxxxx';                  // 替换为你的 API KEY
const MODEL_NAME = 'gpt-4o';                  // 主 Agent 模型
const META_MODEL_NAME = 'gpt-4o-mini';        // Meta-Agent 可以用小模型

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

const generateHash = (text: string) => crypto.createHash('md5').update(text + Math.random()).digest('hex').substring(0, 8);

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
        tokenCount: Math.ceil(content.length / 4) // 粗略估算
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
app.get('/api/state', (req, res) => {
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
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (message) appendData(activeStoryId, 'user', message);

    const window = windows.get(activeStoryId)!;
    const renderedContext = window.render(graph);

    const systemPrompt = `你是一个强大的系统终端Agent。请分析用户的请求，并使用工具完成任务。
规则：
1. 你的唯一状态就是下方的 CURRENT CONTEXT，请基于它进行思考和行动。
2. 优先使用 bash 工具执行命令。
3. 对于文件编辑，使用 sed, awk，或者 echo/cat 配合重定向。
4. 对于搜索，优先使用 rg (ripgrep) 或 grep。

========== CURRENT CONTEXT ==========
${renderedContext}
=====================================`;

    try {
        const { response } = await generateText({
            model: openai(MODEL_NAME),
            system: systemPrompt,
            messages: [{ role: 'user', content: "请根据 Context 的最新状态继续执行任务。如果需要，直接调用工具。" }],
            tools: {
                bash: tool({
                    description: '执行系统 bash 命令，返回 stdout 和 stderr',
                    parameters: z.object({ command: z.string() }),
                    execute: async ({ command }) => {
                        try {
                            const { stdout, stderr } = await execAsync(command);
                            return stdout + (stderr ? `\n[STDERR]:\n${stderr}` : '');
                        } catch (e: any) {
                            return `[EXECUTION ERROR]: ${e.message}`;
                        }
                    }
                })
            },
            maxSteps: 5, // 允许连续调用工具
        });

        // 提取并在架构中重构中间步骤
        const steps = response.messages.slice(1); // 忽略我们发出的触发引导词
        for (const step of steps) {
            if (step.role === 'assistant') {
                const content = step.content || `[调用工具]: ${JSON.stringify(step.toolCalls)}`;
                appendData(activeStoryId, 'assistant', content);
            } else if (step.role === 'tool') {
                appendData(activeStoryId, 'tool', JSON.stringify(step.content));
            }
        }
        res.json({ success: true });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// 手动操作/工具接口
app.post('/api/action', async (req, res) => {
    const { action, sceneId, count, summary } = req.body;
    const window = windows.get(activeStoryId)!;

    if (action === 'switch_story') {
        if (stories.has(req.body.storyId)) activeStoryId = req.body.storyId;
    }
    else if (action === 'edit_history') {
        window.historySummary = summary;
    }
    else if (action === 'recycle') {
        window.windowStartIndex += (count || 1);
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
        // 冻结当前 Render 结果（这里传 Snapshot）
        const fullPath = graph.resolvePath(window.activeStory.headSceneId);
        const snapshot = fullPath.map((s, idx) => {
            if (s.type === 'sentinel') return null;
            const state = window.getOrAssignState(s.id);
            return { wid: state.wid, type: s.type, mode: state.mode, tokenCount: s.tokenCount, isEvicted: idx < window.windowStartIndex };
        }).filter(Boolean);

        const { object } = await generateObject({
            model: openai(META_MODEL_NAME),
            system: "你是一个 Meta-Agent。当前 Agent 的 Context 濒临过载，你需要输出压缩指令。只允许使用 collapse(折叠指定WID) 或 recycle(驱逐最老的N个Scene)。",
            prompt: `当前窗口快照:\n${JSON.stringify(snapshot, null, 2)}`,
            schema: z.object({
                actions: z.array(z.object({
                    type: z.enum(['collapse', 'recycle']),
                    wid: z.string().optional(),
                    count: z.number().optional(),
                    reason: z.string()
                }))
            })
        });

        // 应用 Meta Agent 的操作
        const logs: string[] = [];
        for (const act of object.actions) {
            if (act.type === 'collapse' && act.wid) {
                const sId = Array.from(window.sceneStateMap.entries()).find(([k, v]) => v.wid === act.wid)?.[0];
                if (sId) { window.sceneStateMap.get(sId)!.mode = DisplayMode.COLLAPSED; logs.push(`折叠了 ${act.wid}: ${act.reason}`); }
            } else if (act.type === 'recycle' && act.count) {
                window.windowStartIndex += act.count;
                logs.push(`驱逐了最老的 ${act.count} 个 Scene: ${act.reason}`);
            }
        }
        res.json({ success: true, logs });
        return;
    }
    else if (action === 'fork') {
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
            // 历史节点 Fork: 贪心重建 (倒推 4000 Token)
            const path = graph.resolvePath(targetSceneId);
            let currentTokens = 0;
            let startIndex = path.length - 1;
            while (startIndex >= 0) {
                currentTokens += path[startIndex].tokenCount;
                if (currentTokens > 4000) { startIndex++; break; }
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
