/**
 * MIMI Agent - Specialist Agent Orchestrator V1.0
 * 
 * Swarm Intelligence Architecture:
 * - Multiple specialist SLMs for specific tasks
 * - Router for task classification
 * - Shared context and memory
 * - Agent-to-agent communication
 */

import { getVectorStore } from './vector-store';
import { getVisionEngine } from './vision-engine';
import { getSkillRegistry, type AgentSkill, type SkillMatch } from './skills';
import type { ChatMessage } from './inference-engine';

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
    skills?: AgentSkill[]; // NEW: Skills relevant for this task
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
|----|----|----|----|
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
- Antworte auf Deutsch (außer anders gewünscht)
- Sei direkt und hilfreich — keine leeren Floskeln
- Stelle dich NICHT ausführlich vor, antworte einfach auf die Frage

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

/**
 * Agent Orchestrator - Routes tasks to specialist agents
 * 
 * V2.1: Dynamic Priority Scoring (P3 Audit Fix)
 * Agents earn/lose priority based on actual success rates.
 */
export class AgentOrchestrator {
    private agents: Map<string, SpecialistAgent>;
    private context: AgentContext;
    private skillRegistry = getSkillRegistry(); // NEW: Skill registry

    // P3: Dynamic priority scoring - tracks per-agent success rates
    private agentScores: Map<string, { successes: number; total: number; dynamicBoost: number }> = new Map();

    constructor() {
        this.agents = new Map(SPECIALIST_AGENTS.map(a => [a.id, a]));
        this.context = {
            conversationHistory: [],
            documentContext: '',
            imageContext: null,
            previousAgentOutputs: new Map()
        };

        // Initialize agent scores
        for (const agent of SPECIALIST_AGENTS) {
            this.agentScores.set(agent.id, { successes: 0, total: 0, dynamicBoost: 0 });
        }

        // Initialize skill registry
        this.skillRegistry.initialize().catch(error => {
            console.warn('[AgentOrchestrator] Failed to initialize skill registry:', error);
        });
    }

    /**
     * P3: Records task outcome for dynamic priority learning
     * Call this after each agent interaction to improve routing over time.
     */
    recordAgentOutcome(agentId: string, success: boolean): void {
        const score = this.agentScores.get(agentId);
        if (!score) return;

        score.total += 1;
        if (success) score.successes += 1;

        // Exponential moving average for dynamic boost
        // Successful agents get up to +2 boost, failing agents get up to -1
        const successRate = score.total > 0 ? score.successes / score.total : 0.5;
        score.dynamicBoost = (successRate - 0.5) * 4; // Range: -2 to +2

        console.log(`[AgentOrchestrator] Agent "${agentId}" score updated: ${score.successes}/${score.total} (boost: ${score.dynamicBoost.toFixed(2)})`);
    }

    /**
     * Get success stats for all agents
     */
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

