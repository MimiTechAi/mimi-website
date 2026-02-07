/**
 * MIMI Agent - Inference Engine V2.0
 * 
 * Upgrade von Chat zu Agent:
 * - Chain-of-Thought (CoT) mit verstecktem <thinking> Block
 * - Grammar-Constrained Decoding für strukturiertes JSON
 * - Sovereign Intelligence Persona
 * - Auto-RAG: Automatische Dokumenten-Suche
 */

import { MODELS } from './hardware-check';
import { searchDocuments, loadDocuments, type PDFDocument, type PDFChunk, type PDFSearchResult } from './pdf-processor';
import { getVectorStore, type SearchResult as VectorSearchResult } from './vector-store';
import { getOrchestrator, type AgentOrchestrator } from './agent-orchestrator';
import { getMemoryManager, type MemoryManager } from './memory-manager';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

const SYSTEM_PROMPT = `
Du bist MIMI, eine hochentwickelte KI für digitale Zwillinge und technologische Beratung.

## DEINE VIRTUELLE UMGEBUNG (VIRTUAL COMPUTER)
Du hast Zugriff auf einen **vollständigen virtuellen Computer** direkt im Browser. Nutze ihn aktiv für komplexe Aufgaben!

### 1. Python Sandbox (Pyodide)
- Nutze Python für: Datenanalyse, Mathematik, Simulationen, Dateimanipulation.
- Verfügbare Libraries: \`numpy\`, \`pandas\`, \`micropip\`.
- Du kannst Pakete installieren: Erwähne dies dem User (z.B. "Ich installiere scikit-learn...").
- Code-Blöcke: Schreibe Python-Code in \`\`\`python ... \`\`\`. Dieser wird automatisch ausgeführt.

### 2. SQLite Datenbank (WASM)
- Du hast eine lokale SQL-Datenbank.
- Nutze sie für: Strukturierte Daten, komplexe Abfragen.
- Code-Blöcke: Schreibe SQL in \`\`\`sql ... \`\`\`.

### 3. Dateisystem (OPFS)
- Du kannst Dateien lesen/schreiben im \`/workspace\` Ordner.
- Erstelle Dateien, wenn der User nach Code fragt.

## DEINE PERSÖNLICHKEIT
- Professionell, aber herzlich und "tech-savvy".
- Du liebst es, "Hands-on" zu arbeiten (Code schreiben, Daten analysieren).
- Wenn du rechnest oder Daten verarbeitest, nutze IMMER Python Code statt zu raten.

## FORMATTING
- Nutze Markdown.
- Sei präzise.
`;

export interface AgentResponse {
    thinking: string;      // Versteckter Denkprozess
    response: string;      // Sichtbare Antwort
    artifacts?: Artifact[]; // Generierte Artefakte (Code, Dokumente)
    toolCalls?: ToolCall[]; // Ausgeführte Tools
}

export interface Artifact {
    type: 'code' | 'document' | 'table' | 'plan';
    language?: string;     // z.B. 'python', 'javascript'
    title: string;
    content: string;
}

export interface ToolCall {
    tool: 'python' | 'search' | 'file_create';
    input: string;
    output: string;
    success: boolean;
}

export interface InitProgress {
    progress: number;
    text: string;
    timeElapsed?: number;
}

type ProgressCallback = (progress: InitProgress) => void;
type StatusCallback = (status: AgentStatus) => void;

export type AgentStatus =
    | 'idle'
    | 'thinking'      // CoT läuft
    | 'analyzing'     // Analysiert Input
    | 'planning'      // Erstellt Plan
    | 'coding'        // Schreibt Code
    | 'calculating'   // Führt Berechnung aus
    | 'generating';   // Generiert Antwort

/**
 * MIMI Agent Engine V2.0
 * Nutzt Web Worker für non-blocking Inferenz mit Chain-of-Thought
 */
export class MimiEngine {
    private worker: Worker | null = null;
    private isReady = false;
    private currentModel: string | null = null;
    private messageHandlers: Map<string, (data: any) => void> = new Map();
    private messageId = 0;
    private statusCallback: StatusCallback | null = null;
    private agentOrchestrator: AgentOrchestrator;
    private memoryManager: MemoryManager;
    private isGenerating = false; // NEW: Track generation state

