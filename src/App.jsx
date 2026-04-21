import { useEffect, useMemo, useRef, useState } from 'react';
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
  ChevronDown: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
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
  Wrench: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a4 4 0 0 0 5 5L12 19l-4 1 1-4 7.7-7.7a4 4 0 0 0-2-2z" />
      <path d="M16 8l-1-1" />
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

function normalizeScenePayload(scene) {
  if (scene.streamKind === 'tool_call' || scene.streamKind === 'tool_result') return scene.payload;
  return parseJsonString(scene.content) ?? scene.content;
}

function toClipboardText(item) {
  if (item.kind === 'tool-group') {
    return [
      `[Tool] ${item.toolName}`,
      `[Summary] ${item.summary}`,
      item.callPayload ? `[Input]\n${safeStringify(item.callPayload)}` : '',
      item.resultPayload !== undefined ? `[Result]\n${safeStringify(item.resultPayload)}` : '',
    ].filter(Boolean).join('\n\n');
  }
  if (typeof item.content === 'string') return item.content;
  if (item.payload !== undefined) return safeStringify(item.payload);
  return '';
}

function getToolEventFromScene(scene) {
  if (scene.mode === 'COLLAPSED' || scene.isEvicted) return null;
  if (scene.streamKind === 'tool_call') {
    return {
      phase: 'call',
      toolCallId: scene.toolCallId || scene.id,
      toolName: scene.toolName,
      payload: scene.payload,
      scene,
      isStreaming: true,
    };
  }
  if (scene.streamKind === 'tool_result') {
    return {
      phase: 'result',
      toolCallId: scene.toolCallId || scene.id,
      toolName: scene.toolName,
      payload: scene.payload,
      scene,
      isStreaming: true,
    };
  }
  if (scene.protocol?.kind === 'assistant-tool-call') {
    return {
      phase: 'call',
      toolCallId: scene.protocol.toolCallId,
      toolName: scene.protocol.toolName,
      payload: scene.protocol.input,
      scene,
      isStreaming: false,
    };
  }
  if (scene.protocol?.kind === 'assistant-tool-result') {
    return {
      phase: 'result',
      toolCallId: scene.protocol.toolCallId,
      toolName: scene.protocol.toolName,
      payload: scene.protocol.output,
      scene,
      isStreaming: false,
    };
  }
  return null;
}

function buildToolSummary(toolName, callPayload, resultPayload, hasResult) {
  const data = typeof resultPayload === 'string' ? parseJsonString(resultPayload) ?? resultPayload : resultPayload;
  const input = typeof callPayload === 'string' ? parseJsonString(callPayload) ?? callPayload : callPayload;

  if (toolName === 'bash') {
    const command = input?.command || data?.command;
    if (!hasResult) return command ? command : 'Waiting for tool result';
    if (data?.error) return `${command || toolName} failed`;
    if (data?.truncated) return `${command || toolName} · truncated output`;
    return command || 'Command completed';
  }

  if (toolName === 'read') {
    const path = input?.path || data?.path;
    const range = data?.startLine ? `:${data.startLine}-${data.endLine}` : '';
    return path ? `${path}${range}` : 'File excerpt';
  }

  if (toolName === 'ls') {
    return `${data?.path || input?.path || '.'} · ${data?.total ?? data?.entries?.length ?? 0} entries`;
  }

  if (toolName === 'find') {
    return `${input?.glob || data?.glob || '*'} · ${data?.total ?? 0} matches`;
  }

  if (toolName === 'grep') {
    return `${input?.pattern || data?.pattern || ''} · ${data?.total ?? 0} hits`;
  }

  if (toolName === 'write') {
    return `${data?.path || input?.path || ''} · ${data?.lines ?? 0} lines written`;
  }

  if (toolName === 'edit') {
    if (data?.applied === false) return `${data?.path || input?.path || ''} · ${data?.suggestions?.length ?? 0} suggestions`;
    if (data?.dryRun) return `${data?.path || input?.path || ''} · dry run · ${data?.editsApplied ?? 0} edits`;
    return `${data?.path || input?.path || ''} · ${data?.editsApplied ?? 0} edits`;
  }

  return hasResult ? `${toolName} completed` : `${toolName} running`;
}

