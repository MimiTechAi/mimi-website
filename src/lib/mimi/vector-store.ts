/**
 * MIMI PWA - Vector Store
 * Gemäß Lastenheft §2.3 - Vektorisierung & Suche
 * 
 * In-Browser Embedding und Similarity Search für RAG.
 * Nutzt Transformers.js für lokale Embeddings.
 */

import type { PDFChunk, PDFDocument } from './pdf-processor';

// Dynamic import für Transformers.js
let pipeline: any = null;
let embedder: any = null;

interface VectorEntry {
    text: string;
    embedding: number[];
    documentId: string;
    pageNumber: number;
    chunkIndex: number;
}

interface SearchResult {
    text: string;
    score: number;
    documentId: string;
    pageNumber: number;
}

/**
 * Vector Store für In-Browser RAG
 */
class VectorStore {
    private vectors: VectorEntry[] = [];
    private isInitialized = false;
    private initPromise: Promise<void> | null = null;

    /**
     * Initialisiert den Embedder (lädt Mini-Modell, ~40MB)
     */
    async init(onProgress?: (status: string) => void): Promise<void> {
        if (this.isInitialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = this.doInit(onProgress);
        await this.initPromise;
    }

    private async doInit(onProgress?: (status: string) => void): Promise<void> {
        onProgress?.("Lade Embedding-Modell...");

        try {
            // Dynamic import für @huggingface/transformers v3.x
            const { pipeline, env } = await import('@huggingface/transformers');

            // Configure for browser usage
            env.allowLocalModels = false;
            env.useBrowserCache = true;

            // Mini-Modell für Embeddings (~40MB, sehr schnell)
            // Note: Model ID format changed in v3 - using HuggingFace hub format
            embedder = await pipeline(
                'feature-extraction',
                'Xenova/all-MiniLM-L6-v2',
                {
                    progress_callback: (progress: any) => {
                        if (progress.status === 'progress') {
                            onProgress?.(`Embedding-Modell: ${Math.round(progress.progress)}%`);
                        }
                    }
                }
            );

            this.isInitialized = true;
            onProgress?.("Embedding-Modell geladen!");
        } catch (error) {
            console.error("Fehler beim Laden des Embedding-Modells:", error);
            throw new Error("Embedding-Modell konnte nicht geladen werden");
        }
    }

    /**
     * Fügt ein Dokument zum Vector Store hinzu
     * Auto-initialisiert falls nötig
     */
    async addDocument(
        document: PDFDocument,
        onProgress?: (percent: number) => void
    ): Promise<void> {
        // Auto-Init falls noch nicht initialisiert
        if (!this.isInitialized) {
            console.log('[VectorStore] Auto-initialisiere für addDocument...');
            await this.init();
        }

        const totalChunks = document.chunks.length;

        for (let i = 0; i < totalChunks; i++) {
            const chunk = document.chunks[i];

            // Embedding generieren
            const output = await embedder(chunk.text, {
                pooling: 'mean',
                normalize: true
            });

            this.vectors.push({
                text: chunk.text,
                embedding: Array.from(output.data),
                documentId: document.id,
                pageNumber: chunk.pageNumber,
                chunkIndex: chunk.chunkIndex
            });

            onProgress?.((i + 1) / totalChunks * 100);
        }

        // Persistieren
        await this.save();
    }

    /**
     * Sucht nach ähnlichen Textstellen
     */
    async search(query: string, topK = 3): Promise<SearchResult[]> {
        if (!this.isInitialized || !embedder) {
            throw new Error("VectorStore nicht initialisiert");
        }

        if (this.vectors.length === 0) {
            return [];
        }

        // Query-Embedding generieren
        const queryOutput = await embedder(query, {
            pooling: 'mean',
            normalize: true
        });
        const queryEmbedding = Array.from(queryOutput.data) as number[];

        // Cosine Similarity berechnen
        const scored = this.vectors.map(v => ({
            text: v.text,
            score: this.cosineSimilarity(queryEmbedding, v.embedding),
            documentId: v.documentId,
            pageNumber: v.pageNumber
        }));

        // Top-K zurückgeben
        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }

    /**
     * NEU: BM25 Score Berechnung für Keyword-Matching
     * Standard-Parameter: k1=1.5, b=0.75
     */
    private calculateBM25(
        query: string,
        document: string,
        avgDocLength: number,
        k1 = 1.5,
        b = 0.75
    ): number {
        const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
        const docTerms = document.toLowerCase().split(/\s+/);
        const docLength = docTerms.length;

        if (queryTerms.length === 0) return 0;

        // Term Frequency Map
        const termFreq: Record<string, number> = {};
        for (const term of docTerms) {
            termFreq[term] = (termFreq[term] || 0) + 1;
        }

        let score = 0;
        for (const term of queryTerms) {
            const tf = termFreq[term] || 0;
            if (tf > 0) {
                // BM25 Formel
                const idf = Math.log(1 + (this.vectors.length - 1) / (1 + this.getDocFreq(term)));
                const numerator = tf * (k1 + 1);
                const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));
                score += idf * (numerator / denominator);
            }
        }

