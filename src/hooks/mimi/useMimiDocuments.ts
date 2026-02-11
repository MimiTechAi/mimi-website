"use client";

/**
 * useMimiDocuments — PDF Document Sub-Hook
 * Handles: PDF upload, deletion, vector indexing, document listing
 */

import { useState, useCallback } from "react";
import type { PDFDocument, AgentStatus } from "./types";
import { extractTextFromPDF, saveDocument, loadDocuments, deleteDocument } from "@/lib/mimi/pdf-processor";
import { getVectorStore } from "@/lib/mimi/vector-store";

export interface UseMimiDocumentsReturn {
    uploadedDocuments: PDFDocument[];
    isUploadingPDF: boolean;
    handlePDFUpload: (
        event: React.ChangeEvent<HTMLInputElement>,
        setAgentStatus: (s: AgentStatus) => void,
        setLoadingStatus: (s: string) => void,
        setLoadingProgress: (p: number) => void,
    ) => Promise<void>;
    handleDeleteDocument: (docId: string) => Promise<void>;
    loadAllDocuments: () => Promise<void>;
}

export function useMimiDocuments(): UseMimiDocumentsReturn {
    const [uploadedDocuments, setUploadedDocuments] = useState<PDFDocument[]>([]);
    const [isUploadingPDF, setIsUploadingPDF] = useState(false);

    const loadAllDocuments = useCallback(async () => {
        try {
            const docs = await loadDocuments();
            setUploadedDocuments(docs);
        } catch (e) {
            console.error("Dokumente laden fehlgeschlagen:", e);
        }
    }, []);

    const handlePDFUpload = useCallback(async (
        event: React.ChangeEvent<HTMLInputElement>,
        setAgentStatus: (s: AgentStatus) => void,
        setLoadingStatus: (s: string) => void,
        setLoadingProgress: (p: number) => void,
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Bitte eine PDF-Datei auswählen');
            event.target.value = '';
            return;
        }

        const MAX_PDF_SIZE = 100 * 1024 * 1024;
        if (file.size > MAX_PDF_SIZE) {
            alert(`PDF ist zu groß (${Math.round(file.size / 1024 / 1024)}MB). Maximum: 100MB`);
            event.target.value = '';
            return;
        }

        if (file.size === 0) {
            alert('PDF-Datei ist leer');
            event.target.value = '';
            return;
        }

        setIsUploadingPDF(true);
        setAgentStatus('analyzing');

        try {
            const pdfDoc = await extractTextFromPDF(file, (percent, status) => {
                setLoadingStatus(status);
                setLoadingProgress(percent);
            });

            if (pdfDoc.chunks.length === 0) {
                alert('PDF enthält keinen extrahierbaren Text. Möglicherweise nur Bilder?');
                return;
            }

            await saveDocument(pdfDoc);

            const vectorStore = getVectorStore();
            if (!vectorStore.ready) {
                await vectorStore.init((status) => {
                    setLoadingStatus(status);
                });
            }

            await vectorStore.addDocument(pdfDoc, (percent) => {
                setLoadingProgress(percent);
                setLoadingStatus(`Erstelle Embeddings: ${Math.round(percent)}%`);
            });

            const docs = await loadDocuments();
            setUploadedDocuments(docs);

            console.log(`✅ PDF verarbeitet: ${pdfDoc.chunks.length} Chunks, ${pdfDoc.tables?.length || 0} Tabellen`);
        } catch (error) {
            console.error('PDF-Upload Fehler:', error);
            const err = error as Error;
            if (err.message?.includes('password') || err.message?.includes('encrypted')) {
                alert('PDF ist passwortgeschützt. Bitte entsperre die Datei zuerst.');
            } else if (err.message?.includes('corrupt') || err.message?.includes('invalid')) {
                alert('PDF-Datei ist beschädigt oder ungültig.');
            } else {
                alert(`Fehler beim Verarbeiten der PDF: ${err.message || 'Unbekannter Fehler'}`);
            }
        } finally {
            setIsUploadingPDF(false);
            setAgentStatus('idle');
            event.target.value = '';
        }
    }, []);

    const handleDeleteDocument = useCallback(async (docId: string) => {
        try {
            await deleteDocument(docId);
            const vectorStore = getVectorStore();
            await vectorStore.removeDocument(docId);
            const docs = await loadDocuments();
            setUploadedDocuments(docs);
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
        }
    }, []);

    return {
        uploadedDocuments,
        isUploadingPDF,
        handlePDFUpload,
        handleDeleteDocument,
        loadAllDocuments,
    };
}
