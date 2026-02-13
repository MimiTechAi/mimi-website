/**
 * Task Planner — Unit Tests
 * Tests shouldPlan heuristic, createPlan, step status updates, retry logic,
 * getNextStep, getProgress, addNotes, addDeliverable, canRetry
 * 
 * © 2026 MIMI Tech AI
 */

import { TaskPlanner, type TaskPlan, type TaskStep } from '../task-planner';
import { getAgentEventBus } from '../agent-events';

// Mock requestAnimationFrame / cancelAnimationFrame for Node
beforeAll(() => {
    (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0) as unknown as number;
    (global as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
});

describe('TaskPlanner', () => {
    let planner: TaskPlanner;

    beforeEach(() => {
        planner = new TaskPlanner();
        getAgentEventBus().reset();
        getAgentEventBus().removeAllListeners();
    });

    // ── shouldPlan() heuristic ─────────────────────────────

    describe('shouldPlan', () => {
        test('returns false for greetings', () => {
            expect(planner.shouldPlan('Hallo')).toBe(false);
            expect(planner.shouldPlan('hi')).toBe(false);
            expect(planner.shouldPlan('hey')).toBe(false);
            expect(planner.shouldPlan('danke')).toBe(false);
            expect(planner.shouldPlan('ok')).toBe(false);
        });

        test('returns false for very short messages (< 5 words)', () => {
            expect(planner.shouldPlan('Was ist React?')).toBe(false);
            expect(planner.shouldPlan('Erkläre mir OOP')).toBe(false);
        });

        test('returns true for messages with action verbs and enough length', () => {
            expect(planner.shouldPlan('Erstelle ein Python Script das Fibonacci berechnet und visualisiere es')).toBe(true);
        });

        test('returns true for multi-step requests', () => {
            expect(planner.shouldPlan('Recherchiere die besten JavaScript Frameworks und dann erstelle einen Vergleich')).toBe(true);
        });

        test('returns true for messages with technical terms and action verbs', () => {
            expect(planner.shouldPlan('Implementiere eine API mit Python und deploy es auf den Server mit Datenbank')).toBe(true);
        });

        test('short questions without action verbs get penalized', () => {
            expect(planner.shouldPlan('Ist JavaScript besser als Python?')).toBe(false);
        });
    });

    // ── createPlan() ─────────────────────────────────────────

    describe('createPlan', () => {
        test('creates plan with valid structure', () => {
            const plan = planner.createPlan('Erstelle ein Python script das Fibonacci berechnet und plotte es als chart');

            expect(plan.id).toMatch(/^plan_\d+_[a-z0-9]+$/);
            expect(plan.title).toBeTruthy();
            expect(plan.goal).toBeTruthy();
            expect(plan.steps.length).toBeGreaterThanOrEqual(2);
            expect(plan.status).toBe('planning');
            expect(plan.createdAt).toBeLessThanOrEqual(Date.now());
            expect(plan.context.taskPlan).toContain('# ');
        });

        test('detects Python tool for code tasks', () => {
            const plan = planner.createPlan('Berechne die Fibonacci-Zahlen mit Python und plotte sie');
            const pythonStep = plan.steps.find(s => s.tool === 'execute_python');
            expect(pythonStep).toBeDefined();
        });

        test('detects web_search tool for research tasks', () => {
            const plan = planner.createPlan('Recherchiere die aktuellen Top 10 JavaScript Frameworks und vergleiche sie');
            const searchStep = plan.steps.find(s => s.tool === 'web_search');
            expect(searchStep).toBeDefined();
        });

        test('always adds summary step at end', () => {
            const plan = planner.createPlan('Erstelle ein Python script das Daten analysiert');
            const lastStep = plan.steps[plan.steps.length - 1];
            expect(lastStep.title).toContain('Zusammenfassung');
        });

        test('caps steps at MAX_STEPS (8)', () => {
            // Very complex request that could trigger many tools
            const plan = planner.createPlan(
                'Suche nach aktuellen Daten, erstelle ein Python Script, speichere als Datei, ' +
                'schreibe JavaScript Code, führe SQL Queries aus und erstelle einen Report'
            );
            expect(plan.steps.length).toBeLessThanOrEqual(8);
        });

        test('creates generic steps when no specific tools detected', () => {
            const plan = planner.createPlan('Analysiere die komplexe Beziehung zwischen Quantenphysik und Philosophie des Geistes im Detail');
            expect(plan.steps.length).toBeGreaterThanOrEqual(2);
            const analysisStep = plan.steps.find(s => s.title.includes('Analyse'));
            expect(analysisStep).toBeDefined();
        });

        test('all steps start with pending status', () => {
            const plan = planner.createPlan('Erstelle ein Python chart mit matplotlib das sin(x) zeigt');
            for (const step of plan.steps) {
                expect(step.status).toBe('pending');
                expect(step.retryCount).toBe(0);
            }
        });

        test('emits PLAN_START event', () => {
            const handler = jest.fn();
            getAgentEventBus().on('PLAN_START', handler);

            planner.createPlan('Erstelle ein Python script das Fibonacci berechnet');

            expect(handler).toHaveBeenCalledWith(expect.objectContaining({
                type: 'PLAN_START',
            }));
        });
    });

    // ── updateStepStatus() ───────────────────────────────────

    describe('updateStepStatus', () => {
        let plan: TaskPlan;

        beforeEach(() => {
            plan = planner.createPlan('Erstelle ein Python chart mit matplotlib');
        });

        test('sets step to running with startedAt timestamp', () => {
            const stepId = plan.steps[0].id;
            const updated = planner.updateStepStatus(plan, stepId, 'running');
            const step = updated.steps.find(s => s.id === stepId)!;

            expect(step.status).toBe('running');
            expect(step.startedAt).toBeDefined();
        });

        test('sets step to done with result and duration', () => {
            const stepId = plan.steps[0].id;
            let updated = planner.updateStepStatus(plan, stepId, 'running');
            updated = planner.updateStepStatus(updated, stepId, 'done', 'Success output');
            const step = updated.steps.find(s => s.id === stepId)!;

            expect(step.status).toBe('done');
            expect(step.result).toBe('Success output');
            expect(step.duration).toBeDefined();
            expect(step.completedAt).toBeDefined();
        });

        test('sets step to failed with error and increments retryCount', () => {
            const stepId = plan.steps[0].id;
            let updated = planner.updateStepStatus(plan, stepId, 'running');
            updated = planner.updateStepStatus(updated, stepId, 'failed', undefined, 'SyntaxError');
            const step = updated.steps.find(s => s.id === stepId)!;

            expect(step.status).toBe('failed');
            expect(step.error).toBe('SyntaxError');
            expect(step.retryCount).toBe(1);
        });

        test('marks plan as complete when all steps are done', () => {
            let updated = plan;
            for (const step of plan.steps) {
                updated = planner.updateStepStatus(updated, step.id, 'running');
                updated = planner.updateStepStatus(updated, step.id, 'done', 'OK');
            }

            expect(updated.status).toBe('complete');
            expect(updated.completedAt).toBeDefined();
            expect(updated.totalDuration).toBeDefined();
        });

        test('updates context taskPlan doc', () => {
            const stepId = plan.steps[0].id;
            const updated = planner.updateStepStatus(plan, stepId, 'done', 'Completed');
            expect(updated.context.taskPlan).toContain('[x]');
        });
    });

    // ── canRetry() ────────────────────────────────────────────

    describe('canRetry', () => {
        test('returns true if failed with retryCount < MAX_RETRIES', () => {
            const step: TaskStep = {
                id: 'test', title: 'Test', description: 'Test',
                status: 'failed', retryCount: 0
            };
            expect(planner.canRetry(step)).toBe(true);
        });

        test('returns false if retryCount >= MAX_RETRIES', () => {
            const step: TaskStep = {
                id: 'test', title: 'Test', description: 'Test',
                status: 'failed', retryCount: 2
            };
            expect(planner.canRetry(step)).toBe(false);
        });

        test('returns false if step is not failed', () => {
            const step: TaskStep = {
                id: 'test', title: 'Test', description: 'Test',
                status: 'done', retryCount: 0
            };
            expect(planner.canRetry(step)).toBe(false);
        });
    });

    // ── getNextStep() ─────────────────────────────────────────

    describe('getNextStep', () => {
        test('returns first pending step', () => {
            const plan = planner.createPlan('Erstelle ein Python chart mit matplotlib');
            const next = planner.getNextStep(plan);
            expect(next).toBeDefined();
            expect(next!.status).toBe('pending');
        });

        test('returns null when no pending steps remain', () => {
            let plan = planner.createPlan('Erstelle ein Python chart mit matplotlib');
            for (const step of plan.steps) {
                plan = planner.updateStepStatus(plan, step.id, 'done', 'OK');
            }
            expect(planner.getNextStep(plan)).toBeNull();
        });
    });

    // ── getProgress() ─────────────────────────────────────────

    describe('getProgress', () => {
        test('returns 0 for fresh plan', () => {
            const plan = planner.createPlan('Erstelle ein Python chart mit matplotlib');
            expect(planner.getProgress(plan)).toBe(0);
        });

        test('returns 1 for completed plan', () => {
            let plan = planner.createPlan('Erstelle ein Python chart mit matplotlib');
            for (const step of plan.steps) {
                plan = planner.updateStepStatus(plan, step.id, 'done', 'OK');
            }
            expect(planner.getProgress(plan)).toBe(1);
        });

        test('returns correct fraction for partial progress', () => {
            let plan = planner.createPlan('Erstelle ein Python chart mit matplotlib');
            const totalSteps = plan.steps.length;
            plan = planner.updateStepStatus(plan, plan.steps[0].id, 'done', 'OK');
            expect(planner.getProgress(plan)).toBeCloseTo(1 / totalSteps);
        });

        test('returns 0 for empty steps (edge case)', () => {
            const plan: TaskPlan = {
                id: 'test', title: 'Test', goal: 'Test',
                steps: [], status: 'planning',
                context: { taskPlan: '', notes: '', deliverable: '' },
                createdAt: Date.now()
            };
            expect(planner.getProgress(plan)).toBe(0);
        });
    });

    // ── addNotes() / addDeliverable() ────────────────────────

    describe('addNotes', () => {
        test('appends first note', () => {
            const plan = planner.createPlan('Erstelle ein Python chart mit matplotlib');
            const updated = planner.addNotes(plan, 'Found relevant data');
            expect(updated.context.notes).toBe('Found relevant data');
        });

        test('appends subsequent notes with separator', () => {
            let plan = planner.createPlan('Erstelle ein Python chart mit matplotlib');
            plan = planner.addNotes(plan, 'Note 1');
            plan = planner.addNotes(plan, 'Note 2');
            expect(plan.context.notes).toContain('Note 1');
            expect(plan.context.notes).toContain('---');
            expect(plan.context.notes).toContain('Note 2');
        });
    });

    describe('addDeliverable', () => {
        test('appends content to deliverable', () => {
            let plan = planner.createPlan('Erstelle ein Python chart mit matplotlib');
            plan = planner.addDeliverable(plan, 'Part 1\n');
            plan = planner.addDeliverable(plan, 'Part 2\n');
            expect(plan.context.deliverable).toBe('Part 1\nPart 2\n');
        });
    });
});
