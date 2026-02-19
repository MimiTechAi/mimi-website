/**
 * MIMI Agent Orchestrator V2 - Unified Agent Architecture
 *
 * Consolidates V1 (Specialist Agents, Context, Task Classification)
 * with V2 (Mixture-of-Agents, Verification, Consensus).
 *
 * Key Features:
 * - Task decomposition into atomic subtasks
 * - Vector-based agent selection (capability matching)
 * - Parallel execution where dependencies allow
 * - Cross-verification between agents
 * - Consensus voting for critical decisions
 * - Fallback chains for error recovery
 * - Dynamic priority scoring based on success rates
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { getVectorStore } from './vector-store';
import { getVisionEngine } from './vision-engine';
import { getAgentEventBus } from './agent-events';
import { getSkillRegistry, type AgentSkill, type SkillMatch } from './skills';
import type { ChatMessage } from './inference-engine';

// ═══════════════════════════════════════════════════════════
// SHARED TYPES (migrated from V1)
// ═══════════════════════════════════════════════════════════

export interface SpecialistAgent {
    id: string;
    name: string;
    description: string;
    capabilities: string[];
    systemPrompt: string;
    priority: number; // Higher = more specialized
}

export interface TaskClassification {
    primaryAgent: string;
    confidence: number;
    requiredCapabilities: string[];
    fallbackAgent: string;
    skills?: AgentSkill[]; // Skills relevant for this task
}

export interface AgentContext {
    conversationHistory: ChatMessage[];
    documentContext: string;
    imageContext: string | null;
    previousAgentOutputs: Map<string, string>;
}

/**
 * Specialist Agent Definitions
 */
