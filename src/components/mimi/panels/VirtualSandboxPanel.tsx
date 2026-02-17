"use client";

/**
 * VirtualSandboxPanel -- Right panel of the Manus 3-panel layout.
 *
 * Displays the agent's virtual sandbox with tabs for browser, terminal,
 * editor, and files. Also shows progress steps and Claude-style artifact
 * previews.
 * Consumes MimiAgentContext -- no props needed.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { memo } from "react";
import dynamic from "next/dynamic";
import { useMimiAgentContext } from "../MimiAgentContext";
import { ArtifactPanel } from "./ArtifactPanel";
import { sanitizeHtml } from "../utils/sanitize";
import {
    Globe, Terminal, FileCode2, FolderOpen, Copy, Download
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

const TABS = [
    { id: "browser" as const, Icon: Globe, label: "Browser" },
    { id: "terminal" as const, Icon: Terminal, label: "Terminal" },
    { id: "editor" as const, Icon: FileCode2, label: "Editor" },
    { id: "files" as const, Icon: FolderOpen, label: "Dateien" },
];

export const VirtualSandboxPanel = memo(function VirtualSandboxPanel() {
    const ctx = useMimiAgentContext();

    return (
        <div className={`mimi-panel panel-right${ctx.isGenerating ? ' agent-active' : ''}`}>
            <div className="sandbox-head">
                <div className="sandbox-head-left">
                    <span className="sandbox-head-title">Virtual Sandbox</span>
                    {ctx.isGenerating && (
                        <span className="live-badge">
                            <span className="live-dot" />
                            Live
                        </span>
                    )}
                    {ctx.detectedArtifacts.length > 0 && !ctx.activeDetectedArtifact && (
                        <button
                            className="artifact-badge"
                            onClick={() => ctx.openArtifact(ctx.detectedArtifacts[ctx.detectedArtifacts.length - 1])}
                            title="Letztes Artifact anzeigen"
                        >
                            ✨ {ctx.detectedArtifacts.length} Artifact{ctx.detectedArtifacts.length > 1 ? 's' : ''}
                        </button>
                    )}
                </div>
            </div>
            <div className="sandbox-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        data-tab={tab.id}
                        className={ctx.activeTab === tab.id ? "active" : ""}
                        onClick={() => { ctx.setActiveTab(tab.id); ctx.closeArtifact(); }}
                    >
                        <span className="tab-icon"><tab.Icon className="w-3.5 h-3.5" /></span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="sandbox-scroll" style={{ position: 'relative' }}>
                {/* Claude-style Artifact Panel overlay */}
                {ctx.activeDetectedArtifact && (
                    <ArtifactPanel
                        artifact={ctx.activeDetectedArtifact}
                        onClose={ctx.closeArtifact}
                    />
                )}

                {/* Browser Tab */}
                {ctx.activeTab === "browser" && (
                    <BrowserTab />
                )}

                {/* Terminal Tab */}
                {ctx.activeTab === "terminal" && (
                    <TerminalTab />
                )}

                {/* Editor Tab */}
                {ctx.activeTab === "editor" && (
                    <EditorTab />
                )}

                {/* Files Tab */}
                {ctx.activeTab === "files" && (
                    <FilesTab />
                )}

                {/* Progress Steps */}
                <ProgressSteps />
            </div>
        </div>
    );
});

// ── Sub-components ──────────────────────────────────────────

