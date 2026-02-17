"use client";

/**
 * AgentThinkingBar — Premium animated status bar
 * 
 * A slim, elegant bar showing the active agent, current action,
 * and elapsed time. Replaces boring status text with a living,
 * breathing indicator that makes the agent feel alive.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import React, { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Code2, Globe, Database, FileText,
    Search, Sparkles, Loader2, CheckCircle2,
    ChevronDown, ChevronUp, Zap
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// AGENT ICONS
// ═══════════════════════════════════════════════════════════

const AGENT_ICONS: Record<string, React.ReactNode> = {
    'code': <Code2 size={14} />,
    'code_specialist': <Code2 size={14} />,
    'research': <Globe size={14} />,
    'research_specialist': <Globe size={14} />,
    'data': <Database size={14} />,
    'data_specialist': <Database size={14} />,
    'writing': <FileText size={14} />,
    'writing_specialist': <FileText size={14} />,
    'general': <Brain size={14} />,
    'default': <Sparkles size={14} />
};

const STATUS_LABELS: Record<string, string> = {
    'idle': 'Bereit',
    'thinking': 'Denkt nach...',
    'planning': 'Erstellt Plan...',
    'executing': 'Führt aus...',
    'calculating': 'Berechnet...',
    'searching': 'Recherchiert...',
    'complete': 'Fertig!',
    'error': 'Fehler'
};

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

interface AgentThinkingBarProps {
    status: string;
    agent?: string | null;
    activeTool?: { toolName: string } | null;
    elapsedTime: number;
    thinkingContent?: string;
    isThinking?: boolean;
}

const AgentThinkingBar = memo(({
    status,
    agent,
    activeTool,
    elapsedTime,
    thinkingContent,
    isThinking
}: AgentThinkingBarProps) => {
    const [expanded, setExpanded] = useState(false);

    // Don't show when idle and no recent activity
    if (status === 'idle' && elapsedTime === 0 && !isThinking && !thinkingContent) return null;

    const agentIcon = AGENT_ICONS[agent || 'default'] || AGENT_ICONS['default'];
    const agentName = agent ? agent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'MIMI';
    const statusLabel = activeTool ? activeTool.toolName.replace(/_/g, ' ') : (STATUS_LABELS[status] || status);
    const isActive = status !== 'idle' && status !== 'complete';

    const formatTime = (ms: number): string => {
        const s = Math.floor(ms / 1000);
        const m = Math.floor(s / 60);
        if (m > 0) return `${m}m ${s % 60}s`;
        return `${s}.${Math.floor((ms % 1000) / 100)}s`;
    };

    return (
        <motion.div
            className={`thinking-bar ${isActive ? 'thinking-bar-active' : ''} ${status === 'complete' ? 'thinking-bar-complete' : ''}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            layout
        >
            <div className="thinking-bar-main" onClick={() => thinkingContent && setExpanded(!expanded)}>
                {/* Left: Agent + Status */}
                <div className="thinking-bar-left">
                    {isActive ? (
                        <motion.div
                            className="thinking-bar-pulse"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            {agentIcon}
                        </motion.div>
                    ) : (
                        <div className="thinking-bar-icon-static">
                            {status === 'complete' ? <CheckCircle2 size={14} /> : agentIcon}
                        </div>
                    )}
                    <span className="thinking-bar-agent">{agentName}</span>
                    <span className="thinking-bar-separator">·</span>
                    <span className="thinking-bar-status">{statusLabel}</span>
                    {activeTool && (
                        <motion.span
                            className="thinking-bar-tool"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <Zap size={11} />
                        </motion.span>
                    )}
                </div>

                {/* Right: Timer + Expand */}
                <div className="thinking-bar-right">
                    <span className="thinking-bar-timer">
                        {formatTime(elapsedTime)}
                    </span>
                    {thinkingContent && (
                        <button
                            className="thinking-bar-expand"
                            aria-label={expanded ? "Gedanken minimieren" : "Gedanken anzeigen"}
                        >
                            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Animated gradient border */}
            {isActive && <div className="thinking-bar-glow" />}

            {/* Expandable thinking content */}
            <AnimatePresence>
                {expanded && thinkingContent && (
                    <motion.div
                        className="thinking-bar-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <pre>{thinkingContent}</pre>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});
AgentThinkingBar.displayName = 'AgentThinkingBar';

export default AgentThinkingBar;