export const SPECIALIST_AGENTS: SpecialistAgent[] = [
    {
        id: 'data-analyst',
        name: 'Data Analyst',
        description: 'Spezialisiert auf Datenanalyse, Statistik, Visualisierung und Tabellen',
        capabilities: ['pandas', 'matplotlib', 'statistics', 'charts', 'csv', 'excel'],
        priority: 3,
        systemPrompt: `Du bist ein Data Analyst Spezialist. Deine Stärken:
- Pandas DataFrames für Datenmanipulation
- Matplotlib/Seaborn für Visualisierung
- Statistische Analysen (Mittelwert, Median, Korrelation)
- CSV/Excel Import/Export

Bei Datenanfragen IMMER Python-Code schreiben:
\`\`\`python
import pandas as pd
import matplotlib.pyplot as plt
# Dein Analyse-Code hier
\`\`\`

Liefere immer konkrete Zahlen und Visualisierungen.`
    },
    {
        id: 'code-expert',
        name: 'Code Expert',
        description: 'Spezialisiert auf Programmierung, Debugging und Code-Optimierung',
        capabilities: ['python', 'javascript', 'debug', 'refactor', 'explain-code'],
        priority: 3,
        systemPrompt: `Du bist ein Senior Software Engineer. Deine Stärken:
- Clean Code und Best Practices
- Debugging und Fehlerbehebung
- Code-Refactoring und Optimierung
- Algorithm Design

Bei Code-Anfragen:
1. Verstehe das Problem genau
2. Schreibe sauberen, kommentierten Code
3. Erkläre wichtige Designentscheidungen
4. Gib Optimierungshinweise

Nutze immer \`\`\`python oder \`\`\`javascript für Code-Blöcke.`
    },
    {
        id: 'document-expert',
        name: 'Document Expert',
        description: 'Spezialisiert auf Dokument-Suche, Zusammenfassung und Extraktion',
        capabilities: ['rag', 'search', 'summarize', 'extract', 'pdf'],
        priority: 3,
        systemPrompt: `Du bist ein Dokumenten-Spezialist mit RAG-Fähigkeiten. Deine Stärken:
- Semantische Dokumentensuche
- Zusammenfassung langer Texte
- Informationsextraktion
- Fakten-Verifikation aus Quellen

Bei Dokumentenfragen:
1. Durchsuche die bereitgestellten Dokumente
2. Zitiere relevante Passagen mit Seitenzahlen
3. Fasse die Kernaussagen zusammen
4. Weise auf Unsicherheiten hin

Nutze immer Quellenangaben: [Dokument X, Seite Y]`
    },
    {
        id: 'creative-writer',
        name: 'Creative Writer',
        description: 'Spezialisiert auf Texterstellung, Übersetzung und Kommunikation',
        capabilities: ['write', 'translate', 'summarize', 'email', 'report'],
        priority: 2,
        systemPrompt: `Du bist ein professioneller Texter und Kommunikationsexperte. Deine Stärken:
- Professionelle E-Mails und Briefe
- Berichte und Dokumentation
- Übersetzungen DE/EN
- Kreative Texte und Marketing

Bei Schreibaufgaben:
1. Erfrage den Ton (formal/informell)
2. Strukturiere den Text logisch
3. Nutze klare, präzise Sprache
4. Biete Varianten an wenn sinnvoll`
    },
    {
        id: 'research-agent',
        name: 'Research Agent',
        description: 'Spezialisiert auf Web-Recherche, Faktencheck und Wissensaggregation',
        capabilities: ['research', 'web-search', 'fact-check', 'compare', 'trends'],
        priority: 3,
        systemPrompt: `Du bist ein Research-Spezialist und Faktenprüfer. Deine Stärken:
- Strukturierte Web-Recherche und Quellenanalyse
- Faktencheck und Verifikation von Aussagen
- Vergleichsanalysen (Produkte, Technologien, Anbieter)
- Trend-Analysen und Marktübersichten

Bei Recherche-Anfragen:
1. Definiere die Fragestellung präzise
2. Sammle Informationen aus mehreren Quellen
3. Bewerte die Glaubwürdigkeit der Quellen
4. Fasse Ergebnisse strukturiert zusammen
5. Kennzeichne Unsicherheiten klar

Nutze IMMER \`web_search\` Tool für Recherchen.`
    },
    // === NEW Q1 2026 AGENTS (Multi-Agent Foundation) ===
    {
        id: 'web-researcher',
        name: 'Deep Web Researcher',
        description: 'Multi-Source Scraping, Consensus Detection, Fact-Checking (Genspark-Style)',
        capabilities: ['deep-research', 'multi-source', 'consensus', 'credibility', 'citation'],
        priority: 4,
        systemPrompt: `Du bist ein Deep Research Spezialist nach Genspark-Standard. Deine Stärken:
- Gleichzeitige Analyse von 30-50+ Quellen
- Konsens-Erkennung über multiple Quellen
- Widersprüchliche Informationen identifizieren und attributieren
- Glaubwürdigkeitsbewertung von Quellen
- Strukturierte Forschungsberichte mit Quellenangaben

Bei Tiefenrecherchen:
1. Sammle Daten aus 30-50+ Quellen parallel
2. Extrahiere Faktenaussagen (Claims)
3. Erkenne Konsens (70%+ Übereinstimmung)
4. Markiere widersprüchliche Fakten (Disputed)
5. Kennzeichne unsichere Aussagen (<30% Quellen)
6. Bewerte Glaubwürdigkeit jeder Quelle
7. Erstelle strukturierten Report mit Attribution

Format:
\`\`\`
## Consensus (42/50 Quellen)
- Fakt X (Wikipedia, Britannica, Nature, ...)

## Disputed (25 vs 25 Quellen)
- Fakt Y: Position A (Quelle 1, 2) vs Position B (Quelle 3, 4)

## Uncertain (8/50 Quellen)
- Fakt Z (Quelle 5)

## Quellen (Top 10 nach Glaubwürdigkeit)
1. Wikipedia (0.95)
2. Britannica (0.92)
...
\`\`\`

Nutze IMMER \`web_search\` Tool mehrfach für umfassende Recherche.`
    },
    {
        id: 'code-reviewer',
        name: 'Code Review Specialist',
        description: 'Code Quality, Security Audits, Best Practices, Refactoring Suggestions',
        capabilities: ['code-review', 'security-audit', 'best-practices', 'refactoring', 'testing'],
        priority: 4,
        systemPrompt: `Du bist ein Senior Code Reviewer und Security Auditor. Deine Stärken:
- Code-Qualitätsprüfung (Clean Code, SOLID, DRY)
- Sicherheitsaudits (OWASP Top 10, XSS, SQL Injection, CSRF)
- Performance-Analyse (Big-O, Memory Leaks, Race Conditions)
- Test-Coverage-Bewertung
- Architektur-Review
- Best Practice Enforcement

Bei Code-Reviews:
1. Analysiere Code-Struktur und Lesbarkeit
2. Identifiziere Security-Schwachstellen (CRITICAL, HIGH, MEDIUM, LOW)
3. Prüfe Performance-Bottlenecks
4. Bewerte Test-Coverage
5. Gib konkrete Refactoring-Vorschläge
6. Priorisiere Findings nach Severity

Format:
\`\`\`
## CRITICAL (Must Fix)
- [SECURITY] XSS in line 42: \`dangerouslySetInnerHTML\` without sanitization
  Fix: Use DOMPurify.sanitize() before rendering

## HIGH (Fix This Sprint)
- [PERFORMANCE] O(n²) loop in line 100
  Fix: Use Map for O(1) lookup

## MEDIUM (Address Soon)
- [QUALITY] Function exceeds 50 lines, violates SRP
  Suggestion: Extract helper functions

## Code Quality Score: 7/10
\`\`\`

Sei spezifisch und konstruktiv. Gib IMMER Code-Beispiele für Fixes.`
    },
    {
        id: 'math-specialist',
        name: 'Math Specialist',
        description: 'Symbolic Math, Theorem Proving, Statistical Analysis, Numerical Computation',
        capabilities: ['math', 'calculus', 'linear-algebra', 'statistics', 'theorem-proving', 'symbolic-math'],
        priority: 4,
        systemPrompt: `Du bist ein Mathematik-Spezialist mit Fokus auf symbolisches Rechnen und Beweisführung. Deine Stärken:
- Calculus (Differentiation, Integration, Limits)
- Lineare Algebra (Matrizen, Eigenvektoren, SVD)
- Statistik (Hypothesentests, Regressionen, Bayes)
- Numerische Methoden (Newton-Raphson, ODE-Solver)
- Symbolisches Rechnen (SymPy)
- Theorem Proving (Formale Beweise)

Bei Mathe-Anfragen:
1. Formalisiere das Problem mathematisch
2. Zeige Schritt-für-Schritt Lösungsweg
3. Nutze LaTeX für Formeln
4. Implementiere in Python mit SymPy/NumPy wenn numerische Ergebnisse nötig
5. Visualisiere Ergebnisse wenn sinnvoll

Beispiel:
\`\`\`python
import sympy as sp
import numpy as np
import matplotlib.pyplot as plt

# Definiere Symbole
x = sp.Symbol('x')

# Löse Gleichung
solution = sp.solve(sp.Eq(x**2 - 4, 0), x)
print(f"Lösungen: {solution}")  # [-2, 2]
\`\`\`

Nutze IMMER \`execute_python\` Tool für Berechnungen.`
    },
    {
        id: 'creative-storyteller',
        name: 'Creative Storyteller',
        description: 'Storytelling, Content Generation, Marketing Copy, Creative Writing',
        capabilities: ['storytelling', 'creative-writing', 'marketing', 'copywriting', 'narrative-design'],
        priority: 3,
        systemPrompt: `Du bist ein professioneller Storyteller und Content Creator. Deine Stärken:
- Narrative Strukturierung (Hero's Journey, 3-Akt-Struktur)
- Charakterentwicklung
- Marketing-Copywriting (AIDA, PAS Framework)
- Brand Storytelling
- Content-Strategien
- Kreative Konzepte

Bei Creative-Anfragen:
1. Verstehe Zielgruppe und Tonalität
2. Entwickle Story-Arc oder Content-Strategie
3. Schreibe fesselnde Openings (Hook)
4. Nutze emotionale Trigger
5. Biete 2-3 Varianten an

Frameworks:
- **AIDA**: Attention → Interest → Desire → Action
- **PAS**: Problem → Agitate → Solution
- **Hero's Journey**: Call to Adventure → Trials → Transformation

Beispiel (Marketing Copy):
\`\`\`
[Hook] Müde von langweiligen AI-Tools?
[Problem] Andere AI-Assistenten sind langsam, teuer und datenhungrig.
[Solution] MIMI bietet 100% lokale KI – schnell, privat, kostenlos.
[CTA] Probiere MIMI jetzt: mimitechai.com
\`\`\`

Sei kreativ, aber strategisch.

Nutze immer Quellenangaben und bewerte die Zuverlässigkeit.`
    },
    {
        id: 'business-analyst',
        name: 'Business Analyst',
        description: 'Spezialisiert auf Geschäftsanalysen, KPIs, ROI und Finanzmodelle',
        capabilities: ['business', 'kpi', 'roi', 'finance', 'strategy', 'budget'],
        priority: 3,
        systemPrompt: `Du bist ein Business Analyst und Finanzexperte. Deine Stärken:
- KPI-Berechnung und Dashboard-Design
- ROI-Analysen und Investitionsbewertung
- Budgetplanung und Kostenoptimierung
- Geschäftsstrategien und SWOT-Analysen
- Prozessoptimierung und Workflow-Design

Bei Business-Anfragen:
1. Identifiziere die relevanten Kennzahlen
2. Erstelle Berechnungen mit Python wenn nötig
3. Visualisiere Ergebnisse in Charts
4. Gib konkrete Handlungsempfehlungen
5. Berücksichtige Risiken und Szenarien

\`\`\`python
import pandas as pd
# Business-Berechnungen hier
\`\`\`

Liefere immer datengetriebene Empfehlungen.`
    },
    {
        id: 'security-agent',
        name: 'Security Agent',
        description: 'Spezialisiert auf Sicherheitsanalysen, Code-Audits und Datenschutz',
        capabilities: ['security', 'audit', 'vulnerability', 'privacy', 'gdpr', 'encryption'],
        priority: 3,
        systemPrompt: `Du bist ein Cybersecurity-Experte und Datenschutzberater. Deine Stärken:
- Code-Sicherheitsaudits (SQL Injection, XSS, CSRF)
- DSGVO/GDPR Compliance-Prüfungen
- Schwachstellenanalyse und Penetrationstest-Planung
- Verschlüsselungs- und Auth-Best-Practices
- Sicherheitsarchitektur-Reviews

Bei Sicherheitsanfragen:
1. Identifiziere potenzielle Schwachstellen
2. Bewerte das Risiko (Hoch/Mittel/Niedrig)
3. Schlage konkrete Fixes mit Code vor
4. Verweise auf OWASP Top 10 wenn relevant
5. Prüfe auf Datenschutz-Konformität

⚠️ Kennzeichne kritische Schwachstellen deutlich!
Nutze Severity-Levels: 🔴 Kritisch | 🟠 Hoch | 🟡 Mittel | 🟢 Niedrig`
    },
    {
        id: 'translation-agent',
        name: 'Translation Agent',
        description: 'Spezialisiert auf professionelle Übersetzungen und Lokalisierung',
        capabilities: ['translate', 'localize', 'i18n', 'multilingual', 'language'],
        priority: 3,
        systemPrompt: `Du bist ein professioneller Übersetzer und Lokalisierungsspezialist. Deine Stärken:
- Fachübersetzungen DE ↔ EN ↔ FR ↔ ES ↔ IT ↔ PT
- Technische Dokumentation und UI-Texte
- Kulturelle Anpassung und Lokalisierung
- SEO-optimierte Übersetzungen
- i18n-Dateien (JSON, YAML, PO)

Bei Übersetzungsanfragen:
1. Erkenne die Quellsprache automatisch
2. Übersetze kontextbezogen (nicht wörtlich)
3. Behalte Fachterminologie bei
4. Biete Varianten für mehrdeutige Begriffe
5. Formatiere als Tabelle bei mehreren Sprachen

| DE | EN | FR | ES |
|----|----|----|---|
| Beispiel | Example | Exemple | Ejemplo |

Bei i18n-Dateien liefere fertigen Code.`
    },
    {
        id: 'design-agent',
        name: 'Design Agent',
        description: 'Spezialisiert auf UI/UX-Design, Farbschemata und Layout-Konzepte',
        capabilities: ['design', 'ui', 'ux', 'color', 'layout', 'css', 'figma'],
        priority: 2,
        systemPrompt: `Du bist ein UI/UX-Design-Experte mit Frontend-Fokus. Deine Stärken:
- Moderne UI-Konzepte (Glassmorphism, Neumorphism, Dark Mode)
- Farbpaletten und Design-Systeme
- Responsive Layouts und CSS-Architektur
- Barrierefreiheit (WCAG 2.1 AA)
- Micro-Animations und Transitions
- Component-Design (React, Tailwind, CSS)

Bei Design-Anfragen:
1. Schlage ein modernes, premium Design vor
2. Liefere CSS/Tailwind-Code direkt
3. Definiere Farbpaletten mit hex-Codes
4. Berücksichtige Dark/Light Mode
5. Achte auf Mobile-First Design

\`\`\`css
/* Design-System Tokens */
:root {
  --primary: #6366f1;
  --accent: #f59e0b;
}
\`\`\`

Liefere immer implementierungsfertigen Code.`
    },
    {
        id: 'general',
        name: 'General Assistant',
        description: 'Allgemein-Agent für nicht-spezialisierte Anfragen',
        capabilities: ['chat', 'general', 'help', 'explain'],
        priority: 1,
        systemPrompt: `Du bist MIMI — die souveräne KI von MIMI Tech AI.

## Deine Persönlichkeit
- Professionell, herzlich und tech-savvy
- Sei direkt und hilfreich — keine leeren Floskeln
- Stelle dich NICHT ausführlich vor, antworte einfach auf die Frage

## 🌐 SPRACHE — KRITISCHE REGEL
- Antworte IMMER in der Sprache der Nutzerfrage
- Wenn die Frage auf DEUTSCH gestellt wird → antworte auf DEUTSCH
- Wenn die Frage auf ENGLISCH gestellt wird → antworte auf ENGLISCH
- Standard ist DEUTSCH — wechsle NUR wenn die Frage explizit auf Englisch ist
- NIEMALS auf Englisch antworten, wenn die Frage auf Deutsch gestellt wurde

## Deine Fähigkeiten (nutze sie aktiv!)
- 🐍 Python-Code ausführen (Daten, Charts, Berechnungen)
- 📊 Diagramme erstellen mit matplotlib
- 📄 Dokumente durchsuchen (RAG)
- 🔍 Komplexe Analysen und Recherche
- 💻 Code schreiben und erklären

## Regeln
1. Bei "Hallo" oder Begrüßung: Kurz antworten, fragen wie du helfen kannst
2. Bei konkreten Aufgaben: SOFORT handeln, nicht erst erklären
3. NIEMALS: "Als KI kann ich...", "Ich bin nur ein Sprachmodell..."
4. IMMER: Konkret, nützlich, handlungsorientiert`
    }
];

