/**
 * MIMI PWA - PDF Processor
 * Gemäß Lastenheft §2.3 - Lokales Dokumenten-Verständnis
 * 
 * Extrahiert Text aus PDFs 100% client-side - nichts wird hochgeladen!
 * 🔥 Storage unified via Dexie.js (MimiPortalDB) — no more raw IndexedDB!
 */

import { db } from '@/lib/local-db';

// Dynamic import für pdfjs-dist (vermeidet SSR-Probleme)
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfJs() {
    if (!pdfjsLib) {
        pdfjsLib = await import('pdfjs-dist');

        // Worker-URL mit explizitem HTTPS und .mjs (für ES Module Support)
        // Version 5.x von pdf.js verwendet .mjs Worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url
        ).toString();
    }
    return pdfjsLib;
}

export interface PDFChunk {
    text: string;
    pageNumber: number;
    chunkIndex: number;
}

// NEU: Tabellen-Interface
export interface PDFTable {
    pageNumber: number;
    rows: string[][];
    headers?: string[];
}

export interface PDFDocument {
    id: string;
    name: string;
    pageCount: number;
    chunks: PDFChunk[];
    tables?: PDFTable[];  // NEU: Erkannte Tabellen
    extractedAt: Date;
}

/**
 * Extrahiert Text aus einer PDF-Datei
 * Alles läuft lokal im Browser!
 */
export async function extractTextFromPDF(
    file: File,
    onProgress?: (percent: number, status: string) => void
): Promise<PDFDocument> {
    const pdfjs = await getPdfJs();

    onProgress?.(0, "PDF wird geladen...");

    // 1. PDF als ArrayBuffer laden
    const arrayBuffer = await file.arrayBuffer();

    onProgress?.(10, "Dokument wird analysiert...");

    // 2. PDF-Dokument öffnen
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const totalPages = pdf.numPages;
    const allChunks: PDFChunk[] = [];
    const allTables: PDFTable[] = [];  // NEU

    // 3. Text aus jeder Seite extrahieren
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        onProgress?.(
            10 + (pageNum / totalPages) * 80,
            `Seite ${pageNum} von ${totalPages}...`
        );

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Text zusammenfügen
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();

        // NEU: Tabellen auf dieser Seite erkennen
        const pageTables = extractTablesFromPage(textContent.items, pageNum);
        allTables.push(...pageTables);

        if (pageText.length > 0) {
            // 4. In Chunks aufteilen (für bessere Suche)
            const pageChunks = splitIntoChunks(pageText, 500, pageNum);
            allChunks.push(...pageChunks);
        }
    }

    onProgress?.(95, "Dokument wird indexiert...");

    const document: PDFDocument = {
        id: generateDocumentId(file),
        name: file.name,
        pageCount: totalPages,
        chunks: allChunks,
        tables: allTables.length > 0 ? allTables : undefined,  // NEU
        extractedAt: new Date()
    };

    onProgress?.(100, "Fertig!");

    return document;
}

/**
 * Teilt Text in überlappende Chunks für bessere Suche
 */
function splitIntoChunks(
    text: string,
    chunkSize: number,
    pageNumber: number
): PDFChunk[] {
    const chunks: PDFChunk[] = [];
    const words = text.split(' ');

    let currentChunk: string[] = [];
    let currentLength = 0;
    let chunkIndex = 0;

    for (const word of words) {
        if (currentLength + word.length + 1 > chunkSize && currentChunk.length > 0) {
            chunks.push({
                text: currentChunk.join(' '),
                pageNumber,
                chunkIndex: chunkIndex++
            });

            // Überlappung: Letzte 20% der Wörter behalten
            const overlapCount = Math.floor(currentChunk.length * 0.2);
            currentChunk = currentChunk.slice(-overlapCount);
            currentLength = currentChunk.join(' ').length;
        }

        currentChunk.push(word);
        currentLength += word.length + 1;
    }

    // Letzten Chunk hinzufügen
    if (currentChunk.length > 0) {
        chunks.push({
            text: currentChunk.join(' '),
            pageNumber,
            chunkIndex: chunkIndex
        });
    }

    return chunks;
}

/**
 * NEU: Erkennt Tabellen basierend auf Text-Positionen
 * Analysiert Y-Koordinaten um Zeilen zu gruppieren
 */