function getToolStatus(toolName, resultPayload, hasResult, isStreaming) {
  if (!hasResult) return isStreaming ? 'running' : 'queued';
  const data = typeof resultPayload === 'string' ? parseJsonString(resultPayload) ?? resultPayload : resultPayload;
  if (toolName === 'edit' && data?.applied === false) return 'warning';
  if (data?.error) return 'error';
  if (data?.truncated) return 'warning';
  if (data?.dryRun) return 'dry-run';
  return 'success';
}

function isCompressedToolResultScene(scene) {
  return scene?.mode === 'COLLAPSED' && scene?.protocol?.kind === 'assistant-tool-result' && !scene?.isEvicted;
}

function shouldPreferToolScene(nextScene, currentScene) {
  if (!currentScene) return true;
  const nextRank = nextScene?.transient ? 0 : 1;
  const currentRank = currentScene?.transient ? 0 : 1;
  if (nextRank !== currentRank) return nextRank > currentRank;
  return false;
}

function collectToolGroups(scenes) {
  const groups = new Map();

  scenes.forEach((scene, index) => {
    if (isCompressedToolResultScene(scene)) {
      const toolCallId = scene.protocol.toolCallId;
      const existing = groups.get(toolCallId) || { toolCallId };
      if (shouldPreferToolScene(scene, existing.compressedResultScene)) {
        existing.compressedResultScene = scene;
        existing.compressedResultIndex = index;
        existing.toolName = scene.protocol.toolName;
      }
      groups.set(toolCallId, existing);
      return;
    }

    const event = getToolEventFromScene(scene);
    if (!event) return;

    const existing = groups.get(event.toolCallId) || { toolCallId: event.toolCallId };
    existing.toolName = existing.toolName || event.toolName;

    if (event.phase === 'call') {
      if (shouldPreferToolScene(scene, existing.callScene)) {
        existing.callScene = scene;
        existing.callPayload = event.payload;
        existing.callIndex = index;
      }
    } else if (shouldPreferToolScene(scene, existing.resultScene)) {
      existing.resultScene = scene;
      existing.resultPayload = event.payload;
      existing.resultIndex = index;
    }

    groups.set(event.toolCallId, existing);
  });

  return groups;
}

function buildRenderEntries(scenes) {
  const toolGroups = collectToolGroups(scenes);
  const entries = [];
  const emittedToolGroupIds = new Set();

  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    if (scene.type === 'sentinel') continue;

    if (isCompressedToolResultScene(scene)) {
      const toolGroup = toolGroups.get(scene.protocol.toolCallId);
      if (
        toolGroup?.compressedResultScene?.id === scene.id
        && !emittedToolGroupIds.has(scene.protocol.toolCallId)
      ) {
        entries.push({ kind: 'scene', scene });
        emittedToolGroupIds.add(scene.protocol.toolCallId);
      }
      continue;
    }

    const event = getToolEventFromScene(scene);

    if (!event) {
      entries.push({ kind: 'scene', scene });
      continue;
    }

    if (emittedToolGroupIds.has(event.toolCallId)) {
      continue;
    }

    const toolGroup = toolGroups.get(event.toolCallId);
    if (!toolGroup) {
      entries.push({ kind: 'scene', scene });
      continue;
    }

    if (toolGroup.compressedResultScene) {
      continue;
    }

    const anchorScene = toolGroup.callScene || toolGroup.resultScene;
    if (!anchorScene || anchorScene.id !== scene.id) {
      continue;
    }

    const isStreaming = !!(toolGroup.callScene?.transient || toolGroup.resultScene?.transient);
    const hasResult = !!toolGroup.resultScene;

    entries.push({
      kind: 'tool-group',
      id: `tool-${event.toolCallId}`,
      toolCallId: event.toolCallId,
      toolName: toolGroup.toolName || event.toolName,
      status: getToolStatus(toolGroup.toolName || event.toolName, toolGroup.resultPayload, hasResult, isStreaming),
      summary: buildToolSummary(toolGroup.toolName || event.toolName, toolGroup.callPayload, toolGroup.resultPayload, hasResult),
      callScene: toolGroup.callScene || null,
      resultScene: toolGroup.resultScene || null,
      callPayload: toolGroup.callPayload ?? null,
      resultPayload: toolGroup.resultPayload,
      scenes: [toolGroup.callScene, toolGroup.resultScene].filter(Boolean),
      isStreaming,
      compressibleSceneId: toolGroup.resultScene && !toolGroup.resultScene.transient && !toolGroup.resultScene.isEvicted
        ? toolGroup.resultScene.id
        : (toolGroup.callScene && !toolGroup.callScene.transient && !toolGroup.callScene.isEvicted ? toolGroup.callScene.id : null),
    });
    emittedToolGroupIds.add(event.toolCallId);
  }
  return entries;
}