function BrowserTab() {
    const ctx = useMimiAgentContext();

    const browserUrl = (() => {
        if (ctx.agentEvents.activeTool && typeof ctx.agentEvents.activeTool === 'object' && ctx.agentEvents.activeTool.toolName === 'web_search') {
            return `duckduckgo.com/?q=${encodeURIComponent(String(ctx.agentEvents.activeTool.parameters?.query || ''))}`;
        }
        if (ctx.agentEvents.activeTool) {
            const toolName = typeof ctx.agentEvents.activeTool === 'object' ? ctx.agentEvents.activeTool.toolName : ctx.agentEvents.activeTool;
            return `mimi-agent.local/${toolName}`;
        }
        if (ctx.browserContent) return "duckduckgo.com/results";
        return "mimi-agent.local";
    })();

    return (
        <div className="sec-browser" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="browser-frame" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div className="browser-chrome">
                    <div className="browser-nav-dots">
                        <div className="browser-nav-dot" />
                        <div className="browser-nav-dot" />
                        <div className="browser-nav-dot" />
                    </div>
                    <div className="browser-url">
                        <span className="lock">🔒</span>
                        {browserUrl}
                    </div>
                </div>
                {ctx.agentEvents.isThinking && (
                    <div className="agent-browsing-overlay">
                        <div className="browsing-spinner" />
                        <span className="browsing-text">Agent durchsucht...</span>
                    </div>
                )}
                <div className="browser-page" style={{ flex: 1 }}>
                    {ctx.browserContent ? (
                        <div
                            className="browser-preview"
                            style={{ padding: '12px', fontSize: '0.75rem', lineHeight: 1.5, overflow: 'auto', maxHeight: '100%' }}
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(ctx.browserContent) }}
                        />
                    ) : (
                        <div className="sandbox-empty" style={{ padding: '24px 16px' }}>
                            <div className="sandbox-empty-icon"><Globe className="w-6 h-6" style={{ opacity: 0.4 }} /></div>
                            <h4>Browser bereit</h4>
                            <p>Web-Ergebnisse und Vorschauen erscheinen hier, wenn MIMI eine Aufgabe ausführt.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TerminalTab() {
    const ctx = useMimiAgentContext();

    return (
        <div className="sec-terminal">
            <div className="sec-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Terminal
                <button
                    onClick={() => {
                        // Terminal clear is handled via context -- this is a UI-only action
                        // We just show a cleared state visually
                    }}
                    style={{ fontSize: '0.625rem', opacity: 0.5, cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }}
                >
                    Leeren
                </button>
            </div>
            <div className="terminal-box">
                {ctx.terminalLines.map((line, i) => (
                    <div className="tline" key={i} style={{ opacity: line.type === 'error' ? 1 : 0.9 }}>
                        <span className="prefix" style={{
                            color: line.type === 'error' ? '#ef4444'
                                : line.type === 'success' ? '#22c55e'
                                    : line.type === 'tool' ? '#a855f7'
                                        : '#00d4ff'
                        }}>{line.prefix}</span>{" "}
                        <span className="msg">{line.msg}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EditorTab() {
    const ctx = useMimiAgentContext();
    const activeArtifact = ctx.codeArtifacts[ctx.activeArtifactIdx];

    return (
        <div className="sec-editor">
            <div className="editor-tabs" style={{ display: 'flex', gap: '2px', overflowX: 'auto' }}>
                {ctx.codeArtifacts.length > 0 ? (
                    ctx.codeArtifacts.map((art, i) => (
                        <span
                            key={i}
                            className={`etab ${i === ctx.activeArtifactIdx ? 'active' : ''}`}
                            onClick={() => ctx.setActiveArtifactIdx(i)}
                            style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                            {art.filename}
                        </span>
                    ))
                ) : (
                    <span className="etab active">untitled</span>
                )}
                {activeArtifact && (
                    <button
                        className="editor-copy-btn"
                        title="Code kopieren"
                        onClick={() => ctx.handleCopyMessage(activeArtifact.content)}
                    >
                        <Copy className="w-3 h-3" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />Kopieren
                    </button>
                )}
            </div>
            <div className="editor-code" style={{ flex: 1, minHeight: '200px' }}>
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
                            scrollbar: {
                                verticalScrollbarSize: 6,
                                horizontalScrollbarSize: 6,
                            },
                        }}
                    />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px' }}>
                        <div className="editor-empty" style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem' }}>
                            Dateien werden hier angezeigt, wenn MIMI Code generiert.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function FilesTab() {
    const ctx = useMimiAgentContext();

    return (
        <div className="sec-files">
            <div className="sec-label">Dateien ({ctx.generatedFiles.length + ctx.codeArtifacts.length})</div>
            {(ctx.generatedFiles.length + ctx.codeArtifacts.length) > 0 ? (
                <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {ctx.codeArtifacts.map((art, i) => (
                        <div
                            key={`code-${i}`}
                            onClick={() => { ctx.setActiveArtifactIdx(i); ctx.setActiveTab("editor"); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '6px 8px', borderRadius: '6px', cursor: 'pointer',
                                background: 'rgba(255,255,255,0.03)',
                                fontSize: '0.6875rem', color: '#94a3b8',
                                transition: 'background 0.2s',
                            }}
                        >
                            <span><FileCode2 className="w-3 h-3" /></span>
                            <span style={{ flex: 1, color: '#e2e8f0' }}>{art.filename}</span>
                            <span style={{ fontSize: '0.625rem' }}>{art.language}</span>
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
                        <div
                            key={`file-${i}`}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '6px 8px', borderRadius: '6px',
                                background: 'rgba(255,255,255,0.03)',
                                fontSize: '0.6875rem', color: '#94a3b8',
                            }}
                        >
                            <span><FileCode2 className="w-3 h-3" /></span>
                            <span style={{ flex: 1, color: '#e2e8f0' }}>{file.name}</span>
                            <span style={{ fontSize: '0.625rem' }}>{file.type}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="files-empty">
                    <div className="files-empty-icon"><FolderOpen className="w-6 h-6" style={{ opacity: 0.4 }} /></div>
                    <p>Noch keine Dateien erstellt.<br />MIMI erstellt Dateien automatisch während der Arbeit.</p>
                </div>
            )}
        </div>
    );
}

function ProgressSteps() {
    const ctx = useMimiAgentContext();

    if (ctx.progressSteps && ctx.progressSteps.length > 0) {
        return (
            <div className="progress-card">
                <h5>Fortschritt</h5>
                {ctx.progressSteps.map((step, i) => (
                    <div key={i} className={`step step-${step.status}`}>
                        {step.status === "done" && <span className="ico">✓</span>}
                        {step.status === "running" && <div className="spinner" />}
                        {step.status === "pending" && <div className="circle" />}
                        {i + 1}. {step.label}
                        <span className="step-right">
                            ({step.status === "done" ? "Erledigt" : step.status === "running" ? "Aktiv" : "Ausstehend"})
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    if (!ctx.agentEvents.isThinking) {
        return (
            <div className="progress-card">
                <h5>Fortschritt</h5>
                <div className={`step ${ctx.isReady ? 'step-done' : 'step-running'}`}>
                    {ctx.isReady ? <span className="ico">✓</span> : <div className="spinner" />}
                    1. Systeminitialisierung
                    <span className="step-right">
                        ({ctx.isReady ? "Erledigt" : "Lädt..."})
                    </span>
                </div>
                <div className={`step step-${ctx.isReady ? "done" : "pending"}`}>
                    {ctx.isReady ? <span className="ico">✓</span> : <div className="circle" />}
                    2. Bereit für Aufgaben
                    <span className="step-right">
                        ({ctx.isReady ? "Erledigt" : "Ausstehend"})
                    </span>
                </div>
                <div className={`step ${ctx.isReady ? 'step-awaiting' : 'step-pending'}`}>
                    {ctx.isReady ? <div className="await-ring" /> : <div className="circle" />}
                    3. Warte auf Eingabe
                    <span className="step-right">
                        ({ctx.isReady ? "Wartend" : "Ausstehend"})
                    </span>
                </div>
            </div>
        );
    }

    return null;
}
