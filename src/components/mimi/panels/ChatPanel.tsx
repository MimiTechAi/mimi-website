"use client";

/**
 * ChatPanel -- Center panel of the Manus 3-panel layout.
 *
 * Displays the chat interface with message history, input bar,
 * agent thinking bar, and tool action pills.
 * Consumes MimiAgentContext -- no props needed.
 *
 * Performance 2026:
 * - React.memo to prevent re-renders from unrelated context changes
 * - Local hoveredMsgIdx state (not in global context)
 * - Memoized message rows
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { AnimatePresence } from "framer-motion";
import AgentThinkingBar from "../components/AgentThinkingBar";
import { OnboardingTour } from "../components/OnboardingTour";
import { WelcomeScreen } from "../components/WelcomeScreen";
import ModelLoading from "../ModelLoading";
import { useOnboarding } from "@/hooks/mimi/useOnboarding";
import { useMimiAgentContext } from "../MimiAgentContext";
import { formatContent } from "../utils/formatContent";
import { ArtifactChip } from "./ArtifactPanel";
import { detectArtifacts } from "@/hooks/mimi/useArtifactDetection";
import { TypingCursor } from "../components/TypingCursor";
import { MemoryToast } from "../components/MemoryToast";
import {
    Paperclip, Copy, Pencil, RefreshCw, SendHorizontal, Square, User, Mic, MicOff
} from "lucide-react";

const TOOL_LABELS: Record<string, string> = {
    web_search: '🔍 Websuche',
    execute_python: '🐍 Python',
    execute_javascript: '⚡ JavaScript',
    calculate: '🧮 Berechnung',
    create_file: '📄 Datei erstellen',
    write_file: '📝 Datei schreiben',
    read_file: '📖 Datei lesen',
    search_documents: '📚 Dokumentsuche',
    analyze_image: '👁 Bildanalyse',
};

const RUNNING_LABELS: Record<string, string> = {
    web_search: '🔍 Suche läuft...',
    execute_python: '🐍 Python läuft...',
    execute_javascript: '⚡ JavaScript läuft...',
};

const WELCOME_PROMPTS = [
    "Analysiere meine Daten",
    "Schreibe Python-Code",
    "Erstelle einen Bericht",
    "Erkläre Machine Learning",
];

export const ChatPanel = memo(function ChatPanel() {
    const ctx = useMimiAgentContext();
    const { hasSeenTour, isLoading: onboardingLoading, markTourSeen } = useOnboarding();
    const [hoveredMsgIdx, setHoveredMsgIdx] = useState<number | null>(null);

    // H2 FIX: Typing indicator timeout — don't show dots forever
    // 30s threshold: first generation on Apple Silicon takes longer (WebGPU shader JIT)
    const [typingTimedOut, setTypingTimedOut] = useState(false);
    useEffect(() => {
        if (ctx.isGenerating && !ctx.currentResponse) {
            setTypingTimedOut(false);
            const timer = setTimeout(() => setTypingTimedOut(true), 30000); // 30s for shader JIT
            return () => clearTimeout(timer);
        }
        setTypingTimedOut(false);
    }, [ctx.isGenerating, ctx.currentResponse]);

    return (
        <div className="mimi-panel panel-center">
            {/* Onboarding Tour — first visit only */}
            <AnimatePresence>
                {!onboardingLoading && !hasSeenTour && ctx.isReady && (
                    <OnboardingTour onComplete={markTourSeen} />
                )}
            </AnimatePresence>

            {/* Aurora bar */}
            <div className="aurora-bar" />

            {/* Status Pill + Privacy Badge */}
            <div className="status-pill-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="status-pill">
                    <span className="pill-label">AGENT-STATUS:</span>
                    <span className="pill-value">
                        {ctx.statusText}
                        {!ctx.isIdle && ctx.agentElapsedTime > 0 && ` · ${ctx.agentElapsedTime.toFixed(1)}s`}
                    </span>
                    <div className={`pill-spinner ${ctx.isIdle && ctx.isReady ? "idle" : ""}`} />
                </div>
                {/* Privacy Badge — always visible, addresses user trust concern */}
                <div
                    title="Alle KI-Berechnungen laufen lokal auf deinem Gerät. Keine Daten werden an Server gesendet."
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 10px',
                        borderRadius: '999px',
                        background: 'rgba(34,197,94,0.08)',
                        border: '1px solid rgba(34,197,94,0.25)',
                        color: 'rgba(134,239,172,0.9)',
                        fontSize: '11px',
                        fontWeight: 500,
                        letterSpacing: '0.02em',
                        cursor: 'default',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                    }}
                    role="status"
                    aria-label="Datenschutz: Alle Daten bleiben lokal auf deinem Gerät"
                >
                    <span style={{ fontSize: '10px' }}>🔒</span>
                    <span>Lokal · Keine Cloud</span>
                </div>
            </div>

            {/* Sidebar collapse toggle */}
            <button
                className="sidebar-toggle-btn"
                onClick={() => ctx.setSidebarCollapsed((prev: boolean) => !prev)}
                title={ctx.sidebarCollapsed ? 'Seitenleiste einblenden' : 'Seitenleiste ausblenden'}
                aria-label={ctx.sidebarCollapsed ? 'Seitenleiste einblenden' : 'Seitenleiste ausblenden'}
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
                <ModelLoading
                    progress={ctx.engine.loadingProgress}
                    status={ctx.engine.loadingStatus || 'Initialisierung...'}
                    isFirstTime={ctx.engine.loadingProgress < 5}
                />
            ) : ctx.messages.length === 0 && !ctx.currentResponse ? (
                <WelcomeScreen onPromptSelect={ctx.handleSend} />
            ) : (
                <div className="chat-messages">
                    {ctx.messages.map((msg, idx) => (
                        <div
                            key={`msg-${msg.role}-${idx}`}
                            className="msg-wrap"
                            onMouseEnter={() => setHoveredMsgIdx(idx)}
                            onMouseLeave={() => setHoveredMsgIdx(null)}
                        >
                            {msg.role === "user" ? (
                                <div className="msg-user-wrap">
                                    <div className="msg-user">
                                        {msg.content}
                                        {hoveredMsgIdx === idx && (
                                            <div className="msg-actions">
                                                <button onClick={() => ctx.handleCopyMessage(msg.content)} title="Kopieren"><Copy className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => { ctx.setInput(msg.content); ctx.textareaRef.current?.focus(); }} title="Bearbeiten"><Pencil className="w-3.5 h-3.5" /></button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="user-msg-avatar"><User className="w-3.5 h-3.5" /></div>
                                </div>
                            ) : (
                                <div className="msg-agent">
                                    <div className="agent-dot">M</div>
                                    <div className="agent-body">
                                        {/* Action Pills */}
                                        {idx > 0 && ctx.completedToolPills.length > 0 && (() => {
                                            // M2 FIX: exact per-message pill matching
                                            const assistantIndex = ctx.messages
                                                .slice(0, idx + 1)
                                                .filter(m => m.role === 'assistant').length - 1;
                                            const myPills = ctx.completedToolPills
                                                .filter(pill => pill.messageIndex === assistantIndex);
                                            if (myPills.length === 0) return null;
                                            return (
                                                <div className="action-pills-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                                    {myPills.map(pill => (
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
                                            );
                                        })()}
                                        <div className="agent-bubble">
                                            <div className="agent-text" role="region" aria-live="polite" dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                                        </div>
                                        {/* Artifact Chips */}
                                        {(() => {
                                            const msgArtifacts = detectArtifacts(msg.content);
                                            if (msgArtifacts.length === 0) return null;
                                            return (
                                                <div className="artifact-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                                    {msgArtifacts.map(art => (
                                                        <ArtifactChip
                                                            key={art.id}
                                                            artifact={art}
                                                            onClick={ctx.openArtifact}
                                                        />
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                        {hoveredMsgIdx === idx && (
                                            <div className="msg-actions">
                                                <button onClick={() => ctx.handleCopyMessage(msg.content)} title="Kopieren"><Copy className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => ctx.handleRetryMessage(idx)} title="Nochmal generieren"><RefreshCw className="w-3.5 h-3.5" /></button>
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

                    {/* Typing indicator — agent is thinking but no visible text yet */}
                    {ctx.isGenerating && !ctx.currentResponse && !typingTimedOut && (
                        <div className="msg-agent">
                            <div className="agent-dot">M</div>
                            <div className="agent-body">
                                <div className="agent-bubble">
                                    <div className="typing-indicator">
                                        <span /><span /><span />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* H2 FIX: Timeout message when typing indicator runs too long */}
                    {ctx.isGenerating && !ctx.currentResponse && typingTimedOut && (
                        <div className="msg-agent">
                            <div className="agent-dot">M</div>
                            <div className="agent-body">
                                <div className="agent-bubble">
                                    <div className="agent-text" style={{ opacity: 0.8, fontSize: '0.85rem', lineHeight: 1.5 }}>
                                        <span style={{ display: 'block', marginBottom: '4px' }}>⚡ WebGPU kompiliert Shader für deine GPU — das passiert nur beim ersten Start.</span>
                                        <span style={{ display: 'block', opacity: 0.65, fontSize: '0.78rem' }}>Danach antwortet MIMI sofort. Bitte kurz warten...</span>
                                        <button
                                            className="timeout-abort-btn"
                                            onClick={() => ctx.engine.handleStopGeneration()}
                                            style={{ marginTop: '8px', padding: '2px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.75rem' }}
                                        >
                                            Abbrechen
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Streaming response — visible text from the model */}
                    {ctx.currentResponse && (
                        <div className="msg-agent">
                            <div className="agent-dot">M</div>
                            <div className="agent-body">
                                <div className="agent-bubble">
                                    <div className="agent-text" dangerouslySetInnerHTML={{ __html: formatContent(ctx.currentResponse) }} />
                                    <TypingCursor />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Task Completed Banner */}
                    {ctx.taskCompleted && (
                        <div className="task-completed-banner">
                            <span className="task-completed-icon">✓</span>
                            <span>Aufgabe erfolgreich abgeschlossen</span>
                            {ctx.agentEvents.elapsedTime > 0 && (
                                <span className="task-completed-time">
                                    {(ctx.agentEvents.elapsedTime / 1000).toFixed(1)}s
                                </span>
                            )}
                        </div>
                    )}

                    <div ref={ctx.messagesEndRef} />
                </div>
            )
            }

            {/* Memory Toasts */}
            < MemoryToast toasts={ctx.memoryToasts} onDismiss={ctx.dismissMemoryToast} />

            {/* Input Bar */}
            <div className="chat-input-bar">
                <div className="input-row">
                    <textarea
                        ref={ctx.textareaRef}
                        placeholder={ctx.isReady ? "Nachricht eingeben..." : "Initialisierung..."}
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
                            fileInput.accept = ".pdf,.txt,.csv,.json,.md,.jpg,.jpeg,.png,.gif,.webp";
                            fileInput.onchange = (e) => ctx.engine.handlePDFUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
                            fileInput.click();
                        }}
                        title="Datei anhängen"
                    >
                        <Paperclip className="w-4 h-4" />
                    </button>
                    <button
                        className={`input-icon${ctx.engine.isRecording ? ' recording' : ''}`}
                        onClick={() => ctx.engine.handleVoiceInput()}
                        title={ctx.engine.isRecording ? 'Aufnahme stoppen' : 'Spracheingabe'}
                        aria-label={ctx.engine.isRecording ? 'Aufnahme stoppen' : 'Spracheingabe'}
                    >
                        {ctx.engine.isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button
                        className="send-btn"
                        onClick={ctx.isGenerating ? () => ctx.engine.handleStopGeneration() : () => ctx.handleSend()}
                        disabled={!ctx.isReady || (!ctx.input.trim() && !ctx.isGenerating)}
                        title={ctx.isGenerating ? "Stoppen" : "Senden"}
                    >
                        {ctx.isGenerating ? <Square className="w-4 h-4" /> : <SendHorizontal className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div >
    );
});
