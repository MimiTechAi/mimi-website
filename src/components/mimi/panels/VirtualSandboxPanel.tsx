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
import { ResultArtifactView } from "./ResultArtifactView";
import { sanitizeHtml } from "../utils/sanitize";
import useAgentComputer from "@/hooks/mimi/useAgentComputer";
import type { AgentComputerState, AgentComputerActions } from "@/hooks/mimi/useAgentComputer";
import { AgentEvents } from "@/lib/mimi/agent-events";
import {
    Globe, Terminal, FileCode2, Copy, Download, Brain,
    Bot, Search, PenTool, Check, ChevronRight, ChevronDown,
    Settings, AlertCircle, Loader2, Monitor, Wifi, WifiOff,
    Cpu, ListTodo, Code, Eye, Zap, Activity, Clock,
    ArrowLeft, ArrowRight, RotateCw, Shield, Hash,
    Layers, Database, Network, ChevronUp, Sparkles,
    Upload, Notebook, GripVertical, X, Archive
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
    'scratchpad': '#f97316',
    'artifacts': '#e879f9',
};

const VIEW_ICONS: Record<ComputerView, typeof Monitor> = {
    'idle': Monitor,
    'browsing': Globe,
    'terminal': Terminal,
    'coding': Code,
    'planning': ListTodo,
    'file-manager': FileCode2,
    'scratchpad': Notebook,
    'artifacts': Layers,
};

