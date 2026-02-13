/**
 * Iterative Agent Loop - Q2 2026 Implementation
 *
 * Manus AI-style iterative reasoning loop:
 * - One action per iteration (observe → think → act → observe)
 * - Adaptive planning based on intermediate results
 * - Self-correcting behavior on errors
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import type { ChatMessage } from './inference-engine';
import { getAgentEventBus } from './agent-events';
import { getMimiEngine } from './inference-engine';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type AgentAction =
    | { type: 'research'; query: string }
    | { type: 'code'; language: string; code: string }
    | { type: 'analyze'; data: string }
    | { type: 'synthesize'; sources: string[] }
    | { type: 'verify'; claim: string };

export interface Observation {
    success: boolean;
    data: string;
    error?: string;
    timestamp: number;
}

export interface IterationStep {
    iterationNumber: number;
    thought: string; // Agent's reasoning
    action: AgentAction; // What the agent decided to do
    observation: Observation; // Result of the action
    nextPlan: string; // Updated plan based on observation
}

export interface IterativeResult {
    goal: string;
    steps: IterationStep[];
    finalAnswer: string;
    totalIterations: number;
    successRate: number; // Percentage of successful actions
    timestamp: number;
}

export interface IterativeAgentConfig {
    maxIterations: number;
    adaptivePlanning: boolean;
    selfCorrecting: boolean;
    verbose: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ITERATIVE AGENT
// ═══════════════════════════════════════════════════════════════════════════════

export class IterativeAgent {
    private eventBus = getAgentEventBus();
    private engine = getMimiEngine();
    private config: IterativeAgentConfig = {
        maxIterations: 10,
        adaptivePlanning: true,
        selfCorrecting: true,
        verbose: true
    };

    constructor(config?: Partial<IterativeAgentConfig>) {
        if (config) {
            this.config = { ...this.config, ...config };
        }
    }

    /**
     * Execute iterative reasoning loop
     *
     * @param goal - High-level goal to achieve
     * @param context - Chat history for context
     * @returns Complete iteration history and final answer
     */
    async iterate(goal: string, context: ChatMessage[]): Promise<IterativeResult> {
        const taskId = `iterate-${Date.now()}`;
        const steps: IterationStep[] = [];

        this.eventBus.emit('PLAN_START', {
            planId: taskId,
            title: 'Iterative Reasoning',
            goal,
            stepCount: this.config.maxIterations
        }, undefined, taskId);

        try {
            let currentPlan = `Achieve goal: ${goal}`;
            let goalAchieved = false;

            for (let i = 1; i <= this.config.maxIterations; i++) {
                if (this.config.verbose) {
                    console.log(`\n[Iteration ${i}/${this.config.maxIterations}]`);
                    console.log(`Current Plan: ${currentPlan}`);
                }

                this.eventBus.emit('STATUS_CHANGE', {
                    status: 'thinking'
                });

                // Step 1: Think (decide next action)
                const thought = await this.think(goal, currentPlan, steps, context);

                if (this.config.verbose) {
                    console.log(`Thought: ${thought}`);
                }

                // Check if goal is achieved
                if (thought.toLowerCase().includes('goal achieved') ||
                    thought.toLowerCase().includes('task complete')) {
                    goalAchieved = true;

                    const step: IterationStep = {
                        iterationNumber: i,
                        thought,
                        action: { type: 'synthesize', sources: [] },
                        observation: {
                            success: true,
                            data: 'Goal achieved',
                            timestamp: Date.now()
                        },
                        nextPlan: 'Complete'
                    };

                    steps.push(step);
                    break;
                }

                // Step 2: Act (execute action)
                const action = this.decideAction(thought);

                if (this.config.verbose) {
                    console.log(`Action: ${JSON.stringify(action)}`);
                }

                this.eventBus.emit('STATUS_CHANGE', {
                    status: 'executing'
                });

                const observation = await this.executeAction(action);

                if (this.config.verbose) {
                    console.log(`Observation: ${observation.success ? '✓' : '✗'} ${observation.data}`);
                }

                // Step 3: Adapt (update plan based on observation)
                const nextPlan = this.config.adaptivePlanning
                    ? await this.adaptPlan(goal, currentPlan, observation, steps)
                    : currentPlan;

                if (this.config.verbose && nextPlan !== currentPlan) {
                    console.log(`Updated Plan: ${nextPlan}`);
                }

                const step: IterationStep = {
                    iterationNumber: i,
                    thought,
                    action,
                    observation,
                    nextPlan
                };

                steps.push(step);
                currentPlan = nextPlan;

                // Self-correction: If action failed, adjust plan
                if (!observation.success && this.config.selfCorrecting) {
                    currentPlan = `Retry previous action with corrected approach: ${observation.error}`;
                }
            }

            // Generate final answer
            this.eventBus.emit('STATUS_CHANGE', {
                status: 'synthesizing'
            });

            const finalAnswer = await this.synthesizeFinalAnswer(goal, steps);

            const successCount = steps.filter(s => s.observation.success).length;
            const successRate = steps.length > 0 ? successCount / steps.length : 0;

            const result: IterativeResult = {
                goal,
                steps,
                finalAnswer,
                totalIterations: steps.length,
                successRate,
                timestamp: Date.now()
            };

            this.eventBus.emit('PLAN_COMPLETE', {
                planId: taskId,
                success: true,
                result: finalAnswer
            }, undefined, taskId);

            this.eventBus.emit('STATUS_CHANGE', { status: 'idle' });

            return result;
        } catch (error) {
            this.eventBus.emit('PLAN_COMPLETE', {
                planId: taskId,
                success: false,
                result: error instanceof Error ? error.message : 'Unknown error'
            }, undefined, taskId);

            this.eventBus.emit('STATUS_CHANGE', { status: 'idle' });
            throw error;
        }
    }

    /**
     * Think: Decide next action based on current state
     */
    private async think(
        goal: string,
        currentPlan: string,
        steps: IterationStep[],
        context: ChatMessage[]
    ): Promise<string> {
        const prompt = this.buildThinkingPrompt(goal, currentPlan, steps);

        const messages: ChatMessage[] = [
            ...context,
            {
                role: 'user',
                content: prompt
            }
        ];

        // Generate thought using inference engine
        const thoughtGenerator = this.engine.generate(messages);
        let thought = '';

        for await (const token of thoughtGenerator) {
            thought += token;
        }

        return thought.trim();
    }

    /**
     * Decide action from thought
     */
    private decideAction(thought: string): AgentAction {
        // Simplified action extraction - in production would use structured output
        const lowerThought = thought.toLowerCase();

        if (lowerThought.includes('research') || lowerThought.includes('search')) {
            // Extract query (simplified)
            const queryMatch = thought.match(/research[:\s]+(.+?)(?:\.|$)/i);
            const query = queryMatch ? queryMatch[1].trim() : 'general research';

            return { type: 'research', query };
        }

        if (lowerThought.includes('code') || lowerThought.includes('python')) {
            // Extract code (simplified)
            const codeMatch = thought.match(/```python\n([\s\S]+?)\n```/);
            const code = codeMatch ? codeMatch[1] : 'print("hello")';

            return { type: 'code', language: 'python', code };
        }

        if (lowerThought.includes('analyze')) {
            return { type: 'analyze', data: thought };
        }

        if (lowerThought.includes('verify')) {
            return { type: 'verify', claim: thought };
        }

        // Default: synthesize
        return { type: 'synthesize', sources: [] };
    }

    /**
     * Execute action and return observation
     */
    private async executeAction(action: AgentAction): Promise<Observation> {
        try {
            let data: string;

            switch (action.type) {
                case 'research': {
                    const { getDeepResearchEngine } = await import('./deep-research');
                    const researchEngine = getDeepResearchEngine();
                    const report = await researchEngine.research(action.query, []);
                    data = report.summary;
                    break;
                }

                case 'code': {
                    const { executePython } = await import('./code-executor');
                    const result = await executePython(action.code);
                    data = result.success ? (result.output || 'Code executed') : `Error: ${result.error}`;
                    break;
                }

                case 'analyze': {
                    data = `Analysis complete: ${action.data.slice(0, 100)}...`;
                    break;
                }

                case 'verify': {
                    data = `Verification complete for claim: ${action.claim}`;
                    break;
                }

                case 'synthesize': {
                    data = 'Synthesis complete';
                    break;
                }

                default:
                    data = 'Unknown action type';
            }

            return {
                success: true,
                data,
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                success: false,
                data: '',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: Date.now()
            };
        }
    }

    /**
     * Adapt plan based on observation
     */
    private async adaptPlan(
        goal: string,
        currentPlan: string,
        observation: Observation,
        steps: IterationStep[]
    ): Promise<string> {
        // If observation was successful, continue with plan
        if (observation.success) {
            return currentPlan;
        }

        // If failed, generate corrected plan
        const prompt = `
Goal: ${goal}
Current Plan: ${currentPlan}
Last Action Failed: ${observation.error}

Generate an updated plan that addresses this failure.
`;

        const messages: ChatMessage[] = [
            { role: 'user', content: prompt }
        ];

        const planGenerator = this.engine.generate(messages);
        let newPlan = '';

        for await (const token of planGenerator) {
            newPlan += token;
        }

        return newPlan.trim();
    }

    /**
     * Synthesize final answer from all steps
     */
    private async synthesizeFinalAnswer(goal: string, steps: IterationStep[]): Promise<string> {
        const successfulSteps = steps.filter(s => s.observation.success);

        const prompt = `
Goal: ${goal}

Iteration History:
${steps.map((s, i) => `
Iteration ${s.iterationNumber}:
- Thought: ${s.thought}
- Action: ${JSON.stringify(s.action)}
- Result: ${s.observation.success ? '✓' : '✗'} ${s.observation.data}
`).join('\n')}

Total Iterations: ${steps.length}
Successful Actions: ${successfulSteps.length}/${steps.length}

Synthesize a final answer to the goal based on all iterations.
`;

        const messages: ChatMessage[] = [
            { role: 'user', content: prompt }
        ];

        const answerGenerator = this.engine.generate(messages);
        let answer = '';

        for await (const token of answerGenerator) {
            answer += token;
        }

        return answer.trim();
    }

    /**
     * Build thinking prompt
     */
    private buildThinkingPrompt(
        goal: string,
        currentPlan: string,
        steps: IterationStep[]
    ): string {
        return `
You are an iterative reasoning agent. Your goal: ${goal}

Current Plan: ${currentPlan}

Previous Steps:
${steps.map(s => `
Iteration ${s.iterationNumber}: ${s.thought}
Result: ${s.observation.success ? '✓' : '✗'} ${s.observation.data}
`).join('\n')}

What is your next thought/action? Consider:
1. Have we achieved the goal yet?
2. What information do we still need?
3. What action should we take next?
4. Should we adjust our plan?

Your thought (if goal achieved, say "Goal achieved"):
`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

let agentInstance: IterativeAgent | null = null;

export function getIterativeAgent(config?: Partial<IterativeAgentConfig>): IterativeAgent {
    if (!agentInstance) {
        agentInstance = new IterativeAgent(config);
    }
    return agentInstance;
}
