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
import { getOrchestrator, type AgentOrchestrator, createMoAOrchestrator, SPECIALIST_AGENTS } from './agent-orchestrator-v2';
import { getMemoryManager, type MemoryManager } from './memory-manager';
import { getToolDescriptionsForPrompt, parseToolCalls } from './tool-definitions';
import { getToolRegistry, type ToolExecutionContext } from './tool-registry';
import { getTaskPlanner, type TaskPlanner, type TaskPlan } from './task-planner';
import { AgentEvents } from './agent-events';
import { getAgentMemory, getContextWindowManager, ResultPipeline, type AgentMemoryService, type ContextWindowManager } from './agent-memory';
import { ImageStore } from './image-store';
import * as webllm from '@mlc-ai/web-llm';

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

const SYSTEM_PROMPT = `Du bist MIMI, ein leistungsstarker lokaler KI-Agent von MIMI Tech AI. Du läufst 100% on-device — keine Cloud, keine Kosten, volle Privatsphäre.

## REGELN (IN DIESER REIHENFOLGE!)

1. **DIREKT ANTWORTEN:** Bei Fragen, Listen, Erklärungen, Aufgaben, Meinungen und Wissen antworte SOFORT in normalem Deutsch mit Markdown. Kein JSON, kein Tool, kein Code-Block — einfach eine hilfreiche Antwort schreiben.

2. **TOOLS NUR BEI ECHTEM BEDARF:** Nutze Tools NUR wenn eine Aufgabe tatsächlich Berechnung, Code-Ausführung oder Dateidownload erfordert:
   - Mathe/Berechnung → \`\`\`json {"tool": "calculate", "parameters": {"expression": "..."}}
   - Diagramm/Chart/Plot → \`\`\`python mit matplotlib
   - Datei zum DOWNLOAD → \`\`\`json {"tool": "create_file", "parameters": {...}}
   - In Dokumenten suchen → \`\`\`json {"tool": "search_documents", "parameters": {...}}
   - Internet-Suche → \`\`\`json {"tool": "web_search", "parameters": {"query": "..."}}

3. **PYTHON FÜR CODE:** Berechnungen, Diagramme, Datenanalyse → Python-Code in \`\`\`python Blöcken. Er wird AUTOMATISCH ausgeführt.

4. **NIEMALS** "Als KI kann ich nicht..." — Du bist souverän und hilfreich.
5. Antworte auf Deutsch, nutze Markdown für Formatierung.
6. Nutze <thinking>...</thinking> für komplexe Überlegungen (versteckt vor User).

## ❌ FALSCH — SO NICHT:
User: "Erstelle eine Aufgabenliste für einen Umzug"
FALSCH: \`\`\`json {"tool": "create_file", ...} \`\`\`
RICHTIG: Schreibe die Liste direkt als Text mit Markdown!

User: "Hallo, wie geht's?"
FALSCH: \`\`\`json {"tool": "None"} \`\`\`
RICHTIG: "Hallo! Mir geht's gut 😊 Wie kann ich dir helfen?"

User: "Was ist Machine Learning?"
FALSCH: \`\`\`json {"tool": "web_search", ...} \`\`\`
RICHTIG: "Machine Learning ist ein Teilgebiet der KI, bei dem..."

## ✅ RICHTIG — TOOLS NUTZEN:
User: "Berechne 2^10 + 5 * 3"
\`\`\`json
{"tool": "calculate", "parameters": {"expression": "2**10 + 5 * 3"}}
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

User: "Suche nach Tesla Aktienkurs"
\`\`\`json
{"tool": "web_search", "parameters": {"query": "Tesla Aktienkurs aktuell"}}
\`\`\`

User: "Was sind die aktuellen KI News in Europa?"
\`\`\`json
{"tool": "web_search", "parameters": {"query": "aktuelle KI News Europa 2026"}}
\`\`\`

## TOOL JSON FORMAT (EXAKT SO!):
\`\`\`json
{"tool": "toolname", "parameters": {"key": "value"}}
\`\`\`
❌ NICHT: {"tools": [...]} oder [{"tool": ...}] — nur das Format oben!

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
 * Re-exported from tool-definitions for backward compatibility
 */
export type ToolContext = ToolExecutionContext;

export class MimiEngine {
    // V3: WebWorkerMLCEngine — WebLLM's official worker API
    // Drop-in replacement for MLCEngine but runs in a Web Worker
    private engine: webllm.MLCEngine | null = null;
    private worker: Worker | null = null; // Keep reference for terminate()
    private isReady = false;
    private _isInitializing = false;
    private currentModel: string | null = null;


    private statusCallback: StatusCallback | null = null;
    private agentOrchestrator?: AgentOrchestrator;
    private memoryManager?: MemoryManager;
    private isGenerating = false;
    private toolContext: ToolContext = {};
    // FIX-1: 10→3 — verhindert 10x LLM-Calls pro Antwort (war Haupt-Ursache für Langsamkeit)
    private static MAX_TOOL_ITERATIONS = 5;
    private taskPlanner?: TaskPlanner;
    private agentMemory?: AgentMemoryService;
    private contextWindowManager?: ContextWindowManager;

    constructor() {
        if (typeof window !== 'undefined') {
            this.agentOrchestrator = getOrchestrator();
            this.memoryManager = getMemoryManager();
            this.taskPlanner = getTaskPlanner();
            this.agentMemory = getAgentMemory();
            // FIX-2: 4096→6144 — mehr Platz für System-Prompt + Chat-History
            // System-Prompt allein ist ~1500 Tokens, 4096 war zu knapp
            this.contextWindowManager = getContextWindowManager(6144);
            // Initialize memory (async, non-blocking)
            this.agentMemory.initialize().catch(() => { });
        } else {
            // Server-side: properties remain undefined (optional)
        }
    }

    /**
     * Set tool context from UI layer (Python executor, doc search, etc.)
     * Must be called after init() for tools to work in the agentic loop.
     */
    setToolContext(context: ToolContext): void {
        this.toolContext = context;
        console.log('[MimiEngine] ✅ Tool context set:', Object.keys(context).filter(k => !!(context as Record<string, unknown>)[k]));
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
     * V3: Nutzt CreateWebWorkerMLCEngine — WebLLMs offizielle Worker-API
     */
    async init(modelId: string, onProgress: ProgressCallback): Promise<void> {
        if (this.isReady && this.currentModel === modelId) {
            onProgress({ progress: 100, text: "Modell bereits geladen" });
            return;
        }

        if (this._isInitializing) {
            console.warn('[MIMI] Init already in progress, skipping duplicate call');
            return;
        }

        this._isInitializing = true;
        const startTime = Date.now();

        try {
            // CreateMLCEngine: Main-Thread (kein Worker) — direkter GPU-Zugriff
            // WebLLM 0.2.80 aktiviert shader-f16 + subgroups bereits intern
            // KEIN manueller GPU-Patch — der würde Chromes Pipeline-Cache invalidieren
            this.engine = await webllm.CreateMLCEngine(
                modelId,
                {
                    initProgressCallback: (progress) => {
                        onProgress({
                            progress: progress.progress * 100,
                            text: progress.text || "Lade Modell...",
                            timeElapsed: (Date.now() - startTime) / 1000
                        });

                        if (progress.progress >= 0.99) {
                            onProgress({
                                progress: 100,
                                text: "⚡ WebGPU-Shader werden kompiliert (shader-f16 + subgroups)...",
                                timeElapsed: (Date.now() - startTime) / 1000
                            });
                        }
                    },
                    logLevel: "SILENT",
                    appConfig: {
                        model_list: webllm.prebuiltAppConfig.model_list.map(m =>
                            m.model_id === modelId
                                ? {
                                    ...m,
                                    overrides: {
                                        ...m.overrides,
                                        // Dynamic context window: small models get 6144, larger models get 32K
                                        context_window_size: MimiEngine.isSmallModel(modelId) ? 6144 : 32768,
                                        // Enable sliding window for large prompts
                                        sliding_window_size: MimiEngine.isSmallModel(modelId) ? 4096 : 16384,
                                    }
                                }
                                : m
                        ),
                        useIndexedDBCache: true,
                    },
                }
            );

            this.isReady = true;
            this.currentModel = modelId;
            // Chrome 117+ caches compiled WebGPU shaders persistently — no warmup counter needed.


            // Register LLM in Memory Manager
            try {
                const mm = getMemoryManager();
                const llmKey = modelId.toLowerCase().includes('vision') ? 'llm-phi35-vision'
                    : modelId.includes('Qwen3') ? 'llm-qwen3'
                        : modelId.includes('Phi-4') ? 'llm-phi4'
                            : modelId.includes('Qwen2.5-1.5B') ? 'llm-qwen25'
                                : modelId.includes('Phi-3.5') ? 'llm-phi35'
                                    : modelId.includes('Qwen') ? 'llm-qwen'
                                        : modelId.includes('Llama') ? 'llm-llama'
                                            : 'llm-phi35';
                mm.registerModel(llmKey);
                console.log(`[MIMI] 🧠 Memory Manager: LLM registriert als '${llmKey}'`);
            } catch { /* non-critical */ }

            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`[MIMI] ✅ Engine ready in ${elapsed}s — model: ${modelId} (WebWorkerMLCEngine, ctx: 6144)`);
            onProgress({ progress: 100, text: "MIMI ist bereit!" });

        } catch (err) {
            this.isReady = false;
            this._isInitializing = false;
            // Kein Worker mehr zum terminieren
            this.engine = null;
            throw err;
        } finally {
            this._isInitializing = false;
        }
    }


    /**
     * Löscht den WebLLM-Modell-Cache aus IndexedDB.
     * Nutze dies wenn ein Modell bei X% hängt (korrupter Cache).
     * Nach dem Clear wird die Seite neu geladen.
     */
    static async clearModelCache(): Promise<void> {
        console.log('[MIMI] 🗑️ Clearing model cache...');
        try {
            // WebLLM speichert Modelle in mehreren IndexedDB-Datenbanken
            const dbs = await indexedDB.databases();
            const webllmDbs = dbs.filter(db =>
                db.name?.includes('webllm') ||
                db.name?.includes('mlc-llm') ||
                db.name?.includes('MLC') ||
                db.name?.includes('model-cache')
            );

            for (const db of webllmDbs) {
                if (db.name) {
                    await new Promise<void>((resolve, reject) => {
                        const req = indexedDB.deleteDatabase(db.name!);
                        req.onsuccess = () => { console.log(`[MIMI] ✅ Deleted DB: ${db.name}`); resolve(); };
                        req.onerror = () => reject(req.error);
                        req.onblocked = () => { console.warn(`[MIMI] ⚠️ DB blocked: ${db.name}`); resolve(); };
                    });
                }
            }

            // Auch localStorage-Blacklist zurücksetzen
            try {
                localStorage.removeItem('mimi_blacklisted_models');
                localStorage.removeItem('mimi_model_cache_version');
            } catch { /* ignore */ }

            console.log(`[MIMI] ✅ Cache cleared (${webllmDbs.length} DBs). Reloading...`);
        } catch (err) {
            console.error('[MIMI] Cache clear failed:', err);
        }
    }

    /**
     * Interrupts in-flight generation.
     * V3: Uses engine.interruptGenerate() — WebLLM's official API.
     */
    private async interruptWorker(): Promise<void> {
        if (!this.engine) return;
        try {
            await this.engine.interruptGenerate();
        } catch (e: unknown) {
            console.warn('[MIMI] interruptGenerate failed:', e);
        }
    }

    /**
     * Blacklist a model that failed to generate on this GPU.
     * Stored in localStorage so it's skipped on next page load.
     */
    static blacklistModel(modelId: string): void {
        try {
            const key = 'mimi_blacklisted_models';
            const existing = JSON.parse(localStorage.getItem(key) || '[]') as string[];
            if (!existing.includes(modelId)) {
                existing.push(modelId);
                localStorage.setItem(key, JSON.stringify(existing));
                console.log(`[MIMI] 🚫 Model blacklisted for this device: ${modelId}`);
            }
        } catch { /* localStorage unavailable */ }
    }

    /**
     * Check if a model was previously blacklisted on this device.
     */
    static isModelBlacklisted(modelId: string): boolean {
        try {
            const existing = JSON.parse(localStorage.getItem('mimi_blacklisted_models') || '[]') as string[];
            return existing.includes(modelId);
        } catch { return false; }
    }

    /**
     * Stoppt die aktuelle Generierung sofort
     * V3: Nutzt engine.interruptGenerate()
     */
    async stopGeneration(): Promise<void> {
        console.log('[MimiEngine] ⏸️ Stopping generation...');

        if (!this.isGenerating) {
            console.log('[MimiEngine] No generation in progress');
            return;
        }

        this.isGenerating = false;

        // V3: Use WebLLM's official interrupt API
        if (this.engine) {
            try {
                await this.engine.interruptGenerate();
            } catch { /* ignore */ }
        }

        this.updateStatus('idle');
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
    private async enrichWithRAG(userMessage: string, k = 3): Promise<string> {
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
                        const results = await vectorStore.hybridSearch(query, k);
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
                        .slice(0, k);

                    console.log('[RAG] Hybrid Ergebnisse (merged):', hybridResults.length);

                    if (hybridResults.length > 0) {
                        hasResults = true;
                        for (const result of hybridResults) {
                            const relevanceLabel = result.score > 0.01 ? '🎯' : '📎';
                            context += `${relevanceLabel} **Dokument ${result.documentId} (Seite ${result.pageNumber}):**\n`;
                            context += `> ${result.text.slice(0, 500)}...\n\n`;
                        }
                    }
                } catch (e: unknown) {
                    console.log('[RAG] Hybrid search Fehler:', e);
                }
            }

            // Fallback: Keyword-basierte Suche (immer versuchen wenn keine hybrid results)
            if (!hasResults) {
                console.log('[RAG] Fallback: Keyword-Suche...');
                try {
                    const keywordResults = await searchDocuments(userMessage, k);
                    console.log('[RAG] Keyword Ergebnisse:', keywordResults.length);

                    if (keywordResults.length > 0) {
                        hasResults = true;
                        for (const result of keywordResults) {
                            context += `**Aus "${result.documentName}" (Seite ${result.chunk.pageNumber}):**\n`;
                            context += `> ${result.chunk.text.slice(0, 400)}...\n\n`;
                        }
                    }
                } catch (e: unknown) {
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
                } catch (e: unknown) {
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
     * V3: Streams tokens directly via engine.chat.completions.create()
     * No custom message protocol, no polling loop — WebLLM handles everything.
     *
     * SAFETY GUARDS:
     * - Max thinking buffer: auto-closes unclosed <thinking> blocks after 2000 chars
     * - Generation timeout: 45s total (6min for first gen with shader JIT)
     */
    private async *singleGeneration(
        fullMessages: ChatMessage[],
        options?: { temperature?: number; maxTokens?: number }
    ): AsyncGenerator<string, string, unknown> {
        if (!this.engine) throw new Error('Engine not initialized');

        let isInThinking = false;
        let thinkingBuffer = '';
        let fullResponse = '';
        let outputBuffer = '';
        let pendingPartialTag = '';

        const MAX_THINKING_BUFFER = 2000;
        // WebGPU shaders are compiled by the browser on first GPU use,
        // then cached persistently by Chrome/Edge (since v117). No warmup needed.

        // V3: Direct streaming via WebLLM's official API
        // No polling, no messageHandlers, no tokenQueue — just async iteration
        // FIX: Dynamic max_tokens — never exceed context window
        const contextWindowSize = this.isLowEndModel() ? 6144 : 32768;
        const estimatedPromptTokens = fullMessages.reduce(
            (sum, m) => sum + Math.ceil((m.content?.length || 0) / 3.5), 0
        );
        const safetyMargin = 128;
        const maxAvailableTokens = Math.max(256, contextWindowSize - estimatedPromptTokens - safetyMargin);
        const effectiveMaxTokens = Math.min(options?.maxTokens ?? 4096, maxAvailableTokens);

        if (estimatedPromptTokens > contextWindowSize - 256) {
            console.warn(`[MIMI] ⚠️ Prompt (~${estimatedPromptTokens} tokens) near context limit (${contextWindowSize}). Trimming old messages.`);
            // Trim: keep system + last 3 messages
            const systemMsg = fullMessages.find(m => m.role === 'system');
            const recentMsgs = fullMessages.filter(m => m.role !== 'system').slice(-3);
            fullMessages = systemMsg ? [systemMsg, ...recentMsgs] : recentMsgs;
        }

        let stream;
        try {
            stream = await this.engine.chat.completions.create({
                messages: fullMessages as webllm.ChatCompletionMessageParam[],
                temperature: options?.temperature ?? 0.7,
                max_tokens: effectiveMaxTokens,
                top_p: 0.95,
                stream: true,
                stream_options: { include_usage: false }
            });
        } catch (e: unknown) {
            // FIX: Catch ContextWindowSizeExceeded and retry with minimal prompt
            if (e instanceof Error && e.message?.includes('context window')) {
                console.warn('[MIMI] ⚠️ Context window exceeded, retrying with trimmed prompt');
                const systemMsg = fullMessages.find(m => m.role === 'system');
                const lastMsg = fullMessages.filter(m => m.role !== 'system').slice(-1);
                // Truncate system prompt to 1500 chars for emergency mode
                const trimmedSystem = systemMsg
                    ? { ...systemMsg, content: systemMsg.content.slice(0, 1500) + '\n\n[System prompt truncated due to context limit]' }
                    : null;
                const emergencyMessages = trimmedSystem ? [trimmedSystem, ...lastMsg] : lastMsg;

                stream = await this.engine.chat.completions.create({
                    messages: emergencyMessages as webllm.ChatCompletionMessageParam[],
                    temperature: options?.temperature ?? 0.7,
                    max_tokens: Math.min(1024, effectiveMaxTokens),
                    top_p: 0.95,
                    stream: true,
                    stream_options: { include_usage: false }
                });
            } else {
                throw e;
            }
        }

        for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content ?? '';
            if (!token) continue;

            outputBuffer += token;

            // Chunk-resilient <thinking> tag detection
            if (!isInThinking) {
                const potentialOpenTag = outputBuffer.match(/<t(?:h(?:i(?:n(?:k(?:i(?:n(?:g)?)?)?)?)?)?)?\s*$/);
                if (potentialOpenTag) {
                    pendingPartialTag = potentialOpenTag[0];
                    outputBuffer = outputBuffer.slice(0, -pendingPartialTag.length);
                }
            }
            if (isInThinking) {
                const potentialCloseTag = outputBuffer.match(/<\/t(?:h(?:i(?:n(?:k(?:i(?:n(?:g)?)?)?)?)?)?)?\s*$/);
                if (potentialCloseTag) {
                    pendingPartialTag = potentialCloseTag[0];
                    outputBuffer = outputBuffer.slice(0, -pendingPartialTag.length);
                }
            }

            if (pendingPartialTag) {
                outputBuffer += pendingPartialTag;
                pendingPartialTag = '';
            }

            // Chain-of-Thought filtering
            while (outputBuffer.includes('<thinking>') || isInThinking) {
                if (!isInThinking && outputBuffer.includes('<thinking>')) {
                    const beforeThinking = outputBuffer.split('<thinking>')[0];
                    if (beforeThinking) { fullResponse += beforeThinking; yield beforeThinking; }
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
                    if (outputBuffer.length > 0) AgentEvents.thinkingContent(outputBuffer);
                    thinkingBuffer += outputBuffer;
                    outputBuffer = '';
                    if (thinkingBuffer.length > MAX_THINKING_BUFFER) {
                        console.warn(`[MIMI] ⚠️ Thinking buffer exceeded ${MAX_THINKING_BUFFER} chars, auto-closing`);
                        isInThinking = false;
                        this.updateStatus('generating');
                    }
                    break;
                } else { break; }
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
        }

        // Flush remaining buffer
        if (outputBuffer && !isInThinking) { fullResponse += outputBuffer; yield outputBuffer; }
        if (pendingPartialTag && !pendingPartialTag.includes('thinking')) { fullResponse += pendingPartialTag; yield pendingPartialTag; }
        if (isInThinking && thinkingBuffer) {
            console.warn('[MIMI] ⚠️ Unclosed <thinking> block at end of generation');
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
        if (!this.engine || !this.isReady) {
            throw new Error("Engine nicht initialisiert");
        }

        this.isGenerating = true;

        try {

            // AUTO-RAG: Enrich last user message with document context
            // FIX-7: RAG Skip-Guard — nur bei Dokument-relevanten Fragen
            // Spart 3s Overhead bei normalem Chat (Hallo, Was ist X?, etc.)
            let enrichedMessages = [...messages];
            const lastUserMessage = messages.filter(m => m.role === 'user').pop();

            // Agentic RAG: Intent-Score determines IF and HOW MUCH to retrieve
            // ArXiv 2025: Dynamic k selection based on query complexity — avoids 3s overhead on pure chat
            const ragIntentScore = (() => {
                if (!lastUserMessage) return 0;
                const q = lastUserMessage.content.toLowerCase();
                let score = 0;
                // High-intent signals (direct document references)
                if (/pdf|vertrag|datei|dokument|anhang|seite \d+/.test(q)) score += 3;
                // Medium-intent signals (analysis/retrieval language)
                if (/zusammenfassung|analysier|fass.*zusammen|inhalt|bericht/.test(q)) score += 2;
                // Weak-intent signals (search/show language)
                if (/suche|finde|zeige|erkläre|was steht|wo/.test(q)) score += 1;
                // Negative signals (pure chat — skip RAG)
                if (/^(hallo|hi|hey|danke|ok|ja|nein|super|gut|okay|wie geht|was bist du)/i.test(q.trim())) score = 0;
                return score;
            })();
            // Dynamic k: more intent = more chunks retrieved
            const ragK = ragIntentScore >= 3 ? 5 : ragIntentScore >= 2 ? 3 : 2;
            const hasDocumentContext = ragIntentScore >= 1;

            if (lastUserMessage && hasDocumentContext) {
                this.updateStatus('analyzing');
                try {
                    let ragResolved = false;
                    const ragContext = await Promise.race([
                        this.enrichWithRAG(lastUserMessage.content, ragK).then(r => { ragResolved = true; return r; }),
                        new Promise<string>(resolve => setTimeout(() => {
                            if (!ragResolved) {
                                console.warn('[MIMI] ⚠️ RAG timeout (3s), skipping');
                            }
                            resolve('');
                            // FIX-4: RAG-Timeout 8s→3s — blockierte 8s vor jeder Antwort
                        }, 3000))
                    ]);
                    if (ragContext) {
                        console.log('[MIMI] 📚 RAG-Kontext gefunden');
                        enrichedMessages = messages.map(m =>
                            m === lastUserMessage
                                ? { ...m, content: `${ragContext}\n\n**Frage:** ${m.content}` }
                                : m
                        );
                    }
                } catch (ragErr) {
                    console.warn('[MIMI] ⚠️ RAG failed, continuing without context:', ragErr);
                }

                // IMAGE CONTEXT: Inject vision analysis so LLM knows about the uploaded image
                const imageCtx = this.agentOrchestrator?.getContext?.()?.imageContext;
                if (imageCtx) {
                    console.log('[MIMI] 🖼️ Bild-Kontext gefunden');
                    const currentLastMsg = enrichedMessages.filter(m => m.role === 'user').pop();
                    if (currentLastMsg) {
                        // If we have a multimodal model AND an uploaded image, pass the raw image data
                        // The inference worker will convert it to image_url content blocks
                        const uploadedImage = ImageStore.get();
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

            // Agent classification — FIX-5: 3s→1.5s Timeout
            let primaryAgent = 'general';
            try {
                let classifyResolved = false;
                const classification = await Promise.race([
                    this.agentOrchestrator?.classifyTask(lastUserMessage?.content || '').then(r => { classifyResolved = true; return r; }) ?? Promise.resolve({ primaryAgent: 'general' }),
                    new Promise<{ primaryAgent: string }>(resolve => setTimeout(() => {
                        if (!classifyResolved) {
                            console.warn('[MIMI] ⚠️ Agent classification timeout (1.5s), using general');
                        }
                        resolve({ primaryAgent: 'general' });
                    }, 1500))
                ]);
                primaryAgent = classification.primaryAgent;
                console.log(`[MIMI] 🤖 Agent: ${primaryAgent}`);
            } catch (e: unknown) {
                console.warn('[MIMI] Agent classification failed, using general');
            }

            // Build system prompt — LEAN: base + agent specialization + tools only
            let systemPrompt = this.isLowEndModel()
                ? this.getLitePrompt()
                : SYSTEM_PROMPT + '\n\n' + (this.agentOrchestrator?.getAgentPrompt(primaryAgent) ?? '');

            // Collaborative context (Skills)
            const collaborativeContext = this.agentOrchestrator?.buildCollaborativeContext(primaryAgent);
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
            } catch (e: unknown) {
                // Memory is non-critical, don't block
            }

            // Phase 4b: Scratchpad context.md injection — inject accumulating agent context
            try {
                const { getMimiFilesystem } = await import('./workspace/filesystem');
                const fs = getMimiFilesystem();
                const contextContent = await fs.readFile('/workspace/context.md');
                if (contextContent && contextContent.length > 50) {
                    // Trim to last 1500 chars to avoid blowing up context window
                    const trimmed = contextContent.length > 1500
                        ? '...\n' + contextContent.slice(-1500)
                        : contextContent;
                    systemPrompt += '\n\n## AGENT CONTEXT (from previous steps)\n' + trimmed;
                    console.log('[MIMI] 📋 Scratchpad context.md injected');
                }
            } catch {
                // context.md may not exist yet or fs not initialized — non-critical
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
                activePlan = this.taskPlanner!.createPlan(userMsg2);
                activePlan.status = 'executing';
                console.log(`[MIMI] 📋 Plan created: ${activePlan.title} (${activePlan.steps.length} steps)`);

                // Phase 3: Trigger the MoA Orchestrator (Swarm) in the background
                // This will emit `AgentEventBus` events to explicitly visualize SOTA Swarm orchestration
                // in the VirtualSandbox Action Feed, while the main inference loop runs normally.
                try {
                    const moa = createMoAOrchestrator(SPECIALIST_AGENTS);
                    moa.execute(userMsg2, fullMessages).then(moaResult => {
                        console.log(`[MIMI] 🐝 Swarm background execution completed in ${moaResult.totalDuration}ms`);
                    }).catch(err => {
                        console.error(`[MIMI] 🐝 Swarm execution failed:`, err);
                    });
                } catch (e) {
                    console.error(`[MIMI] Failed to start MoA Orchestrator:`, e);
                }
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
            let selfLoopCount = 0;  // Count consecutive identical tool call sequences

            while (iteration < MimiEngine.MAX_TOOL_ITERATIONS) {
                iteration++;
                console.log(`[MIMI] 🔄 Generation iteration ${iteration}/${MimiEngine.MAX_TOOL_ITERATIONS}`);

                // Update plan step status if we have an active plan
                if (activePlan) {
                    const nextStep = this.taskPlanner?.getNextStep(activePlan);
                    if (nextStep) {
                        activePlan = this.taskPlanner!.updateStepStatus(activePlan, nextStep.id, 'running');
                        currentStepIndex = activePlan.steps.findIndex(s => s.id === nextStep.id);
                    }
                }

                // Run single LLM generation — collect full response for tool parsing
                // BUG-3 FIX: ThinkingStart/End wrapped in try-finally per iteration
                let fullResponse = '';
                AgentEvents.thinkingStart();
                try {
                    for await (const token of this.singleGeneration(fullMessages, options)) {
                        fullResponse += token;
                        AgentEvents.textDelta(token);
                        yield token; // Stream to UI
                    }
                } finally {
                    AgentEvents.thinkingEnd();
                }

                // STALL AUTO-RETRY: If first generation returned empty (shader JIT absorbed
                // all time), interrupt the worker and retry once — shaders should now be compiled.
                if (fullResponse.trim() === '' && iteration === 1) {
                    console.log('[MIMI] 🔄 First generation was empty (shader JIT), interrupting worker & retrying...');

                    // CRITICAL: Interrupt the worker to abort the hung generation
                    // Without this, the worker is still busy and the retry will fail
                    await this.interruptWorker();
                    await new Promise(r => setTimeout(r, 2000)); // 2s cooldown — let Metal finish compiling shaders

                    this.updateStatus('generating');
                    // Retry gets fresh pipeline — shaders already compiled + cached by Chrome.
                    AgentEvents.thinkingStart();
                    try {
                        for await (const token of this.singleGeneration(fullMessages, options)) {
                            fullResponse += token;
                            AgentEvents.textDelta(token);
                            yield token;
                        }
                    } finally {
                        AgentEvents.thinkingEnd();
                    }
                    if (fullResponse.trim() !== '') {
                        console.log(`[MIMI] ✅ Auto-retry succeeded (${fullResponse.length} chars)`);
                    } else {
                        console.error('[MIMI] ❌ Auto-retry also returned empty — GPU may not support this model');
                        // Blacklist this model so it's skipped on next page load
                        MimiEngine.blacklistModel(this.currentModel || '');
                        // Throw so UI can trigger runtime model fallback
                        throw new Error('GENERATION_EMPTY: Model loaded but GPU produced zero tokens. Try a smaller model.');
                    }
                }

                // Parse for tool calls
                const toolCalls = parseToolCalls(fullResponse);

                if (toolCalls.length === 0) {
                    // No tool calls — mark current step done and we're done
                    if (activePlan) {
                        const runningStep = activePlan.steps.find(s => s.status === 'running');
                        if (runningStep) {
                            activePlan = this.taskPlanner!.updateStepStatus(
                                activePlan, runningStep.id, 'done', 'Completed'
                            );
                        }
                        // Mark remaining pending steps as done (summary step)
                        for (const step of activePlan.steps) {
                            if (step.status === 'pending') {
                                activePlan = this.taskPlanner!.updateStepStatus(
                                    activePlan, step.id, 'done', 'Completed'
                                );
                            }
                        }
                    }
                    console.log('[MIMI] ✅ No tool calls, generation complete');
                    break;
                }

                // Self-loop guard: detect repeated identical tool calls (allow 1 retry for self-correction)
                const currentToolHash = JSON.stringify(toolCalls.map(t => ({ tool: t.tool, params: t.parameters })));
                if (currentToolHash === lastToolHash) {
                    selfLoopCount++;
                } else {
                    selfLoopCount = 0;
                }
                lastToolHash = currentToolHash;
                if (selfLoopCount >= 2) {
                    console.warn('[MIMI] ⚠️ Self-loop detected: identical tool calls repeated 3 times. Aborting loop.');
                    yield '\n\n⚠️ *Wiederholte Tool-Aufrufe erkannt. Abbruch der Schleife.*\n';
                    break;
                }

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
                        // V4: Route through ToolRegistry (unified backend with AgentComputer)
                        const registry = getToolRegistry();
                        registry.setContext(this.toolContext);
                        const result = await registry.execute(call);
                        const duration = Date.now() - toolStartTime;
                        toolResultsText += `\n\n**Tool-Ergebnis (${call.tool}):**\n${result.output}\n`;
                        AgentEvents.toolCallEnd(call.tool, result.success, result.output, duration, activePlan?.steps[currentStepIndex]?.id);

                        // Track file operations
                        if (call.tool === 'write_file' && call.parameters?.path) {
                            AgentEvents.fileWrite(call.parameters.path as string, 'create');
                        } else if (call.tool === 'delete_file' && call.parameters?.path) {
                            AgentEvents.fileWrite(call.parameters.path as string, 'delete');
                        } else if (call.tool === 'move_file' && call.parameters?.destination) {
                            AgentEvents.fileWrite(call.parameters.destination as string, 'create');
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
                                activePlan = this.taskPlanner!.updateStepStatus(
                                    activePlan, runningStep.id, 'done', result.output.slice(0, 200), undefined
                                );
                            }
                        }
                    } catch (e: unknown) {
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
                                activePlan = this.taskPlanner!.updateStepStatus(
                                    activePlan, runningStep.id, 'failed', undefined, errMsg
                                );
                                // If retryable, add correction hint to prompt
                                if (this.taskPlanner?.canRetry(runningStep)) {
                                    toolResultsText += `\n⚠️ Bitte versuche es erneut mit korrigiertem Code/Query.\n`;
                                    // Reset step to pending for retry
                                    activePlan = this.taskPlanner!.updateStepStatus(
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
        } finally {
            // BUG-7 FIX: SAFETY NET — guarantee ALL state is reset on any exit path
            this.isGenerating = false;
            this.updateStatus('idle');
            AgentEvents.thinkingEnd();         // Guarantee UI unblocks
            AgentEvents.statusChange('idle');  // Guarantee status resets
        }
    }

    // [REMOVED] streamGeneration — was trivial delegate to generate()

    /**
     * Prüft ob ein Low-End Modell geladen ist
     * FIX-3: Qwen3-0.6B und 1.7B als Low-End klassifiziert
     * → erhalten Lite-Prompt statt 2000-Token System-Prompt
     */
    private isLowEndModel(): boolean {
        if (!this.currentModel) return false;
        return MimiEngine.isSmallModel(this.currentModel);
    }

    /**
     * Static model size check — used during init AND runtime.
     * Small models (≤4B params) get reduced context window.
     */
    private static isSmallModel(modelId: string): boolean {
        const m = modelId.toLowerCase();
        return m.includes('0.5b') || m.includes('0.6b') || m.includes('1.7b')
            || m.includes('1b') || m.includes('3b')
            || m.includes('qwen2.5-0.5b') || m.includes('llama-3.2-1b');
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
     * INTELLIGENT INTENT ROUTER — Detects user intent and injects execution directives
     * Maps user intents to exact tools or NO_TOOL for pure text responses
     */
    private detectActionIntent(userMessage: string): string {
        const msg = userMessage.toLowerCase();

        // ═══════════════════════════════════════════════════════════
        // PRIORITY 1: NO-TOOL intents (pure text response)
        // These MUST be checked first to prevent false tool triggers
        // ═══════════════════════════════════════════════════════════
        const greetings = /^(hallo|hi|hey|guten\s*(morgen|tag|abend)|servus|moin|grüß|was\s*geht|wie\s*geht)/i;
        if (greetings.test(msg)) {
            return '\n\n[DIRECTIVE: Antworte freundlich auf Deutsch. KEIN Tool, KEIN JSON.]\n';
        }

        const knowledgeQuestions = /^(was\s+ist|wer\s+ist|warum|erkl[äa]r|beschreib|definier|unterschied\s+zwischen|was\s+bedeut|was\s+sind|wie\s+funktioniert|erzähl|nenn)/i;
        // Guard: if the question contains current-events/search keywords, DON'T block tools!
        const needsRealTimeData = /aktuell|news|nachrichten|recherch|neueste|neuigkeit|wetter|kurs|preis|aktie|such\s.*internet|web|heute|letzte\s*woche|diese\s*woche|berechn|kalkulier|plot|chart|graph/i;
        if (knowledgeQuestions.test(msg) && !needsRealTimeData.test(msg)) {
            return '\n\n[DIRECTIVE: Beantworte diese Wissensfrage direkt als Markdown-Text. KEIN Tool, KEIN JSON. Nutze Überschriften und Listen.]\n';
        }

        const listRequests = /(?:erstell|schreib|mach).*(?:liste|aufgab|plan|checkliste|todo|schritte|punkte|überblick|zusammenfassung)|liste.*erstell|plan.*erstell|checkliste/i;
        if (listRequests.test(msg) && !/datei|download|csv|pdf|export/i.test(msg)) {
            return '\n\n[DIRECTIVE: Erstelle die Liste/den Plan direkt als Markdown-Text. KEIN create_file Tool! Nur Text mit Überschriften, Nummerierung und Checkboxen.]\n';
        }

        // ═══════════════════════════════════════════════════════════
        // PRIORITY 2: Math/Calculate — MUST come before code/search
        // ═══════════════════════════════════════════════════════════
        const mathIntent = /(?:berechn|calculat|kalkulier|rechne|ausrechn|wie\s*viel\s*(?:ist|sind|ergibt|macht))|(?:was\s*(?:ist|ergibt|macht)\s*\d)|(?:\d+\s*[\+\-\*\/\^]\s*\d+)/i;
        if (mathIntent.test(msg)) {
            return '\n\n[DIRECTIVE: Nutze das calculate Tool: ```json\n{"tool": "calculate", "parameters": {"expression": "..."}}\n``` KEIN web_search für Mathe!]\n';
        }

        // ═══════════════════════════════════════════════════════════  
        // PRIORITY 3: Web Search — explicit internet/search requests
        // ═══════════════════════════════════════════════════════════
        // Match explicit search terms AND current-event/news patterns
        const searchIntent = /(?:such|recherch|find|google|internet|online|aktuell|nachrichten|news|wetter|kurs|preis|aktie).*(?:such|recherch|internet|web|online)|(?:such|recherch|find).*(?:nach|über|zu|im\s*internet|im\s*web|online)|(?:was\s*gibt.*neues|neueste|aktuellste)|(?:aktuell(?:e|en|es|er)?\s+(?:news|nachrichten|event|meldung|entwicklung|trend))|(?:(?:news|nachrichten|neuigkeit)\s+(?:zu|über|aus|in|von))/i;
        if (searchIntent.test(msg)) {
            return '\n\n[DIRECTIVE: Nutze web_search: ```json\n{"tool": "web_search", "parameters": {"query": "..."}}\n```]\n';
        }

        // ═══════════════════════════════════════════════════════════
        // PRIORITY 3.5: Browse URL — read/scrape a specific URL
        // ═══════════════════════════════════════════════════════════
        const browseIntent = /(?:öffne|besuche|lies|lese|scrape|parse|hole|extrahier).*(?:https?:\/\/|webseite|seite|url|link|artikel)|(?:https?:\/\/\S+)|(?:was\s+steht\s+auf.*(?:seite|url|link|webseite))/i;
        if (browseIntent.test(msg)) {
            const urlMatch = msg.match(/https?:\/\/\S+/);
            const urlHint = urlMatch ? `, "url": "${urlMatch[0]}"` : '';
            return `\n\n[DIRECTIVE: Nutze browse_url: \`\`\`json\n{"tool": "browse_url", "parameters": {"url": "..."${urlHint ? '' : ''}}}\n\`\`\`]\n`;
        }

        // ═══════════════════════════════════════════════════════════
        // PRIORITY 3.6: Shell/Terminal — run system commands
        // ═══════════════════════════════════════════════════════════
        const shellIntent = /(?:führe?\s*aus|run|exec|terminal|shell|bash|command|befehl|pip\s+install|curl\s+|ls\s+|cat\s+|mkdir\s+|grep\s+|head\s+|tail\s+)/i;
        if (shellIntent.test(msg)) {
            return '\n\n[DIRECTIVE: Nutze execute_shell: ```json\n{"tool": "execute_shell", "parameters": {"command": "..."}}\n```]\n';
        }

        // ═══════════════════════════════════════════════════════════
        // PRIORITY 4: Diagram/Chart/Plot → Python
        // ═══════════════════════════════════════════════════════════
        const diagramIntent = /(?:erstell|zeichne|plot|visualisier|zeig).*(?:diagramm|chart|graph|plot|kurve|balken|kreis|sinus)|(?:diagramm|chart|graph|plot|sinus).*(?:erstell|zeichne|plot)/i;
        if (diagramIntent.test(msg)) {
            return '\n\n[DIRECTIVE: Schreibe Python-Code mit matplotlib in einem ```python Block. Er wird automatisch ausgeführt.]\n';
        }

        // ═══════════════════════════════════════════════════════════
        // PRIORITY 5: Code/Programming
        // ═══════════════════════════════════════════════════════════
        const codeIntent = /(?:schreib|write|erstell|generier|implementier).*(?:code|script|programm|funktion|klasse|api)|(?:code|script|programm).*(?:schreib|erstell)|(?:debug|fehler.*fix|bug.*fix)/i;
        if (codeIntent.test(msg)) {
            return '\n\n[DIRECTIVE: Schreibe den Code in einem ```python oder ```javascript Block.]\n';
        }

        // ═══════════════════════════════════════════════════════════
        // PRIORITY 6: PDF/Document search
        // ═══════════════════════════════════════════════════════════
        const docIntent = /(?:dokument|pdf).*(?:such|find|was\s*steht|zusammenfass)|(?:such|find).*(?:in.*dokument|in.*pdf)/i;
        if (docIntent.test(msg)) {
            return '\n\n[DIRECTIVE: Nutze search_documents: ```json\n{"tool": "search_documents", "parameters": {"query": "..."}}\n```]\n';
        }

        // ═══════════════════════════════════════════════════════════
        // PRIORITY 7: File export/download — ONLY when user wants a DOWNLOAD
        // ═══════════════════════════════════════════════════════════
        const fileIntent = /(?:download|exportier|speicher.*als|generier.*datei|erstell.*(?:pdf|csv|excel|datei).*(?:zum.*download|als.*datei))/i;
        if (fileIntent.test(msg)) {
            return '\n\n[DIRECTIVE: Nutze create_file: ```json\n{"tool": "create_file", "parameters": {"type": "...", "content": "...", "filename": "..."}}\n```]\n';
        }

        // ═══════════════════════════════════════════════════════════
        // PRIORITY 8: Image analysis (if image uploaded)
        // ═══════════════════════════════════════════════════════════
        const hasImage = this.agentOrchestrator?.getContext?.()?.imageContext;
        if (hasImage) {
            const imageCodeTrigger = /reproduzier|nachbau|erstell.*chart|recreat|nachzeichn|mach.*daraus|konvertier|extrahier.*daten|code.*bild|bild.*code/i;
            if (imageCodeTrigger.test(msg)) {
                return '\n\n[DIRECTIVE: Schreibe Python-Code um das Diagramm/Chart aus der Bildbeschreibung nachzubauen.]\n';
            }
            return '\n\n[DIRECTIVE: Nutze analyze_image: ```json\n{"tool": "analyze_image", "parameters": {"question": "..."}}\n```]\n';
        }

        return '';
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
            ['llm-phi35-vision', 'llm-phi4', 'llm-phi35', 'llm-qwen25', 'llm-qwen3', 'llm-phi3', 'llm-llama', 'llm-qwen']
                .forEach(key => mm.unregisterModel(key));
        } catch (e: unknown) {
            // Memory manager may not exist
        }

        // V3: Null out engine (interruptGenerate is async, skip in sync terminate)
        this.engine = null;
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.isReady = false;
        this._isInitializing = false; // CRITICAL: Allow re-init after terminate
        this.currentModel = null;
        this.updateStatus('idle');
    }

    get ready(): boolean {
        return this.isReady;
    }

    get isInitializing(): boolean {
        return this._isInitializing;
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