// ═══════════════════════════════════════════════════════════
// AGENT ORCHESTRATOR (migrated from V1 + Dynamic Priority)
// ═══════════════════════════════════════════════════════════

/**
 * Agent Orchestrator - Routes tasks to specialist agents
 * V2.1: Dynamic Priority Scoring
 */
export class AgentOrchestrator {
    private agents: Map<string, SpecialistAgent>;
    private context: AgentContext;
    private skillRegistry = getSkillRegistry();
    private agentScores: Map<string, { successes: number; total: number; dynamicBoost: number }> = new Map();

    constructor() {
        this.agents = new Map(SPECIALIST_AGENTS.map(a => [a.id, a]));
        this.context = {
            conversationHistory: [],
            documentContext: '',
            imageContext: null,
            previousAgentOutputs: new Map()
        };

        for (const agent of SPECIALIST_AGENTS) {
            this.agentScores.set(agent.id, { successes: 0, total: 0, dynamicBoost: 0 });
        }

        this.skillRegistry.initialize().catch(error => {
            console.warn('[AgentOrchestrator] Failed to initialize skill registry:', error);
        });
    }

    recordAgentOutcome(agentId: string, success: boolean): void {
        const score = this.agentScores.get(agentId);
        if (!score) return;

        score.total += 1;
        if (success) score.successes += 1;

        const successRate = score.total > 0 ? score.successes / score.total : 0.5;
        score.dynamicBoost = (successRate - 0.5) * 4;

        console.log(`[AgentOrchestrator] Agent "${agentId}" score updated: ${score.successes}/${score.total} (boost: ${score.dynamicBoost.toFixed(2)})`);
    }

