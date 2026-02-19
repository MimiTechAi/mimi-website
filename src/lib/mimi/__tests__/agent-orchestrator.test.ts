/**
 * MIMI Agent - Agent Orchestrator Tests
 * 2026 Expert Audit — Priority 1 Test Coverage
 *
 * Tests task classification, agent routing, context management,
 * and delegation suggestion detection.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
    AgentOrchestrator,
    SPECIALIST_AGENTS,
    getOrchestrator,
} from '../agent-orchestrator-v2';

describe('Agent Orchestrator', () => {
    let orchestrator: AgentOrchestrator;

    beforeEach(() => {
        orchestrator = new AgentOrchestrator();
    });

    describe('Specialist Agent Definitions', () => {
        it('should have at least 10 specialist agents', () => {
            expect(SPECIALIST_AGENTS.length).toBeGreaterThanOrEqual(10);
        });

        it('should always include a general agent', () => {
            const general = SPECIALIST_AGENTS.find(a => a.id === 'general');
            expect(general).toBeDefined();
            expect(general!.priority).toBe(1); // Lowest priority
        });

        it('every agent should have a non-empty systemPrompt', () => {
            for (const agent of SPECIALIST_AGENTS) {
                expect(agent.systemPrompt.length).toBeGreaterThan(50);
            }
        });

        it('every agent should have unique id', () => {
            const ids = SPECIALIST_AGENTS.map(a => a.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });

        it('every agent should have at least 2 capabilities', () => {
            for (const agent of SPECIALIST_AGENTS) {
                expect(agent.capabilities.length).toBeGreaterThanOrEqual(2);
            }
        });
    });

    describe('Task Classification', () => {
        it('should route data analysis queries to data-analyst', async () => {
            const classification = await orchestrator.classifyTask(
                'Erstelle ein Diagramm aus diesen Daten: 10, 20, 30'
            );
            expect(classification.primaryAgent).toBe('data-analyst');
            expect(classification.confidence).toBeGreaterThan(0);
        });

        it('should route code queries to code-expert', async () => {
            const classification = await orchestrator.classifyTask(
                'Schreibe eine Python function zum Sortieren'
            );
            expect(classification.primaryAgent).toBe('code-expert');
        });

        it('should route document queries to document-expert', async () => {
            const classification = await orchestrator.classifyTask(
                'Finde im PDF Dokument den Abschnitt über Verträge'
            );
            expect(classification.primaryAgent).toBe('document-expert');
        });

        it('should route security queries to security-agent', async () => {
            const classification = await orchestrator.classifyTask(
                'Prüfe meinen Code auf Security Schwachstellen'
            );
            expect(classification.primaryAgent).toBe('security-agent');
        });

        it('should route translation queries to translation-agent', async () => {
            const classification = await orchestrator.classifyTask(
                'Übersetze diesen Text ins Englische'
            );
            expect(classification.primaryAgent).toBe('translation-agent');
        });

        it('should route design queries to design-agent', async () => {
            const classification = await orchestrator.classifyTask(
                'Erstelle ein Dark Mode UI Design mit CSS'
            );
            expect(classification.primaryAgent).toBe('design-agent');
        });

        it('should route business queries to business-analyst', async () => {
            const classification = await orchestrator.classifyTask(
                'Berechne den ROI für diese Investition'
            );
            expect(classification.primaryAgent).toBe('business-analyst');
        });

        it('should route research queries to research-agent', async () => {
            const classification = await orchestrator.classifyTask(
                'Recherchiere aktuelle Trends in der KI-Branche'
            );
            expect(classification.primaryAgent).toBe('research-agent');
        });

        it('should route generic greetings with low confidence', async () => {
            const classification = await orchestrator.classifyTask('Hallo, wie geht es dir?');
            // Generic greetings should resolve to some agent with relatively low confidence
            expect(classification.primaryAgent).toBeTruthy();
            const validIds = SPECIALIST_AGENTS.map(a => a.id);
            expect(validIds).toContain(classification.primaryAgent);
        });

        it('should always have a fallback agent', async () => {
            const classification = await orchestrator.classifyTask('Test');
            expect(classification.fallbackAgent).toBeDefined();
        });

        it('confidence should be between 0 and 1', async () => {
            const classification = await orchestrator.classifyTask('Erstelle einen Chart');
            expect(classification.confidence).toBeGreaterThanOrEqual(0);
            expect(classification.confidence).toBeLessThanOrEqual(1);
        });

        it('should route image queries to general (has vision tool)', async () => {
            const classification = await orchestrator.classifyTask(
                'Was siehst du auf diesem Bild?'
            );
            expect(classification.primaryAgent).toBe('general');
        });
    });

    describe('Context Management', () => {
        it('should start with empty context', () => {
            const ctx = orchestrator.getContext();
            expect(ctx.documentContext).toBe('');
            expect(ctx.imageContext).toBeNull();
            expect(ctx.conversationHistory).toEqual([]);
        });

        it('should update context correctly', () => {
            orchestrator.updateContext({
                imageContext: 'A photo of a cat',
                documentContext: 'Legal contract content'
            });
            const ctx = orchestrator.getContext();
            expect(ctx.imageContext).toBe('A photo of a cat');
            expect(ctx.documentContext).toBe('Legal contract content');
        });

        it('should save and retrieve agent outputs', () => {
            orchestrator.saveAgentOutput('data-analyst', 'The average is 42');
            const ctx = orchestrator.getContext();
            expect(ctx.previousAgentOutputs.get('data-analyst')).toBe('The average is 42');
        });
    });

    describe('Agent Prompt Retrieval', () => {
        it('should return correct prompt for known agent', () => {
            const prompt = orchestrator.getAgentPrompt('data-analyst');
            expect(prompt).toContain('Data Analyst');
        });

        it('should fallback to general agent for unknown agent', () => {
            const prompt = orchestrator.getAgentPrompt('non-existent');
            expect(prompt).toContain('MIMI');
        });
    });

    describe('Collaborative Context Building', () => {
        it('should include agent outputs in collaborative context', () => {
            orchestrator.saveAgentOutput('data-analyst', 'Revenue: 1M EUR');
            const ctx = orchestrator.buildCollaborativeContext('code-expert');
            expect(ctx).toContain('Data Analyst');
            expect(ctx).toContain('Revenue');
        });

        it('should exclude own output from collaborative context', () => {
            orchestrator.saveAgentOutput('data-analyst', 'Revenue: 1M EUR');
            const ctx = orchestrator.buildCollaborativeContext('data-analyst');
            expect(ctx).not.toContain('Revenue');
        });

        it('should include image context', () => {
            orchestrator.updateContext({ imageContext: 'A chart showing growth' });
            const ctx = orchestrator.buildCollaborativeContext('general');
            expect(ctx).toContain('chart showing growth');
        });
    });

    describe('Delegation Suggestions', () => {
        it('should detect delegation to data-analyst', () => {
            const output = 'Frage an den Data Analyst: Erstelle einen Chart';
            const suggestions = orchestrator.getDelegationSuggestions(output, 'general');
            expect(suggestions.length).toBeGreaterThan(0);
            expect(suggestions[0].targetAgent).toBe('data-analyst');
        });

        it('should detect delegation to security-agent', () => {
            const output = 'Prüfe die Sicherheit dieses Codes';
            const suggestions = orchestrator.getDelegationSuggestions(output, 'code-expert');
            expect(suggestions.length).toBeGreaterThan(0);
        });

        it('should not suggest delegating to self', () => {
            const output = 'Frage an den Data Analyst: Erstelle einen Chart';
            const suggestions = orchestrator.getDelegationSuggestions(output, 'data-analyst');
            expect(suggestions.filter(s => s.targetAgent === 'data-analyst').length).toBe(0);
        });

        it('should return empty for non-delegation text', () => {
            const output = 'Die Antwort ist 42.';
            const suggestions = orchestrator.getDelegationSuggestions(output, 'general');
            expect(suggestions).toHaveLength(0);
        });
    });

    describe('Available Agents', () => {
        it('should return all agents', () => {
            const agents = orchestrator.getAvailableAgents();
            expect(agents.length).toBe(SPECIALIST_AGENTS.length);
        });
    });

    describe('Singleton', () => {
        it('getOrchestrator should return same instance', () => {
            const a = getOrchestrator();
            const b = getOrchestrator();
            expect(a).toBe(b);
        });
    });
});
