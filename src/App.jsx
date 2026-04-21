import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './App.css';

const API_BASE = '/api';

const Icons = {
  Branch: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Zap: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Copy: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Check: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  X: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Minimize2: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  ),
  Maximize2: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  ),
  GitFork: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="6" r="3" />
      <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />
      <path d="M12 12v3" />
    </svg>
  ),
  User: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Bot: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
  ),
  Terminal: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  ),
  AlertCircle: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

function safeStringify(value, spacing = 2) {
  try {
    return JSON.stringify(value, null, spacing);
  } catch (error) {
    return `[unserializable: ${error instanceof Error ? error.message : String(error)}]`;
  }
}

function parseJsonString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function buildStreamScene(type, extra = {}) {
  return {
    id: `stream-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    wid: 'LIVE',
    mode: 'EXPANDED',
    transient: true,
    ...extra,
  };
}

function toClipboardText(scene) {
  if (scene.streamKind === 'tool_call') {
    return `[调用工具] ${scene.toolName}\n${safeStringify(scene.payload)}`;
  }

  if (scene.streamKind === 'tool_result') {
    return `[工具结果] ${scene.toolName}\n${safeStringify(scene.payload)}`;
  }

  if (typeof scene.content === 'string') return scene.content;
  if (scene.payload !== undefined) return safeStringify(scene.payload);
  return '';
}

function extractToolCallFromAssistant(content) {
  const match = content.match(/^\[调用工具\]\s+([^:]+):\s*([\s\S]+)$/);
  if (!match) return null;

  const [, toolName, argsText] = match;
  return {
    toolName: toolName.trim(),
    payload: parseJsonString(argsText) ?? argsText.trim(),
  };
}

function normalizeToolPayload(scene) {
  if (scene.streamKind === 'tool_call' || scene.streamKind === 'tool_result') {
    return scene.payload;
  }

  if (scene.type === 'tool') {
    return parseJsonString(scene.content) ?? scene.content;
  }

  if (scene.type === 'assistant') {
    const toolCall = extractToolCallFromAssistant(scene.content);
    if (toolCall) return toolCall;
  }

  return null;
}

const JsonNode = ({ value, name, depth = 0 }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const isObj = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  if (!isObj) {
    let color = 'text-green-400';
    if (typeof value === 'number') color = 'text-blue-400';
    if (typeof value === 'boolean') color = 'text-purple-400';
    if (value === null) color = 'text-gray-500';
    return (
      <div className="flex gap-2 min-w-0">
        {name && <span className="text-gray-300 flex-shrink-0">{name}:</span>}
        <span className={`${color} break-words break-all`}>{String(value)}</span>
      </div>
    );
  }

  const keys = Object.keys(value);
  const isEmpty = keys.length === 0;

  return (
    <div className="font-mono text-xs min-w-0">
      <div
        className={`flex items-center gap-1 ${isEmpty ? '' : 'cursor-pointer hover:bg-white/5'} py-0.5 px-1 rounded -ml-1`}
        onClick={() => !isEmpty && setExpanded(!expanded)}
      >
        {name && <span className="text-gray-300 flex-shrink-0">{name}:</span>}
        <span className="text-gray-500">
          {isArray ? '[' : '{'}
          {!expanded && !isEmpty && ` ...${keys.length} items `}
          {(!expanded || isEmpty) && (isArray ? ']' : '}')}
        </span>
      </div>
      {expanded && !isEmpty && (
        <div className="pl-4 border-l border-gray-700/50 mt-0.5">
          {keys.map((key) => (
            <JsonNode key={key} name={isArray ? null : key} value={value[key]} depth={depth + 1} />
          ))}
          <div className="text-gray-500 -ml-1 mt-0.5">{isArray ? ']' : '}'}</div>
        </div>
      )}
    </div>
  );
};

const MarkdownContent = ({ content }) => (
  <div className="markdown-body">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ inline, className, children, ...props }) {
          const codeContent = String(children);
          const isMultiLine = codeContent.includes('\n');
          
          if (inline || !isMultiLine) {
            return (
              <code className={className} {...props}>
                {isMultiLine ? codeContent.replace(/\n/g, ' ') : children}
              </code>
            );
          }

          return (
            <pre>
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

const ToolVisualization = ({ label, toolName, payload }) => {
  const data = typeof payload === 'string' ? parseJsonString(payload) ?? payload : payload;
  const isCommandResult =
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    ('command' in data || 'cwd' in data || 'output' in data);

  if (isCommandResult) {
    return (
      <div className="tool-visualization">
        <div className="tool-header-row">
          <div className="tool-title">{label}</div>
          <div className="tool-name">{toolName}</div>
        </div>
        {'command' in data && (
          <div className="tool-section">
            <div className="tool-section-label">Command</div>
            <pre>{String(data.command)}</pre>
          </div>
        )}
        {'cwd' in data && (
          <div className="tool-inline-meta">
            <span className="tool-inline-key">cwd</span>
            <code>{String(data.cwd)}</code>
          </div>
        )}
        {'error' in data && data.error && (
          <div className="tool-inline-meta tool-inline-meta-error">
            <span className="tool-inline-key">error</span>
            <code>{String(data.error)}</code>
          </div>
        )}
        {'output' in data && (
          <div className="tool-section">
            <div className="tool-section-label">Output</div>
            <pre>{String(data.output)}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="tool-visualization">
      <div className="tool-header-row">
        <div className="tool-title">{label}</div>
        <div className="tool-name">{toolName}</div>
      </div>
      {data !== null && typeof data === 'object' ? (
        <div className="bg-black/20 p-2 rounded overflow-x-auto">
          <JsonNode value={data} />
        </div>
      ) : (
        <pre>{String(data ?? '')}</pre>
      )}
    </div>
  );
};

const SceneContent = ({ scene }) => {
  const trimmedContent = (scene.content || '').replace(/_(模型正在思考下一步|模型正在等待工具执行结果)..._\n?$/, '').trimEnd();
  const toolPayload = normalizeToolPayload(scene);
  const assistantToolCall = scene.type === 'assistant' ? extractToolCallFromAssistant(scene.content || '') : null;

  if (scene.streamKind === 'tool_call') {
    return <ToolVisualization label="Tool Call" toolName={scene.toolName} payload={scene.payload} />;
  }

  if (scene.streamKind === 'tool_result') {
    return <ToolVisualization label="Tool Result" toolName={scene.toolName} payload={scene.payload} />;
  }

  if (scene.type === 'tool') {
    return <ToolVisualization label="Tool Result" toolName={scene.toolName || 'tool'} payload={toolPayload} />;
  }

  if (assistantToolCall) {
    return <ToolVisualization label="Tool Call" toolName={assistantToolCall.toolName} payload={assistantToolCall.payload} />;
  }

  return <MarkdownContent content={trimmedContent} />;
};

function formatCompactCount(value) {
  const abs = Math.abs(value);
  if (abs >= 1000 * 1000) {
    const scaled = value / (1000 * 1000);
    return `${scaled >= 100 ? scaled.toFixed(0) : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2)}M`;
  }

  if (abs >= 1000) {
    const scaled = value / 1000;
    return `${scaled >= 100 ? scaled.toFixed(0) : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2)}K`;
  }

  return String(value);
}

const ContextMeter = ({ windowState }) => {
  const threshold = windowState.compressionThreshold || 1;
  const renderedTokens = windowState.contextTokenCount || 0;
  const utilization = Math.max(0, Math.min(windowState.utilization || 0, 1));
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - utilization);
  const toneClass = windowState.overThreshold
    ? 'text-rose-400'
    : utilization > 0.85
      ? 'text-amber-300'
      : 'text-cyan-300';
  const percent = Math.round((windowState.utilization || 0) * 100);
  const tooltip = `${percent}% of compression threshold`;

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500" title={tooltip}>
      <div className="relative h-9 w-9">
        <svg className="-rotate-90 h-9 w-9" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} className="fill-none stroke-slate-700/55" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r={radius}
            className={`fill-none ${toneClass}`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
      </div>
      <div className={`text-sm font-medium ${toneClass}`}>
        {formatCompactCount(renderedTokens)} / {formatCompactCount(threshold)}
      </div>
    </div>
  );
};

function App() {
  const [state, setState] = useState(null);
  const [input, setInput] = useState('');
  const [metaLogs, setMetaLogs] = useState(['System initialized. Waiting for Meta-Agent...']);
  const [loading, setLoading] = useState(false);
  const [streamScenes, setStreamScenes] = useState([]);
  const [copiedSceneId, setCopiedSceneId] = useState(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const endRef = useRef(null);
  const copyTimeoutRef = useRef(null);

  const fetchState = async () => {
    try {
      const res = await fetch(`${API_BASE}/state`);
      setState(await res.json());
    } catch (err) {
      console.error('Failed to fetch state:', err);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state?.path, streamScenes, metaLogs]);

  useEffect(() => () => {
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
  }, []);

  const markCopied = (sceneId) => {
    setCopiedSceneId(sceneId);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = window.setTimeout(() => setCopiedSceneId(null), 1600);
  };

  const copyScene = async (scene) => {
    const text = toClipboardText(scene);
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      markCopied(scene.id);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const doAction = async (payload) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.logs) setMetaLogs((prev) => [...prev, ...data.logs]);
      await fetchState();
    } catch (err) {
      console.error('Action failed:', err);
    }
    setLoading(false);
  };

  const appendAssistantDelta = (delta) => {
    setStreamScenes((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];

      if (last?.streamKind === 'assistant_draft') {
        next[next.length - 1] = { ...last, content: `${last.content}${delta}` };
        return next;
      }

      return [
        ...next,
        buildStreamScene('assistant', {
          content: delta,
          streamKind: 'assistant_draft',
        }),
      ];
    });
  };

  const appendToolCall = (toolName, args) => {
    setStreamScenes((prev) => [
      ...prev,
      buildStreamScene('tool', {
        streamKind: 'tool_call',
        toolName,
        payload: args,
        content: safeStringify(args),
      }),
    ]);
  };

  const appendToolResult = (toolName, result) => {
    setStreamScenes((prev) => [
      ...prev,
      buildStreamScene('tool', {
        streamKind: 'tool_result',
        toolName,
        payload: result,
        content: typeof result === 'string' ? result : safeStringify(result),
      }),
    ]);
  };

  const appendStreamError = (error) => {
    setStreamScenes((prev) => [
      ...prev,
      buildStreamScene('system', {
        streamKind: 'error',
        content: `[错误]\n${error}`,
      }),
    ]);
  };

  const doChat = async () => {
    if (!input.trim() && !window.confirm('Empty input will trigger Agent reasoning. Continue?')) return;

    setLoading(true);
    setStreamScenes([]);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      setInput('');
      fetchState();

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Response stream is unavailable.');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const pieces = buffer.split(/\n\n|\r\n\r\n/);
        buffer = pieces.pop() || '';

        for (const piece of pieces) {
          const lines = piece.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'start') {
                setStreamScenes([]);
              } else if (data.type === 'text') {
                appendAssistantDelta(data.content);
              } else if (data.type === 'tool_call') {
                appendToolCall(data.name, data.args);
              } else if (data.type === 'tool_result') {
                appendToolResult(data.name, data.result);
              } else if (data.type === 'error') {
                appendStreamError(data.error);
              } else if (data.type === 'done') {
                break;
              }
            } catch (error) {
              console.error('SSE JSON parse error:', error, line);
            }
          }
        }
      }

      setStreamScenes([]);
      await fetchState();
    } catch (err) {
      console.error('Chat failed:', err);
      appendStreamError(err instanceof Error ? err.message : String(err));
    }

    setLoading(false);
  };

  if (!state) {
    return (
      <div className="h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-cyan-400 font-mono text-sm animate-pulse">Connecting to backend...</div>
      </div>
    );
  }

  const scenes = [...state.path, ...streamScenes];
  const debugContextText = [
    '[SYSTEM PROMPT]',
    state.window.systemPrompt || '',
    '',
    '========== RENDERED CONTEXT ==========', 
    state.window.renderedContext || '',
  ].join('\n');

  return (
    <>
      <div className="flex h-screen w-full bg-[#0a0a0f] text-gray-100">
        <div className="w-56 bg-[#12121a] border-r border-[#1e1e2e] flex flex-col">
          <div className="p-4 border-b border-[#1e1e2e] flex items-center gap-2">
            <div className="text-cyan-400"><Icons.Branch /></div>
            <span className="text-xs font-semibold tracking-wider text-gray-300 uppercase">Stories</span>
          </div>
          <ul className="flex-1 overflow-y-auto p-2">
            {state.storyIds.map((id) => (
              <li
                key={id}
                onClick={() => doAction({ action: 'switch_story', storyId: id })}
                className={`mb-1 px-3 py-2 rounded text-xs font-mono cursor-pointer transition-all duration-200 ${
                  id === state.activeStoryId
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a24]'
                }`}
              >
                {id}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1 flex flex-col bg-[#0d0d14]">
          <div className="p-4 border-b border-[#1e1e2e] flex justify-between items-center bg-[#12121a]">
            <div>
              <h2 className="text-sm font-semibold text-gray-200 tracking-wide">
                <span className="text-cyan-400">›</span> {state.activeStoryId}
              </h2>
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 font-mono">
                <span>window: <span className="text-cyan-400">{state.window.startIndex}</span></span>
                <span>nodes: <span className="text-cyan-400">{state.path.length}</span></span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ContextMeter windowState={state.window} />
              <button
                onClick={() => setDebugOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-300 bg-sky-400/10 border border-sky-400/20 rounded hover:bg-sky-400/20 transition-all"
              >
                <Icons.Eye /> Context
              </button>
              <button
                onClick={() => doAction({ action: 'recycle', count: 1 })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 rounded hover:bg-yellow-400/20 transition-all"
              >
                <Icons.Refresh /> Recycle
              </button>
              <button
                onClick={() => doAction({ action: 'meta_compress' })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-400 bg-purple-400/10 border border-purple-400/20 rounded hover:bg-purple-400/20 transition-all"
              >
                <Icons.Zap /> Compress
              </button>
            </div>
          </div>

          <div className="p-3 border-b border-[#1e1e2e] bg-[#0f0f18]">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
              <div className="text-cyan-400"><Icons.Eye /></div>
              Context Summary
            </div>
            <textarea
              className="w-full text-xs p-2 rounded bg-[#1a1a24] border border-[#2a2a3a] text-gray-300 font-mono focus:outline-none focus:border-cyan-500/50 transition-colors"
              rows="2"
              defaultValue={state.window.historySummary}
              onBlur={(e) => doAction({ action: 'edit_history', summary: e.target.value })}
              placeholder="Evicted context summary..."
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {scenes.map((scene) => {
              const isEvicted = scene.isEvicted;
              const isCollapsed = scene.mode === 'COLLAPSED';
              const canMutate = !scene.transient && !isEvicted;

              const typeConfig = {
                user: { icon: <Icons.User />, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
                assistant: { icon: <Icons.Bot />, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
                tool: { icon: <Icons.Terminal />, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
                system: { icon: <Icons.AlertCircle />, color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20' },
              };
              const config = typeConfig[scene.type] || typeConfig.system;

              return (
                <div
                  key={scene.id}
                  className={`p-4 rounded-lg border transition-all duration-200 overflow-hidden min-w-0 ${
                    isEvicted
                      ? 'bg-[#0a0a0f] border-[#1a1a24] opacity-50'
                      : 'bg-[#12121a] border-[#1e1e2e]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color} ${config.bg} border ${config.border}`}>
                        {config.icon}
                        {scene.wid}
                      </span>
                      <span className="text-xs text-gray-600 font-mono">{scene.type}</span>
                      {scene.transient && (
                        <span className="text-[10px] text-sky-300 border border-sky-300/30 px-1 py-0.5 rounded uppercase tracking-wider">Streaming</span>
                      )}
                      {isEvicted && (
                        <span className="text-[10px] text-red-400 border border-red-400/30 px-1 py-0.5 rounded uppercase tracking-wider">Evicted</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <button
                        onClick={() => copyScene(scene)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-200 transition-colors"
                        title="Copy card"
                      >
                        {copiedSceneId === scene.id ? <Icons.Check /> : <Icons.Copy />}
                        {copiedSceneId === scene.id ? 'Copied' : 'Copy'}
                      </button>
                      {!scene.transient && (
                        <button
                          onClick={() => doAction({ action: 'fork', sceneId: scene.id })}
                          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Icons.GitFork /> Fork
                        </button>
                      )}
                      {canMutate && (
                        isCollapsed ? (
                          <button
                            onClick={() => doAction({ action: 'expand', sceneId: scene.id })}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                          >
                            <Icons.Maximize2 /> Expand
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const summary = window.prompt('Enter summary (leave empty to collapse only):');
                              doAction({ action: 'collapse', sceneId: scene.id, summary });
                            }}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                          >
                            <Icons.Minimize2 /> Collapse
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="text-xs font-mono text-gray-300 leading-relaxed overflow-x-hidden min-w-0">
                    {isCollapsed ? (
                      <div className="flex items-center gap-2 text-gray-500 italic">
                        <Icons.ChevronRight /> {scene.summary}
                      </div>
                    ) : (
                      <SceneContent scene={scene} />
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <div className="p-4 bg-[#12121a] border-t border-[#1e1e2e]">
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-[#1a1a24] border border-[#2a2a3a] rounded px-4 py-2 text-sm text-gray-200 font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder-gray-600"
                placeholder="Enter command or instruction..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doChat()}
                disabled={loading}
              />
              <button
                onClick={doChat}
                disabled={loading}
                className={`px-4 py-2 rounded font-medium text-sm transition-all flex items-center gap-2 ${
                  loading
                    ? 'bg-cyan-500/20 text-cyan-400/50 cursor-not-allowed'
                    : 'bg-cyan-500 text-[#0a0a0f] hover:bg-cyan-400'
                }`}
              >
                <Icons.Send />
                {loading ? 'Running...' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        <div className="w-72 bg-[#12121a] border-l border-[#1e1e2e] flex flex-col">
          <div className="p-4 border-b border-[#1e1e2e] flex items-center gap-2">
            <div className="text-purple-400"><Icons.Eye /></div>
            <span className="text-xs font-semibold tracking-wider text-gray-300 uppercase">Meta-Agent</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 bg-[#0a0a0f] font-mono text-xs">
            {metaLogs.map((log, index) => (
              <div key={`${index}-${log}`} className="mb-3 pb-3 border-b border-[#1a1a24] last:border-0">
                <div className="text-gray-600 text-[10px] mb-1">
                  {new Date().toLocaleTimeString()}
                </div>
                <div className="text-gray-400 leading-relaxed">{log}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {debugOpen && (
        <div className="app-modal-overlay" onClick={() => setDebugOpen(false)}>
          <div className="app-modal" onClick={(event) => event.stopPropagation()}>
            <div className="app-modal-header">
              <div>
                <div className="app-modal-title">Rendered Context</div>
                <div className="app-modal-subtitle">System prompt plus raw output from `ContextWindow.render(graph)`</div>
              </div>
              <div className="app-modal-actions">
                <button
                  onClick={() => copyScene({ id: 'context-debug', content: debugContextText })}
                  className="app-modal-button"
                >
                  <Icons.Copy /> Copy
                </button>
                <button onClick={() => setDebugOpen(false)} className="app-modal-button">
                  <Icons.X /> Close
                </button>
              </div>
            </div>
            <pre className="app-modal-content">{debugContextText}</pre>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