    constructor() {
        // Initialize in constructor for browser environment
        if (typeof window !== 'undefined') {
            this.agentOrchestrator = getOrchestrator();
            this.memoryManager = getMemoryManager();
        } else {
            // SSR fallback - will be initialized later
            this.agentOrchestrator = null as any;
            this.memoryManager = null as any;
        }
    }

    /**
     * Registriert Status-Callback für UI-Updates
     */
    onStatusChange(callback: StatusCallback): void {
        this.statusCallback = callback;
    }

    private updateStatus(status: AgentStatus): void {
        this.statusCallback?.(status);
    }

    /**
     * Initialisiert die Engine mit dem angegebenen Modell
     */
    async init(modelId: string, onProgress: ProgressCallback): Promise<void> {
        if (this.isReady && this.currentModel === modelId) {
            onProgress({ progress: 100, text: "Modell bereits geladen" });
            return;
        }

        this.worker = new Worker(
            new URL('./inference-worker.ts', import.meta.url),
            { type: 'module' }
        );

        return new Promise((resolve, reject) => {
            if (!this.worker) {
                reject(new Error("Worker konnte nicht erstellt werden"));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error("Timeout: Modell-Initialisierung dauert zu lange"));
            }, 10 * 60 * 1000);

            this.worker.onmessage = (e) => {
                const { type, payload, id } = e.data;

                switch (type) {
                    case "INIT_PROGRESS":
                        onProgress({
                            progress: payload.progress * 100,
                            text: payload.text || "Lade Modell...",
                            timeElapsed: payload.timeElapsed
                        });
                        break;

                    case "READY":
                        clearTimeout(timeout);
                        this.isReady = true;
                        this.currentModel = modelId;
                        onProgress({ progress: 100, text: "MIMI ist bereit!" });
                        resolve();
                        break;

                    case "ERROR":
                        clearTimeout(timeout);
                        reject(new Error(payload.message));
                        break;

                    case "TOKEN":
                    case "DONE":
                    case "STATUS":
                        const handler = this.messageHandlers.get(id);
                        if (handler) handler({ type, payload });
                        break;
                }
            };

            this.worker.onerror = (error) => {
                clearTimeout(timeout);
                reject(new Error(`Worker-Fehler: ${error.message}`));
            };

            this.worker.postMessage({
                type: "INIT",
                payload: { modelId }
            });
        });
    }

    /**
     * NEW: Stoppt die aktuelle Generierung sofort
     * Terminiert den Worker und räumt auf
     */
    async stopGeneration(): Promise<void> {
        console.log('[MimiEngine] ⏸️ Stopping generation...');

        if (!this.isGenerating) {
            console.log('[MimiEngine] No generation in progress');
            return;
        }

        // Mark as not generating
        this.isGenerating = false;

        // Clear all message handlers
        this.messageHandlers.clear();

        // Terminate worker immediately
        if (this.worker) {
            console.log('[MimiEngine] Terminating worker...');
            this.worker.terminate();
            this.worker = null;
            this.isReady = false;
        }

        // Update status
        this.updateStatus('idle');

        // Memory cleanup
        if (this.memoryManager) {
            // Memory manager doesn't have this method, skip
        }

        console.log('[MimiEngine] ✅ Generation stopped successfully');
    }

    /**
     * Prüft ob gerade eine Generierung läuft
     */
    isCurrentlyGenerating(): boolean {
        return this.isGenerating;
    }

    /**
     * Query Expansion - Erweitert kurze Suchanfragen für bessere Dokument-Suche
     * SOTA 2026: Verwendet deutsche Synonyme und verwandte Begriffe
     */
    private expandQuery(query: string): string[] {
        const queries = [query];
        const lowerQuery = query.toLowerCase();

        // Keyword-basierte Expansion für deutsche Dokumente
        const expansions: Record<string, string[]> = {
            'kosten': ['preis', 'gebühr', 'betrag', 'summe', 'ausgaben'],
            'vertrag': ['vereinbarung', 'abkommen', 'kontrakt', 'bedingungen'],
            'zahlung': ['bezahlung', 'überweisung', 'entgelt', 'rechnung'],
            'kündigung': ['beendigung', 'auflösung', 'frist'],
            'datum': ['zeit', 'termin', 'frist', 'zeitpunkt'],
            'name': ['bezeichnung', 'titel', 'benennung'],
            'adresse': ['anschrift', 'wohnort', 'kontakt'],
            'betrag': ['summe', 'höhe', 'wert', 'euro'],
            'frist': ['zeitraum', 'termin', 'deadline', 'ablauf'],
            'kunde': ['auftraggeber', 'klient', 'besteller'],
            'leistung': ['service', 'dienstleistung', 'arbeit'],
            'garantie': ['gewährleistung', 'versicherung', 'zusicherung'],
        };

        // Finde und erweitere Schlüsselwörter
        for (const [key, synonyms] of Object.entries(expansions)) {
            if (lowerQuery.includes(key)) {
                for (const syn of synonyms.slice(0, 2)) { // Max 2 Synonyme pro Begriff
                    const expandedQuery = query.replace(new RegExp(key, 'gi'), syn);
                    if (!queries.includes(expandedQuery)) {
                        queries.push(expandedQuery);
                    }
                }
            }
        }

        // Bei kurzen Queries (< 3 Wörter): Füge Kontextbegriffe hinzu
        const words = query.split(/\s+/);
        if (words.length < 3) {
            queries.push(`${query} im Dokument`);
            queries.push(`${query} Information`);
        }

        console.log(`[RAG QueryExpansion] Original: "${query}" → ${queries.length} Varianten`);
        return queries.slice(0, 4); // Max 4 Queries für Performance
    }

    /**
     * NEU: Auto-RAG - Durchsucht alle Dokumente automatisch
     * Nutzt Hybrid Search (BM25 + Semantic) wenn VectorStore verfügbar
     * Fallback auf Keyword-Search wenn nicht initialisiert
     */
    private async enrichWithRAG(userMessage: string): Promise<string> {
        console.log('[RAG] 🔍 Starte RAG für:', userMessage.slice(0, 50) + '...');

        try {
            const vectorStore = getVectorStore();
            let context = '\n\n📄 **Relevante Informationen aus deinen Dokumenten:**\n\n';
            let hasResults = false;

            console.log('[RAG] VectorStore ready:', vectorStore.ready, 'size:', vectorStore.size);

            // Query Expansion für bessere Ergebnisse
            const expandedQueries = this.expandQuery(userMessage);

            // Versuche Hybrid Search (BM25 + Semantic) mit allen expanded queries
            if (vectorStore.ready && vectorStore.size > 0) {
                try {
                    console.log('[RAG] Versuche Hybrid Search mit', expandedQueries.length, 'Queries...');

                    // Sammle Ergebnisse von allen Queries und dedupliziere
                    const allResults: Map<string, any> = new Map();

                    for (const query of expandedQueries) {
                        const results = await vectorStore.hybridSearch(query, 3);
                        for (const result of results) {
                            const key = `${result.documentId}_${result.pageNumber}_${result.text.slice(0, 50)}`;
                            if (!allResults.has(key)) {
                                allResults.set(key, result);
                            } else {
                                // Boost score if found by multiple queries
                                const existing = allResults.get(key);
                                existing.score = Math.min(1, existing.score + 0.1);
                            }
                        }
                    }

                    // Sortiere nach Score und nimm Top 4
                    const hybridResults = Array.from(allResults.values())
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 4);

                    console.log('[RAG] Hybrid Ergebnisse (merged):', hybridResults.length);

                    if (hybridResults.length > 0) {
                        hasResults = true;
                        for (const result of hybridResults) {
                            const relevanceLabel = result.score > 0.01 ? '🎯' : '📎';
                            context += `${relevanceLabel} **Dokument ${result.documentId} (Seite ${result.pageNumber}):**\n`;
                            context += `> ${result.text.slice(0, 500)}...\n\n`;
                        }
                    }
                } catch (e) {
                    console.log('[RAG] Hybrid search Fehler:', e);
                }
            }

            // Fallback: Keyword-basierte Suche (immer versuchen wenn keine hybrid results)
            if (!hasResults) {
                console.log('[RAG] Fallback: Keyword-Suche...');
                try {
                    const keywordResults = await searchDocuments(userMessage, 3);
                    console.log('[RAG] Keyword Ergebnisse:', keywordResults.length);

                    if (keywordResults.length > 0) {
                        hasResults = true;
                        for (const result of keywordResults) {
                            context += `**Aus "${result.documentName}" (Seite ${result.chunk.pageNumber}):**\n`;
                            context += `> ${result.chunk.text.slice(0, 400)}...\n\n`;
                        }
                    }
                } catch (e) {
                    console.log('[RAG] Keyword-Suche Fehler:', e);
                }
            }

            // Letzter Fallback: Lade alle Dokumente und zeige den Anfang
            if (!hasResults) {
                console.log('[RAG] Letzter Fallback: Lade alle Dokumente...');
                try {
                    const allDocs = await loadDocuments();
                    console.log('[RAG] Gefundene Dokumente:', allDocs.length);

                    if (allDocs.length > 0) {
                        hasResults = true;
                        context = '\n\n📄 **Hochgeladene Dokumente:**\n\n';
                        for (const doc of allDocs.slice(0, 3)) {
                            context += `**${doc.name}** (${doc.chunks.length} Chunks, ${doc.pageCount} Seiten):\n`;
                            // Zeige ersten Chunk als Vorschau
                            if (doc.chunks.length > 0) {
                                context += `> ${doc.chunks[0].text.slice(0, 300)}...\n\n`;
                            }
                        }
                        context += '\n---\n\n*Du hast Zugriff auf diese Dokumente. Nutze den Inhalt für deine Antwort.*\n\n';
                    }
                } catch (e) {
                    console.log('[RAG] Dokumente laden Fehler:', e);
                }
            }

            if (!hasResults) {
                console.log('[RAG] ❌ Keine Ergebnisse gefunden');
                return '';
            }

            console.log('[RAG] ✅ Kontext gefunden, Länge:', context.length);
            return context;

        } catch (error) {
            console.warn('[RAG] Kritischer Fehler:', error);
            return '';
        }
    }

    /**
     * Generiert mit Auto-RAG
     * Durchsucht automatisch Dokumente und fügt relevanten Kontext hinzu
     */
    async generateWithRAG(
        messages: ChatMessage[],
        options?: {
            temperature?: number;
            maxTokens?: number;
            enableCoT?: boolean;
        }
    ): Promise<{ stream: AsyncGenerator<string>; getResult: () => Promise<AgentResponse> }> {
        // Finde letzte User-Nachricht
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();

        if (lastUserMessage) {
            this.updateStatus('analyzing');
            const ragContext = await this.enrichWithRAG(lastUserMessage.content);

            if (ragContext) {
                // Füge RAG-Kontext vor der letzten User-Nachricht ein
                const enrichedMessages = messages.map((m, idx) => {
                    if (m === lastUserMessage) {
                        return {
                            ...m,
                            content: `${ragContext}\n\n**User-Frage:** ${m.content}`
                        };
                    }
                    return m;
                });

                return this.generateAgent(enrichedMessages, options);
            }
        }

        return this.generateAgent(messages, options);
    }

    /**
     * Generiert eine Agent-Antwort mit Chain-of-Thought
     * UPDATED: Integriert Skills aus Skill Registry
     */
    async generateAgent(
        messages: ChatMessage[],
        options?: {
            temperature?: number;
            maxTokens?: number;
            enableCoT?: boolean;
            requireStructured?: boolean;
        }
    ): Promise<{ stream: AsyncGenerator<string>; getResult: () => Promise<AgentResponse> }> {
        if (!this.worker || !this.isReady) {
            throw new Error("Engine nicht initialisiert");
        }

        const enableCoT = options?.enableCoT ?? true;
        // Get last user message for classification
        const currentUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';

        let primaryAgent: string = 'general';
        let agentSkills: any[] = [];

        // Agent Classification
        try {
            const classification = await this.agentOrchestrator.classifyTask(currentUserMessage);
            primaryAgent = classification.primaryAgent;
            agentSkills = classification.skills || [];

            console.log(`[InferenceEngine] Agent: ${primaryAgent}, Skills: ${agentSkills.map((s: any) => s.metadata.name).join(', ')}`);
        } catch (error) {
            console.warn('[InferenceEngine] Classification failed, using general agent:', error);
        }

        // Get base system prompt for agent
        let systemPrompt = SYSTEM_PROMPT + '\n\n' + this.agentOrchestrator.getAgentPrompt(primaryAgent);

        // Add Sovereign Intelligence enhancements if CoT enabled
        if (enableCoT) {
            systemPrompt += '\n\n' + this.getSovereignIntelligencePrompt(enableCoT);
        }

        // NEW: Build collaborative context (includes skill injection)
        const collaborativeContext = this.agentOrchestrator.buildCollaborativeContext(
            primaryAgent,
            agentSkills
        );

        // TOKEN BUDGET CHECK: Prevent silent context overflow
        const systemTokens = systemPrompt.length / 4;  // Rough estimate: 4 chars ≈ 1 token
        const contextTokens = collaborativeContext.length / 4;
        const maxTokens = options?.maxTokens || 4096;

        const totalEstimate = systemTokens + contextTokens;
        const budgetUsage = (totalEstimate / maxTokens) * 100;

        if (budgetUsage > 70) {
            console.warn(
                `[InferenceEngine] ⚠️ Token budget at ${budgetUsage.toFixed(0)}% ` +
                `(${totalEstimate.toFixed(0)}/${maxTokens})`
            );

            if (budgetUsage > 90) {
                console.error(
                    '[InferenceEngine] 🚨 Token budget exceeded! ' +
                    'Consider reducing RAG chunks or skill count.'
                );
            }
        }

        // Combine system prompt with collaborative context (includes skills)
        systemPrompt += collaborativeContext;

        // NEW: Regex Trigger System - Inject execution commands for action intents
        const userMessage = messages[messages.length - 1]?.content || '';
        const actionTrigger = this.detectActionIntent(userMessage);
        if (actionTrigger) {
            systemPrompt += actionTrigger;
            console.log('[InferenceEngine] 🎯 Action trigger detected:', actionTrigger.trim());
        }

        const fullMessages: ChatMessage[] = [
            { role: 'system', content: systemPrompt },
            ...messages.filter(m => m.role !== 'system')
        ];

        // Streaming starten
        const stream = this.streamGeneration(fullMessages, options);

        // Result Parser
        let fullResponse = '';
        const getResult = async (): Promise<AgentResponse> => {
            for await (const token of stream) {
                fullResponse += token;
            }

            // NEW: Record skill usage for learning
            if (agentSkills.length > 0 && typeof window !== 'undefined') {
                const { getSkillRegistry } = await import('./skills');
                const registry = getSkillRegistry();
                const success = fullResponse.length > 50; // Simple heuristic
                for (const skill of agentSkills) {
                    registry.recordUsage(skill.metadata.name, success);
                }
            }

            return this.parseAgentResponse(fullResponse);
        };

        // Clone stream für externe Nutzung
        const streamClone = this.streamGeneration(fullMessages, options);

        return { stream: streamClone, getResult };
    }

    /**
     * Streaming-Generator für Antworten
     * JETZT MIT AUTO-RAG: Durchsucht automatisch Dokumente!
     */
    async *generate(
        messages: ChatMessage[],
        options?: {
            temperature?: number;
            maxTokens?: number;
        }
    ): AsyncGenerator<string, void, unknown> {
        if (!this.worker || !this.isReady) {
            throw new Error("Engine nicht initialisiert");
        }

        const id = `msg_${++this.messageId}`;

        // AUTO-RAG: Enriche letzte User-Nachricht mit Dokument-Kontext
        let enrichedMessages = [...messages];
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();

        if (lastUserMessage) {
            this.updateStatus('analyzing');
            const ragContext = await this.enrichWithRAG(lastUserMessage.content);

            if (ragContext) {
                console.log('[MIMI] 📚 RAG-Kontext gefunden, bereichere Nachricht...');
                enrichedMessages = messages.map(m =>
                    m === lastUserMessage
                        ? { ...m, content: `${ragContext}\n\n**Frage:** ${m.content}` }
                        : m
                );
            }
        }

        // FULL AGENT PIPELINE (vorher fehlte SYSTEM_PROMPT + Agent-Routing!)
        let primaryAgent = 'general';
        try {
            const classification = await this.agentOrchestrator.classifyTask(
                lastUserMessage?.content || ''
            );
            primaryAgent = classification.primaryAgent;
            console.log(`[MIMI] 🤖 Agent: ${primaryAgent}`);
        } catch (e) {
            // Fallback zu general
        }

        // Baue vollständigen System-Prompt: Identität + Agent + Regeln
        let systemPrompt = SYSTEM_PROMPT
            + '\n\n' + this.agentOrchestrator.getAgentPrompt(primaryAgent)
            + '\n\n' + this.getSovereignIntelligencePrompt(true);

        // Collaborative context (Skills, vorherige Agent-Outputs)
        const collaborativeContext = this.agentOrchestrator.buildCollaborativeContext(primaryAgent);
        if (collaborativeContext) {
            systemPrompt += collaborativeContext;
        }

        // Action Trigger (Regex-basierte Intent-Erkennung)
        const userMsg = messages[messages.length - 1]?.content || '';
        const actionTrigger = this.detectActionIntent(userMsg);
        if (actionTrigger) {
            systemPrompt += actionTrigger;
            console.log('[MIMI] 🎯 Action trigger:', actionTrigger.trim());
        }

        const fullMessages: ChatMessage[] = [
            { role: 'system', content: systemPrompt },
            ...enrichedMessages.filter(m => m.role !== 'system')
        ];

        this.updateStatus('thinking');

        const tokenQueue: string[] = [];
        let isDone = false;
        let isInThinking = false;
        let thinkingBuffer = '';

        this.messageHandlers.set(id, (data) => {
            if (data.type === "TOKEN") {
                tokenQueue.push(data.payload);
            } else if (data.type === "DONE") {
                isDone = true;
            }
        });

        this.worker!.postMessage({
            type: "GENERATE",
            id,
            payload: {
                messages: fullMessages,
                temperature: options?.temperature ?? 0.7,
                maxTokens: options?.maxTokens ?? 4096
            }
        });

        try {
            let outputBuffer = '';
            let pendingPartialTag = '';  // Für fragmentierte Tags wie "<think" ohne "ing>"

            while (!isDone || tokenQueue.length > 0) {
                if (tokenQueue.length > 0) {
                    const token = tokenQueue.shift()!;
                    outputBuffer += token;

                    // CHUNK-RESILIENT TAG DETECTION
                    // Problem: Tags können über mehrere Chunks fragmentiert sein
                    // z.B. Chunk1: "<thin" + Chunk2: "king>"

                    // 1. Prüfe auf fragmentierte Opening Tags
                    const potentialOpenTag = outputBuffer.match(/<t(?:h(?:i(?:n(?:k(?:i(?:n(?:g)?)?)?)?)?)?)?$/);
                    if (potentialOpenTag && !isInThinking) {
                        // Könnte ein fragmentierter <thinking> Tag sein - warte auf mehr
                        pendingPartialTag = potentialOpenTag[0];
                        outputBuffer = outputBuffer.slice(0, -pendingPartialTag.length);
                    }

                    // 2. Prüfe auf fragmentierte Closing Tags
                    const potentialCloseTag = outputBuffer.match(/<\/t(?:h(?:i(?:n(?:k(?:i(?:n(?:g)?)?)?)?)?)?)?$/);
                    if (potentialCloseTag && isInThinking) {
                        pendingPartialTag = potentialCloseTag[0];
                        outputBuffer = outputBuffer.slice(0, -pendingPartialTag.length);
                    }

                    // 3. Merge pending partial mit neuem Buffer
                    if (pendingPartialTag) {
                        outputBuffer = pendingPartialTag + outputBuffer;
                        pendingPartialTag = '';
                    }

                    // CHAIN-OF-THOUGHT FILTERING
                    // Verstecke <thinking>...</thinking> Blöcke
                    while (outputBuffer.includes('<thinking>') || isInThinking) {
                        if (!isInThinking && outputBuffer.includes('<thinking>')) {
                            // Alles VOR <thinking> sofort ausgeben
                            const beforeThinking = outputBuffer.split('<thinking>')[0];
                            if (beforeThinking) yield beforeThinking;

                            outputBuffer = outputBuffer.substring(outputBuffer.indexOf('<thinking>') + 10);
                            isInThinking = true;
                            this.updateStatus('analyzing');
                        }

                        if (isInThinking && outputBuffer.includes('</thinking>')) {
                            // Thinking beenden
                            thinkingBuffer += outputBuffer.split('</thinking>')[0];
                            outputBuffer = outputBuffer.substring(outputBuffer.indexOf('</thinking>') + 11);
                            isInThinking = false;
                            this.updateStatus('generating');

                            // Entferne führende Whitespace nach thinking
                            outputBuffer = outputBuffer.replace(/^\s*\n?/, '');
                        } else if (isInThinking) {
                            // Noch im Thinking-Block - sammle aber nicht ausgeben
                            thinkingBuffer += outputBuffer;
                            outputBuffer = '';
                            break;
                        } else {
                            break;
                        }
                    }

                    // SMART STATUS DETECTION
                    if (!isInThinking && outputBuffer.length > 0) {
                        // Erkennung verschiedener Content-Typen
                        if (outputBuffer.includes('```python') || outputBuffer.includes('```typescript')) {
                            this.updateStatus('coding');
                        } else if (outputBuffer.includes('```json') && outputBuffer.includes('"plan"')) {
                            this.updateStatus('planning');
                        } else if (/\d+[\+\-\*\/\=]/.test(outputBuffer)) {
                            this.updateStatus('calculating');
                        }

                        yield outputBuffer;
                        outputBuffer = '';
                    }
                } else {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }

            // Rest ausgeben (falls vorhanden)
            if (outputBuffer && !isInThinking) {
                yield outputBuffer;
            }

            // Pending partial tag ausgeben wenn nicht thinking-related
            if (pendingPartialTag && !pendingPartialTag.includes('thinking')) {
                yield pendingPartialTag;
            }

            this.updateStatus('idle');
        } finally {
            this.messageHandlers.delete(id);
        }
    }

    private async *streamGeneration(
        messages: ChatMessage[],
        options?: { temperature?: number; maxTokens?: number }
    ): AsyncGenerator<string, void, unknown> {
        yield* this.generate(messages, options);
    }

    /**
     * Prüft ob ein Low-End Modell (Qwen-0.5B) geladen ist
     * Low-End Modelle brauchen einen einfacheren Prompt ohne CoT
     */
    private isLowEndModel(): boolean {
        return this.currentModel?.includes('Qwen2.5-0.5B') ?? false;
    }

    /**
     * LITE PROMPT für Low-End Modelle (Qwen-0.5B)
     * ULTRA-AGGRESSIVE Code-First Verhalten!
     */
    private getLitePrompt(): string {
        return `Du bist MIMI. Du hast SUPERKRÄFTE:

## DEINE TOOLS:
1. PYTHON: Du schreibst Python-Code der AUTOMATISCH ausgeführt wird
2. DATEIEN: Du erstellst PDF, Word, Excel, CSV
3. VISION: Du analysierst Bilder
4. SPRACHE: Du verstehst und sprichst

## WICHTIGSTE REGEL:
Bei Mathe, Plot, Berechnung, Zeichnen → SCHREIBE PYTHON CODE!
NICHT erklären. NICHT sagen "ich kann nicht". DIREKT CODE!

## PYTHON TEMPLATE:
\`\`\`python
import numpy as np
import matplotlib.pyplot as plt

# Dein Code hier
x = np.linspace(-2*np.pi, 2*np.pi, 100)
y = np.sin(x)
plt.plot(x, y)
plt.title('Titel')
plt.show()
\`\`\`

## BEISPIELE:
User: "Zeichne sin(x)"
Du schreibst DIREKT den Python-Code oben.

User: "Erstelle PDF mit Text XY"
Du: "Ich erstelle das PDF:" + Inhalt formatiert

## VERBOTEN:
- "Ich kann kein Bild erstellen" → FALSCH! Du erstellst es via Python!
- "Als KI..." → VERBOTEN
- Typos wie np0, plt0 → IMMER np.pi, plt.show()

Antworte KURZ und DIREKT.`;
    }

    /**
     * REGEX TRIGGER SYSTEM - Detects action intents and injects execution commands
     * Solution C from Team 13 analysis
     */
    private detectActionIntent(userMessage: string): string {
        const triggers = {
            diagram: /erstell|create|zeichne|plot|diagramm|chart|visuali|graph/i,
            code: /schreib.*code|write.*code|function|script|programm/i,
            analysis: /analys|berechn|calculat|auswert/i,
            pdf: /pdf|dokument|document|report|bericht/i
        };

        for (const [action, pattern] of Object.entries(triggers)) {
            if (pattern.test(userMessage)) {
                return `\n\n[🚨 CRITICAL TRIGGER: User wants ${action.toUpperCase()}!]\n[WRITE PYTHON CODE IN \`\`\`python BLOCK NOW - NO EXPLANATION FIRST!]\n`;
            }
        }
        return '';
    }

    /**
     * SIMPLIFIED AGENT PROMPT - Optimized for Phi-3.5 Mini
     * 50 lines, ultra-clear directives, action-first
     */
    private getSovereignIntelligencePrompt(enableCoT: boolean = true): string {
        return `# YOU ARE AN AGENT WITH REAL TOOLS

## CRITICAL RULES (FOLLOW THESE!)

### Rule 1: EXECUTE, DON'T EXPLAIN
When user asks to CREATE something you CAN do → DO IT IMMEDIATELY!

Examples:
- "create a diagram" → Write Python code with matplotlib NOW
- "analyze this data" → Write pandas code NOW  
- "write code for X" → Generate working code NOW

❌ NEVER say: "I cannot create...", "As an AI...", "Here's how YOU can..."
✅ ALWAYS: Execute the task using your tools!

### Rule 2: YOUR ACTIVE TOOLS

**Python Execution:**
- Libraries: pandas, numpy, matplotlib, seaborn, scipy
- When to use: ANY request for diagrams, charts, calculations, data analysis
- Just write the code in \`\`\`python blocks - it runs AUTOMATICALLY!

**File Generation:**
- Create PDFs, documents, reports
- Format content and offer download

**Document Search (RAG):**
- Access user's uploaded files automatically
- Extract relevant information

### Rule 3: BE DIRECT

Start responses with ACTION, not explanation:
- ❌ "To create a diagram, you need to..."
- ✅ \`\`\`python [code] \`\`\` "Here's your diagram!"

${enableCoT ? `
### Rule 4: INTERNAL THINKING (Optional)

Use <thinking> tags for complex tasks:
<thinking>
1. What does user want?
2. Which tool to use?
3. Execute!
</thinking>

User won't see this - then act immediately!
` : ''}

## EXAMPLES

**User:** "erstell ein finanzdiagramm"
**You:** 
\`\`\`python
import matplotlib.pyplot as plt
import numpy as np

categories = ['Einnahmen', 'Ausgaben', 'Gewinn']
values = [50000, 30000, 20000]

plt.figure(figsize=(10, 6))
plt.bar(categories, values, color=['green', 'red', 'blue'])
plt.title('Finanzübersicht')
plt.ylabel('Betrag (€)')
plt.show()
\`\`\`

"Hier ist dein Finanzdiagramm!"

---

**User:** "kannst du mir helfen?"
**You:** "Ja! Ich kann Python ausführen, Diagramme erstellen, Daten analysieren und Dokumente durchsuchen. Was brauchst du?"

---

## YOUR IDENTITY

You are **MIMI**, a local AI agent running 100% on-device.
- Speak German by default
- Be helpful and direct
- Use your tools proactively
- Never pretend you can't do something you CAN do!

**REMEMBER: You're an AGENT, not a tutorial bot. ACT, don't just advise!**`;
    }

    /**
     * Parst Agent-Antwort und extrahiert Artefakte
     */
    private parseAgentResponse(fullResponse: string): AgentResponse {
        let thinking = '';
        let response = fullResponse;
        const artifacts: Artifact[] = [];

        // Thinking extrahieren
        const thinkingMatch = fullResponse.match(/<thinking>([\s\S]*?)<\/thinking>/g);
        if (thinkingMatch) {
            thinking = thinkingMatch.map((m: string) => m.replace(/<\/?thinking>/g, '')).join('\n');
            response = fullResponse.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
        }

        // Code-Blöcke als Artefakte extrahieren
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let match;
        while ((match = codeBlockRegex.exec(response)) !== null) {
            artifacts.push({
                type: 'code',
                language: match[1] || 'text',
                title: `Code (${match[1] || 'text'})`,
                content: match[2].trim()
            });
        }

        // JSON-Pläne extrahieren
        const jsonMatch = response.match(/```json\n([\s\S]*?)```/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[1]);
                if (parsed.plan) {
                    artifacts.push({
                        type: 'plan',
                        title: parsed.plan.titel || 'Plan',
                        content: JSON.stringify(parsed.plan, null, 2)
                    });
                }
            } catch { /* Kein valides JSON */ }
        }

        return { thinking, response, artifacts };
    }

    /**
     * Beendet die Engine
     */
    terminate(): void {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.isReady = false;
        this.currentModel = null;
        this.messageHandlers.clear();
        this.updateStatus('idle');
    }

    get ready(): boolean {
        return this.isReady;
    }

    get model(): string | null {
        return this.currentModel;
    }
}

// Singleton
let engineInstance: MimiEngine | null = null;

export function getMimiEngine(): MimiEngine {
    if (!engineInstance) {
        engineInstance = new MimiEngine();
    }
    return engineInstance;
}