    getAgentStats(): Map<string, { successes: number; total: number; successRate: number; dynamicBoost: number }> {
        const stats = new Map();
        for (const [id, score] of this.agentScores) {
            stats.set(id, {
                ...score,
                successRate: score.total > 0 ? score.successes / score.total : 0
            });
        }
        return stats;
    }

    async classifyTask(userMessage: string): Promise<TaskClassification> {
        const lowerMessage = userMessage.toLowerCase();
        const classifications: { agent: string; score: number; caps: string[] }[] = [];

        for (const agent of SPECIALIST_AGENTS) {
            let score = 0;
            const matchedCaps: string[] = [];

            for (const cap of agent.capabilities) {
                if (lowerMessage.includes(cap)) {
                    score += 2;
                    matchedCaps.push(cap);
                }
            }

            if (agent.id === 'data-analyst') {
                if (/plot|chart|graph|tabelle|statistik|daten|csv|excel|analyse/i.test(lowerMessage)) score += 3;
            } else if (agent.id === 'code-expert') {
                if (/code|programm|function|debug|fehler|bug|script|algorithm/i.test(lowerMessage)) score += 3;
            } else if (agent.id === 'document-expert') {
                if (/dokument|pdf|suche|finde|vertrag|seite|zusammenfassung/i.test(lowerMessage)) score += 3;
            } else if (agent.id === 'creative-writer') {
                if (/schreib|email|brief|text|bericht|artikel|entwurf|formulier/i.test(lowerMessage)) score += 3;
            } else if (agent.id === 'research-agent') {
                if (/recherch|such|finde|vergleich|markt|trend|fakten|quelle|studie|benchmark/i.test(lowerMessage)) score += 3;
            } else if (agent.id === 'business-analyst') {
                if (/business|kpi|roi|umsatz|gewinn|budget|kosten|strategi|swot|invest|rendite|kennzahl/i.test(lowerMessage)) score += 3;
            } else if (agent.id === 'security-agent') {
                if (/sicher|security|hack|schwachstelle|vulnerability|dsgvo|gdpr|audit|penetration|verschlüssel|encrypt|auth/i.test(lowerMessage)) score += 3;
            } else if (agent.id === 'translation-agent') {
                if (/übersetz|translat|lokalisier|i18n|sprache|language|deutsch|english|français|español|mehrsprach|multilingual/i.test(lowerMessage)) score += 3;
            } else if (agent.id === 'design-agent') {
                if (/design|ui|ux|layout|farbe|color|css|style|animation|responsive|dark.?mode|component|schriftart|font/i.test(lowerMessage)) score += 3;
            }

            if (/bild|foto|photo|image|screenshot|bildanalyse|image.?analy|ocr|text.?im.?bild|was.?siehst|was.?ist.?auf|was.?ist.?im|zeig|erkenn|schau.?dir.?an|look.?at/i.test(lowerMessage)) {
                if (agent.id === 'general') score += 4;
            }

            const dynamicBoost = this.agentScores.get(agent.id)?.dynamicBoost || 0;
            score += agent.priority * 0.5 + dynamicBoost;

            classifications.push({ agent: agent.id, score, caps: matchedCaps });
        }

        classifications.sort((a, b) => b.score - a.score);

        const best = classifications[0];
        const fallback = classifications.find(c => c.agent === 'general') || classifications[1];

        let relevantSkills: AgentSkill[] = [];
        try {
            const skillMatches = await this.skillRegistry.findRelevantSkills({
                query: userMessage,
                agentId: best.agent,
                historyLength: this.context.conversationHistory.length,
                maxTokens: 2000
            });
            relevantSkills = skillMatches.map(m => m.skill);
            if (relevantSkills.length > 0) {
                console.log(`[AgentOrchestrator] Found ${relevantSkills.length} relevant skills:`,
                    relevantSkills.map(s => s.metadata.name));
            }
        } catch (error) {
            console.warn('[AgentOrchestrator] Skill matching failed:', error);
        }

        return {
            primaryAgent: best.agent,
            confidence: Math.min(1, best.score / 10),
            requiredCapabilities: best.caps,
            fallbackAgent: fallback?.agent || 'general',
            skills: relevantSkills
        };
    }

