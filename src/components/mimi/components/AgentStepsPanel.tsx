"use client";

/**
 * AgentStepsPanel — Premium real-time task visualization
 * 
 * The crown jewel of MIMI Agent UX. Shows the agent's plan
 * and step-by-step execution in real-time with premium animations.
 * 
 * Design: Glassmorphism dark theme, smooth animations,
 * accessibility with ARIA live regions.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, Loader2, XCircle, Circle,
    Clock, Zap, SkipForward, ChevronDown,
    Sparkles, Brain
} from 'lucide-react';
import type { UITaskPlan, UITaskStep } from '@/hooks/mimi/useAgentEvents';

// ═══════════════════════════════════════════════════════════
// STEP ICON COMPONENT
// ═══════════════════════════════════════════════════════════

const StepStatusIcon = memo(({ status }: { status: UITaskStep['status'] }) => {
    switch (status) {
        case 'done':
            return (
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                    <CheckCircle2 className="step-icon-done" size={20} />
                </motion.div>
            );
        case 'running':
            return (
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                >
                    <Loader2 className="step-icon-running" size={20} />
                </motion.div>
            );
        case 'failed':
            return (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.4 }}
                >
                    <XCircle className="step-icon-failed" size={20} />
                </motion.div>
            );
        case 'skipped':
            return <SkipForward className="step-icon-skipped" size={18} />;
        default:
            return <Circle className="step-icon-pending" size={18} />;
    }
});
StepStatusIcon.displayName = 'StepStatusIcon';

// ═══════════════════════════════════════════════════════════
// INDIVIDUAL STEP COMPONENT
// ═══════════════════════════════════════════════════════════

interface StepRowProps {
    step: UITaskStep;
    index: number;
    isLast: boolean;
}

const StepRow = memo(({ step, index, isLast }: StepRowProps) => {
    const statusClass = `step-row step-${step.status}`;

    return (
        <motion.div
            className={statusClass}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08, duration: 0.3 }}
            layout
        >
            {/* Timeline connector */}
            <div className="step-timeline">
                <StepStatusIcon status={step.status} />
                {!isLast && (
                    <div className={`step-connector ${step.status === 'done' ? 'connector-done' : ''}`} />
                )}
            </div>

            {/* Step content */}
            <div className="step-content">
                <div className="step-header">
                    <span className="step-title">{step.title}</span>
                    {step.duration !== undefined && step.duration > 0 && (
                        <span className="step-duration">
                            <Clock size={12} />
                            {(step.duration / 1000).toFixed(1)}s
                        </span>
                    )}
                    {step.tool && step.status === 'running' && (
                        <span className="step-tool-badge">
                            <Zap size={11} />
                            {step.tool}
                        </span>
                    )}
                </div>
                <p className="step-description">{step.description}</p>

                {/* Progress bar for running steps */}
                {step.status === 'running' && (
                    <div className="step-progress-track">
                        <motion.div
                            className="step-progress-fill"
                            initial={{ width: '0%' }}
                            animate={{ width: step.progress ? `${step.progress * 100}%` : '60%' }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                )}

                {/* Error message */}
                {step.error && (
                    <motion.p
                        className="step-error"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                    >
                        {step.error}
                    </motion.p>
                )}
            </div>
        </motion.div>
    );
});
StepRow.displayName = 'StepRow';

// ═══════════════════════════════════════════════════════════
// MAIN PANEL
// ═══════════════════════════════════════════════════════════

interface AgentStepsPanelProps {
    plan: UITaskPlan | null;
    elapsedTime: number;
    agentStatus: string;
    activeAgent?: string | null;
}

const AgentStepsPanel = memo(({ plan, elapsedTime, agentStatus, activeAgent }: AgentStepsPanelProps) => {
    // Progress stats
    const stats = useMemo(() => {
        if (!plan) return { completed: 0, total: 0, failed: 0, percent: 0 };
        const completed = plan.steps.filter(s => s.status === 'done').length;
        const failed = plan.steps.filter(s => s.status === 'failed').length;
        return {
            completed,
            total: plan.steps.length,
            failed,
            percent: plan.steps.length > 0 ? Math.round((completed / plan.steps.length) * 100) : 0
        };
    }, [plan]);

    const formatTime = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}.${Math.floor((ms % 1000) / 100)}s`;
    };

    // No plan — show idle state
    if (!plan) {
        return (
            <div className="steps-panel steps-idle">
                <div className="steps-idle-content">
                    <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Brain size={40} className="steps-idle-icon" />
                    </motion.div>
                    <h3 className="steps-idle-title">Bereit für Aufgaben</h3>
                    <p className="steps-idle-text">
                        Stelle mir eine komplexe Aufgabe — ich zerlege sie in Schritte und führe sie autonom aus.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="steps-panel" role="region" aria-label="Agent Task Progress" aria-live="polite">
            {/* Header with progress */}
            <div className="steps-header">
                <div className="steps-header-top">
                    <div className="steps-header-left">
                        {plan.status === 'complete' ? (
                            <Sparkles size={18} className="text-emerald-400" />
                        ) : (
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            >
                                <Loader2 size={18} className="text-cyan-400" />
                            </motion.div>
                        )}
                        <span className="steps-count">
                            {stats.completed}/{stats.total}
                        </span>
                    </div>
                    <div className="steps-header-right">
                        <Clock size={14} />
                        <span className="steps-timer">{formatTime(plan.totalDuration || elapsedTime)}</span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="steps-progress-track">
                    <motion.div
                        className={`steps-progress-fill ${plan.status === 'complete' ? 'progress-complete' : ''}`}
                        initial={{ width: '0%' }}
                        animate={{ width: `${stats.percent}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                </div>

                {/* Plan title */}
                <h3 className="steps-plan-title">{plan.title}</h3>
            </div>

            {/* Steps list */}
            <div className="steps-list" role="list">
                <AnimatePresence mode="popLayout">
                    {plan.steps.map((step, idx) => (
                        <StepRow
                            key={step.id}
                            step={step}
                            index={idx}
                            isLast={idx === plan.steps.length - 1}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Completion celebration */}
            <AnimatePresence>
                {plan.status === 'complete' && (
                    <motion.div
                        className="steps-complete-banner"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Sparkles size={16} />
                        <span>
                            Aufgabe abgeschlossen in {formatTime(plan.totalDuration || elapsedTime)}
                            {stats.failed > 0 && ` · ${stats.failed} Fehler`}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
AgentStepsPanel.displayName = 'AgentStepsPanel';

export default AgentStepsPanel;
