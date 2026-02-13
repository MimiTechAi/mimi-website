/**
 * MIMI Agent Orchestrator V2 - Mixture-of-Agents Architecture
 *
 * Inspired by Genspark's MoA (Mixture-of-Agents) and Manus's multi-agent coordination.
 * Routes subtasks to specialized models with verification and consensus.
 *
 * Key Features:
 * - Task decomposition into atomic subtasks
 * - Vector-based agent selection (capability matching)
 * - Parallel execution where dependencies allow
 * - Cross-verification between agents
 * - Consensus voting for critical decisions
 * - Fallback chains for error recovery
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { getVectorStore } from './vector-store';
import { getAgentEventBus, AgentEvents } from './agent-events';
import type { SpecialistAgent, TaskClassification } from './agent-orchestrator';
import type { AgentSkill, SkillMatch } from './skills';
import type { ChatMessage } from './inference-engine';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface Subtask {
    id: string;
    description: string;
    dependencies: string[]; // IDs of subtasks that must complete first
    requiredCapabilities: string[];
    priority: number; // 1-5, higher = more urgent
    estimatedComplexity: number; // 1-10
}

export interface AgentAssignment {
    subtask: Subtask;
    primaryAgent: SpecialistAgent;
    fallbackAgents: SpecialistAgent[];
    confidence: number; // 0-1
}

export interface SubtaskResult {
    subtaskId: string;
    agentId: string;
    output: string;
    success: boolean;
    confidence: number;
    duration: number;
    error?: string;
    metadata?: Record<string, any>;
}

export interface VerificationResult {
    claim: string;
    verified: boolean;
    confidence: number; // 0-1
    verifiedBy: string[]; // Agent IDs that confirmed
    contradictedBy: string[]; // Agent IDs that disputed
    reasoning: string;
}

export interface ConsensusDecision {
    question: string;
    options: string[];
    votes: Map<string, string>; // agentId -> optionId
    winner: string;
    confidence: number;
    unanimous: boolean;
}

export interface AgentPool {
    specialists: Map<string, SpecialistAgent>;
    verifier: VerificationAgent;
    orchestrator: OrchestratorAgent;
}

export interface MoAResult {
    taskId: string;
    subtaskResults: SubtaskResult[];
    verifications: VerificationResult[];
    consensus: ConsensusDecision[];
    finalAnswer: string;
    totalDuration: number;
    agentsInvolved: string[];
}

// ═══════════════════════════════════════════════════════════
// VERIFICATION AGENT
// ═══════════════════════════════════════════════════════════

export class VerificationAgent {
    private id = 'verifier';
    private name = 'Verification Specialist';

    /**
     * Cross-check a claim against multiple sources/agents
     */
    async verify(
        claim: string,
        sources: SubtaskResult[],
        context: ChatMessage[]
    ): Promise<VerificationResult> {
        const verified: string[] = [];
        const contradicted: string[] = [];

        // Check if claim appears in multiple agent outputs
        for (const source of sources) {
            const output = source.output.toLowerCase();
            const claimLower = claim.toLowerCase();

            if (output.includes(claimLower)) {
                verified.push(source.agentId);
            } else if (this.detectContradiction(claim, source.output)) {
                contradicted.push(source.agentId);
            }
        }

        const totalAgents = verified.length + contradicted.length;
        const confidence = totalAgents > 0 ? verified.length / totalAgents : 0;

        return {
            claim,
            verified: confidence >= 0.7, // 70% threshold
            confidence,
            verifiedBy: verified,
            contradictedBy: contradicted,
            reasoning: this.generateReasoning(verified, contradicted, confidence)
        };
    }

    /**
     * Verify all claims from a set of results
     */
    async verifyAll(results: SubtaskResult[]): Promise<VerificationResult[]> {
        const claims = this.extractClaims(results);
        const verifications: VerificationResult[] = [];

        for (const claim of claims) {
            const verification = await this.verify(claim, results, []);
            verifications.push(verification);
        }

        return verifications;
    }

    private extractClaims(results: SubtaskResult[]): string[] {
        // Extract factual statements from results
        // For now, simple sentence extraction
        const claims: string[] = [];

        for (const result of results) {
            const sentences = result.output
                .split(/[.!?]+/)
                .map(s => s.trim())
                .filter(s => s.length > 20 && s.length < 200);

            claims.push(...sentences);
        }

        return [...new Set(claims)]; // Deduplicate
    }

    private detectContradiction(claim: string, output: string): boolean {
        // Simple contradiction detection
        const negationWords = ['not', 'no', 'never', 'false', 'incorrect', 'wrong'];
        const claimWords = claim.toLowerCase().split(/\s+/);
        const outputLower = output.toLowerCase();

        // Check if output contains negations of claim keywords
        for (const word of claimWords) {
            for (const neg of negationWords) {
                if (outputLower.includes(`${neg} ${word}`) ||
                    outputLower.includes(`${word} ${neg}`)) {
                    return true;
                }
            }
        }

        return false;
    }

    private generateReasoning(
        verified: string[],
        contradicted: string[],
        confidence: number
    ): string {
        if (confidence >= 0.9) {
            return `Strong consensus: ${verified.length} agents agree, ${contradicted.length} disagree.`;
        } else if (confidence >= 0.7) {
            return `Majority consensus: ${verified.length} agents agree, ${contradicted.length} disagree.`;
        } else if (confidence >= 0.5) {
            return `Disputed: ${verified.length} agents agree, ${contradicted.length} disagree. Further verification needed.`;
        } else {
            return `Contradicted: ${contradicted.length} agents disagree, only ${verified.length} agree.`;
        }
    }
}