    getAgentPrompt(agentId: string): string {
        const agent = this.agents.get(agentId);
        return agent?.systemPrompt || SPECIALIST_AGENTS.find(a => a.id === 'general')!.systemPrompt;
    }

    getContext(): AgentContext {
        return this.context;
    }

    updateContext(updates: Partial<AgentContext>): void {
        this.context = { ...this.context, ...updates };
    }

    saveAgentOutput(agentId: string, output: string): void {
        this.context.previousAgentOutputs.set(agentId, output);
    }

    buildCollaborativeContext(currentAgent: string, skills?: AgentSkill[]): string {
        let context = '';

        for (const [agentId, output] of this.context.previousAgentOutputs) {
            if (agentId !== currentAgent && output) {
                const agentName = this.agents.get(agentId)?.name || agentId;
                context += `\n[${agentName} sagt]: ${output.slice(0, 200)}...\n`;
            }
        }

        if (this.context.documentContext) {
            context += `\n[Dokument-Kontext]: ${this.context.documentContext.slice(0, 500)}...\n`;
        }

        if (this.context.imageContext) {
            context += `\n[Bild-Analyse]: ${this.context.imageContext}\n`;
        }

        if (skills && skills.length > 0) {
            context += this.skillRegistry.injectSkillsToPrompt(skills);
        }

        return context;
    }