const VIEW_LABELS: Record<ComputerView, string> = {
    'idle': 'Standby',
    'browsing': 'Web Browser',
    'terminal': 'Terminal',
    'coding': 'Editor',
    'planning': 'Task Execution',
    'file-manager': 'File Manager',
    'scratchpad': 'Scratchpad',
    'artifacts': 'Artifacts',
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

// ── Shared AgentComputer context (avoids duplicate hook calls in child views) ──
import { createContext, useContext } from "react";
const AgentComputerCtx = createContext<{ state: AgentComputerState; actions: AgentComputerActions } | null>(null);
function useComputer() { return useContext(AgentComputerCtx)!; }

export const VirtualSandboxPanel = memo(function VirtualSandboxPanel() {
    const ctx = useMimiAgentContext();
    const [computer, computerActions] = useAgentComputer();
    const [localViewOverride, setLocalViewOverride] = useState<ComputerView | null>(null);
    const view = localViewOverride ?? ctx.computerView;
    const viewColor = VIEW_COLORS[view];
    const ViewIcon = VIEW_ICONS[view];
    const viewLabel = VIEW_LABELS[view];
    const [taskTreeOpen, setTaskTreeOpen] = useState(true);
    const [timelineOpen, setTimelineOpen] = useState(false);
    const [prevView, setPrevView] = useState<ComputerView>(view);
    const [viewKey, setViewKey] = useState(0);

    // Auto-clear local override after 15s so auto-detection resumes
    useEffect(() => {
        if (!localViewOverride) return;
        const t = setTimeout(() => setLocalViewOverride(null), 15000);
        return () => clearTimeout(t);
    }, [localViewOverride]);

    // ── Split View State ──────────────────────────────────────
    const [splitMode, setSplitMode] = useState(false);
    const [splitRatio, setSplitRatio] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('mimi-split-ratio');
            return saved ? parseFloat(saved) : 0.5;
        }
        return 0.5;
    });
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('mimi-split-ratio', String(splitRatio));
        }
    }, [splitRatio]);

    // ── Auto-boot AgentComputer ──────────────────────────────
    useEffect(() => {
        if (!computer.isReady && !computer.isBooting) {
            computerActions.boot();
        }
    }, [computer.isReady, computer.isBooting, computerActions]);

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

    const computerCtxValue = useMemo(() => ({
        state: computer, actions: computerActions
    }), [computer, computerActions]);

    return (
        <AgentComputerCtx.Provider value={computerCtxValue}>
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

                    {/* Scratchpad toggle */}
                    <button
                        className={`task-tree-toggle${view === 'scratchpad' ? ' active' : ''}`}
                        onClick={() => setLocalViewOverride(view === 'scratchpad' ? null : 'scratchpad')}
                        title="Scratchpad anzeigen"
                    >
                        <Notebook className="w-3.5 h-3.5" />
                    </button>

                    {/* Artifacts toggle */}
                    <button
                        className={`task-tree-toggle${view === 'artifacts' ? ' active' : ''}`}
                        onClick={() => setLocalViewOverride(view === 'artifacts' ? null : 'artifacts')}
                        title="Artifacts anzeigen"
                    >
                        <Layers className="w-3.5 h-3.5" />
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
                        {splitMode ? (
                            <SplitViewContainer ratio={splitRatio} onRatioChange={setSplitRatio}>
                                <TerminalView />
                                <EditorView />
                            </SplitViewContainer>
                        ) : (
                            <>
                                {view === 'browsing' && <BrowserView />}
                                {view === 'terminal' && <TerminalView />}
                                {view === 'coding' && <EditorView />}
                                {view === 'planning' && <PlanningView />}
                                {view === 'idle' && <IdleView />}
                                {view === 'file-manager' && <FileManagerView />}
                                {view === 'scratchpad' && <ScratchpadView />}
                                {view === 'artifacts' && <ResultArtifactView />}
                            </>
                        )}
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

                    {/* ── Process List Overlay ── */}
                    {computer.runningProcesses.length > 0 && (
                        <div className="process-list-overlay">
                            <ProcessListPanel />
                        </div>
                    )}
                </div>

                {/* ── Resource Status Bar ─────────────── */}
                <div className="panel-bottom-bar">
                    <button
                        className={`split-toggle-btn${splitMode ? ' active' : ''}`}
                        onClick={() => setSplitMode(prev => !prev)}
                        title={splitMode ? 'Split View beenden' : 'Terminal + Editor nebeneinander'}
                    >
                        <GripVertical className="w-3.5 h-3.5" />
                        <span>Split</span>
                    </button>
                    <ResourceStatusBar />
                </div>
            </div>
        </AgentComputerCtx.Provider>
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
    const { state: computer } = useComputer();
    const networkActive = ctx.computerView === 'browsing' && ctx.isGenerating;

    // Derive CPU from real process count + agent status
    const cpuLevel = useMemo(() => {
        if (!computer.isReady) return 0;
        const runCount = computer.runningProcesses.length;
        const base = ctx.isGenerating ? 40 : 0;
        return Math.min(100, base + runCount * 15);
    }, [computer.isReady, computer.runningProcesses.length, ctx.isGenerating]);

    // Derive file count from real status
    const fileCount = computer.status?.filesystem?.fileCount ?? 0;
    const uptime = computer.status?.uptime ?? 0;
    const uptimeStr = uptime > 0 ? `${Math.round(uptime / 1000)}s` : '—';

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

            <div className="resource-item" title="Dateien im Workspace">
                <Database className="w-3 h-3" />
                <span className="resource-value mem">{computer.isReady ? `${fileCount} Files` : '—'}</span>
            </div>

            <div className={`resource-item${networkActive ? ' net-active' : ''}`} title="Netzwerk">
                <Network className="w-3 h-3" />
                <span className="resource-value">{networkActive ? 'Aktiv' : 'Idle'}</span>
                {networkActive && <div className="net-pulse" />}
            </div>

            <div className="resource-item" title="Prozesse">
                <Layers className="w-3 h-3" />
                <span className="resource-value">{computer.runningProcesses.length} running</span>
            </div>

            {(ctx.agentEvents.elapsedTime > 0 || uptime > 0) && (
                <div className="resource-item elapsed" title="Uptime">
                    <Clock className="w-3 h-3" />
                    <span className="resource-value">{ctx.agentEvents.elapsedTime > 0 ? `${(ctx.agentEvents.elapsedTime / 1000).toFixed(1)}s` : uptimeStr}</span>
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
    const { state: computer, actions } = useComputer();
    const termEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputCmd, setInputCmd] = useState('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [cmdHistory, setCmdHistory] = useState<string[]>([]);
    const [historyIdx, setHistoryIdx] = useState(-1);
    const activeProcessId = useRef<string | null>(null);

    // Merge real AgentComputer terminal output with legacy ctx.terminalLines
    const mergedLines = useMemo(() => {
        const computerLines = computer.terminalHistory.map(t => ({
            prefix: t.type === 'input' ? 'mimi@agent:~$' : t.type === 'stderr' ? '✗' : t.type === 'system' ? '⚙' : '→',
            msg: t.content,
            type: t.type === 'stderr' ? 'error' as const : t.type === 'system' ? 'info' as const : t.type === 'input' ? 'tool' as const : 'success' as const,
            _ts: t.timestamp,
        }));
        const ctxLines = ctx.terminalLines.map(l => ({ ...l, _ts: 0 }));
        // Show AgentComputer lines first; fallback to ctx lines if none
        return computerLines.length > 0 ? computerLines : ctxLines;
    }, [computer.terminalHistory, ctx.terminalLines]);

    useEffect(() => {
        termEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [mergedLines]);

    // Auto-focus input on mount
    useEffect(() => { inputRef.current?.focus(); }, []);

    // Detect when running process finishes → re-enable input
    useEffect(() => {
        if (activeProcessId.current && computer.runningProcesses.every(p => p.id !== activeProcessId.current)) {
            setIsExecuting(false);
            activeProcessId.current = null;
            inputRef.current?.focus();
        }
    }, [computer.runningProcesses]);

    const handleShellSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputCmd.trim() || isExecuting) return;
        const cmd = inputCmd.trim();
        setInputCmd('');
        setIsExecuting(true);

        // Push to history (max 50)
        setCmdHistory(prev => {
            const next = [cmd, ...prev.filter(c => c !== cmd)].slice(0, 50);
            return next;
        });
        setHistoryIdx(-1);

        try {
            // Track the process ID for cancel support
            const latestBefore = computer.processes.length;
            await actions.executeShell(cmd);
            // Check if a new process was spawned
            if (computer.processes.length > latestBefore) {
                activeProcessId.current = computer.processes[computer.processes.length - 1]?.id ?? null;
            }
        } catch { /* output displayed in terminal */ }
        setIsExecuting(false);
        inputRef.current?.focus();
    }, [inputCmd, isExecuting, actions, computer.processes]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        // Ctrl+C → kill running process
        if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            if (isExecuting && activeProcessId.current) {
                actions.killProcess(activeProcessId.current);
                activeProcessId.current = null;
                setIsExecuting(false);
            } else if (inputCmd) {
                setInputCmd('');
            }
            return;
        }
        // Arrow Up → older command
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (cmdHistory.length === 0) return;
            const newIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
            setHistoryIdx(newIdx);
            setInputCmd(cmdHistory[newIdx]);
            return;
        }
        // Arrow Down → newer command
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIdx <= 0) {
                setHistoryIdx(-1);
                setInputCmd('');
            } else {
                const newIdx = historyIdx - 1;
                setHistoryIdx(newIdx);
                setInputCmd(cmdHistory[newIdx]);
            }
            return;
        }
    }, [isExecuting, inputCmd, cmdHistory, historyIdx, actions]);

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
                    <button className="terminal-action-btn" title="Terminal leeren" onClick={() => actions.clearTerminal()}>
                        <Hash className="w-3 h-3" />
                    </button>
                </div>
            </div>
            <div className="terminal-box">
                {mergedLines.length > 0 ? (
                    mergedLines.map((line, i) => (
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
                {/* Blinking cursor / running indicator */}
                <div className="terminal-cursor-line">
                    <span className="prefix" style={{ color: '#22c55e' }}>mimi@agent:~$</span>{" "}
                    {isExecuting ? (
                        <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#f59e0b', display: 'inline' }} />
                    ) : (
                        <span className="terminal-block-cursor" />
                    )}
                </div>
                <div ref={termEndRef} />
            </div>
            {/* ── Enhanced Terminal Input ── */}
            <form className="terminal-input-bar" onSubmit={handleShellSubmit}>
                <span className="terminal-input-prompt">{isExecuting ? '⏳' : '$'}</span>
                <input
                    ref={inputRef}
                    type="text"
                    className="terminal-input-field"
                    placeholder={isExecuting ? 'Ausführung läuft… (Ctrl+C zum Abbrechen)' : 'Befehl eingeben…'}
                    value={inputCmd}
                    onChange={e => setInputCmd(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isExecuting}
                    autoComplete="off"
                    spellCheck={false}
                />
                {isExecuting && (
                    <button
                        type="button"
                        className="terminal-cancel-btn"
                        title="Ctrl+C: Abbrechen"
                        onClick={() => {
                            if (activeProcessId.current) {
                                actions.killProcess(activeProcessId.current);
                                activeProcessId.current = null;
                                setIsExecuting(false);
                            }
                        }}
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </form>
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
// VIEW: FILE MANAGER — OPFS files + artifacts + DRAG & DROP UPLOAD
// ═════════════════════════════════════════════════════════════

function FileManagerView() {
    const ctx = useMimiAgentContext();
    const { state: computer, actions } = useComputer();
    const [opfsFiles, setOpfsFiles] = useState<{ name: string; isDirectory: boolean; size?: number }[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploads, setUploads] = useState<{ name: string; pct: number; done: boolean }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Allowed extensions + 10MB limit
    const ALLOWED_EXTS = new Set(['.txt', '.md', '.csv', '.json', '.pdf', '.py', '.js', '.ts', '.html', '.css']);
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    // Load real OPFS files from AgentComputer
    const refreshFiles = useCallback(async () => {
        if (!computer.isReady) return;
        try {
            const entries = await actions.listFiles();
            setOpfsFiles(entries);
        } catch { /* non-critical */ }
    }, [computer.isReady, actions]);

    useEffect(() => {
        refreshFiles();
    }, [refreshFiles, computer.terminalHistory.length]);

    const totalFiles = ctx.codeArtifacts.length + ctx.generatedFiles.length + opfsFiles.length;

    // ── File processing (shared by drag-drop and file picker) ──
    const processFiles = useCallback(async (fileList: File[]) => {
        const validFiles: File[] = [];
        for (const file of fileList) {
            const ext = '.' + file.name.split('.').pop()?.toLowerCase();
            if (!ALLOWED_EXTS.has(ext)) {
                ctx.addToast(`❌ ${file.name}: Dateityp nicht unterstützt`);
                continue;
            }
            if (file.size > MAX_SIZE) {
                ctx.addToast(`❌ ${file.name}: Datei zu groß (max 10MB)`);
                continue;
            }
            validFiles.push(file);
        }
        if (validFiles.length === 0) return;

        // Initialize progress entries
        setUploads(validFiles.map(f => ({ name: f.name, pct: 0, done: false })));

        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            setUploads(prev => prev.map((u, j) => j === i ? { ...u, pct: 20 } : u));
            try {
                const text = await file.text();
                setUploads(prev => prev.map((u, j) => j === i ? { ...u, pct: 60 } : u));

                // Ensure uploads dir exists + write file
                await actions.writeFile(`uploads/${file.name}`, text);

                setUploads(prev => prev.map((u, j) => j === i ? { ...u, pct: 100, done: true } : u));

                // Notify agent event bus
                AgentEvents.fileWrite(`/workspace/uploads/${file.name}`, 'create', file.size);
            } catch {
                setUploads(prev => prev.map((u, j) => j === i ? { ...u, pct: -1, done: true } : u));
                ctx.addToast(`❌ Upload fehlgeschlagen: ${file.name}`);
            }
        }

        // Refresh file list
        await refreshFiles();
        ctx.addToast(`✅ ${validFiles.length} Datei(en) hochgeladen`);

        // Clear progress after delay
        setTimeout(() => setUploads([]), 2000);
    }, [actions, ctx, refreshFiles]);

    // ── Drag & Drop handlers ──
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);
    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        await processFiles(files);
    }, [processFiles]);

    // ── Native file picker handler ──
    const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const files = Array.from(e.target.files);
        await processFiles(files);
        e.target.value = ''; // Reset so same file can be picked again
    }, [processFiles]);

    // ── Download helpers ──
    const downloadFile = useCallback(async (name: string) => {
        try {
            const content = await actions.readFile(name);
            const ext = name.split('.').pop()?.toLowerCase() || '';
            const mimeMap: Record<string, string> = {
                pdf: 'application/pdf', json: 'application/json',
                html: 'text/html', css: 'text/css', csv: 'text/csv',
                js: 'application/javascript', ts: 'text/plain',
                py: 'text/plain', md: 'text/markdown', txt: 'text/plain',
            };
            const mime = mimeMap[ext] || 'application/octet-stream';
            const blob = new Blob([content], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = name; a.click();
            URL.revokeObjectURL(url);
            ctx.addToast(`⬇️ ${name} heruntergeladen`);
        } catch { ctx.addToast(`❌ Download fehlgeschlagen: ${name}`); }
    }, [actions, ctx]);

    const downloadAll = useCallback(async () => {
        const downloadable = opfsFiles.filter(f => !f.isDirectory);
        if (downloadable.length === 0 && ctx.codeArtifacts.length === 0) {
            ctx.addToast('Keine Dateien zum Download');
            return;
        }
        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            for (const file of downloadable) {
                try {
                    const content = await actions.readFile(file.name);
                    zip.file(file.name, content);
                } catch { /* skip unreadable */ }
            }
            for (const art of ctx.codeArtifacts) {
                zip.file(`artifacts/${art.filename}`, art.content);
            }
            const blob = await zip.generateAsync({ type: 'blob' });
            const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `mimi-workspace-${ts}.zip`; a.click();
            URL.revokeObjectURL(url);
            ctx.addToast(`📦 Workspace als ZIP heruntergeladen`);
        } catch { ctx.addToast('❌ ZIP-Erstellung fehlgeschlagen'); }
    }, [opfsFiles, actions, ctx]);

    return (
        <div
            className="computer-files-view"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Hidden file input for native picker */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md,.csv,.json,.pdf,.py,.js,.ts,.html,.css"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
            />

            {/* ── Upload Drop Zone Overlay ── */}
            {isDragging && (
                <div className="file-drop-overlay">
                    <Upload className="w-8 h-8" style={{ color: '#00d4ff' }} />
                    <span>Dateien ablegen → /workspace/uploads/</span>
                    <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>
                        .txt .md .csv .json .pdf .py .js .ts .html .css (max 10MB)
                    </span>
                </div>
            )}

            {/* ── Per-file Upload Progress ── */}
            {uploads.length > 0 && (
                <div className="upload-progress-list">
                    {uploads.map((u, i) => (
                        <div key={i} className="upload-progress-bar">
                            <span className="upload-file-name">{u.name}</span>
                            <div className="upload-progress-track">
                                <div
                                    className={`upload-progress-fill${u.pct === -1 ? ' error' : ''}`}
                                    style={{ width: `${Math.max(0, u.pct)}%` }}
                                />
                            </div>
                            <span>{u.pct === -1 ? '✗' : u.done ? '✓' : `${u.pct}%`}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="files-header">
                <FileCode2 className="w-4 h-4 text-brand-cyan" />
                <span>Workspace ({totalFiles} Dateien)</span>
                <button
                    className="file-upload-btn"
                    title="Dateien hochladen"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Upload className="w-3 h-3" />
                </button>
                {totalFiles > 0 && (
                    <button
                        className="file-upload-btn"
                        title="Alles als ZIP herunterladen"
                        onClick={downloadAll}
                    >
                        <Archive className="w-3 h-3" />
                    </button>
                )}
            </div>
            {totalFiles > 0 ? (
                <div className="files-grid">
                    {/* OPFS workspace files (real) */}
                    {opfsFiles.map((file, i) => (
                        <div key={`opfs-${i}`} className="file-card">
                            {file.isDirectory
                                ? <Layers className="w-4 h-4" style={{ color: '#06b6d4' }} />
                                : <FileCode2 className="w-4 h-4" style={{ color: '#22c55e' }} />}
                            <span className="file-name">{file.name}</span>
                            <span className="file-lang">{file.isDirectory ? 'dir' : file.size ? `${file.size}B` : ''}</span>
                            {!file.isDirectory && (
                                <button
                                    className="file-download-btn"
                                    title="Herunterladen"
                                    onClick={(e) => { e.stopPropagation(); downloadFile(file.name); }}
                                >
                                    <Download className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                    {/* Code artifacts (from inference) */}
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
                    {/* Generated files */}
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
                    <p className="files-empty-hint">Dateien hierher ziehen oder Upload-Button nutzen</p>
                </div>
            )}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════
// VIEW: SCRATCHPAD — Read-only OPFS notes viewer
// ═════════════════════════════════════════════════════════════

const SCRATCHPAD_FILES = ['todo.md', 'notes.md', 'context.md'];

function ScratchpadView() {
    const ctx = useMimiAgentContext();
    const { state: computer, actions } = useComputer();
    const [files, setFiles] = useState<{ name: string; content: string; lastModified: number }[]>([]);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    // Poll OPFS files every 2 seconds for auto-refresh
    useEffect(() => {
        if (!computer.isReady) return;
        let cancelled = false;

        const loadFiles = async () => {
            const loaded: { name: string; content: string; lastModified: number }[] = [];
            for (const name of SCRATCHPAD_FILES) {
                try {
                    const content = await actions.readFile(name);
                    loaded.push({ name, content, lastModified: Date.now() });
                } catch {
                    // File doesn't exist yet
                }
            }
            if (!cancelled) setFiles(loaded);
        };

        loadFiles();
        const interval = setInterval(loadFiles, 2000);
        return () => { cancelled = true; clearInterval(interval); };
    }, [computer.isReady, actions]);

    const toggleSection = useCallback((name: string) => {
        setCollapsed(prev => ({ ...prev, [name]: !prev[name] }));
    }, []);

    const copyContent = useCallback((content: string, name: string) => {
        navigator.clipboard.writeText(content)
            .then(() => ctx.addToast(`${name} kopiert`))
            .catch(() => ctx.addToast('Kopieren fehlgeschlagen'));
    }, [ctx]);

    // Render todo.md as checklist
    const renderContent = useCallback((name: string, content: string) => {
        if (name === 'todo.md') {
            return (
                <div className="scratchpad-checklist">
                    {content.split('\n').map((line, i) => {
                        const checked = /^\s*-\s*\[x\]/i.test(line);
                        const unchecked = /^\s*-\s*\[\s*\]/.test(line);
                        const text = line.replace(/^\s*-\s*\[[ x]\]\s*/i, '');
                        if (checked || unchecked) {
                            return (
                                <div key={i} className={`scratchpad-todo-item${checked ? ' done' : ''}`}>
                                    <span className="scratchpad-checkbox">{checked ? '☑' : '☐'}</span>
                                    <span className="scratchpad-todo-text">{text}</span>
                                </div>
                            );
                        }
                        if (line.trim().startsWith('#')) {
                            return <div key={i} className="scratchpad-heading">{line.replace(/^#+\s*/, '')}</div>;
                        }
                        return line.trim() ? <div key={i} className="scratchpad-line">{line}</div> : null;
                    })}
                </div>
            );
        }
        return <pre className="scratchpad-text">{content}</pre>;
    }, []);

    return (
        <div className="scratchpad-view">
            <div className="scratchpad-header">
                <Notebook className="w-4 h-4" style={{ color: '#f97316' }} />
                <span>Agent Scratchpad</span>
                <span className="scratchpad-badge">Read-only</span>
            </div>

            <div className="scratchpad-sections">
                {SCRATCHPAD_FILES.map(name => {
                    const file = files.find(f => f.name === name);
                    const isCollapsed = collapsed[name] ?? false;
                    const timeStr = file ? new Date(file.lastModified).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

                    return (
                        <div key={name} className="scratchpad-section">
                            <div className="scratchpad-section-header" onClick={() => toggleSection(name)}>
                                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                <span className="scratchpad-section-name">{name}</span>
                                {file && <span className="scratchpad-section-time">{timeStr}</span>}
                                {file && (
                                    <button
                                        className="scratchpad-copy-btn"
                                        title="Inhalt kopieren"
                                        onClick={(e) => { e.stopPropagation(); copyContent(file.content, name); }}
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                )}
                                {!file && <span className="scratchpad-section-empty">—</span>}
                            </div>
                            {!isCollapsed && (
                                <div className="scratchpad-section-body">
                                    {file ? (
                                        renderContent(name, file.content)
                                    ) : (
                                        <div className="scratchpad-placeholder">
                                            Agent hasn&apos;t created <code>{name}</code> yet
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════
// COMPONENT: Split View Container — Draggable horizontal split
// ═════════════════════════════════════════════════════════════

interface SplitViewProps {
    ratio: number;
    onRatioChange: (r: number) => void;
    children: [React.ReactNode, React.ReactNode];
}

function SplitViewContainer({ ratio, onRatioChange, children }: SplitViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;

        const handleMouseMove = (ev: MouseEvent) => {
            if (!isDragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = ev.clientX - rect.left;
            const newRatio = Math.max(0.2, Math.min(0.8, x / rect.width));
            onRatioChange(newRatio);
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, [onRatioChange]);

    return (
        <div className="split-view-container" ref={containerRef}>
            <div className="split-pane split-left" style={{ width: `${ratio * 100}%` }}>
                {children[0]}
            </div>
            <div
                className="split-divider"
                onMouseDown={handleMouseDown}
            >
                <GripVertical className="w-3 h-3" />
            </div>
            <div className="split-pane split-right" style={{ width: `${(1 - ratio) * 100}%` }}>
                {children[1]}
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════════════════════
// COMPONENT: Process List Panel — Running AgentComputer processes
// ═════════════════════════════════════════════════════════════

function ProcessListPanel() {
    const { state: computer, actions } = useComputer();

    if (computer.processes.length === 0) return null;

    return (
        <div className="process-list-inner">
            <div className="timeline-header">
                <Cpu className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                <span>Processes</span>
                <span className="timeline-count">{computer.runningProcesses.length} running</span>
            </div>
            <div className="timeline-entries">
                {computer.processes.slice(0, 10).map(proc => {
                    const isRunning = proc.status === 'running';
                    const color = isRunning ? '#22c55e' : proc.status === 'failed' ? '#ef4444' : '#64748b';
                    const elapsed = proc.endTime
                        ? `${((proc.endTime - proc.startTime) / 1000).toFixed(1)}s`
                        : `${((Date.now() - proc.startTime) / 1000).toFixed(0)}s`;
                    return (
                        <div key={proc.id} className={`timeline-entry ${proc.status}`} style={{ '--tl-color': color } as React.CSSProperties}>
                            <div className={`timeline-dot ${proc.status}`}>
                                {isRunning
                                    ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    : proc.status === 'completed' ? <Check className="w-2.5 h-2.5" />
                                        : <AlertCircle className="w-2.5 h-2.5" />}
                            </div>
                            <div className="timeline-content">
                                <span className="timeline-label">{proc.type}: {proc.command.slice(0, 40)}</span>
                            </div>
                            <span className="timeline-time">{elapsed}</span>
                            {isRunning && (
                                <button
                                    className="terminal-action-btn"
                                    title="Kill Process"
                                    onClick={() => actions.killProcess(proc.id)}
                                    style={{ marginLeft: 4, color: '#ef4444' }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
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