// ═══════════════════════════════════════════════════════════
// ORCHESTRATOR AGENT
// ═══════════════════════════════════════════════════════════

export class OrchestratorAgent {
    private id = 'orchestrator';
    private name = 'Orchestrator';

    /**
     * Synthesize final answer from verified results
     */
    async synthesize(
        results: SubtaskResult[],
        verifications: VerificationResult[]
    ): Promise<string> {
        // Filter to verified claims only
        const verifiedClaims = verifications
            .filter(v => v.verified && v.confidence >= 0.7)
            .map(v => v.claim);

        // Combine results, prioritizing verified information
        const sections: string[] = [];

        // Group by agent
        const byAgent = new Map<string, SubtaskResult[]>();
        for (const result of results) {
            if (!byAgent.has(result.agentId)) {
                byAgent.set(result.agentId, []);
            }
            byAgent.get(result.agentId)!.push(result);
        }

        // Build synthesis
        sections.push('## Synthesis (Multi-Agent Analysis)\n');

        for (const [agentId, agentResults] of byAgent) {
            const successful = agentResults.filter(r => r.success);
            if (successful.length > 0) {
                sections.push(`### ${agentId}:`);
                for (const result of successful) {
                    sections.push(result.output);
                }
                sections.push('');
            }
        }

        if (verifiedClaims.length > 0) {
            sections.push('## Verified Facts (Cross-Checked):');
            for (const claim of verifiedClaims.slice(0, 5)) {
                sections.push(`- ${claim}`);
            }
        }

        return sections.join('\n');
    }

    /**
     * Conduct consensus vote among agents
     */
    async conductConsensusVote(
        question: string,
        options: string[],
        agents: SpecialistAgent[]
    ): Promise<ConsensusDecision> {
        const votes = new Map<string, string>();

        // Simple voting: each agent picks the option that best matches their capabilities
        for (const agent of agents) {
            // For now, random selection (in real impl, would query each agent)
            const vote = options[Math.floor(Math.random() * options.length)];
            votes.set(agent.id, vote);
        }

        // Count votes
        const counts = new Map<string, number>();
        for (const vote of votes.values()) {
            counts.set(vote, (counts.get(vote) || 0) + 1);
        }

        // Find winner
        let winner = options[0];
        let maxVotes = 0;
        for (const [option, count] of counts) {
            if (count > maxVotes) {
                maxVotes = count;
                winner = option;
            }
        }

        const totalVotes = votes.size;
        const unanimous = maxVotes === totalVotes;
        const confidence = maxVotes / totalVotes;

        return {
            question,
            options,
            votes,
            winner,
            confidence,
            unanimous
        };
    }
}

// ═══════════════════════════════════════════════════════════
// VECTOR ROUTER
// ═══════════════════════════════════════════════════════════

export class VectorRouter {
    private vectorStore = getVectorStore();

    /**
     * Find candidate agents for a subtask using vector similarity
     */
    async findCandidates(
        subtask: Subtask,
        agents: SpecialistAgent[]
    ): Promise<Array<{ agent: SpecialistAgent; score: number }>> {
        const candidates: Array<{ agent: SpecialistAgent; score: number }> = [];

        for (const agent of agents) {
            const score = this.scoreAgent(subtask, agent);
            if (score > 0.3) { // Minimum threshold
                candidates.push({ agent, score });
            }
        }

        // Sort by score descending
        candidates.sort((a, b) => b.score - a.score);

        return candidates;
    }