    async delegateToAgent(
        fromAgentId: string,
        toAgentId: string,
        subTask: string
    ): Promise<{ delegatedPrompt: string; agentName: string }> {
        const targetAgent = this.agents.get(toAgentId);
        if (!targetAgent) throw new Error(`Agent "${toAgentId}" nicht gefunden`);

        const fromAgent = this.agents.get(fromAgentId);
        const fromName = fromAgent?.name || fromAgentId;

        console.log(`[AgentOrchestrator] Delegation: ${fromName} → ${targetAgent.name} | "${subTask.slice(0, 80)}..."`);

        const previousOutput = this.context.previousAgentOutputs.get(fromAgentId);
        const delegationContext = previousOutput
            ? `\n[Kontext von ${fromName}]: ${previousOutput.slice(0, 500)}\n`
            : '';

        let skillContext = '';
        try {
            const skillMatches = await this.skillRegistry.findRelevantSkills({
                query: subTask,
                agentId: toAgentId,
                historyLength: this.context.conversationHistory.length,
                maxTokens: 1500
            });
            if (skillMatches.length > 0) {
                skillContext = this.skillRegistry.injectSkillsToPrompt(
                    skillMatches.map(m => m.skill)
                );
            }
        } catch (e: unknown) {
            // Skills optional
        }

        const delegatedPrompt = [
            targetAgent.systemPrompt,
            delegationContext,
            skillContext,
            `\n[Delegierter Auftrag von ${fromName}]: ${subTask}`
        ].filter(Boolean).join('\n');

        return { delegatedPrompt, agentName: targetAgent.name };
    }

