"use client";

/**
 * useAgentEvents — React hook bridging AgentEventBus to UI state
 * 
 * Provides reactive state for:
 * - Task plans and step progress
 * - Thinking/CoT content
 * - Tool execution status
 * - Agent status changes
 * 
 * Uses cleanup on unmount and batched updates via the event bus.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { getAgentEventBus, type AgentEvent, type AgentEventType } from '@/lib/mimi/agent-events';
import type {
    PlanStartPayload,
    PlanStepAddPayload,
    StepStartPayload,
    StepCompletePayload,
    StepFailPayload,
    StepProgressPayload,
    ToolCallStartPayload,
    ToolCallEndPayload,
    ThinkingContentPayload,
    TextDeltaPayload,
    StatusChangePayload,
    PlanCompletePayload,
    FileWritePayload,
    ArtifactCreatePayload
} from '@/lib/mimi/agent-events';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface UITaskStep {
    id: string;
    title: string;
    description: string;
    tool?: string;
    status: 'pending' | 'running' | 'done' | 'failed' | 'skipped';
    result?: string;
    error?: string;
    duration?: number;
    progress?: number;
    confidence?: number;
}

export interface UITaskPlan {
    id: string;
    title: string;
    goal: string;
    steps: UITaskStep[];
    status: 'planning' | 'executing' | 'complete' | 'failed';
    progress: number; // 0-1
    totalDuration?: number;
}

export interface UIToolExecution {
    toolName: string;
    parameters: Record<string, unknown>;
    status: 'running' | 'done' | 'failed';
    output?: string;
    duration?: number;
    startTime: number;
}

export interface UIFileActivity {
    path: string;
    action: 'create' | 'update' | 'delete';
    timestamp: number;
}

export interface AgentEventsState {
    // Plan state
    activePlan: UITaskPlan | null;

    // Agent state
    agentStatus: string;
    activeAgent: string | null;

    // Thinking / CoT
    isThinking: boolean;
    thinkingContent: string;

    // Tool execution
    activeTool: UIToolExecution | null;
    recentTools: UIToolExecution[];

    // File activity
    recentFiles: UIFileActivity[];

    // Workspace
    shouldOpenWorkspace: boolean;

    // Metrics
    elapsedTime: number;
}

const INITIAL_STATE: AgentEventsState = {
    activePlan: null,
    agentStatus: 'idle',
    activeAgent: null,
    isThinking: false,
    thinkingContent: '',
    activeTool: null,
    recentTools: [],
    recentFiles: [],
    shouldOpenWorkspace: false,
    elapsedTime: 0
};

// ═══════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════

export function useAgentEvents() {
    const [state, setState] = useState<AgentEventsState>(INITIAL_STATE);
    const startTimeRef = useRef<number | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Timer for elapsed time display
    const startTimer = useCallback(() => {
        if (timerRef.current) return;
        startTimeRef.current = Date.now();
        timerRef.current = setInterval(() => {
            if (startTimeRef.current) {
                setState(prev => ({
                    ...prev,
                    elapsedTime: Date.now() - startTimeRef.current!
                }));
            }
        }, 100); // Update every 100ms for smooth display
    }, []);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        startTimeRef.current = null;
    }, []);

    useEffect(() => {
        const bus = getAgentEventBus();

        const unsubscribe = bus.onAll((event: AgentEvent) => {
            switch (event.type) {
                case 'PLAN_START': {
                    const p = event.payload as PlanStartPayload;
                    setState(prev => ({
                        ...prev,
                        activePlan: {
                            id: p.planId,
                            title: p.title,
                            goal: p.goal,
                            steps: [],
                            status: 'planning',
                            progress: 0
                        },
                        shouldOpenWorkspace: true,
                        agentStatus: 'planning'
                    }));
                    startTimer();
                    break;
                }

                case 'PLAN_STEP_ADD': {
                    const p = event.payload as PlanStepAddPayload;
                    setState(prev => {
                        if (!prev.activePlan) return prev;
                        return {
                            ...prev,
                            activePlan: {
                                ...prev.activePlan,
                                steps: [...prev.activePlan.steps, {
                                    id: p.stepId,
                                    title: p.title,
                                    description: p.description,
                                    tool: p.tool,
                                    status: 'pending'
                                }]
                            }
                        };
                    });
                    break;
                }

                case 'STEP_START': {
                    const p = event.payload as StepStartPayload;
                    setState(prev => {
                        if (!prev.activePlan) return prev;
                        return {
                            ...prev,
                            activePlan: {
                                ...prev.activePlan,
                                status: 'executing',
                                steps: prev.activePlan.steps.map(s =>
                                    s.id === p.stepId
                                        ? { ...s, status: 'running' as const }
                                        : s
                                )
                            },
                            agentStatus: 'executing'
                        };
                    });
                    break;
                }

                case 'STEP_PROGRESS': {
                    const p = event.payload as StepProgressPayload;
                    setState(prev => {
                        if (!prev.activePlan) return prev;
                        return {
                            ...prev,
                            activePlan: {
                                ...prev.activePlan,
                                steps: prev.activePlan.steps.map(s =>
                                    s.id === p.stepId
                                        ? { ...s, progress: p.progress }
                                        : s
                                )
                            }
                        };
                    });
                    break;
                }

                case 'STEP_COMPLETE': {
                    const p = event.payload as StepCompletePayload;
                    setState(prev => {
                        if (!prev.activePlan) return prev;
                        const updatedSteps = prev.activePlan.steps.map(s =>
                            s.id === p.stepId
                                ? {
                                    ...s,
                                    status: 'done' as const,
                                    result: p.result,
                                    duration: p.duration,
                                    confidence: p.confidence
                                }
                                : s
                        );
                        const completed = updatedSteps.filter(s => s.status === 'done' || s.status === 'failed' || s.status === 'skipped').length;
                        return {
                            ...prev,
                            activePlan: {
                                ...prev.activePlan,
                                steps: updatedSteps,
                                progress: updatedSteps.length > 0 ? completed / updatedSteps.length : 0
                            }
                        };
                    });
                    break;
                }

                case 'STEP_FAIL': {
                    const p = event.payload as StepFailPayload;
                    setState(prev => {
                        if (!prev.activePlan) return prev;
                        const updatedSteps = prev.activePlan.steps.map(s =>
                            s.id === p.stepId
                                ? { ...s, status: 'failed' as const, error: p.error }
                                : s
                        );
                        const completed = updatedSteps.filter(s => s.status === 'done' || s.status === 'failed' || s.status === 'skipped').length;
                        return {
                            ...prev,
                            activePlan: {
                                ...prev.activePlan,
                                steps: updatedSteps,
                                progress: updatedSteps.length > 0 ? completed / updatedSteps.length : 0
                            }
                        };
                    });
                    break;
                }

                case 'TOOL_CALL_START': {
                    const p = event.payload as ToolCallStartPayload;
                    setState(prev => ({
                        ...prev,
                        activeTool: {
                            toolName: p.toolName,
                            parameters: p.parameters,
                            status: 'running',
                            startTime: Date.now()
                        }
                    }));
                    break;
                }

                case 'TOOL_CALL_END': {
                    const p = event.payload as ToolCallEndPayload;
                    setState(prev => {
                        const completed: UIToolExecution = {
                            toolName: p.toolName,
                            parameters: {},
                            status: p.success ? 'done' : 'failed',
                            output: p.output,
                            duration: p.duration,
                            startTime: Date.now() - p.duration
                        };
                        return {
                            ...prev,
                            activeTool: null,
                            recentTools: [completed, ...prev.recentTools].slice(0, 10)
                        };
                    });
                    break;
                }

                case 'THINKING_START': {
                    setState(prev => ({
                        ...prev,
                        isThinking: true,
                        thinkingContent: ''
                    }));
                    startTimer();
                    break;
                }

                case 'THINKING_CONTENT': {
                    const p = event.payload as ThinkingContentPayload;
                    // flushSync: force synchronous DOM commit per CoT token.
                    // Without this, React 18 batches these with the 100ms timer setState,
                    // causing thinking content to lag or be invisible until a layout event.
                    flushSync(() => {
                        setState(prev => ({
                            ...prev,
                            thinkingContent: prev.thinkingContent + p.text
                        }));
                    });
                    break;
                }

                case 'THINKING_END': {
                    setState(prev => {
                        // Stop timer if no active plan (simple chat request)
                        if (!prev.activePlan) {
                            stopTimer();
                        }
                        return {
                            ...prev,
                            isThinking: false
                        };
                    });
                    break;
                }

                case 'STATUS_CHANGE': {
                    const p = event.payload as StatusChangePayload;
                    setState(prev => ({
                        ...prev,
                        agentStatus: p.status,
                        activeAgent: p.agent || prev.activeAgent
                    }));
                    if (p.status === 'idle') {
                        stopTimer();
                    }
                    break;
                }

                case 'FILE_WRITE': {
                    const p = event.payload as FileWritePayload;
                    const fileAction = p.action as UIFileActivity['action'];
                    setState(prev => ({
                        ...prev,
                        recentFiles: [{
                            path: p.path,
                            action: fileAction,
                            timestamp: Date.now()
                        }, ...prev.recentFiles].slice(0, 20)
                    }));
                    break;
                }

                case 'ARTIFACT_CREATE': {
                    // Handled by ArtifactCard, but we track file activity
                    const p = event.payload as ArtifactCreatePayload;
                    setState(prev => ({
                        ...prev,
                        recentFiles: [{
                            path: p.title,
                            action: 'create' as const,
                            timestamp: Date.now()
                        }, ...prev.recentFiles].slice(0, 20)
                    }));
                    break;
                }

                case 'PLAN_COMPLETE': {
                    const p = event.payload as PlanCompletePayload;
                    setState(prev => ({
                        ...prev,
                        activePlan: prev.activePlan
                            ? { ...prev.activePlan, status: 'complete', totalDuration: p.totalDuration }
                            : null,
                        agentStatus: 'complete'
                    }));
                    stopTimer();
                    break;
                }
            }
        });

        return () => {
            unsubscribe();
            stopTimer();
        };
    }, [startTimer, stopTimer]);

    // Reset state (for starting new conversations)
    const reset = useCallback(() => {
        setState(INITIAL_STATE);
        stopTimer();
    }, [stopTimer]);

    // Mark workspace as opened (clear the flag)
    const markWorkspaceOpened = useCallback(() => {
        setState(prev => ({ ...prev, shouldOpenWorkspace: false }));
    }, []);

    return {
        ...state,
        reset,
        markWorkspaceOpened
    };
}