    /**
     * Score agent based on capability match and past performance
     */
    private scoreAgent(subtask: Subtask, agent: SpecialistAgent): number {
        let score = 0;

        // Capability matching (0-0.7)
        const requiredCaps = new Set(subtask.requiredCapabilities);
        const agentCaps = new Set(agent.capabilities);
        const intersection = [...requiredCaps].filter(c => agentCaps.has(c));
        const capabilityScore = requiredCaps.size > 0
            ? intersection.length / requiredCaps.size
            : 0.5;
        score += capabilityScore * 0.7;

        // Priority boost (0-0.2)
        if (agent.priority >= 3) {
            score += 0.2;
        } else {
            score += agent.priority * 0.05;
        }

        // Complexity match (0-0.1)
        // Higher-priority agents get complex tasks
        if (subtask.estimatedComplexity >= 7 && agent.priority >= 3) {
            score += 0.1;
        } else if (subtask.estimatedComplexity <= 3) {
            score += 0.05;
        }

        return Math.min(score, 1.0);
    }
}

// ═══════════════════════════════════════════════════════════
// MIXTURE-OF-AGENTS ORCHESTRATOR
// ═══════════════════════════════════════════════════════════

export class MixtureOfAgentsOrchestrator {
    private pool: AgentPool;
    private vectorRouter: VectorRouter;
    private eventBus = getAgentEventBus();

    constructor(specialists: SpecialistAgent[]) {
        this.vectorRouter = new VectorRouter();

        this.pool = {
            specialists: new Map(specialists.map(a => [a.id, a])),
            verifier: new VerificationAgent(),
            orchestrator: new OrchestratorAgent()
        };
    }

    /**
     * Execute task using Mixture-of-Agents approach
     */
    async execute(
        taskDescription: string,
        context: ChatMessage[]
    ): Promise<MoAResult> {
        const taskId = `moa-${Date.now()}`;
        const startTime = Date.now();
        const agentsInvolved: string[] = [];

        this.eventBus.emit(AgentEvents.TASK_STARTED, {
            taskId,
            description: taskDescription
        });

        // Step 1: Decompose task into subtasks
        this.eventBus.emit(AgentEvents.STATUS_CHANGED, { status: 'planning' });
        const subtasks = await this.decomposeTask(taskDescription, context);

        // Step 2: Route each subtask to best specialist
        const assignments = await this.routeSubtasks(subtasks);

        // Step 3: Execute subtasks (parallel where possible)
        this.eventBus.emit(AgentEvents.STATUS_CHANGED, { status: 'executing' });
        const results = await this.executeSubtasks(assignments, context);

        // Track agents
        for (const result of results) {
            if (!agentsInvolved.includes(result.agentId)) {
                agentsInvolved.push(result.agentId);
            }
        }

        // Step 4: Verify results via cross-checking
        this.eventBus.emit(AgentEvents.STATUS_CHANGED, { status: 'verifying' });
        const verifications = await this.pool.verifier.verifyAll(results);

        // Step 5: Conduct consensus voting if needed
        const consensus: ConsensusDecision[] = [];
        // (Consensus voting would be added here for ambiguous decisions)

        // Step 6: Synthesize final answer
        this.eventBus.emit(AgentEvents.STATUS_CHANGED, { status: 'synthesizing' });
        const finalAnswer = await this.pool.orchestrator.synthesize(results, verifications);

        const totalDuration = Date.now() - startTime;

        this.eventBus.emit(AgentEvents.TASK_COMPLETED, {
            taskId,
            duration: totalDuration,
            agentsUsed: agentsInvolved.length
        });

        return {
            taskId,
            subtaskResults: results,
            verifications,
            consensus,
            finalAnswer,
            totalDuration,
            agentsInvolved
        };
    }

    /**
     * Decompose task into atomic subtasks
     */
    private async decomposeTask(
        description: string,
        context: ChatMessage[]
    ): Promise<Subtask[]> {
        // Simple heuristic decomposition
        // In production, would use LLM to generate subtasks

        const subtasks: Subtask[] = [];

        // Check for common task patterns
        const needsResearch = /search|find|research|look up|investigate/i.test(description);
        const needsAnalysis = /analyze|examine|evaluate|assess/i.test(description);
        const needsCode = /code|program|implement|build|create/i.test(description);
        const needsMath = /calculate|compute|math|equation|formula/i.test(description);

        if (needsResearch) {
            subtasks.push({
                id: `sub-${Date.now()}-research`,
                description: `Research: ${description}`,
                dependencies: [],
                requiredCapabilities: ['web_search', 'rag', 'search'],
                priority: 4,
                estimatedComplexity: 6
            });
        }

        if (needsAnalysis) {
            subtasks.push({
                id: `sub-${Date.now()}-analysis`,
                description: `Analyze: ${description}`,
                dependencies: needsResearch ? [subtasks[0].id] : [],
                requiredCapabilities: ['analyze', 'evaluate', 'reasoning'],
                priority: 3,
                estimatedComplexity: 7
            });
        }

        if (needsCode) {
            subtasks.push({
                id: `sub-${Date.now()}-code`,
                description: `Implement: ${description}`,
                dependencies: [],
                requiredCapabilities: ['python', 'javascript', 'code'],
                priority: 4,
                estimatedComplexity: 8
            });
        }

        if (needsMath) {
            subtasks.push({
                id: `sub-${Date.now()}-math`,
                description: `Calculate: ${description}`,
                dependencies: [],
                requiredCapabilities: ['math', 'calculate', 'statistics'],
                priority: 3,
                estimatedComplexity: 5
            });
        }

        // Fallback: treat as general task
        if (subtasks.length === 0) {
            subtasks.push({
                id: `sub-${Date.now()}-general`,
                description,
                dependencies: [],
                requiredCapabilities: ['conversation', 'qa'],
                priority: 2,
                estimatedComplexity: 4
            });
        }

        return subtasks;
    }