    /**
     * Klassifiziert eine Anfrage und wählt den besten Agenten
     * NEU: Findet auch relevante Skills für die Aufgabe
     */
    async classifyTask(userMessage: string): Promise<TaskClassification> {
        const lowerMessage = userMessage.toLowerCase();

        // Keyword-basierte Klassifikation
        const classifications: { agent: string; score: number; caps: string[] }[] = [];

        for (const agent of SPECIALIST_AGENTS) {
            let score = 0;
            const matchedCaps: string[] = [];

            // Capability Matching
            for (const cap of agent.capabilities) {
                if (lowerMessage.includes(cap)) {
                    score += 2;
                    matchedCaps.push(cap);
                }
            }

            // Pattern Matching
            if (agent.id === 'data-analyst') {
                if (/plot|chart|graph|tabelle|statistik|daten|csv|excel|analyse/i.test(lowerMessage)) {
                    score += 3;
                }
            } else if (agent.id === 'code-expert') {
                if (/code|programm|function|debug|fehler|bug|script|algorithm/i.test(lowerMessage)) {
                    score += 3;
                }
            } else if (agent.id === 'document-expert') {
                if (/dokument|pdf|suche|finde|vertrag|seite|zusammenfassung/i.test(lowerMessage)) {
                    score += 3;
                }
            } else if (agent.id === 'creative-writer') {
                if (/schreib|email|brief|text|bericht|artikel|entwurf|formulier/i.test(lowerMessage)) {
                    score += 3;
                }
            } else if (agent.id === 'research-agent') {
                if (/recherch|such|finde|vergleich|markt|trend|fakten|quelle|studie|benchmark/i.test(lowerMessage)) {
                    score += 3;
                }
            } else if (agent.id === 'business-analyst') {
                if (/business|kpi|roi|umsatz|gewinn|budget|kosten|strategi|swot|invest|rendite|kennzahl/i.test(lowerMessage)) {
                    score += 3;
                }
            } else if (agent.id === 'security-agent') {
                if (/sicher|security|hack|schwachstelle|vulnerability|dsgvo|gdpr|audit|penetration|verschlüssel|encrypt|auth/i.test(lowerMessage)) {
                    score += 3;
                }
            } else if (agent.id === 'translation-agent') {
                if (/übersetz|translat|lokalisier|i18n|sprache|language|deutsch|english|français|español|mehrsprach|multilingual/i.test(lowerMessage)) {
                    score += 3;
                }
            } else if (agent.id === 'design-agent') {
                if (/design|ui|ux|layout|farbe|color|css|style|animation|responsive|dark.?mode|component|schriftart|font/i.test(lowerMessage)) {
                    score += 3;
                }
            }

            // Vision-related queries boost general agent (which has tool access)
            if (/bild|foto|photo|image|screenshot|bildanalyse|image.?analy|ocr|text.?im.?bild|was.?siehst|was.?ist.?auf|was.?ist.?im|zeig|erkenn|schau.?dir.?an|look.?at/i.test(lowerMessage)) {
                if (agent.id === 'general') {
                    score += 4; // Boost general agent for vision queries (has analyze_image tool)
                }
            }

            // Priority Bonus + P3: Dynamic learning boost
            const dynamicBoost = this.agentScores.get(agent.id)?.dynamicBoost || 0;
            score += agent.priority * 0.5 + dynamicBoost;

            classifications.push({ agent: agent.id, score, caps: matchedCaps });
        }

        // Sortiere nach Score
        classifications.sort((a, b) => b.score - a.score);

        const best = classifications[0];
        const fallback = classifications.find(c => c.agent === 'general') || classifications[1];

        // NEW: Find relevant skills for this task
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
            skills: relevantSkills // NEW
        };
    }

    /**
     * Holt den System-Prompt für einen Agenten
     */
    getAgentPrompt(agentId: string): string {
        const agent = this.agents.get(agentId);
        return agent?.systemPrompt || SPECIALIST_AGENTS.find(a => a.id === 'general')!.systemPrompt;
    }

    /**
     * Gibt den aktuellen Kontext zurück (für imageContext etc.)
     */
    getContext(): AgentContext {
        return this.context;
    }

    /**
     * Aktualisiert den geteilten Kontext
     */
    updateContext(updates: Partial<AgentContext>): void {
        this.context = { ...this.context, ...updates };
    }

    /**
     * Speichert Agent-Output für andere Agenten
     */
    saveAgentOutput(agentId: string, output: string): void {
        this.context.previousAgentOutputs.set(agentId, output);
    }

    /**
     * Baut erweiterten Kontext für Multi-Agent Collaboration
     * NEU: Injiziert auch relevante Skills
     */
    buildCollaborativeContext(currentAgent: string, skills?: AgentSkill[]): string {
        let context = '';

        // Outputs von anderen Agenten
        for (const [agentId, output] of this.context.previousAgentOutputs) {
            if (agentId !== currentAgent && output) {
                const agentName = this.agents.get(agentId)?.name || agentId;
                context += `\n[${agentName} sagt]: ${output.slice(0, 200)}...\n`;
            }
        }

        // Dokument-Kontext
        if (this.context.documentContext) {
            context += `\n[Dokument-Kontext]: ${this.context.documentContext.slice(0, 500)}...\n`;
        }

        // Bild-Kontext
        if (this.context.imageContext) {
            context += `\n[Bild-Analyse]: ${this.context.imageContext}\n`;
        }

        // NEW: Inject relevant skills
        if (skills && skills.length > 0) {
            context += this.skillRegistry.injectSkillsToPrompt(skills);
        }

        return context;
    }

    /**
     * Delegiert einen Sub-Task an einen anderen Agenten
     * Ermöglicht echte Inter-Agent-Kommunikation
     */
    async delegateToAgent(
        fromAgentId: string,
        toAgentId: string,
        subTask: string
    ): Promise<{ delegatedPrompt: string; agentName: string }> {
        const targetAgent = this.agents.get(toAgentId);
        if (!targetAgent) {
            throw new Error(`Agent "${toAgentId}" nicht gefunden`);
        }

        const fromAgent = this.agents.get(fromAgentId);
        const fromName = fromAgent?.name || fromAgentId;

        console.log(`[AgentOrchestrator] Delegation: ${fromName} → ${targetAgent.name} | "${subTask.slice(0, 80)}..."`);

        // Baue delegierten Kontext
        const previousOutput = this.context.previousAgentOutputs.get(fromAgentId);
        const delegationContext = previousOutput
            ? `\n[Kontext von ${fromName}]: ${previousOutput.slice(0, 500)}\n`
            : '';

        // Finde relevante Skills für den Ziel-Agenten
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

        return {
            delegatedPrompt,
            agentName: targetAgent.name
        };
    }

    /**
     * Analysiert ob ein Agent-Output Delegation-Hinweise enthält
     * Erkennt Muster wie "Frage an den Security Agent" oder "Der Data Analyst sollte..."
     */
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
                // Extrahiere den Sub-Task aus dem Kontext
                const match = agentOutput.match(new RegExp(`(.{0,100}${pattern.source}.{0,100})`, 'i'));
                suggestions.push({
                    targetAgent: agentId,
                    subTask: match?.[1]?.trim() || agentOutput.slice(0, 200)
                });
            }
        }

        return suggestions;
    }

    /**
     * Gibt alle verfügbaren Agenten zurück
     */
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