const JsonNode = ({ value, name, depth = 0 }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const isObj = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  if (!isObj) {
    let color = 'text-[#fa520f]';
    if (typeof value === 'number') color = 'text-[#fb6424]';
    if (typeof value === 'boolean') color = 'text-[#ff8105]';
    if (value === null) color = 'text-[#1f1f1f]';
    return (
      <div className="flex gap-2 min-w-0">
        {name && <span className="text-[#1f1f1f] flex-shrink-0 opacity-60">{name}:</span>}
        <span className={`${color} break-words break-all`}>{String(value)}</span>
      </div>
    );
  }

  const keys = Object.keys(value);
  const isEmpty = keys.length === 0;

  return (
    <div className="font-mono text-xs min-w-0">
      <div className={`flex items-center gap-1 ${isEmpty ? '' : 'cursor-pointer hover:bg-[#fff0c2]'} py-0.5 px-1 -ml-1`} onClick={() => !isEmpty && setExpanded(!expanded)}>
        {name && <span className="text-[#1f1f1f] flex-shrink-0 opacity-60">{name}:</span>}
        <span className="text-[#1f1f1f] opacity-40">
          {isArray ? '[' : '{'}
          {!expanded && !isEmpty && ` ...${keys.length} items `}
          {(!expanded || isEmpty) && (isArray ? ']' : '}')}
        </span>
      </div>
      {expanded && !isEmpty && (
        <div className="pl-4 border-l border-[#ffa110] mt-0.5">
          {keys.map((key) => <JsonNode key={key} name={isArray ? null : key} value={value[key]} depth={depth + 1} />)}
          <div className="text-[#1f1f1f] opacity-40 -ml-1 mt-0.5">{isArray ? ']' : '}'}</div>
        </div>
      )}
    </div>
  );
};

const MarkdownContent = ({ content }) => (
  <div className="markdown-body">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
  </div>
);

const StatusBadge = ({ status }) => {
  const config = {
    queued: 'tool-status tool-status-neutral',
    running: 'tool-status tool-status-neutral',
    success: 'tool-status tool-status-success',
    error: 'tool-status tool-status-error',
    warning: 'tool-status tool-status-warning',
    'dry-run': 'tool-status tool-status-info',
  };
  const label = {
    queued: 'Queued',
    running: 'Running',
    success: 'Success',
    error: 'Error',
    warning: 'Partial',
    'dry-run': 'Dry Run',
  };
  return <span className={config[status] || config.queued}>{label[status] || status}</span>;
};