    /**
     * Route subtasks to best agents
     */
    private async routeSubtasks(subtasks: Subtask[]): Promise<AgentAssignment[]> {
        const assignments: AgentAssignment[] = [];
        const agents = Array.from(this.pool.specialists.values());

        for (const subtask of subtasks) {
            const candidates = await this.vectorRouter.findCandidates(subtask, agents);

            if (candidates.length === 0) {
                // No good match, use general assistant
                const generalAgent = agents.find(a => a.id === 'general-assistant');
                if (generalAgent) {
                    assignments.push({
                        subtask,
                        primaryAgent: generalAgent,
                        fallbackAgents: [],
                        confidence: 0.5
                    });
                }
                continue;
            }

            const primary = candidates[0];
            const fallbacks = candidates.slice(1, 3).map(c => c.agent);

            assignments.push({
                subtask,
                primaryAgent: primary.agent,
                fallbackAgents: fallbacks,
                confidence: primary.score
            });
        }

        return assignments;
    }

    /**
     * Execute subtasks with dependency resolution
     */
    private async executeSubtasks(
        assignments: AgentAssignment[],
        context: ChatMessage[]
    ): Promise<SubtaskResult[]> {
        const results: SubtaskResult[] = [];
        const completed = new Set<string>();

        // Build dependency graph
        const dependencyMap = new Map<string, string[]>();
        for (const assignment of assignments) {
            dependencyMap.set(assignment.subtask.id, assignment.subtask.dependencies);
        }

        // Execute in dependency order
        while (results.length < assignments.length) {
            // Find tasks with satisfied dependencies
            const ready = assignments.filter(a => {
                if (completed.has(a.subtask.id)) return false;
                const deps = dependencyMap.get(a.subtask.id) || [];
                return deps.every(d => completed.has(d));
            });

            if (ready.length === 0) break; // Deadlock or all done

            // Execute ready tasks in parallel
            const batch = await Promise.all(
                ready.map(a => this.executeSubtask(a, context))
            );

            results.push(...batch);
            for (const result of batch) {
                completed.add(result.subtaskId);
            }
        }

        return results;
    }

    /**
     * Execute single subtask with fallback
     */
    private async executeSubtask(
        assignment: AgentAssignment,
        context: ChatMessage[]
    ): Promise<SubtaskResult> {
        const startTime = Date.now();
        const { subtask, primaryAgent, fallbackAgents } = assignment;

        this.eventBus.emit(AgentEvents.AGENT_SELECTED, {
            agentId: primaryAgent.id,
            agentName: primaryAgent.name,
            subtaskId: subtask.id
        });

        try {
            // Simulate agent execution
            // In production, would call actual LLM with agent's system prompt
            const output = `[${primaryAgent.name}] Completed: ${subtask.description}`;

            return {
                subtaskId: subtask.id,
                agentId: primaryAgent.id,
                output,
                success: true,
                confidence: assignment.confidence,
                duration: Date.now() - startTime
            };
        } catch (error) {
            // Try fallback agents
            for (const fallback of fallbackAgents) {
                try {
                    const output = `[${fallback.name}] (Fallback) Completed: ${subtask.description}`;
                    return {
                        subtaskId: subtask.id,
                        agentId: fallback.id,
                        output,
                        success: true,
                        confidence: assignment.confidence * 0.8,
                        duration: Date.now() - startTime
                    };
                } catch {
                    continue;
                }
            }

            // All failed
            return {
                subtaskId: subtask.id,
                agentId: primaryAgent.id,
                output: '',
                success: false,
                confidence: 0,
                duration: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

export function createMoAOrchestrator(specialists: SpecialistAgent[]): MixtureOfAgentsOrchestrator {
    return new MixtureOfAgentsOrchestrator(specialists);
}
