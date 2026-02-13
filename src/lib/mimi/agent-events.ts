"use client";

/**
 * MIMI Agent — AG-UI Inspired Event System
 * 
 * Event-driven communication backbone between agent engine and UI.
 * Inspired by the AG-UI protocol (Agent-User Interaction Protocol).
 * 
 * 16 typed events covering: planning, execution, thinking, artifacts, and lifecycle.
 * Supports batching (max 10 events/frame) and snapshot for UI hydration.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

// ═══════════════════════════════════════════════════════════
// EVENT TYPES — Inspired by AG-UI Protocol
// ═══════════════════════════════════════════════════════════

export type AgentEventType =
    | 'PLAN_START'         // Task plan created
    | 'PLAN_STEP_ADD'      // New step added to plan
    | 'STEP_START'         // Step execution begins
    | 'STEP_PROGRESS'      // Intermediate progress update
    | 'STEP_COMPLETE'      // Step finished successfully
    | 'STEP_FAIL'          // Step failed (with error)
    | 'TOOL_CALL_START'    // Tool invocation begins
    | 'TOOL_CALL_END'      // Tool returns result
    | 'THINKING_START'     // CoT reasoning begins
    | 'THINKING_CONTENT'   // CoT token stream
    | 'THINKING_END'       // CoT reasoning ends
    | 'TEXT_DELTA'         // Visible text token
    | 'ARTIFACT_CREATE'    // New artifact (code, file, chart)
    | 'FILE_WRITE'         // File created/updated in workspace
    | 'STATUS_CHANGE'      // Agent status change
    | 'PLAN_COMPLETE';     // All steps done

// ═══════════════════════════════════════════════════════════
// EVENT INTERFACES
// ═══════════════════════════════════════════════════════════

export interface AgentEvent<T = unknown> {
    type: AgentEventType;
    timestamp: number;
    stepId?: string;
    planId?: string;
    payload: T;
}

// Typed payloads for each event
export interface PlanStartPayload {
    planId: string;
    title: string;
    goal: string;
    stepCount: number;
}

export interface PlanStepAddPayload {
    stepId: string;
    title: string;
    description: string;
    tool?: string;
    index: number;
}

export interface StepStartPayload {
    stepId: string;
    title: string;
    tool?: string;
}

export interface StepProgressPayload {
    stepId: string;
    message: string;
    progress?: number; // 0-1
}

export interface StepCompletePayload {
    stepId: string;
    result: string;
    duration: number; // ms
    confidence?: number; // 0-1
}

export interface StepFailPayload {
    stepId: string;
    error: string;
    retryable: boolean;
    retryCount?: number;
}

export interface ToolCallStartPayload {
    toolName: string;
    parameters: Record<string, unknown>;
}

export interface ToolCallEndPayload {
    toolName: string;
    success: boolean;
    output: string;
    duration: number;
}

export interface ThinkingContentPayload {
    text: string;
}

export interface TextDeltaPayload {
    text: string;
}

export interface ArtifactCreatePayload {
    title: string;
    language: string;
    content: string;
    type: 'code' | 'html' | 'chart' | 'file';
}

export interface FileWritePayload {
    path: string;
    action: 'create' | 'update' | 'delete';
    size?: number;
}

export interface StatusChangePayload {
    status: string;
    agent?: string;
}

export interface PlanCompletePayload {
    planId: string;
    totalDuration: number;
    stepsCompleted: number;
    stepsFailed: number;
}

// ═══════════════════════════════════════════════════════════
// EVENT HANDLER TYPE
// ═══════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventHandler = (event: AgentEvent<any>) => void;

// ═══════════════════════════════════════════════════════════
// AGENT EVENT BUS
// ═══════════════════════════════════════════════════════════

const MAX_EVENTS_PER_FRAME = 10;
const MAX_SNAPSHOT_SIZE = 200;

export class AgentEventBus {
    private handlers: Map<AgentEventType, Set<EventHandler>> = new Map();
    private globalHandlers: Set<EventHandler> = new Set();
    private eventQueue: AgentEvent[] = [];
    private snapshot: AgentEvent[] = [];
    private isProcessing = false;
    private frameRequestId: number | null = null;

    /**
     * Subscribe to a specific event type
     */
    on<T>(type: AgentEventType, handler: (event: AgentEvent<T>) => void): () => void {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type)!.add(handler as EventHandler);

        // Return unsubscribe function
        return () => {
            this.handlers.get(type)?.delete(handler as EventHandler);
        };
    }

    /**
     * Subscribe to ALL events (for logging, debugging, or aggregate UI)
     */
    onAll(handler: EventHandler): () => void {
        this.globalHandlers.add(handler);
        return () => {
            this.globalHandlers.delete(handler);
        };
    }

    /**
     * Emit an event — batched per animation frame (max 10/frame)
     */
    emit<T>(type: AgentEventType, payload: T, stepId?: string, planId?: string): void {
        const event: AgentEvent<T> = {
            type,
            timestamp: Date.now(),
            stepId,
            planId,
            payload
        };

        // Add to snapshot (circular buffer)
        this.snapshot.push(event);
        if (this.snapshot.length > MAX_SNAPSHOT_SIZE) {
            this.snapshot = this.snapshot.slice(-MAX_SNAPSHOT_SIZE);
        }

        // Queue for batched processing
        this.eventQueue.push(event);
        this.scheduleProcessing();
    }

    /**
     * Emit an event immediately — bypasses batching for critical events
     */
    emitImmediate<T>(type: AgentEventType, payload: T, stepId?: string, planId?: string): void {
        const event: AgentEvent<T> = {
            type,
            timestamp: Date.now(),
            stepId,
            planId,
            payload
        };

        this.snapshot.push(event);
        if (this.snapshot.length > MAX_SNAPSHOT_SIZE) {
            this.snapshot = this.snapshot.slice(-MAX_SNAPSHOT_SIZE);
        }

        this.dispatchEvent(event);
    }

    /**
     * Get snapshot for UI hydration (e.g. on reconnect or component mount)
     */
    getSnapshot(): AgentEvent[] {
        return [...this.snapshot];
    }

    /**
     * Get latest events of a specific type
     */
    getLatestByType(type: AgentEventType, count = 1): AgentEvent[] {
        return this.snapshot
            .filter(e => e.type === type)
            .slice(-count);
    }

    /**
     * Clear all snapshots and handlers
     */
    reset(): void {
        this.snapshot = [];
        this.eventQueue = [];
        if (this.frameRequestId !== null) {
            cancelAnimationFrame(this.frameRequestId);
            this.frameRequestId = null;
        }
    }

    /**
     * Remove all handlers (for cleanup)
     */
    removeAllListeners(): void {
        this.handlers.clear();
        this.globalHandlers.clear();
    }

    /**
     * Get handler count for debugging
     */
    getHandlerCount(): number {
        let count = this.globalHandlers.size;
        for (const handlers of this.handlers.values()) {
            count += handlers.size;
        }
        return count;
    }

    // ─── INTERNAL ─────────────────────────────────

    private scheduleProcessing(): void {
        if (this.isProcessing) return;

        if (typeof requestAnimationFrame !== 'undefined') {
            if (this.frameRequestId === null) {
                this.frameRequestId = requestAnimationFrame(() => {
                    this.processQueue();
                    this.frameRequestId = null;
                });
            }
        } else {
            // Fallback for non-browser environments (SSR, workers)
            setTimeout(() => this.processQueue(), 0);
        }
    }

    private processQueue(): void {
        this.isProcessing = true;
        const batchSize = Math.min(this.eventQueue.length, MAX_EVENTS_PER_FRAME);
        const batch = this.eventQueue.splice(0, batchSize);

        for (const event of batch) {
            this.dispatchEvent(event);
        }

        this.isProcessing = false;

        // If more events remain, schedule next frame
        if (this.eventQueue.length > 0) {
            this.scheduleProcessing();
        }
    }

    private dispatchEvent(event: AgentEvent): void {
        // Typed handlers
        const handlers = this.handlers.get(event.type);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(event);
                } catch (err) {
                    console.error(`[AgentEventBus] Handler error for ${event.type}:`, err);
                }
            }
        }

        // Global handlers
        for (const handler of this.globalHandlers) {
            try {
                handler(event);
            } catch (err) {
                console.error(`[AgentEventBus] Global handler error:`, err);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════

let _eventBus: AgentEventBus | null = null;

export function getAgentEventBus(): AgentEventBus {
    if (!_eventBus) {
        _eventBus = new AgentEventBus();
    }
    return _eventBus;
}

/**
 * Helper to create typed events quickly
 */
export const AgentEvents = {
    planStart(planId: string, title: string, goal: string, stepCount: number) {
        getAgentEventBus().emitImmediate<PlanStartPayload>('PLAN_START', {
            planId, title, goal, stepCount
        }, undefined, planId);
    },

    planStepAdd(planId: string, stepId: string, title: string, description: string, tool: string | undefined, index: number) {
        getAgentEventBus().emit<PlanStepAddPayload>('PLAN_STEP_ADD', {
            stepId, title, description, tool, index
        }, stepId, planId);
    },

    stepStart(planId: string, stepId: string, title: string, tool?: string) {
        getAgentEventBus().emitImmediate<StepStartPayload>('STEP_START', {
            stepId, title, tool
        }, stepId, planId);
    },

    stepProgress(planId: string, stepId: string, message: string, progress?: number) {
        getAgentEventBus().emit<StepProgressPayload>('STEP_PROGRESS', {
            stepId, message, progress
        }, stepId, planId);
    },

    stepComplete(planId: string, stepId: string, result: string, duration: number, confidence?: number) {
        getAgentEventBus().emitImmediate<StepCompletePayload>('STEP_COMPLETE', {
            stepId, result, duration, confidence
        }, stepId, planId);
    },

    stepFail(planId: string, stepId: string, error: string, retryable = true, retryCount = 0) {
        getAgentEventBus().emitImmediate<StepFailPayload>('STEP_FAIL', {
            stepId, error, retryable, retryCount
        }, stepId, planId);
    },

    toolCallStart(toolName: string, parameters: Record<string, unknown>, stepId?: string) {
        getAgentEventBus().emitImmediate<ToolCallStartPayload>('TOOL_CALL_START', {
            toolName, parameters
        }, stepId);
    },

    toolCallEnd(toolName: string, success: boolean, output: string, duration: number, stepId?: string) {
        getAgentEventBus().emitImmediate<ToolCallEndPayload>('TOOL_CALL_END', {
            toolName, success, output, duration
        }, stepId);
    },

    thinkingStart() {
        getAgentEventBus().emit('THINKING_START', {});
    },

    thinkingContent(text: string) {
        getAgentEventBus().emit<ThinkingContentPayload>('THINKING_CONTENT', { text });
    },

    thinkingEnd() {
        getAgentEventBus().emit('THINKING_END', {});
    },

    textDelta(text: string) {
        getAgentEventBus().emit<TextDeltaPayload>('TEXT_DELTA', { text });
    },

    artifactCreate(title: string, language: string, content: string, type: 'code' | 'html' | 'chart' | 'file') {
        getAgentEventBus().emitImmediate<ArtifactCreatePayload>('ARTIFACT_CREATE', {
            title, language, content, type
        });
    },

    fileWrite(path: string, action: 'create' | 'update' | 'delete', size?: number) {
        getAgentEventBus().emit<FileWritePayload>('FILE_WRITE', {
            path, action, size
        });
    },

    statusChange(status: string, agent?: string) {
        getAgentEventBus().emitImmediate<StatusChangePayload>('STATUS_CHANGE', {
            status, agent
        });
    },

    planComplete(planId: string, totalDuration: number, stepsCompleted: number, stepsFailed: number) {
        getAgentEventBus().emitImmediate<PlanCompletePayload>('PLAN_COMPLETE', {
            planId, totalDuration, stepsCompleted, stepsFailed
        }, undefined, planId);
    }
};