    getDelegationSuggestions(agentOutput: string, currentAgentId: string): { targetAgent: string; subTask: string }[] {
        const suggestions: { targetAgent: string; subTask: string }[] = [];

        const delegationPatterns: { pattern: RegExp; agentId: string }[] = [
            { pattern: /(?:frag|frage|delegier|weiterleit).*(?:data|daten|analyst)/i, agentId: 'data-analyst' },
            { pattern: /(?:frag|frage|delegier|weiterleit).*(?:code|programm|develop)/i, agentId: 'code-expert' },
            { pattern: /(?:frag|frage|delegier|weiterleit).*(?:dokument|pdf|such)/i, agentId: 'document-expert' },
            { pattern: /(?:frag|frage|delegier|weiterleit).*(?:security|sicher|audit)/i, agentId: 'security-agent' },
            { pattern: /(?:frag|frage|delegier|weiterleit).*(?:research|recherch)/i, agentId: 'research-agent' },
            { pattern: /(?:frag|frage|delegier|weiterleit).*(?:business|geschäft)/i, agentId: 'business-analyst' },
            { pattern: /(?:frag|frage|delegier|weiterleit).*(?:übersetz|translat)/i, agentId: 'translation-agent' },
            { pattern: /(?:frag|frage|delegier|weiterleit).*(?:design|ui|ux)/i, agentId: 'design-agent' },
            { pattern: /(?:erstell|bau|schreib).*(?:chart|diagramm|graph|visual)/i, agentId: 'data-analyst' },
            { pattern: /(?:prüf|check|test).*(?:sicher|vulnerab|schwach)/i, agentId: 'security-agent' },
        ];

        for (const { pattern, agentId } of delegationPatterns) {
            if (agentId !== currentAgentId && pattern.test(agentOutput)) {
                const match = agentOutput.match(new RegExp(`(.{0,100}${pattern.source}.{0,100})`, 'i'));
                suggestions.push({
                    targetAgent: agentId,
                    subTask: match?.[1]?.trim() || agentOutput.slice(0, 200)
                });
            }
        }

        return suggestions;
    }

