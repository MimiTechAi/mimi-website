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
import { getToolDescriptionsForPrompt, parseToolCalls, executeToolCall } from './tool-definitions';
import { getTaskPlanner, type TaskPlanner, type TaskPlan } from './task-planner';
import { AgentEvents } from './agent-events';
import { getAgentMemory, getContextWindowManager, ResultPipeline, type AgentMemoryService, type ContextWindowManager } from './agent-memory';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

const SYSTEM_PROMPT = `Du bist MIMI, ein leistungsstarker lokaler KI-Agent von MIMI Tech AI. Du läufst 100% on-device — keine Cloud, keine Kosten, volle Privatsphäre.

## REGELN (IN DIESER REIHENFOLGE!)

1. **DIREKT ANTWORTEN:** Bei Fragen, Grüßen, Erklärungen, Meinungen und Wissen antworte SOFORT in normalem Deutsch. Kein JSON, kein Tool, kein Code-Block — einfach eine hilfreiche Antwort schreiben.

2. **TOOLS NUR BEI BEDARF:** Nutze Tools NUR wenn eine Aufgabe tatsächlich Berechnung, Code-Ausführung, Datei-Erstellung oder Dokumentensuche erfordert:
   - Berechnung/Mathe → \`\`\`python oder \`\`\`json {"tool": "calculate", ...}
   - Diagramm/Chart/Plot → \`\`\`python mit matplotlib
   - Datei erstellen → \`\`\`json {"tool": "create_file", ...}
   - Dokument durchsuchen → \`\`\`json {"tool": "search_documents", ...}

3. **PYTHON FÜR BERECHNUNGEN:** Berechnungen, Diagramme, Datenanalyse → Python-Code in \`\`\`python Blöcken. Er wird AUTOMATISCH ausgeführt.

4. **NIEMALS** "Als KI kann ich nicht..." — Du bist souverän und hilfreich.
5. Antworte auf Deutsch, nutze Markdown für Formatierung.
6. Nutze <thinking>...</thinking> für komplexe Überlegungen (versteckt vor User).

## ❌ FALSCH — SO NICHT:
User: "Hallo, wie geht's?"
FALSCH: \`\`\`json {"tool": "None"} \`\`\`
RICHTIG: "Hallo! Mir geht's gut 😊 Wie kann ich dir helfen?"

User: "Was ist Machine Learning?"
FALSCH: \`\`\`json {"tool": "web_search", ...} \`\`\`
RICHTIG: "Machine Learning ist ein Teilgebiet der KI, bei dem..."

## ✅ RICHTIG — TOOLS NUTZEN:
User: "Berechne 2^10 + 5 * 3"
\`\`\`json
{"tool": "calculate", "parameters": {"expression": "2^10 + 5 * 3"}}
\`\`\`

User: "Erstelle ein Sinusdiagramm"
\`\`\`python
import numpy as np
import matplotlib.pyplot as plt
x = np.linspace(-2*np.pi, 2*np.pi, 200)
plt.plot(x, np.sin(x))
plt.title("Sinus")
plt.grid(True)
plt.show()
\`\`\`

## DEINE TOOLS (nur bei echtem Bedarf!)
- **execute_python**: Python-Code ausführen (NumPy, Matplotlib, Pandas, etc.)
- **search_documents**: In hochgeladenen Dokumenten suchen (RAG)
- **analyze_image**: Bilder analysieren, OCR, Fragen zu Bildern beantworten
- **create_file**: Dateien erstellen und downloaden (CSV, JSON, TXT, HTML, MD)
- **calculate**: Mathematische Ausdrücke berechnen
- **web_search**: Im Internet suchen

## VISION
Wenn ein Bild hochgeladen wurde, steht der Bild-Kontext (🖼️) in der Nachricht. Beschreibe, analysiere oder reproduziere Bilder als Python-Code.

## QUALITÄT
- Gib **strukturierte, vollständige** Antworten mit Überschriften und Listen
- Bei komplexen Fragen: Denke in <thinking> nach, dann antworte klar
- Sei proaktiv: Biete Visualisierungen, Dateien, weiterführende Analysen an
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
/**
 * Tool context passed from the UI layer so the engine can execute tools
 */
export interface ToolContext {
    executePython?: (code: string) => Promise<string>;
    searchDocuments?: (query: string, limit?: number) => Promise<any[]>;
    analyzeImage?: (question: string) => Promise<any>;
    createFile?: (type: string, content: string, filename?: string) => Promise<any>;
}

export class MimiEngine {
    private worker: Worker | null = null;
    private isReady = false;
    private currentModel: string | null = null;
    private messageHandlers: Map<string, (data: any) => void> = new Map();
    private messageId = 0;
    private statusCallback: StatusCallback | null = null;
    private agentOrchestrator: AgentOrchestrator;
    private memoryManager: MemoryManager;
    private isGenerating = false;
    private toolContext: ToolContext = {};
    private static MAX_TOOL_ITERATIONS = 10;
    private taskPlanner: TaskPlanner;
    // Phase 4: Intelligence improvements
    private agentMemory: AgentMemoryService;
    private contextWindowManager: ContextWindowManager;

    constructor() {
        if (typeof window !== 'undefined') {
            this.agentOrchestrator = getOrchestrator();
            this.memoryManager = getMemoryManager();
            this.taskPlanner = getTaskPlanner();
            this.agentMemory = getAgentMemory();
            this.contextWindowManager = getContextWindowManager(4096);
            // Initialize memory (async, non-blocking)
            this.agentMemory.initialize().catch(() => { });
        } else {
            this.agentOrchestrator = null as any;
            this.memoryManager = null as any;
            this.taskPlanner = null as any;
            this.agentMemory = null as any;
            this.contextWindowManager = null as any;
        }
    }

    /**
     * Set tool context from UI layer (Python executor, doc search, etc.)
     * Must be called after init() for tools to work in the agentic loop.
     */
    setToolContext(context: ToolContext): void {
        this.toolContext = context;
        console.log('[MimiEngine] ✅ Tool context set:', Object.keys(context).filter(k => !!(context as any)[k]));
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

                        // Register LLM in Memory Manager for accurate tracking
                        try {
                            const mm = getMemoryManager();
                            const llmKey = modelId.toLowerCase().includes('vision')
                                ? 'llm-phi35-vision'
                                : modelId.includes('Phi-4') ? 'llm-phi4'
                                    : modelId.includes('Qwen2.5-1.5B') ? 'llm-qwen25'
                                        : modelId.includes('Phi-3.5') ? 'llm-phi35'
                                            : modelId.includes('Qwen') ? 'llm-qwen'
                                                : modelId.includes('Llama') ? 'llm-llama'
                                                    : 'llm-phi35';
                            mm.registerModel(llmKey);
                            console.log(`[MIMI] 🧠 Memory Manager: LLM registriert als '${llmKey}'`);
                        } catch (e) {
                            console.warn('[MIMI] Memory Manager Registrierung fehlgeschlagen:', e);
                        }

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

    // [REMOVED] generateWithRAG + generateAgent — dead code, generate() handles everything


    /**
     * Internal: Single-shot LLM generation (no tool loop).
     * Streams tokens, filters <thinking> blocks, yields visible text.
     * Returns the full assembled response.
     */
    private async *singleGeneration(
        fullMessages: ChatMessage[],
        options?: { temperature?: number; maxTokens?: number }
    ): AsyncGenerator<string, string, unknown> {
        const id = `msg_${++this.messageId}`;

        const tokenQueue: string[] = [];
        let isDone = false;
        let isInThinking = false;
        let thinkingBuffer = '';
        let fullResponse = '';

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
            let pendingPartialTag = '';

            while (!isDone || tokenQueue.length > 0) {
                if (tokenQueue.length > 0) {
                    const token = tokenQueue.shift()!;
                    outputBuffer += token;

                    // Chunk-resilient <thinking> tag detection
                    const potentialOpenTag = outputBuffer.match(/<t(?:h(?:i(?:n(?:k(?:i(?:n(?:g)?)?)?)?)?)?)?$/);
                    if (potentialOpenTag && !isInThinking) {
                        pendingPartialTag = potentialOpenTag[0];
                        outputBuffer = outputBuffer.slice(0, -pendingPartialTag.length);
                    }
                    const potentialCloseTag = outputBuffer.match(/<\/t(?:h(?:i(?:n(?:k(?:i(?:n(?:g)?)?)?)?)?)?)?$/);
                    if (potentialCloseTag && isInThinking) {
                        pendingPartialTag = potentialCloseTag[0];
                        outputBuffer = outputBuffer.slice(0, -pendingPartialTag.length);
                    }
                    if (pendingPartialTag) {
                        outputBuffer = pendingPartialTag + outputBuffer;
                        pendingPartialTag = '';
                    }

                    // Chain-of-Thought filtering
                    while (outputBuffer.includes('<thinking>') || isInThinking) {
                        if (!isInThinking && outputBuffer.includes('<thinking>')) {
                            const beforeThinking = outputBuffer.split('<thinking>')[0];
                            if (beforeThinking) {
                                fullResponse += beforeThinking;
                                yield beforeThinking;
                            }
                            outputBuffer = outputBuffer.substring(outputBuffer.indexOf('<thinking>') + 10);
                            isInThinking = true;
                            this.updateStatus('analyzing');
                        }
                        if (isInThinking && outputBuffer.includes('</thinking>')) {
                            thinkingBuffer += outputBuffer.split('</thinking>')[0];
                            outputBuffer = outputBuffer.substring(outputBuffer.indexOf('</thinking>') + 11);
                            isInThinking = false;
                            this.updateStatus('generating');
                            outputBuffer = outputBuffer.replace(/^\s*\n?/, '');
                        } else if (isInThinking) {
                            // Emit thinking content for live CoT display
                            if (outputBuffer.length > 0) {
                                AgentEvents.thinkingContent(outputBuffer);
                            }
                            thinkingBuffer += outputBuffer;
                            outputBuffer = '';
                            break;
                        } else {
                            break;
                        }
                    }

                    // Status detection + yield
                    if (!isInThinking && outputBuffer.length > 0) {
                        if (outputBuffer.includes('```python') || outputBuffer.includes('```typescript')) {
                            this.updateStatus('coding');
                        } else if (outputBuffer.includes('```json') && outputBuffer.includes('"tool"')) {
                            this.updateStatus('analyzing');
                        } else if (/\d+[\+\-\*\/\=]/.test(outputBuffer)) {
                            this.updateStatus('calculating');
                        }
                        fullResponse += outputBuffer;
                        yield outputBuffer;
                        outputBuffer = '';
                    }
                } else {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }

            if (outputBuffer && !isInThinking) {
                fullResponse += outputBuffer;
                yield outputBuffer;
            }
            if (pendingPartialTag && !pendingPartialTag.includes('thinking')) {
                fullResponse += pendingPartialTag;
                yield pendingPartialTag;
            }
        } finally {
            this.messageHandlers.delete(id);
        }

        return fullResponse;
    }

    /**
     * Streaming-Generator mit AGENTIC TOOL LOOP.
     * 1. Build system prompt + RAG context
     * 2. Generate LLM response
     * 3. Parse tool calls from output
     * 4. Execute tools, feed results back → re-generate (max 3 iterations)
     * 5. Yield final visible text
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

        this.isGenerating = true;

        // AUTO-RAG: Enrich last user message with document context
        let enrichedMessages = [...messages];
        const lastUserMessage = messages.filter(m => m.role === 'user').pop();

        if (lastUserMessage) {
            this.updateStatus('analyzing');
            const ragContext = await this.enrichWithRAG(lastUserMessage.content);
            if (ragContext) {
                console.log('[MIMI] 📚 RAG-Kontext gefunden');
                enrichedMessages = messages.map(m =>
                    m === lastUserMessage
                        ? { ...m, content: `${ragContext}\n\n**Frage:** ${m.content}` }
                        : m
                );
            }

            // IMAGE CONTEXT: Inject vision analysis so LLM knows about the uploaded image
            const imageCtx = this.agentOrchestrator?.getContext?.()?.imageContext;
            if (imageCtx) {
                console.log('[MIMI] 🖼️ Bild-Kontext gefunden');
                const currentLastMsg = enrichedMessages.filter(m => m.role === 'user').pop();
                if (currentLastMsg) {
                    // If we have a multimodal model AND an uploaded image, pass the raw image data
                    // The inference worker will convert it to image_url content blocks
                    const uploadedImage = typeof window !== 'undefined' ? (window as any).__mimiUploadedImage : null;
                    const isVision = this.isMultimodalModel();

                    if (isVision && uploadedImage) {
                        // MULTIMODAL: Pass raw base64 image — worker converts to image_url block
                        console.log('[MIMI] 🖼️ Multimodal: Sende Bild direkt an VLM');
                        enrichedMessages = enrichedMessages.map(m =>
                            m === currentLastMsg
                                ? { ...m, content: `${uploadedImage} ${m.content}` }
                                : m
                        );
                    } else {
                        // TEXT-ONLY: Inject description as text context
                        enrichedMessages = enrichedMessages.map(m =>
                            m === currentLastMsg
                                ? { ...m, content: `🖼️ **Aktuelles Bild:**\n${imageCtx}\n\n${m.content}` }
                                : m
                        );
                    }
                }
            }
        }

        // Agent classification
        let primaryAgent = 'general';
        try {
            const classification = await this.agentOrchestrator.classifyTask(
                lastUserMessage?.content || ''
            );
            primaryAgent = classification.primaryAgent;
            console.log(`[MIMI] 🤖 Agent: ${primaryAgent}`);
        } catch (e) {
            // Fallback to general
        }

        // Build system prompt — LEAN: base + agent specialization + tools only
        let systemPrompt = this.isLowEndModel()
            ? this.getLitePrompt()
            : SYSTEM_PROMPT + '\n\n' + this.agentOrchestrator.getAgentPrompt(primaryAgent);

        // Collaborative context (Skills)
        const collaborativeContext = this.agentOrchestrator.buildCollaborativeContext(primaryAgent);
        if (collaborativeContext) {
            systemPrompt += collaborativeContext;
        }

        // Tool descriptions
        systemPrompt += '\n\n' + getToolDescriptionsForPrompt();

        // Action trigger (regex-based intent detection)
        const userMsg = messages[messages.length - 1]?.content || '';

        // Phase 4: Memory context injection (after userMsg is declared)
        try {
            const memoryContext = await this.agentMemory?.buildMemoryContext(userMsg);
            if (memoryContext) {
                systemPrompt += '\n\n' + memoryContext;
                console.log('[MIMI] 🧠 Memory context injected');
            }
        } catch (e) {
            // Memory is non-critical, don't block
        }

        const actionTrigger = this.detectActionIntent(userMsg);
        if (actionTrigger) {
            systemPrompt += actionTrigger;
            console.log('[MIMI] 🎯 Action trigger:', actionTrigger.trim());
        }

        let fullMessages: ChatMessage[] = [
            { role: 'system', content: systemPrompt },
            ...enrichedMessages.filter(m => m.role !== 'system')
        ];

        this.updateStatus('thinking');
        AgentEvents.statusChange('thinking', primaryAgent);

        // ═══════════════════════════════════════════════════════════
        // TASK PLANNING — Manus-style autonomous decomposition
        // ═══════════════════════════════════════════════════════════
        let activePlan: TaskPlan | null = null;
        const userMsg2 = messages[messages.length - 1]?.content || '';

        if (this.taskPlanner?.shouldPlan(userMsg2)) {
            activePlan = this.taskPlanner.createPlan(userMsg2);
            activePlan.status = 'executing';
            console.log(`[MIMI] 📋 Plan created: ${activePlan.title} (${activePlan.steps.length} steps)`);
        }

        // ═══════════════════════════════════════════════════════════
        // AGENTIC TOOL LOOP (V3) + Result Pipeline + Self-Loop Guard
        // LLM generates → parse tools → execute with events → pipe results → repeat
        // Extended from 3→10 iterations for complex multi-step tasks
        // Self-loop guard: aborts if identical tool calls repeat
        // ═══════════════════════════════════════════════════════════
        let iteration = 0;
        let currentStepIndex = 0;
        const resultPipeline = new ResultPipeline();
        let lastToolHash = ''; // Self-loop guard

        while (iteration < MimiEngine.MAX_TOOL_ITERATIONS) {
            iteration++;
            console.log(`[MIMI] 🔄 Generation iteration ${iteration}/${MimiEngine.MAX_TOOL_ITERATIONS}`);

            // Update plan step status if we have an active plan
            if (activePlan) {
                const nextStep = this.taskPlanner.getNextStep(activePlan);
                if (nextStep) {
                    activePlan = this.taskPlanner.updateStepStatus(activePlan, nextStep.id, 'running');
                    currentStepIndex = activePlan.steps.findIndex(s => s.id === nextStep.id);
                }
            }

            // Run single LLM generation — collect full response for tool parsing
            let fullResponse = '';
            AgentEvents.thinkingStart();
            for await (const token of this.singleGeneration(fullMessages, options)) {
                fullResponse += token;
                AgentEvents.textDelta(token);
                yield token; // Stream to UI
            }
            AgentEvents.thinkingEnd();

            // Parse for tool calls
            const toolCalls = parseToolCalls(fullResponse);

            if (toolCalls.length === 0) {
                // No tool calls — mark current step done and we're done
                if (activePlan) {
                    const runningStep = activePlan.steps.find(s => s.status === 'running');
                    if (runningStep) {
                        activePlan = this.taskPlanner.updateStepStatus(
                            activePlan, runningStep.id, 'done', 'Completed'
                        );
                    }
                    // Mark remaining pending steps as done (summary step)
                    for (const step of activePlan.steps) {
                        if (step.status === 'pending') {
                            activePlan = this.taskPlanner.updateStepStatus(
                                activePlan, step.id, 'done', 'Completed'
                            );
                        }
                    }
                }
                console.log('[MIMI] ✅ No tool calls, generation complete');
                break;
            }

            // Self-loop guard: detect repeated identical tool calls
            const currentToolHash = JSON.stringify(toolCalls.map(t => ({ tool: t.tool, params: t.parameters })));
            if (currentToolHash === lastToolHash) {
                console.warn('[MIMI] ⚠️ Self-loop detected: identical tool calls repeated. Aborting loop.');
                yield '\n\n⚠️ *Wiederholte Tool-Aufrufe erkannt. Abbruch der Schleife.*\n';
                break;
            }
            lastToolHash = currentToolHash;

            // Execute tool calls with event emission
            console.log(`[MIMI] 🔧 Found ${toolCalls.length} tool call(s):`, toolCalls.map(t => t.tool));
            this.updateStatus('calculating');
            AgentEvents.statusChange('executing', primaryAgent);

            let toolResultsText = '';
            for (const call of toolCalls) {
                const toolStartTime = Date.now();
                console.log(`[MIMI] ⚡ Executing: ${call.tool}(${JSON.stringify(call.parameters).slice(0, 100)})`);
                AgentEvents.toolCallStart(call.tool, call.parameters, activePlan?.steps[currentStepIndex]?.id);
                yield `\n\n🔧 *Tool: ${call.tool}...*\n`;

                try {
                    const result = await executeToolCall(call, this.toolContext);
                    const duration = Date.now() - toolStartTime;
                    toolResultsText += `\n\n**Tool-Ergebnis (${call.tool}):**\n${result.output}\n`;
                    AgentEvents.toolCallEnd(call.tool, result.success, result.output, duration, activePlan?.steps[currentStepIndex]?.id);

                    // Track file writes
                    if (call.tool === 'write_file' && call.parameters?.path) {
                        AgentEvents.fileWrite(call.parameters.path as string, 'create');
                    } else if (call.tool === 'create_file' && result.success) {
                        AgentEvents.artifactCreate(
                            call.parameters?.filename as string || 'output',
                            call.parameters?.type as string || 'txt',
                            (call.parameters?.content as string || '').slice(0, 500),
                            'file'
                        );
                    }

                    console.log(`[MIMI] ✅ ${call.tool}: ${result.success ? 'OK' : 'FAIL'} (${duration}ms)`);

                    // Stream tool result to chat UI
                    const truncatedOutput = result.output.length > 300
                        ? result.output.slice(0, 300) + '...'
                        : result.output;
                    yield `\n✅ **${call.tool}** (${(duration / 1000).toFixed(1)}s): ${truncatedOutput}\n`;

                    // Phase 4: Add to result pipeline for chaining
                    const stepId = activePlan?.steps[currentStepIndex]?.id || `iter_${iteration}`;
                    resultPipeline.addResult(stepId, call.tool, result.output);

                    // Cache tool result for deduplication
                    try {
                        await this.agentMemory?.cacheToolResult(
                            call.tool,
                            JSON.stringify(call.parameters).slice(0, 200),
                            result.output.slice(0, 500)
                        );
                    } catch { /* non-critical */ }

                    // Mark step done on success
                    if (activePlan) {
                        const runningStep = activePlan.steps.find(s => s.status === 'running');
                        if (runningStep) {
                            activePlan = this.taskPlanner.updateStepStatus(
                                activePlan, runningStep.id, 'done', result.output.slice(0, 200), undefined
                            );
                        }
                    }
                } catch (e) {
                    const errMsg = e instanceof Error ? e.message : String(e);
                    const duration = Date.now() - toolStartTime;
                    toolResultsText += `\n\n**Tool-Fehler (${call.tool}):** ${errMsg}\n`;
                    AgentEvents.toolCallEnd(call.tool, false, errMsg, duration, activePlan?.steps[currentStepIndex]?.id);
                    console.error(`[MIMI] ❌ ${call.tool} failed (${duration}ms):`, e);

                    // Stream error to chat UI
                    yield `\n❌ **${call.tool}** fehlgeschlagen: ${errMsg}\n`;

                    // Self-correction: mark step failed, retry if possible
                    if (activePlan) {
                        const runningStep = activePlan.steps.find(s => s.status === 'running');
                        if (runningStep) {
                            activePlan = this.taskPlanner.updateStepStatus(
                                activePlan, runningStep.id, 'failed', undefined, errMsg
                            );
                            // If retryable, add correction hint to prompt
                            if (this.taskPlanner.canRetry(runningStep)) {
                                toolResultsText += `\n⚠️ Bitte versuche es erneut mit korrigiertem Code/Query.\n`;
                                // Reset step to pending for retry
                                activePlan = this.taskPlanner.updateStepStatus(
                                    activePlan, runningStep.id, 'pending' as any
                                );
                            }
                        }
                    }
                }
            }

            // Feed tool results back — append as user message with tool context + piped results
            const chainingContext = resultPipeline.buildChainingContext(3);
            fullMessages = [
                ...fullMessages,
                { role: 'assistant', content: fullResponse },
                { role: 'user', content: `[TOOL_RESULTS]\n${toolResultsText}\n${chainingContext ? '\n' + chainingContext + '\n' : ''}\nNutze diese Ergebnisse um die ursprüngliche Frage zu beantworten. Antworte DIREKT basierend auf den Ergebnissen.` }
            ];

            // Yield separator before next iteration
            yield '\n\n---\n\n';
            this.updateStatus('thinking');
            AgentEvents.statusChange('thinking', primaryAgent);
        }

        if (iteration >= MimiEngine.MAX_TOOL_ITERATIONS) {
            console.warn('[MIMI] ⚠️ Max tool iterations reached');
        }

        // Mark plan as complete if all steps are done/failed
        if (activePlan) {
            const allDone = activePlan.steps.every(s => s.status === 'done' || s.status === 'failed');
            if (allDone || iteration >= MimiEngine.MAX_TOOL_ITERATIONS) {
                activePlan.status = 'complete';
                const completedSteps = activePlan.steps.filter(s => s.status === 'done').length;
                const failedSteps = activePlan.steps.filter(s => s.status === 'failed').length;
                const totalDuration = Date.now() - activePlan.createdAt;
                AgentEvents.planComplete(activePlan.id, totalDuration, completedSteps, failedSteps);
                console.log(`[MIMI] 📋 Plan complete: ${completedSteps}/${activePlan.steps.length} steps done`);
            }
        }

        this.isGenerating = false;
        this.updateStatus('idle');
        AgentEvents.statusChange('idle');

        // Phase 4: Persist task summary if plan completed
        if (activePlan && activePlan.status === 'complete') {
            try {
                const stepTitles = activePlan.steps.map(s => s.title);
                const completedSteps = activePlan.steps.filter(s => s.status === 'done').length;
                await this.agentMemory?.storeTaskSummary(
                    activePlan.title,
                    stepTitles,
                    `${completedSteps}/${activePlan.steps.length} steps completed`,
                    Date.now() - activePlan.createdAt
                );
            } catch { /* non-critical */ }
        }
    }

    // [REMOVED] streamGeneration — was trivial delegate to generate()

    /**
     * Prüft ob ein Low-End Modell geladen ist
     * Low-End Modelle brauchen einen einfacheren Prompt ohne CoT
     */
    private isLowEndModel(): boolean {
        if (!this.currentModel) return false;
        const m = this.currentModel.toLowerCase();
        return m.includes('qwen2.5-0.5b') || m.includes('llama-3.2-1b');
    }

    /**
     * Prüft ob ein multimodales Vision-Modell geladen ist (Phi-3.5-vision)
     * Multimodale Modelle können Bilder direkt als Input verarbeiten
     */
    private isMultimodalModel(): boolean {
        return this.currentModel?.toLowerCase().includes('vision') ?? false;
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

        let result = '';

        for (const [action, pattern] of Object.entries(triggers)) {
            if (pattern.test(userMessage)) {
                result = `\n\n[🚨 CRITICAL TRIGGER: User wants ${action.toUpperCase()}!]\n[WRITE PYTHON CODE IN \`\`\`python BLOCK NOW - NO EXPLANATION FIRST!]\n`;
                break;
            }
        }

        // BILD-ZU-CODE PIPELINE: If image is uploaded AND user wants reproduction/analysis
        const hasImage = this.agentOrchestrator?.getContext?.()?.imageContext;
        if (hasImage) {
            const imageCodeTrigger = /reproduzier|nachbau|erstell.*chart|erstell.*diagramm|recreat|nachzeichn|mach.*daraus|konvertier|extrahier.*daten|daten.*extract|tabelle.*erstell|code.*bild|bild.*code/i;
            if (imageCodeTrigger.test(userMessage)) {
                result += `\n\n[🖼️→💻 BILD-ZU-CODE PIPELINE AKTIV!]
[Du hast Zugriff auf die Bildbeschreibung. Nutze sie um Python-Code zu schreiben der das Bild als interaktives Matplotlib-Chart reproduziert.]
[SCHRITTE: 1. Lies die Bildbeschreibung 2. Extrahiere Daten/Struktur 3. Schreibe Python mit matplotlib 4. plt.show()]
[JETZT CODE SCHREIBEN!]\n`;
            }
        }

        return result;
    }

    // [REMOVED] getSovereignIntelligencePrompt — merged into SYSTEM_PROMPT


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
        // Unregister LLM from Memory Manager
        try {
            const mm = getMemoryManager();
            // Unregister all possible LLM keys
            ['llm-phi35-vision', 'llm-phi4', 'llm-phi35', 'llm-qwen25', 'llm-phi3', 'llm-llama', 'llm-qwen']
                .forEach(key => mm.unregisterModel(key));
        } catch (e) {
            // Memory manager may not exist
        }

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
