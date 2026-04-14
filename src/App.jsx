import { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE = '/api';

// SVG Icons
const Icons = {
  Branch: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="3" x2="6" y2="15"></line>
      <circle cx="18" cy="6" r="3"></circle>
      <circle cx="6" cy="18" r="3"></circle>
      <path d="M18 9a9 9 0 0 1-9 9"></path>
    </svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  ),
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  ),
  Zap: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  ),
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  ),
  Copy: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  ),
  Minimize2: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20"></polyline>
      <polyline points="20 10 14 10 14 4"></polyline>
      <line x1="14" y1="10" x2="21" y2="3"></line>
      <line x1="3" y1="21" x2="10" y2="14"></line>
    </svg>
  ),
  Maximize2: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9"></polyline>
      <polyline points="9 21 3 21 3 15"></polyline>
      <line x1="21" y1="3" x2="14" y2="10"></line>
      <line x1="3" y1="21" x2="10" y2="14"></line>
    </svg>
  ),
  GitFork: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="18" r="3"></circle>
      <circle cx="6" cy="6" r="3"></circle>
      <circle cx="18" cy="6" r="3"></circle>
      <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"></path>
      <path d="M12 12v3"></path>
    </svg>
  ),
  User: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  Bot: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"></rect>
      <circle cx="12" cy="5" r="2"></circle>
      <path d="M12 7v4"></path>
      <line x1="8" y1="16" x2="8" y2="16"></line>
      <line x1="16" y1="16" x2="16" y2="16"></line>
    </svg>
  ),
  Terminal: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5"></polyline>
      <line x1="12" y1="19" x2="20" y2="19"></line>
    </svg>
  ),
  AlertCircle: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  ),
};

function App() {
  const [state, setState] = useState(null);
  const [input, setInput] = useState('');
  const [metaLogs, setMetaLogs] = useState(['System initialized. Waiting for Meta-Agent...']);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const fetchState = async () => {
    try {
      const res = await fetch(`${API_BASE}/state`);
      setState(await res.json());
    } catch (err) {
      console.error('Failed to fetch state:', err);
    }
  };

  useEffect(() => { fetchState(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [state?.path]);

  const doAction = async (payload) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.logs) setMetaLogs(prev => [...prev, ...data.logs]);
      await fetchState();
    } catch (err) {
      console.error('Action failed:', err);
    }
    setLoading(false);
  };

  const doChat = async () => {
    if (!input.trim() && !confirm('Empty input will trigger Agent reasoning. Continue?')) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      setInput('');
      await fetchState();
    } catch (err) {
      console.error('Chat failed:', err);
    }
    setLoading(false);
  };

  if (!state) return (
    <div className="h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-cyan-400 font-mono text-sm animate-pulse">Connecting to backend...</div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#0a0a0f] text-gray-100">
      {/* Left Sidebar - Stories */}
      <div className="w-56 bg-[#12121a] border-r border-[#1e1e2e] flex flex-col">
        <div className="p-4 border-b border-[#1e1e2e] flex items-center gap-2">
          <div className="text-cyan-400"><Icons.Branch /></div>
          <span className="text-xs font-semibold tracking-wider text-gray-300 uppercase">Stories</span>
        </div>
        <ul className="flex-1 overflow-y-auto p-2">
          {state.storyIds.map(id => (
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-[#0d0d14]">
        {/* Header */}
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

        {/* Global Summary */}
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

        {/* Scene List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {state.path.map((scene, idx) => {
            const isEvicted = scene.isEvicted;
            const isCollapsed = scene.mode === 'COLLAPSED';

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
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  isEvicted 
                    ? 'bg-[#0a0a0f] border-[#1a1a24] opacity-50' 
                    : 'bg-[#12121a] border-[#1e1e2e]'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color} ${config.bg} border ${config.border}`}>
                      {config.icon}
                      {scene.wid}
                    </span>
                    <span className="text-xs text-gray-600 font-mono">{scene.type}</span>
                    {isEvicted && (
                      <span className="text-[10px] text-red-400 border border-red-400/30 px-1 py-0.5 rounded uppercase tracking-wider">Evicted</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => doAction({ action: 'fork', sceneId: scene.id })}
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Icons.GitFork /> Fork
                    </button>
                    {!isEvicted && (
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
                            const sum = prompt("Enter summary (leave empty to collapse only):");
                            doAction({ action: 'collapse', sceneId: scene.id, summary: sum });
                          }}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          <Icons.Minimize2 /> Collapse
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="text-xs font-mono whitespace-pre-wrap text-gray-400 leading-relaxed">
                  {isCollapsed ? (
                    <div className="flex items-center gap-2 text-gray-500 italic">
                      <Icons.ChevronRight /> {scene.summary}
                    </div>
                  ) : (
                    scene.content
                  )}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-[#12121a] border-t border-[#1e1e2e]">
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-[#1a1a24] border border-[#2a2a3a] rounded px-4 py-2 text-sm text-gray-200 font-mono focus:outline-none focus:border-cyan-500/50 transition-colors placeholder-gray-600"
              placeholder="Enter command or instruction..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doChat()}
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

      {/* Right Panel - Meta Agent */}
      <div className="w-72 bg-[#12121a] border-l border-[#1e1e2e] flex flex-col">
        <div className="p-4 border-b border-[#1e1e2e] flex items-center gap-2">
          <div className="text-purple-400"><Icons.Eye /></div>
          <span className="text-xs font-semibold tracking-wider text-gray-300 uppercase">Meta-Agent</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 bg-[#0a0a0f] font-mono text-xs">
          {metaLogs.map((log, i) => (
            <div key={i} className="mb-3 pb-3 border-b border-[#1a1a24] last:border-0">
              <div className="text-gray-600 text-[10px] mb-1">
                {new Date().toLocaleTimeString()}
              </div>
              <div className="text-gray-400 leading-relaxed">{log}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>
    </div>
  );
}

export default App;
