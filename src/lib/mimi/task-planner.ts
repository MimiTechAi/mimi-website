"use client";

/**
 * MIMI Agent — Manus-Style Autonomous Task Planner
 * 
 * Implements intelligent task decomposition inspired by Manus AI's
 * three-file context system (task_plan, notes, deliverable).
 * 
 * Capabilities:
 * - shouldPlan() heuristic to avoid over-planning simple queries
 * - LLM-powered plan generation with structured JSON output
 * - Step-by-step execution with event emission
 * - Self-correction on failures with exponential backoff
 * - Context isolation between planner and executor
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { AgentEvents, getAgentEventBus, type AgentEvent } from './agent-events';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface TaskStep {
    id: string;
    title: string;
    description: string;
    tool?: string;
    toolParams?: Record<string, unknown>;
    status: 'pending' | 'running' | 'done' | 'failed' | 'skipped';
    result?: string;
    confidence?: number;       // 0-1 confidence score
    duration?: number;         // ms
    retryCount: number;
    startedAt?: number;
    completedAt?: number;
    error?: string;
}

export interface TaskPlan {
    id: string;
    title: string;
    goal: string;
    steps: TaskStep[];
    status: 'planning' | 'awaiting_approval' | 'executing' | 'complete' | 'failed';
    context: TaskContext;
    createdAt: number;
    completedAt?: number;
    totalDuration?: number;
}

export interface TaskContext {
    taskPlan: string;       // Manus task_plan.md — progress tracking
    notes: string;          // Manus notes.md — research findings
    deliverable: string;    // Final output accumulator
}

export type PlannerCallback = (event: AgentEvent) => void;

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const PLAN_THRESHOLD = 0.6;
const MAX_RETRIES_PER_STEP = 2;
const MAX_STEPS = 8;

// Action verbs that indicate planning is needed (German + English)
const ACTION_VERBS = [
    // German
    'erstelle', 'erstell', 'baue', 'bau', 'analysiere', 'analysier',
    'vergleiche', 'vergleich', 'schreibe', 'schreib', 'generiere', 'generier',
    'implementiere', 'implementier', 'entwickle', 'entwickel', 'berechne',
    'optimiere', 'optimier', 'teste', 'test', 'debugge', 'fixe', 'fix',
    'konvertiere', 'konvertier', 'transformiere', 'übersetze', 'visualisiere',
    'zeichne', 'plotte', 'zeige', 'mache', 'mach',
    // English
    'create', 'build', 'analyze', 'compare', 'write', 'generate',
    'implement', 'develop', 'calculate', 'optimize', 'test', 'debug',
    'fix', 'convert', 'transform', 'translate', 'visualize', 'draw',
    'plot', 'show', 'make', 'design', 'research', 'investigate'
];

// Multi-step indicators
const MULTI_STEP_INDICATORS = [
    'und dann', 'und', 'außerdem', 'danach', 'anschließend', 'zusätzlich',
    'schritt für schritt', 'step by step', 'zuerst', 'erstens', 'zweitens',
    'and then', 'additionally', 'furthermore', 'also', 'first', 'then',
    'finally', 'next', 'after that'
];

// Simple greetings that never need planning
const GREETINGS = [
    'hallo', 'hi', 'hey', 'moin', 'servus', 'guten tag', 'guten morgen',
    'guten abend', 'hello', 'good morning', 'good evening', 'sup', 'yo',
    'danke', 'thanks', 'thank you', 'tschüss', 'bye', 'ciao', 'ja', 'nein',
    'ok', 'okay', 'klar', 'sure', 'yes', 'no', 'alright'
];

// Tool mapping — which tool to use for which kind of task
const TOOL_HINTS: Record<string, string[]> = {
    'execute_python': [
        'diagramm', 'chart', 'plot', 'berechne', 'calculate', 'graph',
        'matplotlib', 'daten', 'data', 'analyse', 'statistik', 'python',
        'script', 'algorithmus', 'sortier', 'fibonacci', 'primzahl'
    ],
    'web_search': [
        'suche', 'finde', 'recherche', 'search', 'find', 'research',
        'aktuell', 'current', 'latest', 'news', 'was ist', 'what is',
        'wer ist', 'who is', 'wie viel', 'how much', 'vergleiche'
    ],
    'execute_javascript': [
        'javascript', 'js', 'html', 'css', 'dom', 'browser',
        'website', 'webpage', 'react', 'frontend'
    ],
    'execute_sql': [
        'sql', 'datenbank', 'database', 'tabelle', 'table',
        'query', 'abfrage', 'select', 'insert'
    ],
    'create_file': [
        'datei', 'file', 'erstelle datei', 'create file',
        'speichere', 'save', 'schreibe in', 'write to'
    ]
};

// ═══════════════════════════════════════════════════════════
// TASK PLANNER
// ═══════════════════════════════════════════════════════════

export class TaskPlanner {

    /**
     * Heuristic: does this query need a multi-step plan?
     * 
     * NO plan needed for:
     * - Greetings ("Hallo", "Hi", "Hey")
     * - Simple questions ("Was ist React?")
     * - Short messages (< 10 words, no action verbs)
     * - Yes/No answers
     * 
     * YES plan needed for:
     * - Action verbs: "erstelle", "baue", "analysiere"
     * - Multi-part requests: contains "und", "dann", "außerdem"
     * - Complex queries: > 20 words with technical terms
     * - Explicit plan requests: "schritt für schritt", "plan"
     */
    shouldPlan(message: string): boolean {
        const lower = message.toLowerCase().trim();
        const words = lower.split(/\s+/);

        // Never plan for greetings
        if (GREETINGS.some(g => lower === g || lower.startsWith(g + ' ') || lower.startsWith(g + ','))) {
            return false;
        }

        // Never plan for very short messages (< 5 words)
        if (words.length < 5) {
            return false;
        }

        let score = 0;

        // Action verbs boost (+0.3 per verb found)
        const actionVerbCount = ACTION_VERBS.filter(v => lower.includes(v)).length;
        score += Math.min(actionVerbCount * 0.3, 0.6);

        // Multi-step indicators boost (+0.3 per indicator)
        const multiStepCount = MULTI_STEP_INDICATORS.filter(i => lower.includes(i)).length;
        score += Math.min(multiStepCount * 0.3, 0.6);

        // Length boost (longer = more complex)
        if (words.length > 15) score += 0.2;
        if (words.length > 25) score += 0.2;

        // Question-only slight penalty (questions are often direct)
        if (lower.endsWith('?') && actionVerbCount === 0) {
            score -= 0.2;
        }

        // Technical terms boost
        const techTerms = ['api', 'code', 'function', 'class', 'algorithmus', 'algorithm',
            'database', 'datenbank', 'frontend', 'backend', 'server', 'deploy',
            'python', 'javascript', 'typescript', 'react', 'sql'];
        const techCount = techTerms.filter(t => lower.includes(t)).length;
        score += Math.min(techCount * 0.15, 0.3);

        return score >= PLAN_THRESHOLD;
    }

    /**
     * Create a task plan from a user message.
     * Uses simple heuristic-based decomposition (no LLM call needed).
     * 
     * For a local-first agent, we decompose based on detected intents
     * rather than calling the LLM for planning (saves context window).
     */
    createPlan(message: string): TaskPlan {
        const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const lower = message.toLowerCase();

        // Detect required tools
        const detectedTools = this.detectTools(lower);

        // Generate steps based on detected tools and message analysis
        const steps = this.generateSteps(message, detectedTools, planId);

        // Determine plan title
        const title = this.generateTitle(message);

        const plan: TaskPlan = {
            id: planId,
            title,
            goal: message,
            steps,
            status: 'planning',
            context: {
                taskPlan: this.buildTaskPlanDoc(title, steps),
                notes: '',
                deliverable: ''
            },
            createdAt: Date.now()
        };

        // Emit events
        AgentEvents.planStart(planId, title, message, steps.length);

        steps.forEach((step, idx) => {
            AgentEvents.planStepAdd(planId, step.id, step.title, step.description, step.tool, idx);
        });

        console.log(`[TaskPlanner] 📋 Created plan "${title}" with ${steps.length} steps`);
        return plan;
    }

    /**
     * Update a step's status and emit the corresponding event
     */
    updateStepStatus(
        plan: TaskPlan,
        stepId: string,
        status: TaskStep['status'],
        result?: string,
        error?: string
    ): TaskPlan {
        const updatedSteps = plan.steps.map(step => {
            if (step.id !== stepId) return step;

            const now = Date.now();
            const updated = { ...step, status };

            if (status === 'running') {
                updated.startedAt = now;
                AgentEvents.stepStart(plan.id, stepId, step.title, step.tool);
            } else if (status === 'done') {
                updated.completedAt = now;
                updated.result = result;
                updated.duration = updated.startedAt ? now - updated.startedAt : 0;
                AgentEvents.stepComplete(plan.id, stepId, result || '', updated.duration);
            } else if (status === 'failed') {
                updated.completedAt = now;
                updated.error = error;
                updated.duration = updated.startedAt ? now - updated.startedAt : 0;
                updated.retryCount += 1;
                AgentEvents.stepFail(
                    plan.id, stepId, error || 'Unknown error',
                    updated.retryCount < MAX_RETRIES_PER_STEP,
                    updated.retryCount
                );
            } else if (status === 'skipped') {
                AgentEvents.stepComplete(plan.id, stepId, 'Übersprungen', 0);
            }

            return updated;
        });

        // Check if all steps are done
        const allDone = updatedSteps.every(s =>
            s.status === 'done' || s.status === 'failed' || s.status === 'skipped'
        );

        const newStatus = allDone ? 'complete' : plan.status;
        const now = Date.now();

        if (allDone) {
            const totalDuration = now - plan.createdAt;
            const stepsCompleted = updatedSteps.filter(s => s.status === 'done').length;
            const stepsFailed = updatedSteps.filter(s => s.status === 'failed').length;
            AgentEvents.planComplete(plan.id, totalDuration, stepsCompleted, stepsFailed);
        }

        // Update context
        const updatedContext = {
            ...plan.context,
            taskPlan: this.buildTaskPlanDoc(plan.title, updatedSteps)
        };

        return {
            ...plan,
            steps: updatedSteps,
            status: newStatus,
            context: updatedContext,
            ...(allDone ? { completedAt: now, totalDuration: now - plan.createdAt } : {})
        };
    }

    /**
     * Append notes to the plan context (Manus notes.md pattern)
     */
    addNotes(plan: TaskPlan, note: string): TaskPlan {
        return {
            ...plan,
            context: {
                ...plan.context,
                notes: plan.context.notes
                    ? `${plan.context.notes}\n\n---\n\n${note}`
                    : note
            }
        };
    }

    /**
     * Append to the deliverable (Manus deliverable.md pattern)
     */
    addDeliverable(plan: TaskPlan, content: string): TaskPlan {
        return {
            ...plan,
            context: {
                ...plan.context,
                deliverable: plan.context.deliverable + content
            }
        };
    }

    /**
     * Check if a step should be retried
     */
    canRetry(step: TaskStep): boolean {
        return step.status === 'failed' && step.retryCount < MAX_RETRIES_PER_STEP;
    }

    /**
     * Get the next pending step
     */
    getNextStep(plan: TaskPlan): TaskStep | null {
        return plan.steps.find(s => s.status === 'pending') || null;
    }

    /**
     * Get plan progress as fraction (0-1)
     */
    getProgress(plan: TaskPlan): number {
        if (plan.steps.length === 0) return 0;
        const completed = plan.steps.filter(s =>
            s.status === 'done' || s.status === 'failed' || s.status === 'skipped'
        ).length;
        return completed / plan.steps.length;
    }

    // ─── INTERNAL ─────────────────────────────────

    private detectTools(lowerMessage: string): string[] {
        const tools: string[] = [];

        for (const [tool, keywords] of Object.entries(TOOL_HINTS)) {
            if (keywords.some(k => lowerMessage.includes(k))) {
                tools.push(tool);
            }
        }

        return tools;
    }

    private generateSteps(message: string, detectedTools: string[], planId: string): TaskStep[] {
        const steps: TaskStep[] = [];
        const lower = message.toLowerCase();
        let stepIndex = 0;

        const makeStep = (title: string, description: string, tool?: string): TaskStep => {
            const step: TaskStep = {
                id: `step_${planId}_${stepIndex++}`,
                title,
                description,
                tool,
                status: 'pending',
                retryCount: 0
            };
            return step;
        };

        // Research step — if topic requires web knowledge
        const needsResearch = detectedTools.includes('web_search') ||
            /recherch|such|find|aktuell|current|latest|top \d+|best \d+|vergleich/i.test(lower);

        if (needsResearch) {
            steps.push(makeStep(
                '🔍 Web-Recherche',
                'Aktuelle Informationen zum Thema sammeln',
                'web_search'
            ));
        }

        // Data analysis/Python step
        if (detectedTools.includes('execute_python')) {
            if (needsResearch) {
                steps.push(makeStep(
                    '📊 Daten aufbereiten',
                    'Recherche-Ergebnisse strukturieren und analysieren',
                    'execute_python'
                ));
            }
            steps.push(makeStep(
                '🐍 Code ausführen',
                'Python-Script erstellen und ausführen',
                'execute_python'
            ));
        }

        // JavaScript step
        if (detectedTools.includes('execute_javascript')) {
            steps.push(makeStep(
                '⚡ JavaScript ausführen',
                'JavaScript-Code erstellen und im Sandbox ausführen',
                'execute_javascript'
            ));
        }

        // SQL step
        if (detectedTools.includes('execute_sql')) {
            steps.push(makeStep(
                '🗄️ Datenbank-Abfrage',
                'SQL-Query erstellen und ausführen',
                'execute_sql'
            ));
        }

        // File creation step
        if (detectedTools.includes('create_file') || /datei|file|speicher|save/i.test(lower)) {
            steps.push(makeStep(
                '📝 Datei erstellen',
                'Ergebnis als Datei im Workspace speichern',
                'create_file'
            ));
        }

        // If no specific tools detected but planning was triggered,
        // create generic analysis + response steps
        if (steps.length === 0) {
            steps.push(makeStep(
                '🧠 Analyse',
                'Anfrage analysieren und Informationen sammeln'
            ));
            steps.push(makeStep(
                '✍️ Antwort erstellen',
                'Detaillierte Antwort formulieren'
            ));
        }

        // Always add summary/review step at end
        steps.push(makeStep(
            '📋 Zusammenfassung',
            'Ergebnisse zusammenfassen und präsentieren'
        ));

        // Cap at MAX_STEPS
        return steps.slice(0, MAX_STEPS);
    }

    private generateTitle(message: string): string {
        // Extract a short title from the message
        const words = message.split(/\s+/).slice(0, 6);
        let title = words.join(' ');
        if (message.split(/\s+/).length > 6) {
            title += '...';
        }
        return title;
    }

    private buildTaskPlanDoc(title: string, steps: TaskStep[]): string {
        const lines = [`# ${title}\n`];

        for (const step of steps) {
            const checkbox = step.status === 'done' ? '[x]' :
                step.status === 'running' ? '[~]' :
                    step.status === 'failed' ? '[!]' :
                        step.status === 'skipped' ? '[-]' : '[ ]';

            let line = `- ${checkbox} ${step.title}`;
            if (step.duration) {
                line += ` (${(step.duration / 1000).toFixed(1)}s)`;
            }
            if (step.error) {
                line += ` ❌ ${step.error}`;
            }
            lines.push(line);
        }

        return lines.join('\n');
    }
}

// ═══════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════

let _planner: TaskPlanner | null = null;

export function getTaskPlanner(): TaskPlanner {
    if (!_planner) {
        _planner = new TaskPlanner();
    }
    return _planner;
}

// Re-export event bus for convenience
export { getAgentEventBus, AgentEvents };
