"use client";

/**
 * Shared Types for MIMI Engine Sub-Hooks
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import type { DeviceProfile } from "@/lib/mimi/hardware-check";
import type { ChatMessage, AgentStatus, Artifact } from "@/lib/mimi/inference-engine";
import type { PDFDocument } from "@/lib/mimi/pdf-processor";

export type AppState = "checking" | "unsupported" | "loading" | "ready" | "error";

export type { DeviceProfile, ChatMessage, AgentStatus, Artifact, PDFDocument };

// Voice Types (dynamically imported)
export type VoiceRecorderType = {
    recording: boolean;
    language: string;
    transcript: string;
    setLanguage: (lang: string) => void;
    setAutoStop: (enabled: boolean, delayMs?: number) => void;
    onAutoStop: (callback: () => void) => void;
    startRecording: (onResult?: (result: { text: string; isFinal: boolean }) => void) => Promise<void>;
    stopRecording: () => Promise<string>;
    cancelRecording: () => void;
};

export interface UseMimiEngineReturn {
    // State
    state: AppState;
    error: string;
    deviceProfile: DeviceProfile | null;
    loadedModel: string | null;
    loadingProgress: number;
    loadingStatus: string;
    isGenerating: boolean;
    agentStatus: AgentStatus;
    isRecording: boolean;
    isVoiceReady: boolean;
    isPythonReady: boolean;
    isSpeaking: boolean;
    currentLanguage: string;
    interimText: string;
    voiceTranscript: string;
    uploadedDocuments: PDFDocument[];
    isUploadingPDF: boolean;
    uploadedImage: string | null;
    isVisionReady: boolean;
    memoryUsageMB: number;
    isMemoryWarning: boolean;

    // Handlers
    handleSendMessage: (content: string) => AsyncGenerator<string, void, unknown>;
    handleVoiceInput: () => Promise<void>;
    handleSpeak: (text: string) => Promise<void>;
    handleLanguageChange: (lang: string) => void;
    handleExecuteCode: (code: string, language: string) => Promise<{ output: string; chartBase64?: string }>;
    handleDownloadArtifact: (artifact: Artifact) => void;
    handleClearChat: () => void;
    handlePDFUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleDeleteDocument: (docId: string) => Promise<void>;
    handleImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleUnloadVision: () => Promise<void>;
    handleStopGeneration: () => Promise<void>;

    // Setters needed by page
    setVoiceTranscript: (text: string) => void;
}