const ToolDetailBody = ({ toolName, callPayload, resultPayload }) => {
  const data = typeof resultPayload === 'string' ? parseJsonString(resultPayload) ?? resultPayload : resultPayload;
  const input = typeof callPayload === 'string' ? parseJsonString(callPayload) ?? callPayload : callPayload;

  if (toolName === 'read') {
    return <div className="tool-detail-panel"><pre>{String(data?.content || '')}</pre></div>;
  }

  if (toolName === 'ls') {
    return (
      <div className="tool-detail-panel">
        <div className="tool-metadata-row"><span>Path</span><code>{String(data?.path || input?.path || '')}</code></div>
        <div className="tool-list-grid">
          {(data?.entries || []).map((entry, index) => (
            <div key={`${entry.name}-${index}`} className="tool-list-row">
              <span className="tool-type-badge">{entry.type}</span>
              <code>{entry.name}</code>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (toolName === 'find' || toolName === 'grep') {
    return (
      <div className="tool-detail-panel">
        <div className="tool-metadata-row"><span>Target</span><code>{String(data?.path || input?.path || '')}</code></div>
        <pre>{String(data?.matches || '')}</pre>
      </div>
    );
  }

  if (toolName === 'bash') {
    return (
      <div className="tool-detail-panel">
        <div className="tool-metadata-row"><span>Command</span><code>{String(data?.command || input?.command || '')}</code></div>
        {data?.cwd && <div className="tool-metadata-row"><span>cwd</span><code>{String(data.cwd)}</code></div>}
        {data?.fullOutputPath && <div className="tool-metadata-row"><span>full output</span><code>{String(data.fullOutputPath)}</code></div>}
        {data?.error && <div className="tool-error-box"><code>{String(data.error)}</code></div>}
        {data?.output && <pre>{String(data.output)}</pre>}
      </div>
    );
  }

  if (toolName === 'write') {
    return (
      <div className="tool-detail-panel">
        <div className="tool-metadata-grid">
          <div><span>Path</span><code>{String(data?.path || input?.path || '')}</code></div>
          <div><span>Lines</span><code>{String(data?.lines ?? 0)}</code></div>
          <div><span>Bytes</span><code>{String(data?.bytes ?? 0)}</code></div>
        </div>
      </div>
    );
  }

  if (toolName === 'edit') {
    return (
      <div className="tool-detail-panel">
        <div className="tool-metadata-grid">
          <div><span>Path</span><code>{String(data?.path || input?.path || '')}</code></div>
          <div><span>Mode</span><code>{data?.dryRun ? 'dry run' : 'write'}</code></div>
          <div><span>Applied</span><code>{String(data?.editsApplied ?? 0)}</code></div>
        </div>
        {Array.isArray(data?.previews) && data.previews.length > 0 && (
          <div className="tool-preview-stack">
            {data.previews.map((preview, index) => (
              <div key={`${preview.editIndex}-${index}`} className="tool-preview-card">
                <div className="tool-preview-title">Edit {preview.editIndex} · line {preview.line}</div>
                <div className="tool-preview-columns">
                  <div>
                    <div className="tool-section-label">Before</div>
                    <pre>{String(preview.oldTextPreview || '')}</pre>
                  </div>
                  <div>
                    <div className="tool-section-label">After</div>
                    <pre>{String(preview.newTextPreview || '')}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {Array.isArray(data?.suggestions) && data.suggestions.length > 0 && (
          <div className="tool-preview-stack">
            {data.suggestions.map((suggestion, index) => (
              <div key={`${suggestion.line}-${index}`} className="tool-suggestion-card">
                <div className="tool-preview-title">Suggestion · line {suggestion.line} · {suggestion.similarity}</div>
                <pre>{String(suggestion.snippet || '')}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (data && typeof data === 'object') {
    return <div className="tool-detail-panel"><JsonNode value={data} /></div>;
  }

  return <div className="tool-detail-panel"><pre>{String(data ?? input ?? '')}</pre></div>;
};

const ToolTimelineCard = ({ entry, expanded, onToggle, onCopy, onCompress }) => (
  <div className="tool-timeline-card">
    <div className="tool-timeline-rail">
      <span className="tool-timeline-dot" />
      <span className="tool-timeline-line" />
    </div>
    <div className="tool-timeline-main">
      <div className="tool-timeline-header">
        <div className="tool-timeline-heading">
          <span className="tool-chip"><Icons.Wrench /> {entry.toolName}</span>
          {entry.isStreaming && <span className="tool-chip tool-chip-stream">Streaming</span>}
          <StatusBadge status={entry.status} />
        </div>
        <div className="tool-timeline-actions">
          <button onClick={() => onCopy(entry)} className="tool-inline-action">
            <Icons.Copy /> Copy
          </button>
          {entry.compressibleSceneId && (
            <button onClick={() => onCompress(entry)} className="tool-inline-action">
              <Icons.Minimize2 /> Compress
            </button>
          )}
          <button onClick={() => onToggle(entry.id)} className="tool-inline-action">
            {expanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
            {expanded ? 'Details shown' : 'Expand details'}
          </button>
        </div>
      </div>
      <div className="tool-timeline-summary">{entry.summary}</div>
      <div className="tool-timeline-substeps">
        <div className="tool-timeline-step">{entry.callScene ? 'Tool call emitted' : 'Recovered result-only event'}</div>
        <div className="tool-timeline-step">{entry.resultScene ? 'Tool result recorded' : 'Waiting for tool result'}</div>
      </div>
      {expanded && (
        <ToolDetailBody toolName={entry.toolName} callPayload={entry.callPayload} resultPayload={entry.resultPayload} />
      )}
    </div>
  </div>
);

const SceneCard = ({ scene, copiedSceneId, onCopy, onFork, onExpand, onCollapse }) => {
  const isEvicted = scene.isEvicted;
  const isCompressed = scene.mode === 'COLLAPSED';
  const canMutate = !scene.transient && !isEvicted;

  const typeConfig = {
    user: { icon: <Icons.User />, color: 'text-[#fa520f]', bg: 'bg-[#ffe295]', border: 'border-[#ffa110]' },
    assistant: { icon: <Icons.Bot />, color: 'text-[#fb6424]', bg: 'bg-[#ffd06a]', border: 'border-[#ffa110]' },
    tool: { icon: <Icons.Terminal />, color: 'text-[#ff8105]', bg: 'bg-[#fff0c2]', border: 'border-[#ffa110]' },
    system: { icon: <Icons.AlertCircle />, color: 'text-[#1f1f1f]', bg: 'bg-[#fff0c2]', border: 'border-[#ffa110]' },
  };
  const config = typeConfig[scene.type] || typeConfig.system;

  return (
    <div className={`p-4 border transition-all duration-200 overflow-hidden min-w-0 ${isEvicted ? 'bg-[#fff0c2] border-[#ffd900] opacity-50' : 'bg-[#fffaeb] border-[#ffa110]'}`}>
      <div className="flex justify-between items-start mb-2 gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${config.color} ${config.bg} border ${config.border}`}>
            {config.icon}
            {scene.wid}
          </span>
          <span className="text-xs text-[#1f1f1f] font-mono opacity-60">{scene.type}</span>
          {scene.transient && <span className="text-[10px] text-[#1f1f1f] border border-[#ffa110] px-1 py-0.5 uppercase tracking-wider bg-[#ffd06a]">Streaming</span>}
          {isEvicted && <span className="text-[10px] text-[#ffffff] border border-[#fa520f] px-1 py-0.5 uppercase tracking-wider bg-[#fa520f]">Evicted</span>}
          {isCompressed && <span className="compressed-badge">Compressed</span>}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button onClick={() => onCopy(scene)} className="flex items-center gap-1 text-xs text-[#1f1f1f] hover:text-[#fa520f] transition-colors opacity-60 hover:opacity-100">
            {copiedSceneId === scene.id ? <Icons.Check /> : <Icons.Copy />}
            {copiedSceneId === scene.id ? 'Copied' : 'Copy'}
          </button>
          {!scene.transient && (
            <button onClick={() => onFork(scene.id)} className="flex items-center gap-1 text-xs text-[#fb6424] hover:text-[#fa520f] transition-colors">
              <Icons.GitFork /> Fork
            </button>
          )}
          {canMutate && (
            isCompressed ? (
              <button onClick={() => onExpand(scene.id)} className="flex items-center gap-1 text-xs text-[#1f1f1f] hover:text-[#fa520f] transition-colors opacity-60 hover:opacity-100">
                <Icons.Maximize2 /> Expand
              </button>
            ) : (
              <button onClick={() => onCollapse(scene.id)} className="flex items-center gap-1 text-xs text-[#1f1f1f] hover:text-[#fa520f] transition-colors opacity-60 hover:opacity-100">
                <Icons.Minimize2 /> Collapse
              </button>
            )
          )}
        </div>
      </div>

      <div className="text-xs font-mono text-[#1f1f1f] leading-relaxed overflow-x-hidden min-w-0">
        {isCompressed ? (
          <div className="flex items-center gap-2 text-[#1f1f1f] opacity-50 italic">
            <Icons.ChevronRight /> {scene.summary}
          </div>
        ) : (
          <MarkdownContent content={(scene.content || '').trimEnd()} />
        )}
      </div>
    </div>
  );
};

const ContextMeter = ({ windowState }) => {
  const threshold = windowState.compressionThreshold || 1;
  const renderedTokens = windowState.contextTokenCount || 0;
  const utilization = Math.max(0, Math.min(windowState.utilization || 0, 1));
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - utilization);
  const strokeClass = windowState.overThreshold ? 'stroke-[#fa520f]' : utilization > 0.85 ? 'stroke-[#fb6424]' : 'stroke-[#ff8a00]';
  const textClass = windowState.overThreshold ? 'text-[#fa520f]' : utilization > 0.85 ? 'text-[#fb6424]' : 'text-[#ff8a00]';
  const percent = Math.round((windowState.utilization || 0) * 100);

  return (
    <div className="flex items-center gap-2 text-xs" title={`${percent}% of compression threshold`}>
      <div className="relative h-9 w-9">
        <svg className="-rotate-90 h-9 w-9" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} className="fill-none stroke-[#e5d5a8] stroke-[5]" />
          <circle cx="32" cy="32" r={radius} className={`fill-none ${strokeClass} stroke-[5] stroke-linecap-round`} strokeDasharray={circumference} strokeDashoffset={dashOffset} />
        </svg>
      </div>
      <div className={`text-sm font-medium ${textClass}`}>
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
  const [copiedId, setCopiedId] = useState(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [expandedToolGroups, setExpandedToolGroups] = useState({});
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

  useEffect(() => { fetchState(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [state?.path, streamScenes, metaLogs]);
  useEffect(() => () => { if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current); }, []);

  const scenes = useMemo(() => (
    state ? [...state.path, ...streamScenes] : streamScenes
  ), [state, streamScenes]);

  const renderEntries = useMemo(() => buildRenderEntries(scenes), [scenes]);

  const debugContextText = useMemo(() => (
    state
      ? ['[SYSTEM PROMPT]', state.window.systemPrompt || '', '', '========== RENDERED CONTEXT ==========', state.window.renderedContext || ''].join('\n')
      : ''
  ), [state]);

  const markCopied = (id) => {
    setCopiedId(id);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = window.setTimeout(() => setCopiedId(null), 1600);
  };

  const copyItem = async (item) => {
    const text = toClipboardText(item);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      markCopied(item.id);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const compressToolGroup = async (entry) => {
    if (!entry.compressibleSceneId) return;
    const summary = window.prompt('Enter summary for the compressed tool result (leave empty to use current summary):', entry.summary);
    await doAction({
      action: 'collapse',
      sceneId: entry.compressibleSceneId,
      summary: summary === null ? undefined : summary,
    });
  };

  const doAction = async (payload) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: state?.activeStoryId, ...payload }),
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
      const last = prev[prev.length - 1];
      if (last?.streamKind === 'assistant_draft') {
        return [...prev.slice(0, -1), { ...last, content: `${last.content}${delta}` }];
      }
      return [...prev, buildStreamScene('assistant', { content: delta, streamKind: 'assistant_draft' })];
    });
  };

  const appendToolCall = (toolName, args, toolCallId) => {
    setStreamScenes((prev) => [...prev, buildStreamScene('tool', {
      streamKind: 'tool_call',
      toolName,
      toolCallId: toolCallId || `stream-call-${Date.now()}`,
      payload: args,
      content: safeStringify(args),
    })]);
  };

  const appendToolResult = (toolName, result, toolCallId) => {
    setStreamScenes((prev) => [...prev, buildStreamScene('tool', {
      streamKind: 'tool_result',
      toolName,
      toolCallId: toolCallId || `stream-result-${Date.now()}`,
      payload: result,
      content: typeof result === 'string' ? result : safeStringify(result),
    })]);
  };

  const appendStreamError = (error) => {
    setStreamScenes((prev) => [...prev, buildStreamScene('system', { streamKind: 'error', content: `[错误]\n${error}` })]);
  };

  const toggleToolGroup = (groupId) => {
    setExpandedToolGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const doChat = async () => {
    if (!input.trim() && !window.confirm('Empty input will trigger Agent reasoning. Continue?')) return;
    setLoading(true);
    setStreamScenes([]);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, storyId: state.activeStoryId }),
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
                appendToolCall(data.name, data.args, data.toolCallId);
              } else if (data.type === 'tool_result') {
                appendToolResult(data.name, data.result, data.toolCallId);
              } else if (data.type === 'error') {
                appendStreamError(data.error);
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
    return <div className="h-screen bg-[#fffaeb] flex items-center justify-center"><div className="text-[#fa520f] font-mono text-sm animate-pulse">Connecting to backend...</div></div>;
  }

  return (
    <>
      <div className="flex h-screen w-full bg-[#fffaeb] text-[#1f1f1f]">
        <div className="w-56 bg-[#fff0c2] border-r border-[#ffa110] flex flex-col">
          <div className="p-4 border-b border-[#ffa110] flex items-center gap-2">
            <div className="text-[#fa520f]"><Icons.Branch /></div>
            <span className="text-xs font-semibold tracking-wider text-[#1f1f1f] uppercase">Stories</span>
          </div>
          <ul className="flex-1 overflow-y-auto p-2">
            {state.storyIds.map((id) => (
              <li key={id} onClick={() => doAction({ action: 'switch_story', storyId: id })} className={`mb-1 px-3 py-2 rounded text-xs font-mono cursor-pointer transition-all duration-200 ${id === state.activeStoryId ? 'bg-[#ffd900]/20 text-[#fa520f] border border-[#ffa110]' : 'text-[#1f1f1f] hover:bg-[#ffe295] border border-transparent'}`}>
                {id}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1 flex flex-col bg-[#fffaeb]">
          <div className="p-4 border-b border-[#ffa110] flex justify-between items-center bg-[#fff0c2]">
            <div>
              <h2 className="text-sm font-semibold text-[#1f1f1f] tracking-wide"><span className="text-[#fa520f]">›</span> {state.activeStoryId}</h2>
              <div className="flex items-center gap-4 mt-1 text-xs text-[#1f1f1f] font-mono opacity-60">
                <span>window: <span className="text-[#fa520f]">{state.window.startIndex}</span></span>
                <span>nodes: <span className="text-[#fa520f]">{state.path.length}</span></span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ContextMeter windowState={state.window} />
              <button onClick={() => setDebugOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1f1f1f] bg-[#ffe295] border border-[#ffa110] hover:bg-[#ffd900] transition-all"><Icons.Eye /> Context</button>
              <button onClick={() => doAction({ action: 'recycle', count: 1 })} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1f1f1f] bg-[#ffd900] border border-[#ffa110] hover:bg-[#ffb83e] transition-all"><Icons.Refresh /> Recycle</button>
              <button onClick={() => doAction({ action: 'meta_compress' })} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#ffffff] bg-[#fa520f] border border-[#fb6424] hover:bg-[#fb6424] transition-all"><Icons.Zap /> Compress</button>
            </div>
          </div>

          <div className="p-3 border-b border-[#ffa110] bg-[#fff0c2]">
            <div className="flex items-center gap-2 text-xs font-medium text-[#1f1f1f] mb-2 uppercase tracking-wider opacity-60">
              <div className="text-[#fa520f]"><Icons.Eye /></div>
              Context Summary
            </div>
            <textarea className="w-full text-xs p-2 rounded bg-[#fffaeb] border border-[#ffa110] text-[#1f1f1f] font-mono focus:outline-none focus:border-[#fa520f] transition-colors" rows="2" defaultValue={state.window.historySummary} onBlur={(e) => doAction({ action: 'edit_history', summary: e.target.value })} placeholder="Evicted context summary..." />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {renderEntries.map((entry) => (
              entry.kind === 'tool-group' ? (
                <ToolTimelineCard key={entry.id} entry={entry} expanded={!!expandedToolGroups[entry.id]} onToggle={toggleToolGroup} onCopy={copyItem} onCompress={compressToolGroup} />
              ) : (
                <SceneCard
                  key={entry.scene.id}
                  scene={entry.scene}
                  copiedSceneId={copiedId}
                  onCopy={copyItem}
                  onFork={(sceneId) => doAction({ action: 'fork', sceneId })}
                  onExpand={(sceneId) => doAction({ action: 'expand', sceneId })}
                  onCollapse={(sceneId) => {
                    const summary = window.prompt('Enter summary (leave empty to collapse only):');
                    doAction({ action: 'collapse', sceneId, summary });
                  }}
                />
              )
            ))}
            <div ref={endRef} />
          </div>

          <div className="p-4 bg-[#fff0c2] border-t border-[#ffa110]">
            <div className="flex gap-2">
              <input type="text" className="flex-1 bg-[#fffaeb] border border-[#ffa110] rounded px-4 py-2 text-sm text-[#1f1f1f] font-mono focus:outline-none focus:border-[#fa520f] transition-colors placeholder-[#1f1f1f] opacity-50" placeholder="Enter command or instruction..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doChat()} disabled={loading} />
              <button onClick={doChat} disabled={loading} className={`px-4 py-2 rounded font-medium text-sm transition-all flex items-center gap-2 ${loading ? 'bg-[#ffe295] text-[#1f1f1f]/50 cursor-not-allowed' : 'bg-[#1f1f1f] text-[#ffffff] hover:bg-[#fa520f]'}`}>
                <Icons.Send />
                {loading ? 'Running...' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        <div className="w-72 bg-[#fff0c2] border-l border-[#ffa110] flex flex-col">
          <div className="p-4 border-b border-[#ffa110] flex items-center gap-2">
            <div className="text-[#fa520f]"><Icons.Eye /></div>
            <span className="text-xs font-semibold tracking-wider text-[#1f1f1f] uppercase">Meta-Agent</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 bg-[#fffaeb] font-mono text-xs">
            {metaLogs.map((log, index) => (
              <div key={`${index}-${log}`} className="mb-3 pb-3 border-b border-[#ffe295] last:border-0">
                <div className="text-[#1f1f1f] text-[10px] mb-1 opacity-50">{new Date().toLocaleTimeString()}</div>
                <div className="text-[#1f1f1f] leading-relaxed opacity-80">{log}</div>
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
                <button onClick={() => copyItem({ id: 'context-debug', content: debugContextText })} className="app-modal-button"><Icons.Copy /> Copy</button>
                <button onClick={() => setDebugOpen(false)} className="app-modal-button"><Icons.X /> Close</button>
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