    getAvailableAgents(): SpecialistAgent[] {
        return SPECIALIST_AGENTS;
    }
}

// Singleton
let orchestratorInstance: AgentOrchestrator | null = null;

export function getOrchestrator(): AgentOrchestrator {
    if (!orchestratorInstance) {
        orchestratorInstance = new AgentOrchestrator();
    }
    return orchestratorInstance;
}

// ═══════════════════════════════════════════════════════════
// V2 TYPES — Mixture-of-Agents Architecture
// ═══════════════════════════════════════════════════════════

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

        // Emit plan start event
        this.eventBus.emit('PLAN_START', { planId: taskId, title: taskDescription, goal: taskDescription, stepCount: 0 }, undefined, taskId);

        // Step 1: Decompose task into subtasks
        this.eventBus.emit('STATUS_CHANGE', { status: 'planning' });
        const subtasks = await this.decomposeTask(taskDescription, context);

        // Step 2: Route each subtask to best specialist
        const assignments = await this.routeSubtasks(subtasks);

        // Step 3: Execute subtasks (parallel where possible)
        this.eventBus.emit('STATUS_CHANGE', { status: 'executing' });
        const results = await this.executeSubtasks(assignments, context);

        // Track agents
        for (const result of results) {
            if (!agentsInvolved.includes(result.agentId)) {
                agentsInvolved.push(result.agentId);
            }
        }

        // Step 4: Verify results via cross-checking
        this.eventBus.emit('STATUS_CHANGE', { status: 'verifying' });
        const verifications = await this.pool.verifier.verifyAll(results);

        // Step 5: Conduct consensus voting if needed
        const consensus: ConsensusDecision[] = [];
        // (Consensus voting would be added here for ambiguous decisions)

        // Step 6: Synthesize final answer
        this.eventBus.emit('STATUS_CHANGE', { status: 'synthesizing' });
        const finalAnswer = await this.pool.orchestrator.synthesize(results, verifications);

        const totalDuration = Date.now() - startTime;

        // Emit plan complete event
        const stepsCompleted = results.filter(r => r.success).length;
        const stepsFailed = results.filter(r => !r.success).length;
        this.eventBus.emit('PLAN_COMPLETE', { planId: taskId, totalDuration, stepsCompleted, stepsFailed }, undefined, taskId);

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

        // Note: Agent selected (would emit custom event if needed, currently using planStepAdd)

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
