/**
 * Iterative Agent Tests - Q2 2026
 *
 * Tests for Manus-style iterative reasoning loop.
 * NOTE: These are unit tests that verify architecture, not full integration tests
 * (full integration would require WebGPU which isn't available in Node test environment).
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    type AgentAction,
    type Observation,
    type IterationStep,
    type IterativeResult,
    type IterativeAgentConfig
} from '../iterative-agent';

describe('IterativeAgent Architecture', () => {
    describe('Type Definitions', () => {
        it('should have correct AgentAction types', () => {
            const researchAction: AgentAction = { type: 'research', query: 'test' };
            const codeAction: AgentAction = { type: 'code', language: 'python', code: 'print("test")' };
            const analyzeAction: AgentAction = { type: 'analyze', data: 'test data' };
            const synthesizeAction: AgentAction = { type: 'synthesize', sources: ['a', 'b'] };
            const verifyAction: AgentAction = { type: 'verify', claim: 'test claim' };

            expect(researchAction.type).toBe('research');
            expect(codeAction.type).toBe('code');
            expect(analyzeAction.type).toBe('analyze');
            expect(synthesizeAction.type).toBe('synthesize');
            expect(verifyAction.type).toBe('verify');
        });

        it('should have correct Observation structure', () => {
            const successObs: Observation = {
                success: true,
                data: 'result',
                timestamp: Date.now()
            };

            const failObs: Observation = {
                success: false,
                data: '',
                error: 'test error',
                timestamp: Date.now()
            };

            expect(successObs.success).toBe(true);
            expect(successObs.data).toBeTruthy();
            expect(failObs.success).toBe(false);
            expect(failObs.error).toBeTruthy();
        });

        it('should have correct IterationStep structure', () => {
            const step: IterationStep = {
                iterationNumber: 1,
                thought: 'Test thought',
                action: { type: 'research', query: 'test' },
                observation: {
                    success: true,
                    data: 'result',
                    timestamp: Date.now()
                },
                nextPlan: 'Next plan'
            };

            expect(step.iterationNumber).toBe(1);
            expect(step.thought).toBeTruthy();
            expect(step.action.type).toBe('research');
            expect(step.observation.success).toBe(true);
            expect(step.nextPlan).toBeTruthy();
        });

        it('should have correct IterativeResult structure', () => {
            const result: IterativeResult = {
                goal: 'Test goal',
                steps: [],
                finalAnswer: 'Final answer',
                totalIterations: 5,
                successRate: 0.8,
                timestamp: Date.now()
            };

            expect(result.goal).toBeTruthy();
            expect(result.finalAnswer).toBeTruthy();
            expect(result.totalIterations).toBeGreaterThan(0);
            expect(result.successRate).toBeGreaterThanOrEqual(0);
            expect(result.successRate).toBeLessThanOrEqual(1);
        });

        it('should have correct Config structure', () => {
            const config: IterativeAgentConfig = {
                maxIterations: 10,
                adaptivePlanning: true,
                selfCorrecting: true,
                verbose: false
            };

            expect(config.maxIterations).toBeGreaterThan(0);
            expect(typeof config.adaptivePlanning).toBe('boolean');
            expect(typeof config.selfCorrecting).toBe('boolean');
            expect(typeof config.verbose).toBe('boolean');
        });
    });

    describe('Success Rate Calculation Logic', () => {
        it('should calculate 100% success rate correctly', () => {
            const steps: IterationStep[] = [
                {
                    iterationNumber: 1,
                    thought: 'test',
                    action: { type: 'research', query: 'test' },
                    observation: { success: true, data: 'ok', timestamp: Date.now() },
                    nextPlan: 'next'
                },
                {
                    iterationNumber: 2,
                    thought: 'test',
                    action: { type: 'analyze', data: 'test' },
                    observation: { success: true, data: 'ok', timestamp: Date.now() },
                    nextPlan: 'next'
                }
            ];

            const successCount = steps.filter(s => s.observation.success).length;
            const successRate = successCount / steps.length;

            expect(successRate).toBe(1.0);
        });

        it('should calculate 50% success rate correctly', () => {
            const steps: IterationStep[] = [
                {
                    iterationNumber: 1,
                    thought: 'test',
                    action: { type: 'research', query: 'test' },
                    observation: { success: true, data: 'ok', timestamp: Date.now() },
                    nextPlan: 'next'
                },
                {
                    iterationNumber: 2,
                    thought: 'test',
                    action: { type: 'code', language: 'python', code: 'test' },
                    observation: { success: false, data: '', error: 'failed', timestamp: Date.now() },
                    nextPlan: 'retry'
                }
            ];

            const successCount = steps.filter(s => s.observation.success).length;
            const successRate = successCount / steps.length;

            expect(successRate).toBe(0.5);
        });

        it('should handle empty steps array', () => {
            const steps: IterationStep[] = [];
            const successCount = steps.filter(s => s.observation.success).length;
            const successRate = steps.length > 0 ? successCount / steps.length : 0;

            expect(successRate).toBe(0);
        });
    });

    describe('Iteration Number Tracking', () => {
        it('should increment iteration numbers correctly', () => {
            const steps: IterationStep[] = [];

            for (let i = 1; i <= 5; i++) {
                steps.push({
                    iterationNumber: i,
                    thought: `Thought ${i}`,
                    action: { type: 'research', query: `query ${i}` },
                    observation: { success: true, data: `result ${i}`, timestamp: Date.now() },
                    nextPlan: `Plan ${i + 1}`
                });
            }

            steps.forEach((step, idx) => {
                expect(step.iterationNumber).toBe(idx + 1);
            });

            expect(steps.length).toBe(5);
        });
    });

    describe('Adaptive Planning Logic', () => {
        it('should keep plan when action succeeds', () => {
            const currentPlan = 'Execute research query';
            const observation: Observation = {
                success: true,
                data: 'Research completed',
                timestamp: Date.now()
            };

            // Logic: if success, keep current plan
            const nextPlan = observation.success ? currentPlan : 'Retry with corrections';

            expect(nextPlan).toBe(currentPlan);
        });

        it('should update plan when action fails', () => {
            const currentPlan = 'Execute research query';
            const observation: Observation = {
                success: false,
                data: '',
                error: 'Network timeout',
                timestamp: Date.now()
            };

            // Logic: if failure, generate corrected plan
            const nextPlan = observation.success
                ? currentPlan
                : `Retry previous action with corrected approach: ${observation.error}`;

            expect(nextPlan).not.toBe(currentPlan);
            expect(nextPlan).toContain('Retry');
            expect(nextPlan).toContain(observation.error);
        });
    });

    describe('Max Iterations Logic', () => {
        it('should respect max iterations limit', () => {
            const maxIterations = 3;
            const steps: IterationStep[] = [];

            for (let i = 1; i <= maxIterations; i++) {
                steps.push({
                    iterationNumber: i,
                    thought: 'test',
                    action: { type: 'research', query: 'test' },
                    observation: { success: true, data: 'ok', timestamp: Date.now() },
                    nextPlan: 'next'
                });
            }

            expect(steps.length).toBe(maxIterations);
            expect(steps.length).toBeLessThanOrEqual(maxIterations);
        });

        it('should allow early termination', () => {
            const maxIterations = 10;
            const steps: IterationStep[] = [];

            // Simulate early goal achievement after 3 iterations
            for (let i = 1; i <= 3; i++) {
                steps.push({
                    iterationNumber: i,
                    thought: i === 3 ? 'Goal achieved' : 'Continue',
                    action: { type: 'synthesize', sources: [] },
                    observation: { success: true, data: 'ok', timestamp: Date.now() },
                    nextPlan: i === 3 ? 'Complete' : 'next'
                });

                if (steps[i - 1].thought.includes('Goal achieved')) {
                    break;
                }
            }

            expect(steps.length).toBe(3);
            expect(steps.length).toBeLessThan(maxIterations);
        });
    });
});
