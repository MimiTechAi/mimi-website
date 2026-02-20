"use client";

/**
 * VirtualSandboxPanel — Manus AI / GenSpark-Level Agent Computer (2026 SOTA)
 *
 * Unified "Computer" view that auto-switches based on agent activity:
 *   - idle     → Agent grid + capability tags + quick actions
 *   - browsing → Live browser with real URLs, scanning animation, page counter
 *   - terminal → Terminal with syntax coloring & blinking cursor
 *   - coding   → Monaco editor with file tabs
 *   - planning → Task decomposition tree
 *
 * New features (Manus/GenSpark-inspired):
 *   ✦ Activity Timeline — persistent chronological log of all actions
 *   ✦ Resource Status Bar — CPU/Memory/Network indicators
 *   ✦ Browser scanning visualization — see pages being scanned
 *   ✦ Premium view transitions with per-view entry animations
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { memo, useState, useEffect, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useMimiAgentContext } from "../MimiAgentContext";
import type { ComputerView } from "../MimiAgentContext";
import { ArtifactPanel } from "./ArtifactPanel";
import { sanitizeHtml } from "../utils/sanitize";
import {
    Globe, Terminal, FileCode2, Copy, Download, Brain,
    Bot, Search, PenTool, Check, ChevronRight, ChevronDown,
    Settings, AlertCircle, Loader2, Monitor, Wifi, WifiOff,
    Cpu, ListTodo, Code, Eye, Zap, Activity, Clock,
    ArrowLeft, ArrowRight, RotateCw, Shield, Hash,
    Layers, Database, Network, ChevronUp, Sparkles
} from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then(mod => mod.default), {
    ssr: false,
    loading: () => <div style={{ padding: '16px', color: '#64748b', fontSize: '0.6875rem' }}>Editor wird geladen...</div>
});

const LANGUAGE_MAP: Record<string, string> = {
    'python': 'python', 'py': 'python',
    'javascript': 'javascript', 'js': 'javascript',
    'typescript': 'typescript', 'ts': 'typescript',
    'html': 'html', 'css': 'css', 'json': 'json',
    'sql': 'sql', 'markdown': 'markdown', 'md': 'markdown',
    'shell': 'shell', 'bash': 'shell', 'sh': 'shell',
    'yaml': 'yaml', 'xml': 'xml', 'csv': 'plaintext',
};

// ── Agent Specialist Config ─────────────────────────────────
const AGENT_SPECS: Record<string, { icon: typeof Bot; label: string; color: string; capabilities: string[] }> = {
    'web-researcher': { icon: Search, label: 'Web Researcher', color: '#3b82f6', capabilities: ['Search', 'Summarize', 'Extract'] },
    'code-expert': { icon: Code, label: 'Code Expert', color: '#a855f7', capabilities: ['Generate', 'Debug', 'Refactor'] },
    'data-analyst': { icon: Cpu, label: 'Data Analyst', color: '#f59e0b', capabilities: ['Analyze', 'Visualize', 'Report'] },
    'document-expert': { icon: FileCode2, label: 'Document Expert', color: '#22c55e', capabilities: ['Parse', 'Format', 'Export'] },
    'research-agent': { icon: Eye, label: 'Research Agent', color: '#06b6d4', capabilities: ['Research', 'Compare', 'Cite'] },
    'math-specialist': { icon: Zap, label: 'Math Specialist', color: '#ef4444', capabilities: ['Calculate', 'Prove', 'Model'] },
    'general': { icon: Bot, label: 'General Agent', color: '#00d4ff', capabilities: ['Multi-Task', 'Reason', 'Plan'] },
};

// ── View Config ─────────────────────────────────────────────
const VIEW_COLORS: Record<ComputerView, string> = {
    'idle': '#00d4ff',
    'browsing': '#3b82f6',
    'terminal': '#22c55e',
    'coding': '#a855f7',
    'planning': '#f59e0b',
    'file-manager': '#06b6d4',
};

const VIEW_ICONS: Record<ComputerView, typeof Monitor> = {
    'idle': Monitor,
    'browsing': Globe,
    'terminal': Terminal,
    'coding': Code,
    'planning': ListTodo,
    'file-manager': FileCode2,
};

const VIEW_LABELS: Record<ComputerView, string> = {
    'idle': 'Standby',
    'browsing': 'Web Browser',
    'terminal': 'Terminal',
    'coding': 'Editor',
    'planning': 'Task Execution',
    'file-manager': 'File Manager',
};

// ── Activity Timeline Entry Type ────────────────────────────
interface TimelineEntry {
    id: string;
    type: 'search' | 'code' | 'file' | 'plan' | 'tool' | 'status';
    label: string;
    detail?: string;
    timestamp: number;
    status: 'running' | 'done' | 'failed';
}

// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT — Unified Computer Panel
// ═════════════════════════════════════════════════════════════

export const VirtualSandboxPanel = memo(function VirtualSandboxPanel() {
    const ctx = useMimiAgentContext();
    const view = ctx.computerView;
    const viewColor = VIEW_COLORS[view];
    const ViewIcon = VIEW_ICONS[view];
    const viewLabel = VIEW_LABELS[view];
    const [taskTreeOpen, setTaskTreeOpen] = useState(true);
    const [timelineOpen, setTimelineOpen] = useState(false);
    const [prevView, setPrevView] = useState<ComputerView>(view);
    const [viewKey, setViewKey] = useState(0);

    // ── Activity Timeline State ──────────────────────────────
    const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

    // Track tool executions → timeline
    useEffect(() => {
        if (ctx.agentEvents.activeTool && typeof ctx.agentEvents.activeTool === 'object') {
            const toolName = ctx.agentEvents.activeTool.toolName;
            const type: TimelineEntry['type'] =
                toolName === 'web_search' ? 'search' :
                    toolName.includes('file') || toolName.includes('write') ? 'file' :
                        toolName.includes('execute') || toolName.includes('run') ? 'code' : 'tool';
            setTimeline(prev => [{
                id: `tl-${Date.now()}`,
                type,
                label: toolName.replace(/_/g, ' '),
                detail: ctx.agentEvents.activeTool && typeof ctx.agentEvents.activeTool === 'object'
                    ? String(ctx.agentEvents.activeTool.parameters?.query || ctx.agentEvents.activeTool.parameters?.code || '').slice(0, 50)
                    : undefined,
                timestamp: Date.now(),
                status: 'running' as const,
            }, ...prev].slice(0, 30));
        }
    }, [ctx.agentEvents.activeTool]);

    // Mark completed tools
    useEffect(() => {
        if (ctx.agentEvents.recentTools && ctx.agentEvents.recentTools.length > 0) {
            const latest = ctx.agentEvents.recentTools[0];
            setTimeline(prev => {
                const updated = [...prev];
                const idx = updated.findIndex(e => e.status === 'running' && e.label.replace(/ /g, '_') === latest.toolName);
                if (idx >= 0) updated[idx] = { ...updated[idx], status: latest.status === 'done' ? 'done' : 'failed' };
                return updated;
            });
        }
    }, [ctx.agentEvents.recentTools]);

    // Track status changes → timeline
    useEffect(() => {
        if (ctx.agentEvents.agentStatus && ctx.agentEvents.agentStatus !== 'idle') {
            setTimeline(prev => [{
                id: `tl-status-${Date.now()}`,
                type: 'status' as const,
                label: ctx.agentEvents.agentStatus,
                timestamp: Date.now(),
                status: 'done' as const,
            }, ...prev].slice(0, 30));
        }
    }, [ctx.agentEvents.agentStatus]);

    // Auto-open timeline when agent starts working
    useEffect(() => {
        if (ctx.isGenerating && !timelineOpen) setTimelineOpen(true);
    }, [ctx.isGenerating, timelineOpen]);

    // Track view changes for transition animation
    useEffect(() => {
        if (view !== prevView) {
            setPrevView(view);
            setViewKey(k => k + 1);
        }
    }, [view, prevView]);

    // Dynamic view subtitle based on context
    const viewSubtitle = useMemo(() => {
        if (view === 'browsing' && ctx.agentEvents.activeTool && typeof ctx.agentEvents.activeTool === 'object') {
            if (ctx.agentEvents.activeTool.toolName === 'web_search') {
                return `Suche: ${String(ctx.agentEvents.activeTool.parameters?.query || '').slice(0, 30)}...`;
            }
        }
        if (view === 'coding') {
            const art = ctx.codeArtifacts[ctx.activeArtifactIdx];
            if (art) return art.filename;
        }
        if (view === 'terminal' && ctx.agentEvents.activeTool && typeof ctx.agentEvents.activeTool === 'object') {
            return ctx.agentEvents.activeTool.toolName;
        }
        if (view === 'planning') {
            const plan = ctx.agentEvents.activePlan;
            if (plan) return `${plan.steps.filter(s => s.status === 'done' || s.status === 'skipped').length}/${plan.steps.length} Schritte`;
        }
        return null;
    }, [view, ctx.agentEvents.activeTool, ctx.codeArtifacts, ctx.activeArtifactIdx, ctx.agentEvents.activePlan]);

    // Auto-open task tree when planning starts
    useEffect(() => {
        if (ctx.agentEvents.activePlan) setTaskTreeOpen(true);
    }, [ctx.agentEvents.activePlan]);

    return (
        <div className={`mimi-panel panel-right${ctx.isGenerating ? ' agent-active' : ''}`}>
            {/* 3D Pendulum / Orb */}
            <div className="sandbox-pendulum-container">
                <div className="pendulum-orb" />
                <div className="pendulum-core" />
                <div className="pendulum-ring" />
                <div className="pendulum-ring-2" />
            </div>

            {/* ── OS Header ─────────────────────── */}
            <div className="agent-os-header">
                <div className="os-branding">
                    <Brain className="w-4 h-4 text-brand-cyan" />
                    <span>MIMI&apos;s Computer</span>
                </div>
                <div className="os-status">
                    <span className={`status-dot ${ctx.isGenerating ? 'active' : ''}`} />
                    <span>{ctx.isGenerating ? 'Aktiv' : 'Standby'}</span>
                </div>
                <div className="os-controls">
                    <span className="minimize" />
                    <span className="maximize" />
                    <span className="close" />
                </div>
            </div>

            {/* ── Active View Indicator (replaces tab bar) ─── */}
            <div className="computer-view-bar">
                <div className="view-indicator" style={{ '--view-color': viewColor } as React.CSSProperties}>
                    <ViewIcon className="w-3.5 h-3.5" />
                    <span>{viewLabel}</span>
                    {viewSubtitle && <span className="view-subtitle">· {viewSubtitle}</span>}
                    {ctx.isGenerating && <div className="view-pulse" />}
                </div>

                {/* Active Agent Avatars */}
                <div className="agent-avatars">
                    {ctx.activeSwarmAgents.length > 0 ? (
                        ctx.activeSwarmAgents.slice(0, 4).map((agentId) => {
                            const spec = AGENT_SPECS[agentId] || AGENT_SPECS['general'];
                            const AgentIcon = spec.icon;
                            return (
                                <div
                                    key={agentId}
                                    className="agent-avatar active"
                                    title={spec.label}
                                    style={{ '--agent-color': spec.color } as React.CSSProperties}
                                >
                                    <AgentIcon className="w-3 h-3" />
                                </div>
                            );
                        })
                    ) : (
                        <div className="agent-avatar idle" title="Kein Agent aktiv">
                            <Bot className="w-3 h-3" />
                        </div>
                    )}
                </div>

                {/* Timeline toggle */}
                <button
                    className={`timeline-toggle-btn${timelineOpen ? ' active' : ''}`}
                    onClick={() => setTimelineOpen(prev => !prev)}
                    title={timelineOpen ? 'Activity Log ausblenden' : 'Activity Log anzeigen'}
                >
                    <Activity className="w-3.5 h-3.5" />
                    {timeline.filter(e => e.status === 'running').length > 0 && (
                        <span className="timeline-badge">{timeline.filter(e => e.status === 'running').length}</span>
                    )}
                </button>

                {/* Task tree toggle */}
                <button
                    className="task-tree-toggle"
                    onClick={() => setTaskTreeOpen(prev => !prev)}
                    title={taskTreeOpen ? 'Task Tree ausblenden' : 'Task Tree anzeigen'}
                >
                    <ListTodo className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* ── Computer Viewport ─────────────── */}
            <div className="computer-viewport">
                {/* Claude-style Artifact Panel overlay */}
                {ctx.activeDetectedArtifact && (
                    <ArtifactPanel
                        artifact={ctx.activeDetectedArtifact}
                        onClose={ctx.closeArtifact}
                    />
                )}

                {/* Auto-switching views based on computerView */}
                <div key={viewKey} className={`computer-view-content view-${view}`} style={{ '--view-color': viewColor } as React.CSSProperties}>
                    {view === 'browsing' && <BrowserView />}
                    {view === 'terminal' && <TerminalView />}
                    {view === 'coding' && <EditorView />}
                    {view === 'planning' && <PlanningView />}
                    {view === 'idle' && <IdleView />}
                    {view === 'file-manager' && <FileManagerView />}
                </div>

                {/* ── Activity Timeline Overlay ── */}
                {timelineOpen && (
                    <div className="activity-timeline-overlay">
                        <ActivityTimeline entries={timeline} />
                    </div>
                )}

                {/* ── Persistent Task Tree Overlay ── */}
                {taskTreeOpen && ctx.agentEvents.activePlan && (
                    <div className="task-tree-overlay">
                        <SwarmTaskTree />
                    </div>
                )}
            </div>

            {/* ── Resource Status Bar ─────────────── */}
            <ResourceStatusBar />
        </div>
    );
});