function extractTablesFromPage(items: any[], pageNumber: number): PDFTable[] {
    const tables: PDFTable[] = [];

    if (items.length < 4) return tables;  // Zu wenig für Tabelle

    // Items mit Position gruppieren
    interface TextItem {
        str: string;
        x: number;
        y: number;
        width: number;
        height: number;
    }

    const textItems: TextItem[] = items
        .filter((item: any) => item.transform && item.str?.trim())
        .map((item: any) => ({
            str: item.str.trim(),
            x: item.transform[4],
            y: Math.round(item.transform[5]),  // Y gerundet für Gruppierung
            width: item.width || 0,
            height: item.height || 0
        }));

    if (textItems.length < 4) return tables;

    // Nach Y-Koordinate gruppieren (Zeilen)
    const rowGroups: Map<number, TextItem[]> = new Map();
    const yTolerance = 3;  // Pixel-Toleranz

    for (const item of textItems) {
        // Finde existierende Zeile mit ähnlichem Y
        let foundY: number | null = null;
        for (const [y] of rowGroups) {
            if (Math.abs(y - item.y) <= yTolerance) {
                foundY = y;
                break;
            }
        }

        if (foundY !== null) {
            rowGroups.get(foundY)!.push(item);
        } else {
            rowGroups.set(item.y, [item]);
        }
    }

    // Nur Zeilen mit mehreren "Spalten" behalten (potentielle Tabellen-Zeilen)
    const tableRows: TextItem[][] = [];
    const sortedYs = Array.from(rowGroups.keys()).sort((a, b) => b - a);  // Top-to-bottom

    for (const y of sortedYs) {
        const row = rowGroups.get(y)!;
        // Tabellen haben typischerweise 2+ Spalten
        if (row.length >= 2) {
            // Nach X sortieren (links nach rechts)
            row.sort((a, b) => a.x - b.x);
            tableRows.push(row);
        }
    }

    // Mindestens 3 aufeinanderfolgende Zeilen mit ähnlicher Spaltenanzahl
    if (tableRows.length >= 3) {
        // Spaltenanzahl analysieren
        const columnCounts = tableRows.map(r => r.length);
        const avgColumns = columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length;

        // Zeilen mit ähnlicher Spaltenanzahl
        const consistentRows = tableRows.filter(row =>
            Math.abs(row.length - avgColumns) <= 1
        );

        if (consistentRows.length >= 3) {
            const table: PDFTable = {
                pageNumber,
                rows: consistentRows.map(row => row.map(item => item.str)),
                headers: consistentRows[0]?.map(item => item.str)
            };
            tables.push(table);
        }
    }

    return tables;
}

/**
 * Generiert eindeutige Dokument-ID
 */
function generateDocumentId(file: File): string {
    return `doc_${file.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}`;
}

/**
 * Speichert extrahiertes Dokument in Dexie (IndexedDB)
 */
export async function saveDocument(doc: PDFDocument): Promise<void> {
    await db.mimiDocuments.put(doc);
}

/**
 * Lädt alle gespeicherten Dokumente
 */
export async function loadDocuments(): Promise<PDFDocument[]> {
    return await db.mimiDocuments.toArray();
}

/**
 * NEU: Durchsucht alle Dokumente nach relevantem Content
 * Für Auto-RAG - findet Chunks die zur Frage passen
 */
export interface PDFSearchResult {
    chunk: PDFChunk;
    documentName: string;
    score: number;
}

export async function searchDocuments(
    query: string,
    maxResults: number = 5
): Promise<PDFSearchResult[]> {
    const documents = await loadDocuments();

    if (documents.length === 0) {
        return [];
    }

    const results: PDFSearchResult[] = [];
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

    if (queryTerms.length === 0) {
        return [];
    }

    // Durchsuche alle Chunks aller Dokumente
    for (const doc of documents) {
        for (const chunk of doc.chunks) {
            const chunkLower = chunk.text.toLowerCase();

            // Berechne Score basierend auf Übereinstimmungen
            let score = 0;
            let matchCount = 0;

            for (const term of queryTerms) {
                if (chunkLower.includes(term)) {
                    matchCount++;
                    // Häufigere Treffer = höherer Score
                    const occurrences = (chunkLower.match(new RegExp(term, 'g')) || []).length;
                    score += occurrences * term.length;
                }
            }

            // Mindestens 30% der Begriffe müssen passen
            if (matchCount >= Math.ceil(queryTerms.length * 0.3)) {
                // Normalisiere Score
                score = (score / chunk.text.length) * (matchCount / queryTerms.length);

                results.push({
                    chunk,
                    documentName: doc.name,
                    score
                });
            }
        }
    }

    // Sortiere nach Score und limitiere
    return results
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);
}

/**
 * Löscht ein Dokument
 */
export async function deleteDocument(docId: string): Promise<void> {
    await db.mimiDocuments.delete(docId);
}
