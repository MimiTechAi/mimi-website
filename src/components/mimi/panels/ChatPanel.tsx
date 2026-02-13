"use client";

/**
 * ChatPanel -- Center panel of the Manus 3-panel layout.
 *
 * Displays the chat interface with message history, input bar,
 * agent thinking bar, and tool action pills.
 * Consumes MimiAgentContext -- no props needed.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import AgentThinkingBar from "../components/AgentThinkingBar";
import { useMimiAgentContext } from "../MimiAgentContext";
import { formatContent } from "../utils/formatContent";

const TOOL_LABELS: Record<string, string> = {
    web_search: '🔍 Web Search',
    execute_python: '🐍 Python',
    execute_javascript: '⚡ JavaScript',
    calculate: '🧮 Calculate',
    create_file: '📄 Create File',
    write_file: '📝 Write File',
    read_file: '📖 Read File',
    search_documents: '📚 Doc Search',
    analyze_image: '👁 Vision',
};

const RUNNING_LABELS: Record<string, string> = {
    web_search: '🔍 Searching...',
    execute_python: '🐍 Running Python...',
    execute_javascript: '⚡ Running JS...',
};

const WELCOME_PROMPTS = [
    "Analysiere meine Daten",
    "Schreibe Python-Code",
    "Erstelle einen Bericht",
    "Erklaere Machine Learning",
];

export function ChatPanel() {
    const ctx = useMimiAgentContext();

    return (
        <div className="mimi-panel panel-center">
            {/* Aurora bar */}
            <div className="aurora-bar" />

            {/* Status Pill */}
            <div className="status-pill-wrap">
                <div className="status-pill">
                    <span className="pill-label">AGENT STATUS:</span>
                    <span className="pill-value">
                        {ctx.statusText}
                        {!ctx.isIdle && ctx.agentElapsedTime > 0 && ` · ${ctx.agentElapsedTime.toFixed(1)}s`}
                    </span>
                    <div className={`pill-spinner ${ctx.isIdle && ctx.isReady ? "idle" : ""}`} />
                </div>
            </div>

            {/* Sidebar collapse toggle */}
            <button
                className="sidebar-toggle-btn"
                onClick={() => ctx.setSidebarCollapsed((prev: boolean) => !prev)}
                title={ctx.sidebarCollapsed ? 'Sidebar einblenden' : 'Sidebar ausblenden'}
            >
                {ctx.sidebarCollapsed ? '☰' : '◁'}
            </button>

            {/* Agent Thinking Bar */}
            {ctx.agentEvents.isThinking && (
                <AgentThinkingBar
                    status={ctx.agentEvents.agentStatus}
                    agent={ctx.agentEvents.activeAgent}
                    activeTool={ctx.agentEvents.activeTool}
                    elapsedTime={ctx.agentEvents.elapsedTime}
                    thinkingContent={ctx.agentEvents.thinkingContent}
                    isThinking={ctx.agentEvents.isThinking}
                />
            )}

            {/* Chat Content */}
            {!ctx.isReady ? (
                <div className="center-loading">
                    <div className="loading-spinner" />
                    <p>{ctx.engine.state === "loading" ? `Loading model... ${Math.round(ctx.engine.loadingProgress)}%` : "Initializing..."}</p>
                    {ctx.engine.loadingStatus && <p>{ctx.engine.loadingStatus}</p>}
                </div>
            ) : ctx.messages.length === 0 && !ctx.currentResponse ? (
                <div className="chat-welcome">
                    <div className="welcome-orb">✦</div>
                    <h2>MIMI -- Ihre Souveraene Intelligenz</h2>
                    <p>Keine Cloud. Keine API-Calls. MIMI denkt, plant und handelt -- komplett lokal auf Ihrem Geraet.</p>
                    <div className="welcome-prompts">
                        {WELCOME_PROMPTS.map((prompt, i) => (
                            <button
                                key={i}
                                className="welcome-prompt-btn"
                                onClick={() => ctx.handleSend(prompt)}
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="chat-messages">
                    {ctx.messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className="msg-wrap"
                            onMouseEnter={() => ctx.setHoveredMsgIdx(idx)}
                            onMouseLeave={() => ctx.setHoveredMsgIdx(null)}
                        >
                            {msg.role === "user" ? (
                                <div className="msg-user-wrap">
                                    <div className="msg-user">
                                        {msg.content}
                                        {ctx.hoveredMsgIdx === idx && (
                                            <div className="msg-actions">
                                                <button onClick={() => ctx.handleCopyMessage(msg.content)} title="Kopieren">📋</button>
                                                <button onClick={() => { ctx.setInput(msg.content); ctx.textareaRef.current?.focus(); }} title="Bearbeiten">✏️</button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="user-msg-avatar">U</div>
                                </div>
                            ) : (
                                <div className="msg-agent">
                                    <div className="agent-dot">M</div>
                                    <div className="agent-body">
                                        {/* Action Pills */}
                                        {idx > 0 && ctx.completedToolPills.length > 0 && (
                                            <div className="action-pills-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                                {ctx.completedToolPills
                                                    .filter(pill => {
                                                        const msgIndex = ctx.messages.filter(m => m.role === 'assistant').indexOf(msg);
                                                        const pillIndex = ctx.completedToolPills.indexOf(pill);
                                                        const pillsPerMsg = Math.ceil(ctx.completedToolPills.length / Math.max(1, ctx.messages.filter(m => m.role === 'assistant').length));
                                                        return pillIndex >= msgIndex * pillsPerMsg && pillIndex < (msgIndex + 1) * pillsPerMsg;
                                                    })
                                                    .map(pill => (
                                                        <div
                                                            key={pill.id}
                                                            className={`action-pill action-pill--${pill.status}`}
                                                            title={pill.output?.slice(0, 200) || pill.toolName}
                                                        >
                                                            <span className="action-pill-icon">
                                                                {pill.status === 'running' ? '⟳' :
                                                                    pill.status === 'done' ? '✓' : '✗'}
                                                            </span>
                                                            <span className="action-pill-label">
                                                                {TOOL_LABELS[pill.toolName] || pill.toolName}
                                                            </span>
                                                            {pill.duration && (
                                                                <span className="action-pill-duration">
                                                                    {(pill.duration / 1000).toFixed(1)}s
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                        <div className="agent-bubble">
                                            <div className="agent-text" dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                                        </div>
                                        {ctx.hoveredMsgIdx === idx && (
                                            <div className="msg-actions">
                                                <button onClick={() => ctx.handleCopyMessage(msg.content)} title="Kopieren">📋</button>
                                                <button onClick={() => ctx.handleRetryMessage(idx)} title="Nochmal generieren">🔄</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Active Action Pills -- currently running tools */}
                    {ctx.completedToolPills.some(p => p.status === 'running') && (
                        <div className="msg-agent" style={{ marginBottom: '4px' }}>
                            <div className="agent-dot" />
                            <div className="agent-body">
                                <div className="action-pills-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {ctx.completedToolPills.filter(p => p.status === 'running').map(pill => (
                                        <div key={pill.id} className="action-pill action-pill--active">
                                            <span className="action-pill-icon">⟳</span>
                                            <span className="action-pill-label">
                                                {RUNNING_LABELS[pill.toolName] || `Running ${pill.toolName}...`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Streaming response */}
                    {ctx.currentResponse && (
                        <div className="msg-agent">
                            <div className="agent-dot">M</div>
                            <div className="agent-body">
                                <div className="agent-bubble">
                                    <div className="agent-text" dangerouslySetInnerHTML={{ __html: formatContent(ctx.currentResponse) }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Task Completed Banner */}
                    {ctx.taskCompleted && (
                        <div className="task-completed-banner">
                            <span className="task-completed-icon">✓</span>
                            <span>Task completed successfully</span>
                            {ctx.agentEvents.elapsedTime > 0 && (
                                <span className="task-completed-time">
                                    {(ctx.agentEvents.elapsedTime / 1000).toFixed(1)}s
                                </span>
                            )}
                        </div>
                    )}

                    <div ref={ctx.messagesEndRef} />
                </div>
            )}

            {/* Input Bar */}
            <div className="chat-input-bar">
                <div className="input-row">
                    <textarea
                        ref={ctx.textareaRef}
                        placeholder={ctx.isReady ? "Type a message..." : "Initializing..."}
                        value={ctx.input}
                        onChange={e => {
                            ctx.setInput(e.target.value);
                            const ta = e.target;
                            ta.style.height = 'auto';
                            ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                ctx.handleSend();
                                if (ctx.textareaRef.current) ctx.textareaRef.current.style.height = 'auto';
                            }
                        }}
                        disabled={!ctx.isReady}
                        rows={1}
                        style={{ resize: 'none', overflow: 'hidden' }}
                    />
                    <button
                        className="input-icon"
                        onClick={() => {
                            const fileInput = document.createElement("input");
                            fileInput.type = "file";
                            fileInput.accept = ".pdf,.txt,.csv,.json,.md";
                            fileInput.onchange = (e) => ctx.engine.handlePDFUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
                            fileInput.click();
                        }}
                        title="Datei anhaengen"
                    >
                        📎
                    </button>
                    <button
                        className="send-btn"
                        onClick={ctx.isGenerating ? () => ctx.engine.handleStopGeneration() : () => ctx.handleSend()}
                        disabled={!ctx.isReady || (!ctx.input.trim() && !ctx.isGenerating)}
                        title={ctx.isGenerating ? "Stop" : "Send"}
                    >
                        {ctx.isGenerating ? "■" : "➤"}
                    </button>
                </div>
            </div>
        </div>
    );
}