// ═════════════════════════════════════════════════════════════
// COMPONENT: Activity Timeline
// ═════════════════════════════════════════════════════════════

const TIMELINE_ICONS: Record<TimelineEntry['type'], typeof Search> = {
    'search': Search,
    'code': Code,
    'file': FileCode2,
    'plan': ListTodo,
    'tool': Zap,
    'status': Activity,
};

const TIMELINE_COLORS: Record<TimelineEntry['type'], string> = {
    'search': '#3b82f6',
    'code': '#a855f7',
    'file': '#22c55e',
    'plan': '#f59e0b',
    'tool': '#00d4ff',
    'status': '#64748b',
};

function ActivityTimeline({ entries }: { entries: TimelineEntry[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <div className="activity-timeline-inner">
            <div className="timeline-header">
                <Activity className="w-3.5 h-3.5" style={{ color: '#00d4ff' }} />
                <span>Activity Log</span>
                <span className="timeline-count">{entries.length}</span>
            </div>
            <div className="timeline-entries" ref={scrollRef}>
                {entries.length > 0 ? (
                    entries.map((entry, i) => {
                        const EntryIcon = TIMELINE_ICONS[entry.type];
                        const color = TIMELINE_COLORS[entry.type];
                        const isRunning = entry.status === 'running';
                        const timeAgo = Math.round((Date.now() - entry.timestamp) / 1000);
                        return (
                            <div key={entry.id} className={`timeline-entry ${entry.status}`} style={{ '--tl-color': color } as React.CSSProperties}>
                                {/* Connecting line */}
                                {i < entries.length - 1 && <div className="timeline-connector" />}
                                <div className={`timeline-dot ${entry.status}`}>
                                    {isRunning ? (
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    ) : (
                                        <EntryIcon className="w-2.5 h-2.5" />
                                    )}
                                </div>
                                <div className="timeline-content">
                                    <span className="timeline-label">{entry.label}</span>
                                    {entry.detail && <span className="timeline-detail">{entry.detail}</span>}
                                </div>
                                <span className="timeline-time">{timeAgo < 60 ? `${timeAgo}s` : `${Math.round(timeAgo / 60)}m`}</span>
                            </div>
                        );
                    })
                ) : (
                    <div className="timeline-empty">
                        <Clock className="w-4 h-4" style={{ opacity: 0.3 }} />
                        <span>Noch keine Aktivität</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════
// COMPONENT: Resource Status Bar
// ═════════════════════════════════════════════════════════════

function ResourceStatusBar() {
    const ctx = useMimiAgentContext();
    const [cpuLevel, setCpuLevel] = useState(0);
    const [networkActive, setNetworkActive] = useState(false);

    // Simulate CPU based on agent activity
    useEffect(() => {
        if (ctx.isGenerating) {
            const interval = setInterval(() => {
                setCpuLevel(30 + Math.random() * 60);
            }, 400);
            return () => clearInterval(interval);
        } else {
            setCpuLevel(prev => prev > 0 ? 0 : prev);
        }
    }, [ctx.isGenerating]);

    // Network indicator during browsing
    useEffect(() => {
        setNetworkActive(ctx.computerView === 'browsing' && ctx.isGenerating);
    }, [ctx.computerView, ctx.isGenerating]);

    return (
        <div className="resource-status-bar">
            <div className="resource-item" title="CPU Auslastung">
                <Cpu className="w-3 h-3" />
                <div className="resource-meter">
                    <div
                        className={`resource-fill${ctx.isGenerating ? ' active' : ''}`}
                        style={{ width: `${cpuLevel}%` }}
                    />
                </div>
                <span className="resource-value">{Math.round(cpuLevel)}%</span>
            </div>

            <div className="resource-item" title="WebGPU Memory">
                <Database className="w-3 h-3" />
                <span className="resource-value mem">{ctx.isReady ? 'Active' : '—'}</span>
            </div>

            <div className={`resource-item${networkActive ? ' net-active' : ''}`} title="Netzwerk">
                <Network className="w-3 h-3" />
                <span className="resource-value">{networkActive ? 'Aktiv' : 'Idle'}</span>
                {networkActive && <div className="net-pulse" />}
            </div>

            {ctx.agentEvents.elapsedTime > 0 && (
                <div className="resource-item elapsed" title="Verstrichene Zeit">
                    <Clock className="w-3 h-3" />
                    <span className="resource-value">{(ctx.agentEvents.elapsedTime / 1000).toFixed(1)}s</span>
                </div>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════
// VIEW: IDLE — Agent Grid + Capabilities + Quick Actions
// ═════════════════════════════════════════════════════════════

function IdleView() {
    const ctx = useMimiAgentContext();
    const totalFiles = ctx.codeArtifacts.length + ctx.generatedFiles.length;

    return (
        <div className="computer-idle-view">
            {/* Ambient glow */}
            <div className="idle-ambient-glow" />

            <div className="idle-center">
                {/* Animated orb with rings */}
                <div className="idle-orb-container">
                    <div className="idle-orb-ring idle-orb-ring-1" />
                    <div className="idle-orb-ring idle-orb-ring-2" />
                    <div className="idle-orb">
                        <Monitor className="w-7 h-7" />
                    </div>
                    <div className="idle-particle p1" />
                    <div className="idle-particle p2" />
                    <div className="idle-particle p3" />
                </div>

                <h4>MIMI&apos;s Computer</h4>
                <p className="idle-subtitle">
                    {ctx.isReady
                        ? 'Bereit für Aufgaben. Schreibe eine komplexe Anfrage und beobachte die Agenten bei der Arbeit.'
                        : 'System wird initialisiert...'}
                </p>

                <div className="idle-status-row">
                    <div className={`idle-chip ${ctx.isReady ? 'online' : ''}`}>
                        {ctx.isReady ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        <span>{ctx.isReady ? 'Engine Online' : 'Laden...'}</span>
                    </div>
                    <div className="idle-chip">
                        <Cpu className="w-3 h-3" />
                        <span>WebGPU</span>
                    </div>
                    {totalFiles > 0 && (
                        <div className="idle-chip files">
                            <FileCode2 className="w-3 h-3" />
                            <span>{totalFiles} Dateien</span>
                        </div>
                    )}
                </div>

                {/* Agent Grid with Capability Tags */}
                <div className="idle-agent-grid">
                    {Object.entries(AGENT_SPECS).slice(0, 6).map(([id, spec]) => {
                        const AgentIcon = spec.icon;
                        const isActive = ctx.activeSwarmAgents.includes(id);
                        return (
                            <div key={id} className={`idle-agent-card ${isActive ? 'active' : ''}`}>
                                <div className="agent-icon-wrap" style={{ '--agent-color': spec.color } as React.CSSProperties}>
                                    <AgentIcon className="w-4 h-4" />
                                </div>
                                <span className="agent-label">{spec.label}</span>
                                <div className="agent-capabilities">
                                    {spec.capabilities.map(cap => (
                                        <span key={cap} className="cap-tag" style={{ '--agent-color': spec.color } as React.CSSProperties}>{cap}</span>
                                    ))}
                                </div>
                                {isActive && <div className="agent-active-dot" />}
                            </div>
                        );
                    })}
                </div>

                {/* Quick Action Suggestions */}
                {ctx.isReady && (
                    <div className="idle-quick-actions">
                        <Sparkles className="w-3 h-3" style={{ color: '#fbbf24', opacity: 0.7 }} />
                        <span className="quick-actions-label">Vorschläge</span>
                        {['Recherchiere aktuelle KI-News', 'Erstelle ein Python Script', 'Analysiere Daten'].map((action, i) => (
                            <button key={i} className="quick-action-chip" onClick={() => ctx.setInput(action)}>
                                {action}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Artifacts preview section */}
            {ctx.detectedArtifacts.length > 0 && (
                <div className="idle-artifacts-section">
                    <div className="idle-artifacts-header">
                        <Zap className="w-3 h-3" style={{ color: '#fbbf24' }} />
                        <span>Letzte Artifacts</span>
                    </div>
                    <div className="idle-artifacts-list">
                        {ctx.detectedArtifacts.slice(-3).reverse().map((art, i) => (
                            <button
                                key={i}
                                className="idle-artifact-card"
                                onClick={() => ctx.openArtifact(art)}
                            >
                                <div className="artifact-icon-sm">
                                    {art.type === 'code' ? <Code className="w-3.5 h-3.5" /> : <FileCode2 className="w-3.5 h-3.5" />}
                                </div>
                                <div className="artifact-info-sm">
                                    <span className="artifact-title-sm">{art.title || art.language || 'Artifact'}</span>
                                    <span className="artifact-type-sm">{art.language || art.type}</span>
                                </div>
                                <ChevronRight className="w-3 h-3" style={{ opacity: 0.3 }} />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════
// VIEW: BROWSING — Enhanced Browser with Scanning Visualization
// ═════════════════════════════════════════════════════════════

function BrowserView() {
    const ctx = useMimiAgentContext();
    const [scannedUrls, setScannedUrls] = useState<string[]>([]);
    const [pagesScanned, setPagesScanned] = useState(0);
    const [loadProgress, setLoadProgress] = useState(0);

    // Derive URL from active tool
    const browserUrl = useMemo(() => {
        if (ctx.agentEvents.activeTool && typeof ctx.agentEvents.activeTool === 'object') {
            if (ctx.agentEvents.activeTool.toolName === 'web_search') {
                return `duckduckgo.com/?q=${encodeURIComponent(String(ctx.agentEvents.activeTool.parameters?.query || ''))}`;
            }
        }
        if (ctx.browserContent) return 'agent://results';
        return 'mimi-agent.local';
    }, [ctx.agentEvents.activeTool, ctx.browserContent]);

    // Track browsing history
    useEffect(() => {
        if (browserUrl && browserUrl !== 'mimi-agent.local') {
            setScannedUrls(prev => [browserUrl, ...prev.filter(u => u !== browserUrl)].slice(0, 12));
            setPagesScanned(p => p + 1);
        }
    }, [browserUrl]);

    // Simulate page scanning while thinking
    useEffect(() => {
        if (!ctx.agentEvents.isThinking) return;
        const scanUrls = [
            'duckduckgo.com/?q=search',
            'en.wikipedia.org/wiki/...',
            'stackoverflow.com/questions/...',
            'github.com/search?q=...',
            'news.ycombinator.com',
            'dev.to/search',
            'arxiv.org/abs/...',
            'reddit.com/r/technology'
        ];
        const interval = setInterval(() => {
            const url = scanUrls[Math.floor(Math.random() * scanUrls.length)];
            setScannedUrls(prev => [url, ...prev].slice(0, 12));
            setPagesScanned(p => p + 1);
        }, 900);
        return () => clearInterval(interval);
    }, [ctx.agentEvents.isThinking]);

    // Simulate loading progress
    useEffect(() => {
        if (ctx.agentEvents.isThinking) {
            setLoadProgress(0);
            const interval = setInterval(() => {
                setLoadProgress(prev => {
                    if (prev >= 95) return prev;
                    return prev + Math.random() * 15;
                });
            }, 300);
            return () => clearInterval(interval);
        } else {
            setLoadProgress(100);
            const t = setTimeout(() => setLoadProgress(0), 500);
            return () => clearTimeout(t);
        }
    }, [ctx.agentEvents.isThinking]);

    return (
        <div className="computer-browser-view">
            {/* Browser chrome — Enhanced */}
            <div className="browser-chrome">
                <div className="browser-nav-controls">
                    <div className="browser-nav-dots">
                        <div className="browser-nav-dot" />
                        <div className="browser-nav-dot" />
                        <div className="browser-nav-dot" />
                    </div>
                    <button className="browser-nav-btn" title="Zurück"><ArrowLeft className="w-3 h-3" /></button>
                    <button className="browser-nav-btn" title="Weiter"><ArrowRight className="w-3 h-3" /></button>
                    <button className={`browser-nav-btn${ctx.agentEvents.isThinking ? ' spinning' : ''}`} title="Neu laden">
                        <RotateCw className="w-3 h-3" />
                    </button>
                </div>
                <div className="browser-url-bar">
                    <Shield className="w-3 h-3" style={{ color: '#22c55e', opacity: 0.7 }} />
                    <span className={ctx.agentEvents.isThinking ? 'typing-url' : ''}>
                        {browserUrl}
                    </span>
                </div>
                {/* Page counter */}
                {pagesScanned > 0 && (
                    <div className="browser-page-counter">
                        <Globe className="w-3 h-3" />
                        <span>{pagesScanned}</span>
                    </div>
                )}
            </div>

            {/* Loading progress bar */}
            {loadProgress > 0 && loadProgress < 100 && (
                <div className="browser-load-bar">
                    <div className="browser-load-fill" style={{ width: `${loadProgress}%` }} />
                </div>
            )}

            {/* Tab strip for browsed pages */}
            {scannedUrls.length > 0 && ctx.agentEvents.isThinking && (
                <div className="browser-tab-strip">
                    {scannedUrls.slice(0, 4).map((url, i) => (
                        <div key={i} className={`browser-tab${i === 0 ? ' active' : ''}`}>
                            <Globe className="w-2.5 h-2.5" />
                            <span>{url.split('/')[0].replace('www.', '')}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Scanning overlay */}
            {ctx.agentEvents.isThinking && (
                <div className="agent-browsing-overlay">
                    <div className="browser-scan-line" />
                    <div className="browsing-spinner" />
                    <span className="browsing-text">
                        Agent durchsucht Web... {pagesScanned > 0 && <strong>{pagesScanned} Seiten gescannt</strong>}
                    </span>
                </div>
            )}

            {/* Page content */}
            <div className="browser-page" style={{ flex: 1, position: 'relative', overflow: 'auto' }}>
                {ctx.browserContent ? (
                    <div
                        className="browser-preview"
                        style={{ padding: '12px', fontSize: '0.75rem', lineHeight: 1.5, overflow: 'auto', maxHeight: '100%' }}
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(ctx.browserContent) }}
                    />
                ) : (
                    <div className="browser-placeholder">
                        <Globe className="w-5 h-5" style={{ opacity: 0.3 }} />
                        <span>Ergebnisse erscheinen hier</span>
                    </div>
                )}
            </div>

            {/* Browsing history strip at bottom */}
            {scannedUrls.length > 0 && (
                <div className="browser-history-strip">
                    <span className="history-label">Besucht:</span>
                    {scannedUrls.slice(0, 5).map((url, i) => (
                        <span key={i} className="history-pill">
                            <Globe className="w-2 h-2" style={{ opacity: 0.5 }} />
                            {url.split('/')[0].replace('www.', '')}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════
// VIEW: TERMINAL — Enhanced with blinking cursor & syntax color
// ═════════════════════════════════════════════════════════════

function TerminalView() {
    const ctx = useMimiAgentContext();
    const termEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        termEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ctx.terminalLines]);

    return (
        <div className="computer-terminal-view">
            <div className="terminal-chrome">
                <div className="browser-nav-dots">
                    <div className="browser-nav-dot" style={{ background: '#ef4444' }} />
                    <div className="browser-nav-dot" style={{ background: '#f59e0b' }} />
                    <div className="browser-nav-dot" style={{ background: '#22c55e' }} />
                </div>
                <span className="terminal-title">mimi@agent:~$</span>
                <div className="terminal-actions">
                    <button className="terminal-action-btn" title="Terminal leeren" onClick={() => { }}>
                        <Hash className="w-3 h-3" />
                    </button>
                </div>
            </div>
            <div className="terminal-box">
                {ctx.terminalLines.length > 0 ? (
                    ctx.terminalLines.map((line, i) => (
                        <div className={`tline tline-${line.type || 'info'}`} key={i}>
                            <span className="prefix" style={{
                                color: line.type === 'error' ? '#ef4444'
                                    : line.type === 'success' ? '#22c55e'
                                        : line.type === 'tool' ? '#a855f7'
                                            : '#00d4ff'
                            }}>{line.prefix}</span>{" "}
                            <span className="msg">{line.msg}</span>
                        </div>
                    ))
                ) : (
                    <div className="tline">
                        <span className="prefix" style={{ color: '#22c55e' }}>mimi@agent:~$</span>{" "}
                        <span className="msg" style={{ opacity: 0.4 }}>Warte auf Code-Ausführung...</span>
                    </div>
                )}
                {/* Blinking cursor */}
                <div className="terminal-cursor-line">
                    <span className="prefix" style={{ color: '#22c55e' }}>mimi@agent:~$</span>{" "}
                    <span className="terminal-block-cursor" />
                </div>
                <div ref={termEndRef} />
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════
// VIEW: CODING — Monaco Editor with generated files
// ═════════════════════════════════════════════════════════════

function EditorView() {
    const ctx = useMimiAgentContext();
    const activeArtifact = ctx.codeArtifacts[ctx.activeArtifactIdx];

    return (
        <div className="computer-editor-view">
            {/* File tabs */}
            <div className="editor-tab-bar">
                {ctx.codeArtifacts.length > 0 ? (
                    ctx.codeArtifacts.map((art, i) => (
                        <button
                            key={i}
                            className={`editor-file-tab ${i === ctx.activeArtifactIdx ? 'active' : ''}`}
                            onClick={() => ctx.setActiveArtifactIdx(i)}
                        >
                            <FileCode2 className="w-3 h-3" />
                            <span>{art.filename}</span>
                        </button>
                    ))
                ) : (
                    <span className="editor-file-tab active">
                        <FileCode2 className="w-3 h-3" />
                        <span>untitled</span>
                    </span>
                )}
                {activeArtifact && (
                    <button
                        className="editor-action-btn"
                        title="Code kopieren"
                        onClick={() => ctx.handleCopyMessage(activeArtifact.content)}
                    >
                        <Copy className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Monaco */}
            <div className={`editor-code-area${ctx.isGenerating ? ' typing' : ''}`}>
                {activeArtifact ? (
                    <MonacoEditor
                        height="100%"
                        language={LANGUAGE_MAP[activeArtifact.language?.toLowerCase() || 'text'] || 'plaintext'}
                        value={activeArtifact.content}
                        theme="vs-dark"
                        options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 12,
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            wordWrap: 'on',
                            padding: { top: 8 },
                            renderLineHighlight: 'none',
                            overviewRulerBorder: false,
                            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                        }}
                    />
                ) : (
                    <div className="editor-empty-state">
                        <Code className="w-6 h-6" style={{ opacity: 0.3 }} />
                        <span>Agent generiert Code...</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════
// VIEW: PLANNING — Task decomposition tree
// ═════════════════════════════════════════════════════════════

function PlanningView() {
    const ctx = useMimiAgentContext();
    const plan = ctx.agentEvents.activePlan;

    return (
        <div className="computer-planning-view">
            <div className="planning-header">
                <Brain className="w-4 h-4 text-brand-cyan" />
                <span>Task Execution</span>
                {ctx.agentEvents.elapsedTime > 0 && (
                    <span className="elapsed-badge">
                        {Math.round(ctx.agentEvents.elapsedTime / 1000)}s
                    </span>
                )}
            </div>

            {/* Active agents row */}
            <div className="planning-agents-row">
                {ctx.activeSwarmAgents.length > 0 ? (
                    ctx.activeSwarmAgents.map(agentId => {
                        const spec = AGENT_SPECS[agentId] || AGENT_SPECS['general'];
                        const AgentIcon = spec.icon;
                        return (
                            <div key={agentId} className="planning-agent-chip" style={{ '--agent-color': spec.color } as React.CSSProperties}>
                                <AgentIcon className="w-3 h-3" />
                                <span>{spec.label}</span>
                            </div>
                        );
                    })
                ) : (
                    <div className="planning-agent-chip" style={{ '--agent-color': '#00d4ff' } as React.CSSProperties}>
                        <Bot className="w-3 h-3" />
                        <span>Analyzing...</span>
                    </div>
                )}
            </div>

            {/* Thinking indicator */}
            {ctx.agentEvents.isThinking && (
                <div className="thinking-indicator">
                    <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#00d4ff' }} />
                    <span>Agent denkt nach...</span>
                    {ctx.agentEvents.thinkingContent && (
                        <div className="thinking-preview">
                            {ctx.agentEvents.thinkingContent.slice(-80)}...
                        </div>
                    )}
                </div>
            )}

            {/* Active tool indicator */}
            {ctx.agentEvents.activeTool && (
                <div className="active-tool-card">
                    <Zap className="w-3 h-3" style={{ color: '#f59e0b' }} />
                    <span className="tool-name">
                        {typeof ctx.agentEvents.activeTool === 'object'
                            ? ctx.agentEvents.activeTool.toolName
                            : String(ctx.agentEvents.activeTool)}
                    </span>
                    <div className="tool-progress-bar" />
                </div>
            )}

            {/* Plan steps or waiting */}
            {plan ? (
                <div className="planning-steps-list">
                    <div className="plan-goal">
                        <ListTodo className="w-3 h-3" style={{ color: '#00d4ff' }} />
                        <span>{plan.goal}</span>
                    </div>
                    {plan.steps.map((step, i) => {
                        const isRunning = step.status === 'running';
                        const isDone = step.status === 'done' || step.status === 'skipped';
                        const isFailed = step.status === 'failed';

                        return (
                            <div key={step.id} className={`planning-step ${step.status}`}>
                                <div className="step-number">
                                    {isDone ? <Check className="w-3 h-3" style={{ color: '#22c55e' }} />
                                        : isFailed ? <AlertCircle className="w-3 h-3" style={{ color: '#ef4444' }} />
                                            : isRunning ? <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#00d4ff' }} />
                                                : <span>{i + 1}</span>}
                                </div>
                                <div className="step-info">
                                    <span className="step-title">{step.title}</span>
                                    <span className="step-desc">{step.description}</span>
                                    {isRunning && (
                                        <div className="step-running-bar" />
                                    )}
                                </div>
                                {step.duration && (
                                    <span className="step-duration">{step.duration}ms</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="planning-waiting">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#00d4ff', opacity: 0.5 }} />
                    <span>Agent verarbeitet Anfrage...</span>
                </div>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════
// VIEW: FILE MANAGER — Generated files overview
// ═════════════════════════════════════════════════════════════

function FileManagerView() {
    const ctx = useMimiAgentContext();

    return (
        <div className="computer-files-view">
            <div className="files-header">
                <FileCode2 className="w-4 h-4 text-brand-cyan" />
                <span>Workspace ({ctx.codeArtifacts.length + ctx.generatedFiles.length} Dateien)</span>
            </div>
            {(ctx.codeArtifacts.length + ctx.generatedFiles.length) > 0 ? (
                <div className="files-grid">
                    {ctx.codeArtifacts.map((art, i) => (
                        <div
                            key={`code-${i}`}
                            className="file-card"
                            onClick={() => { ctx.setActiveArtifactIdx(i); }}
                        >
                            <FileCode2 className="w-4 h-4" style={{ color: '#a855f7' }} />
                            <span className="file-name">{art.filename}</span>
                            <span className="file-lang">{art.language}</span>
                            <button
                                className="file-download-btn"
                                title="Herunterladen"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const blob = new Blob([art.content], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = art.filename;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                    ctx.addToast(`${art.filename} heruntergeladen`);
                                }}
                            >
                                <Download className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {ctx.generatedFiles.map((file, i) => (
                        <div key={`file-${i}`} className="file-card">
                            <FileCode2 className="w-4 h-4" style={{ color: '#22c55e' }} />
                            <span className="file-name">{file.name}</span>
                            <span className="file-lang">{file.type}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="files-empty-state">
                    <FileCode2 className="w-6 h-6" style={{ opacity: 0.3 }} />
                    <span>Noch keine Dateien erstellt</span>
                </div>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════
// PERSISTENT OVERLAY: Swarm Task Tree
// ═════════════════════════════════════════════════════════════

function SwarmTaskTree() {
    const ctx = useMimiAgentContext();
    const plan = ctx.agentEvents.activePlan;

    if (!plan) return null;

    const completedCount = plan.steps.filter(s => s.status === 'done' || s.status === 'skipped').length;
    const progressPercent = plan.steps.length > 0 ? Math.round((completedCount / plan.steps.length) * 100) : 0;

    return (
        <div className="swarm-tree-overlay-inner">
            <div className="swarm-tree-header">
                <Brain className="w-3.5 h-3.5 text-brand-cyan" />
                <span>Fortschritt</span>
                <span className="progress-badge">{progressPercent}%</span>
            </div>

            <div className="swarm-tree-progress-bar">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="swarm-tree-steps">
                {plan.steps.map((step) => {
                    const isRunning = step.status === 'running';
                    const isDone = step.status === 'done' || step.status === 'skipped';
                    const isFailed = step.status === 'failed';

                    let StepIcon = Settings;
                    if (step.tool === 'web_search' || step.tool?.includes('read')) StepIcon = Search;
                    if (step.tool === 'write_file' || step.tool?.includes('replace')) StepIcon = PenTool;
                    if (step.tool === 'run_command' || step.tool === 'execute_python') StepIcon = Terminal;
                    if (isDone) StepIcon = Check;
                    if (isFailed) StepIcon = AlertCircle;

                    return (
                        <div key={step.id} className={`tree-step ${step.status}`}>
                            <div className={`tree-step-dot ${step.status}`}>
                                {isRunning ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                    <StepIcon className="w-2.5 h-2.5" />
                                )}
                            </div>
                            <span className="tree-step-label">{step.title}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
