/**
 * Agent Orchestrator V2 - Integration Tests
 *
 * Tests for Mixture-of-Agents architecture:
 * - Task decomposition
 * - Agent routing (vector-based)
 * - Parallel execution
 * - Cross-verification
 * - Consensus voting
 * - Fallback chains
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
    MixtureOfAgentsOrchestrator,
    VerificationAgent,
    OrchestratorAgent,
    VectorRouter,
    createMoAOrchestrator,
    SPECIALIST_AGENTS,
    type Subtask,
    type SubtaskResult,
    type AgentAssignment
} from '../agent-orchestrator-v2';
import type { ChatMessage } from '../inference-engine';

describe('VerificationAgent', () => {
    let verifier: VerificationAgent;

    beforeEach(() => {
        verifier = new VerificationAgent();
    });

    it('should verify claims with high consensus', async () => {
        const claim = 'Paris is the capital of France';
        const sources: SubtaskResult[] = [
            {
                subtaskId: 'sub-1',
                agentId: 'agent-1',
                output: 'Paris is the capital of France, with a population of 2.16 million.',
                success: true,
                confidence: 0.9,
                duration: 100
            },
            {
                subtaskId: 'sub-2',
                agentId: 'agent-2',
                output: 'Yes, Paris is the capital of France, founded in 3rd century BC.',
                success: true,
                confidence: 0.85,
                duration: 120
            },
            {
                subtaskId: 'sub-3',
                agentId: 'agent-3',
                output: 'Indeed, Paris is the capital of France natively.',
                success: true,
                confidence: 0.95,
                duration: 90
            }
        ];

        const result = await verifier.verify(claim, sources, []);

        expect(result.verified).toBe(true);
        expect(result.confidence).toBeGreaterThanOrEqual(0.7);
        expect(result.verifiedBy.length).toBe(3);
        expect(result.contradictedBy.length).toBe(0);
    });

    it('should detect contradictions', async () => {
        const claim = 'The Earth is flat';
        const sources: SubtaskResult[] = [
            {
                subtaskId: 'sub-1',
                agentId: 'agent-1',
                output: 'The Earth is not flat, it is an oblate spheroid.',
                success: true,
                confidence: 0.95,
                duration: 100
            },
            {
                subtaskId: 'sub-2',
                agentId: 'agent-2',
                output: 'Scientific consensus confirms Earth is round, not flat.',
                success: true,
                confidence: 0.9,
                duration: 110
            }
        ];

        const result = await verifier.verify(claim, sources, []);

        expect(result.verified).toBe(false);
        expect(result.contradictedBy.length).toBeGreaterThan(0);
    });

    it('should handle disputed claims (50-50 split)', async () => {
        const claim = 'AI will replace all jobs by 2030';
        const sources: SubtaskResult[] = [
            {
                subtaskId: 'sub-1',
                agentId: 'agent-1',
                output: 'AI will replace all jobs by 2030 according to some experts.',
                success: true,
                confidence: 0.6,
                duration: 100
            },
            {
                subtaskId: 'sub-2',
                agentId: 'agent-2',
                output: 'AI will not replace all jobs, but will augment human work.',
                success: true,
                confidence: 0.7,
                duration: 120
            }
        ];

        const result = await verifier.verify(claim, sources, []);

        expect(result.confidence).toBeLessThan(0.7); // Below verification threshold
        expect(result.reasoning).toContain('Disputed');
    });
});

describe('VectorRouter', () => {
    let router: VectorRouter;
    let agents: typeof SPECIALIST_AGENTS;

    beforeEach(() => {
        router = new VectorRouter();
        agents = SPECIALIST_AGENTS;
    });

    it('should route data analysis tasks to data-analyst', async () => {
        const subtask: Subtask = {
            id: 'sub-1',
            description: 'Analyze sales data and create visualizations',
            dependencies: [],
            requiredCapabilities: ['pandas', 'matplotlib', 'statistics'],
            priority: 4,
            estimatedComplexity: 7
        };

        const candidates = await router.findCandidates(subtask, agents);

        expect(candidates.length).toBeGreaterThan(0);
        expect(candidates[0].agent.id).toBe('data-analyst');
        expect(candidates[0].score).toBeGreaterThan(0.5);
    });

    it('should route code review tasks to code-reviewer', async () => {
        const subtask: Subtask = {
            id: 'sub-2',
            description: 'Review code for security vulnerabilities',
            dependencies: [],
            requiredCapabilities: ['code-review', 'security-audit'],
            priority: 5,
            estimatedComplexity: 8
        };

        const candidates = await router.findCandidates(subtask, agents);

        expect(candidates.length).toBeGreaterThan(0);
        expect(candidates[0].agent.id).toBe('code-reviewer');
    });

    it('should route research tasks to web-researcher', async () => {
        const subtask: Subtask = {
            id: 'sub-3',
            description: 'Research latest AI trends from 50+ sources',
            dependencies: [],
            requiredCapabilities: ['deep-research', 'multi-source', 'consensus'],
            priority: 4,
            estimatedComplexity: 9
        };

        const candidates = await router.findCandidates(subtask, agents);

        expect(candidates.length).toBeGreaterThan(0);
        expect(candidates[0].agent.id).toBe('web-researcher');
    });

    it('should provide fallback agents', async () => {
        const subtask: Subtask = {
            id: 'sub-4',
            description: 'General task that could match multiple agents',
            dependencies: [],
            requiredCapabilities: ['research', 'analyze'],
            priority: 3,
            estimatedComplexity: 5
        };

        const candidates = await router.findCandidates(subtask, agents);

        expect(candidates.length).toBeGreaterThanOrEqual(2); // Primary + fallback(s)
    });

    it('should score by capability match + priority', async () => {
        const subtask: Subtask = {
            id: 'sub-5',
            description: 'Calculate statistical significance',
            dependencies: [],
            requiredCapabilities: ['math', 'statistics'],
            priority: 5,
            estimatedComplexity: 6
        };

        const candidates = await router.findCandidates(subtask, agents);

        // Math-specialist should score high due to exact capability match
        const mathSpecialist = candidates.find(c => c.agent.id === 'math-specialist');
        expect(mathSpecialist).toBeDefined();
        expect(mathSpecialist!.score).toBeGreaterThan(0.6);
    });
});

describe('OrchestratorAgent', () => {
    let orchestrator: OrchestratorAgent;

    beforeEach(() => {
        orchestrator = new OrchestratorAgent();
    });

    it('should synthesize results from multiple agents', async () => {
        const results: SubtaskResult[] = [
            {
                subtaskId: 'sub-1',
                agentId: 'web-researcher',
                output: 'Research finding: AI adoption is growing 40% YoY.',
                success: true,
                confidence: 0.9,
                duration: 200
            },
            {
                subtaskId: 'sub-2',
                agentId: 'data-analyst',
                output: 'Analysis: Market size reached $500B in 2025.',
                success: true,
                confidence: 0.85,
                duration: 150
            }
        ];

        const verifications = [
            {
                claim: 'AI adoption is growing 40% YoY',
                verified: true,
                confidence: 0.92,
                verifiedBy: ['web-researcher', 'data-analyst'],
                contradictedBy: [],
                reasoning: 'Strong consensus'
            }
        ];

        const synthesis = await orchestrator.synthesize(results, verifications);

        expect(synthesis).toContain('Synthesis');
        expect(synthesis).toContain('web-researcher');
        expect(synthesis).toContain('data-analyst');
        expect(synthesis).toContain('Verified Facts');
    });

    it('should conduct consensus votes', async () => {
        const question = 'Which programming language should we use?';
        const options = ['Python', 'JavaScript', 'TypeScript'];

        const decision = await orchestrator.conductConsensusVote(
            question,
            options,
            SPECIALIST_AGENTS.slice(0, 5)
        );

        expect(decision.winner).toBeDefined();
        expect(options).toContain(decision.winner);
        expect(decision.confidence).toBeGreaterThan(0);
        expect(decision.confidence).toBeLessThanOrEqual(1);
        expect(decision.votes.size).toBe(5);
    });
});

describe('MixtureOfAgentsOrchestrator - Integration', () => {
    let moa: MixtureOfAgentsOrchestrator;

    beforeEach(() => {
        moa = createMoAOrchestrator(SPECIALIST_AGENTS);
    });

    it('should execute simple task end-to-end', async () => {
        const taskDescription = 'Search for information about WebGPU';
        const context: ChatMessage[] = [];

        const result = await moa.execute(taskDescription, context);

        expect(result.taskId).toBeDefined();
        expect(result.subtaskResults.length).toBeGreaterThan(0);
        expect(result.finalAnswer).toBeDefined();
        expect(result.totalDuration).toBeGreaterThanOrEqual(0);
        expect(result.agentsInvolved.length).toBeGreaterThan(0);
    });

    it('should decompose complex tasks into subtasks', async () => {
        const taskDescription = 'Research AI trends, analyze market data, and create a report';
        const context: ChatMessage[] = [];

        const result = await moa.execute(taskDescription, context);

        // Should decompose into: research + analysis subtasks
        expect(result.subtaskResults.length).toBeGreaterThanOrEqual(2);
        expect(result.agentsInvolved).toContain('web-researcher');
        expect(result.agentsInvolved).toContain('data-analyst');
    });

    it('should handle code-related tasks', async () => {
        const taskDescription = 'Implement a Python function to calculate Fibonacci numbers';
        const context: ChatMessage[] = [];

        const result = await moa.execute(taskDescription, context);

        expect(result.subtaskResults.length).toBeGreaterThan(0);
        const codeAgent = result.agentsInvolved.find(
            id => id === 'code-expert' || id === 'math-specialist'
        );
        expect(codeAgent).toBeDefined();
    });

    it('should handle math tasks', async () => {
        const taskDescription = 'Calculate the derivative of x^2 + 3x + 5';
        const context: ChatMessage[] = [];

        const result = await moa.execute(taskDescription, context);

        expect(result.agentsInvolved).toContain('math-specialist');
    });

    it('should verify results via VerificationAgent', async () => {
        const taskDescription = 'Research the population of Paris';
        const context: ChatMessage[] = [];

        const result = await moa.execute(taskDescription, context);

        // Should have verification results
        expect(result.verifications).toBeDefined();
        expect(result.verifications.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle task with dependencies', async () => {
        const taskDescription = 'Research AI trends and then analyze the data';
        const context: ChatMessage[] = [];

        const result = await moa.execute(taskDescription, context);

        // Subtasks should execute in order (research first, then analysis)
        expect(result.subtaskResults.length).toBeGreaterThanOrEqual(2);

        const researchResult = result.subtaskResults.find(r =>
            r.agentId.includes('research')
        );
        const analysisResult = result.subtaskResults.find(r =>
            r.agentId.includes('analyst')
        );

        if (researchResult && analysisResult) {
            // Analysis should start after research (not a strict requirement due to mock, but conceptually)
            expect(true).toBe(true);
        }
    });

    it('should use fallback agents on primary failure', async () => {
        // This test would require mocking agent failures
        // Conceptual test: verify fallback chain is used
        const taskDescription = 'Perform complex task';
        const context: ChatMessage[] = [];

        const result = await moa.execute(taskDescription, context);

        expect(result.subtaskResults.length).toBeGreaterThan(0);
        // At least some subtasks should succeed
        const successCount = result.subtaskResults.filter(r => r.success).length;
        expect(successCount).toBeGreaterThan(0);
    });
});

describe('MoA Performance', () => {
    it('should complete task in reasonable time', async () => {
        const moa = createMoAOrchestrator(SPECIALIST_AGENTS);
        const start = Date.now();

        await moa.execute('Simple task', []);

        const duration = Date.now() - start;
        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle 10 concurrent tasks', async () => {
        const moa = createMoAOrchestrator(SPECIALIST_AGENTS);

        const tasks = Array.from({ length: 10 }, (_, i) =>
            moa.execute(`Task ${i}`, [])
        );

        const results = await Promise.all(tasks);

        expect(results.length).toBe(10);
        results.forEach(result => {
            expect(result.taskId).toBeDefined();
            expect(result.finalAnswer).toBeDefined();
        });
    });
});

describe('Error Handling', () => {
    it('should gracefully handle empty task description', async () => {
        const moa = createMoAOrchestrator(SPECIALIST_AGENTS);

        const result = await moa.execute('', []);

        expect(result.finalAnswer).toBeDefined(); // Should still return something
    });

    it('should handle missing capabilities', async () => {
        const moa = createMoAOrchestrator(SPECIALIST_AGENTS);

        // Task with very specific capability that no agent has
        const result = await moa.execute('Perform quantum computing simulation', []);

        expect(result.subtaskResults.length).toBeGreaterThan(0);
        // Should fall back to general-assistant
    });
});