        return score;
    }

    /**
     * Document Frequency für IDF Berechnung
     */
    private getDocFreq(term: string): number {
        return this.vectors.filter(v =>
            v.text.toLowerCase().includes(term.toLowerCase())
        ).length;
    }

    /**
     * NEU: Hybrid Search - Kombiniert BM25 + Semantic Search
     * Nutzt Reciprocal Rank Fusion (RRF) für Score-Kombination
     */
    async hybridSearch(
        query: string,
        topK = 5,
        semanticWeight = 0.6  // 60% semantisch, 40% BM25
    ): Promise<SearchResult[]> {
        if (!this.isInitialized || !embedder) {
            throw new Error("VectorStore nicht initialisiert");
        }

        if (this.vectors.length === 0) {
            return [];
        }

        // 1. Semantic Search
        const queryOutput = await embedder(query, {
            pooling: 'mean',
            normalize: true
        });
        const queryEmbedding = Array.from(queryOutput.data) as number[];

        // 2. BM25 Scores
        const avgDocLength = this.vectors.reduce((sum, v) =>
            sum + v.text.split(/\s+/).length, 0
        ) / this.vectors.length;

        // 3. Scoring für alle Dokumente
        const results: Array<{
            text: string;
            semanticScore: number;
            bm25Score: number;
            documentId: string;
            pageNumber: number;
        }> = [];

        // Max BM25 Score für Normalisierung finden
        let maxBm25 = 0;
        const bm25Scores: number[] = [];

        for (const v of this.vectors) {
            const bm25 = this.calculateBM25(query, v.text, avgDocLength);
            bm25Scores.push(bm25);
            if (bm25 > maxBm25) maxBm25 = bm25;
        }

        for (let i = 0; i < this.vectors.length; i++) {
            const v = this.vectors[i];
            const semanticScore = this.cosineSimilarity(queryEmbedding, v.embedding);
            const bm25Score = maxBm25 > 0 ? bm25Scores[i] / maxBm25 : 0;  // Normalisiert auf 0-1

            results.push({
                text: v.text,
                semanticScore,
                bm25Score,
                documentId: v.documentId,
                pageNumber: v.pageNumber
            });
        }

        // 4. Hybrid Score mit RRF (Reciprocal Rank Fusion)
        const sortedBySemantic = [...results].sort((a, b) => b.semanticScore - a.semanticScore);
        const sortedByBM25 = [...results].sort((a, b) => b.bm25Score - a.bm25Score);

        const rrfK = 60; // RRF Konstante
        const finalScores = new Map<string, { entry: typeof results[0], score: number }>();

        for (let rank = 0; rank < results.length; rank++) {
            // Semantic RRF
            const semEntry = sortedBySemantic[rank];
            const semKey = `${semEntry.documentId}_${semEntry.pageNumber}_${semEntry.text.slice(0, 50)}`;
            const semRRF = semanticWeight / (rrfK + rank + 1);

            if (!finalScores.has(semKey)) {
                finalScores.set(semKey, { entry: semEntry, score: 0 });
            }
            finalScores.get(semKey)!.score += semRRF;

            // BM25 RRF
            const bm25Entry = sortedByBM25[rank];
            const bm25Key = `${bm25Entry.documentId}_${bm25Entry.pageNumber}_${bm25Entry.text.slice(0, 50)}`;
            const bm25RRF = (1 - semanticWeight) / (rrfK + rank + 1);

            if (!finalScores.has(bm25Key)) {
                finalScores.set(bm25Key, { entry: bm25Entry, score: 0 });
            }
            finalScores.get(bm25Key)!.score += bm25RRF;
        }

        // 5. Sortieren und Top-K zurückgeben
        return Array.from(finalScores.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
            .map(({ entry, score }) => ({
                text: entry.text,
                score,
                documentId: entry.documentId,
                pageNumber: entry.pageNumber
            }));
    }

    /**
     * NEU: Multi-Document Search mit Document-Level Aggregation
     * Gruppiert Ergebnisse nach Dokument für bessere Übersicht
     */
    async multiDocumentSearch(
        query: string,
        topDocsK = 3,
        chunksPerDoc = 2
    ): Promise<Map<string, SearchResult[]>> {
        const allResults = await this.hybridSearch(query, topDocsK * chunksPerDoc * 2);

        // Gruppiere nach Dokument
        const docGroups = new Map<string, SearchResult[]>();

        for (const result of allResults) {
            if (!docGroups.has(result.documentId)) {
                docGroups.set(result.documentId, []);
            }
            const group = docGroups.get(result.documentId)!;
            if (group.length < chunksPerDoc) {
                group.push(result);
            }
        }

        // Limitiere auf Top-K Dokumente
        const sortedDocs = Array.from(docGroups.entries())
            .sort((a, b) => {
                const maxA = Math.max(...a[1].map(r => r.score));
                const maxB = Math.max(...b[1].map(r => r.score));
                return maxB - maxA;
            })
            .slice(0, topDocsK);

        return new Map(sortedDocs);
    }

    /**
     * Entfernt ein Dokument aus dem Vector Store
     */
    async removeDocument(documentId: string): Promise<void> {
        this.vectors = this.vectors.filter(v => v.documentId !== documentId);
        await this.save();
    }

    /**
     * Cosine Similarity zwischen zwei Vektoren
     */
    private cosineSimilarity(a: number[], b: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Speichert Vektoren in IndexedDB
     */
    private async save(): Promise<void> {
        const db = await this.openDB();
        const tx = db.transaction('vectors', 'readwrite');
        const store = tx.objectStore('vectors');
        await store.clear();

        for (const vector of this.vectors) {
            await store.add(vector);
        }
    }

    /**
     * Lädt Vektoren aus IndexedDB
     */
    async load(): Promise<void> {
        try {
            const db = await this.openDB();
            const tx = db.transaction('vectors', 'readonly');
            const store = tx.objectStore('vectors');

            this.vectors = await new Promise((resolve, reject) => {
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        } catch {
            this.vectors = [];
        }
    }

    /**
     * Öffnet IndexedDB
     */
    private async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('MimiVectors', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('vectors')) {
                    db.createObjectStore('vectors', { autoIncrement: true });
                }
            };
        });
    }

    /**
     * Anzahl der gespeicherten Vektoren
     */
    get size(): number {
        return this.vectors.length;
    }

    /**
     * Prüft ob initialisiert
     */
    get ready(): boolean {
        return this.isInitialized;
    }
}

// Singleton-Instanz
let storeInstance: VectorStore | null = null;

export function getVectorStore(): VectorStore {
    if (!storeInstance) {
        storeInstance = new VectorStore();
    }
    return storeInstance;
}

export type { SearchResult, VectorEntry };
