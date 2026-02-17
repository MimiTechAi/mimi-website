"use client";

/**
 * useMimiEngine — Orchestrator Hook (Refactored)
 * Composes useMimiVoice, useMimiVision, useMimiDocuments
 * and manages core engine lifecycle + chat generation.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { checkWebGPU, isModelCached, requestPersistentStorage, type DeviceProfile } from "@/lib/mimi/hardware-check";
import { getMimiEngine, type ChatMessage, type AgentStatus, type Artifact } from "@/lib/mimi/inference-engine";
// file-generator is dynamically imported to avoid pulling jspdf into the initial bundle
import { getMemoryManager } from "@/lib/mimi/memory-manager";
import { ImageStore } from "@/lib/mimi/image-store";
import {
    trackMimiPageVisit,
    trackModelLoaded,
    trackFirstMessage,
    trackPDFUpload as trackPDFEvent,
    trackImageUpload as trackImageEvent,
    trackVoiceUsed,
    trackCodeExecuted,
    trackWebGPUCheck,
} from "@/lib/mimi/analytics";

import { useMimiVoice } from "./useMimiVoice";
import { useMimiVision } from "./useMimiVision";
import { useMimiDocuments } from "./useMimiDocuments";

import type { AppState, UseMimiEngineReturn } from "./types";

export type { AppState, UseMimiEngineReturn };

export function useMimiEngine(): UseMimiEngineReturn {
    // ── Core State ──────────────────────────────────────────────────────
    const [state, setState] = useState<AppState>("checking");
    const [error, setError] = useState<string>("");
    const [deviceProfile, setDeviceProfile] = useState<DeviceProfile | null>(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingStatus, setLoadingStatus] = useState("Prüfe Hardware...");
    const [isGenerating, setIsGenerating] = useState(false);
    const [agentStatus, setAgentStatus] = useState<AgentStatus>("idle");
    const [isPythonReady, setIsPythonReady] = useState(false);
    const [memoryUsageMB, setMemoryUsageMB] = useState(0);
    const [isMemoryWarning, setIsMemoryWarning] = useState(false);
    const [loadedModel, setLoadedModel] = useState<string | null>(null);
    const messageCountRef = useRef(0);
    const initStartRef = useRef(0);

    // ── Refs ─────────────────────────────────────────────────────────────
    const chatHistoryRef = useRef<ChatMessage[]>([]);
    const engineRef = useRef(getMimiEngine());

    // ── Composed Sub-Hooks ──────────────────────────────────────────────
    const voice = useMimiVoice();
    const vision = useMimiVision();
    const documents = useMimiDocuments();

    // ── Initialization ──────────────────────────────────────────────────
    useEffect(() => {
        trackMimiPageVisit();
        async function initialize() {
            try {
                setLoadingStatus("Prüfe WebGPU-Unterstützung...");
                initStartRef.current = Date.now();
                const profile = await checkWebGPU();
                setDeviceProfile(profile);

                if (!profile.supported) {
                    trackWebGPUCheck(false);
                    setState("unsupported");
                    setError(profile.error || "WebGPU wird nicht unterstützt");
                    return;
                }
                trackWebGPUCheck(true);

                // Request persistent storage (Chrome: up to 60% disk = ~600GB)
                requestPersistentStorage().catch(() => { });

                setLoadingStatus("Prüfe lokalen Cache...");
                const cached = await isModelCached(profile.model!);

                if (cached) {
                    setLoadingStatus("Modell gefunden! Lade aus Cache...");
                    setLoadingProgress(50);
                }

                setState("loading");
                engineRef.current.onStatusChange(setAgentStatus);

                // Model fallback cascade: if selected model fails, try progressively smaller ones
                const { MODELS } = await import("@/lib/mimi/hardware-check");
                const { MimiEngine } = await import("@/lib/mimi/inference-engine");
                const fallbackChain = [
                    profile.model!,                          // Hardware-selected (best)
                    MODELS.FULL.id,                          // Phi-4 Mini
                    MODELS.BALANCED.id,                      // Qwen2.5 1.5B
                    MODELS.SMALL.id,                         // Llama 3.2 1B
                ]
                    .filter((id, idx, arr) => arr.indexOf(id) === idx) // Deduplicate
                    .filter(id => {
                        // Skip models that previously failed to generate on this GPU
                        if (MimiEngine.isModelBlacklisted(id)) {
                            console.log(`[MIMI] ⏭️ Skipping blacklisted model: ${id}`);
                            return false;
                        }
                        return true;
                    });

                let loadedModel: string | null = null;
                for (const modelId of fallbackChain) {
                    try {
                        console.log(`[MIMI] 🔄 Versuche Modell: ${modelId}`);
                        setLoadingStatus(`Lade ${modelId.split('-').slice(0, 3).join(' ')}...`);

                        await engineRef.current.init(modelId, (progress) => {
                            setLoadingProgress(progress.progress);
                            setLoadingStatus(progress.text);
                        });

                        loadedModel = modelId;
                        setLoadedModel(modelId);
                        const loadTimeSec = (Date.now() - initStartRef.current) / 1000;
                        trackModelLoaded(modelId, loadTimeSec);
                        console.log(`[MIMI] ✅ Modell geladen: ${modelId} (${loadTimeSec.toFixed(1)}s)`);
                        break; // Success!
                    } catch (modelErr) {
                        console.warn(`[MIMI] ⚠️ Modell ${modelId} fehlgeschlagen:`, modelErr);
                        // Terminate failed worker before retrying
                        engineRef.current.terminate();
                        if (modelId === fallbackChain[fallbackChain.length - 1]) {
                            // All models failed
                            throw modelErr;
                        }
                        setLoadingStatus(`${modelId.split('-')[0]} nicht verfügbar, versuche nächstes Modell...`);
                    }
                }

                if (!loadedModel) {
                    throw new Error("Kein Modell konnte geladen werden.");
                }

                setState("ready");
                setLoadingStatus(loadedModel !== profile.model
                    ? `✅ Fallback: ${loadedModel.split('-').slice(0, 3).join(' ')} geladen`
                    : "MIMI ist bereit!"
                );


                // Wire tool context so the agentic loop can execute tools
                engineRef.current.setToolContext({
                    executePython: async (code: string) => {
                        const { executePython } = await import("@/lib/mimi/code-executor");
                        const result = await executePython(code);
                        if (result.success) {
                            return result.output || "(Keine Ausgabe)";
                        }
                        throw new Error(result.error || "Python-Fehler");
                    },
                    executeJavaScript: async (code: string) => {
                        // Execute JS in a sandboxed Function scope (no access to page DOM)
                        try {
                            // eslint-disable-next-line no-new-func
                            const fn = new Function('"use strict";\n' + code);
                            const logs: string[] = [];
                            const origLog = console.log;
                            console.log = (...args: any[]) => logs.push(args.map(String).join(' '));
                            try {
                                const result = fn();
                                console.log = origLog;
                                const output = logs.length > 0 ? logs.join('\n') : String(result ?? '(Keine Ausgabe)');
                                return output;
                            } finally {
                                console.log = origLog;
                            }
                        } catch (e) {
                            throw new Error(`JS-Fehler: ${e instanceof Error ? e.message : String(e)}`);
                        }
                    },
                    searchDocuments: async (query: string, limit?: number) => {
                        const { searchDocuments } = await import("@/lib/mimi/pdf-processor");
                        return searchDocuments(query, limit || 3);
                    },
                    analyzeImage: async (question: string) => {
                        const { getVisionEngine } = await import("@/lib/mimi/vision-engine");
                        const visionEngine = getVisionEngine();
                        if (!visionEngine.ready) {
                            await visionEngine.init();
                        }
                        // Use the uploaded image from the typed ImageStore (B-02)
                        const uploadedImg = ImageStore.get();
                        if (!uploadedImg) {
                            return "Kein Bild hochgeladen. Bitte lade zuerst ein Bild hoch.";
                        }
                        const result = await visionEngine.askAboutImage(uploadedImg, question);
                        return result.answer;
                    },
                    createFile: async (type: string, content: string, filename?: string) => {
                        // PDF can't be created from plain text via Blob — redirect to HTML
                        let effectiveType = type;
                        if (type === 'pdf') {
                            console.warn('[createFile] PDF requested but Blob API cannot create binary PDF. Using HTML instead.');
                            effectiveType = 'html';
                            // Wrap content in basic HTML if it's not already HTML
                            if (!content.trim().startsWith('<')) {
                                content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${filename || 'document'}</title><style>body{font-family:system-ui;padding:2rem;max-width:800px;margin:auto;line-height:1.6}</style></head><body><pre>${content}</pre></body></html>`;
                            }
                        }
                        const mimeTypes: Record<string, string> = {
                            csv: 'text/csv',
                            json: 'application/json',
                            txt: 'text/plain',
                            html: 'text/html',
                            md: 'text/markdown',
                        };
                        const mime = mimeTypes[effectiveType] || 'text/plain';
                        const blob = new Blob([content], { type: mime });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${filename || 'mimi-export'}.${effectiveType}`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        return { success: true, filename: a.download };
                    },
                    readFile: async (path: string) => {
                        // Virtual filesystem (in-memory) for sandbox
                        const vfs = (window as any).__mimiVFS as Map<string, string> | undefined;
                        if (!vfs?.has(path)) {
                            throw new Error(`Datei nicht gefunden: ${path}`);
                        }
                        return vfs.get(path)!;
                    },
                    writeFile: async (path: string, content: string) => {
                        // Virtual filesystem (in-memory) for sandbox
                        if (!(window as any).__mimiVFS) {
                            (window as any).__mimiVFS = new Map<string, string>();
                        }
                        ((window as any).__mimiVFS as Map<string, string>).set(path, content);
                    },
                    listFiles: async (path?: string) => {
                        const vfs = (window as any).__mimiVFS as Map<string, string> | undefined;
                        if (!vfs) return [];
                        const prefix = path && path !== '/' ? path : '';
                        return Array.from(vfs.keys()).filter(k => !prefix || k.startsWith(prefix));
                    },
                });

                const memoryManager = getMemoryManager();
                memoryManager.checkMemory();

                // Background modules
                voice.initVoice();
                documents.loadAllDocuments();

                // Pyodide preload (non-blocking)
                import("@/lib/mimi/code-executor").then(({ preloadPyodide, getPyodidePromise }) => {
                    preloadPyodide();
                    console.log("✅ Python Preload gestartet");
                    // Set ready only after Pyodide actually loads
                    const promise = getPyodidePromise?.();
                    if (promise) {
                        promise.then(() => setIsPythonReady(true)).catch(() => { });
                    } else {
                        // Fallback: mark ready after a reasonable timeout
                        setTimeout(() => setIsPythonReady(true), 5000);
                    }
                }).catch(e => {
                    console.log("Pyodide nicht verfügbar:", e);
                });
            } catch (err) {
                console.error("Initialisierungsfehler:", err);
                setState("error");
                setError(err instanceof Error ? err.message : "Unbekannter Fehler");
            }
        }

        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Memory Polling ──────────────────────────────────────────────────
    useEffect(() => {
        if (state !== 'ready') return;

        const updateMemory = () => {
            const memoryManager = getMemoryManager();
            const status = memoryManager.getStatus();
            setMemoryUsageMB(status.estimatedUsageMB);
            setIsMemoryWarning(status.isWarning);
        };

        updateMemory();
        const interval = setInterval(updateMemory, 5000);
        return () => clearInterval(interval);
    }, [state]);

    // ── Service Worker ──────────────────────────────────────────────────
    // L1 FIX: Use centralized sw-register module (prevents duplicate registration warnings)
    useEffect(() => {
        import('@/lib/sw-register').then(({ registerServiceWorker }) => {
            registerServiceWorker().catch(() => { /* non-critical */ });
        });
    }, []);

    // ── Core Handlers ───────────────────────────────────────────────────

    const handleSendMessage = useCallback(async function* (content: string): AsyncGenerator<string, void, unknown> {
        if (!engineRef.current.ready) {
            throw new Error("Engine nicht bereit");
        }

        setIsGenerating(true);

        try {
            chatHistoryRef.current.push({ role: "user", content });
            messageCountRef.current += 1;
            if (messageCountRef.current === 1) {
                trackFirstMessage();
            }

            // Runtime model fallback: if generation fails with GENERATION_EMPTY,
            // automatically try smaller models from the fallback chain
            let generationSucceeded = false;
            let attemptsLeft = 3; // max fallback attempts

            while (!generationSucceeded && attemptsLeft > 0) {
                attemptsLeft--;
                try {
                    const generator = engineRef.current.generate(chatHistoryRef.current);
                    let fullResponse = "";

                    for await (const token of generator) {
                        fullResponse += token;
                        yield token;
                    }

                    chatHistoryRef.current.push({ role: "assistant", content: fullResponse });
                    generationSucceeded = true;
                } catch (genErr) {
                    const errMsg = genErr instanceof Error ? genErr.message : String(genErr);

                    // Only fallback on GENERATION_EMPTY — other errors propagate normally
                    if (!errMsg.includes('GENERATION_EMPTY') || attemptsLeft <= 0) {
                        throw genErr;
                    }

                    // Determine next smaller model in fallback chain
                    const { MODELS } = await import("@/lib/mimi/hardware-check");
                    const currentModel = engineRef.current.model;
                    const fallbackOrder: string[] = [
                        MODELS.VISION_FULL.id,
                        MODELS.FULL.id,
                        MODELS.BALANCED.id,
                        MODELS.SMALL.id,
                    ];

                    const currentIdx = fallbackOrder.indexOf(currentModel || '');
                    const nextModel = currentIdx >= 0 && currentIdx < fallbackOrder.length - 1
                        ? fallbackOrder[currentIdx + 1]
                        : MODELS.BALANCED.id as string; // Default fallback: Qwen2.5 1.5B

                    console.log(`[MIMI] 🔄 Generation failed with ${currentModel}, falling back to ${nextModel}...`);
                    yield `\n\n⚠️ *Modell ${currentModel?.split('-').slice(0, 3).join(' ')} konnte keine Antwort erzeugen. Wechsle zu ${nextModel.split('-').slice(0, 3).join(' ')}...*\n\n`;

                    // Terminate current engine and re-init with smaller model
                    engineRef.current.terminate();
                    setLoadingStatus(`Wechsle zu ${nextModel.split('-').slice(0, 3).join(' ')}...`);

                    try {
                        await engineRef.current.init(nextModel, (progress) => {
                            setLoadingProgress(progress.progress);
                            setLoadingStatus(progress.text);
                        });
                        setLoadedModel(nextModel);
                        console.log(`[MIMI] ✅ Fallback model loaded: ${nextModel}`);
                    } catch (initErr) {
                        console.error(`[MIMI] ❌ Fallback model ${nextModel} also failed to init:`, initErr);
                        throw new Error(`Kein Modell konnte geladen werden. Bitte Browser neu laden.`);
                    }

                    // Remove the failed assistant response from history if any
                    if (chatHistoryRef.current[chatHistoryRef.current.length - 1]?.role === 'assistant') {
                        chatHistoryRef.current.pop();
                    }
                }
            }

            // Trim history to prevent context window overflow (keep last 40 messages)
            if (chatHistoryRef.current.length > 40) {
                chatHistoryRef.current = chatHistoryRef.current.slice(-40);
                console.info('[MIMI] Konversationskontext auf 40 Nachrichten gekürzt');
            }
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const handleExecuteCode = useCallback(async (code: string, language: string): Promise<{ output: string; chartBase64?: string }> => {
        if (language !== 'python') {
            return { output: `Code-Ausführung für ${language} nicht unterstützt` };
        }

        setAgentStatus("calculating");
        trackCodeExecuted();

        try {
            const { executePython } = await import("@/lib/mimi/code-executor");
            const result = await executePython(code);

            if (result.success) {
                return {
                    output: result.output || "(Keine Ausgabe)",
                    chartBase64: result.chartBase64,
                };
            } else {
                return { output: `Fehler: ${result.error}` };
            }
        } finally {
            setAgentStatus("idle");
        }
    }, []);

    const handleDownloadArtifact = useCallback(async (artifact: Artifact) => {
        const filename = artifact.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const { generateAndDownload } = await import("@/lib/mimi/file-generator");

        if (artifact.type === 'code') {
            const ext = artifact.language === 'python' ? 'py' :
                artifact.language === 'javascript' ? 'js' : 'txt';
            await generateAndDownload(artifact.content, `${filename}.${ext}`, 'text');
        } else if (artifact.type === 'plan' || artifact.type === 'document') {
            await generateAndDownload(artifact.content, filename, 'pdf', { title: artifact.title });
        }
    }, []);

    const handleClearChat = useCallback(() => {
        chatHistoryRef.current = [];
    }, []);

    const handleStopGeneration = useCallback(async () => {
        if (!isGenerating) return;

        try {
            setIsGenerating(false);
            setAgentStatus('idle');
            await engineRef.current.stopGeneration();
            console.log('✅ Generation gestoppt');

            // M4 FIX: Guard against double-init race condition
            if (deviceProfile && !engineRef.current.ready && !engineRef.current.isInitializing) {
                console.log('[Engine] Re-initializing after stop (worker was terminated)');
                await engineRef.current.init(deviceProfile.model!, () => { });
            }
        } catch (error) {
            console.error('Fehler beim Stoppen:', error);
        }
    }, [isGenerating, deviceProfile]);

    // ── Wrapped handlers that inject shared state ───────────────────────

    const handlePDFUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        trackPDFEvent();
        return documents.handlePDFUpload(event, setAgentStatus, setLoadingStatus, setLoadingProgress);
    }, [documents]);

    const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        trackImageEvent();
        return vision.handleImageUpload(event, chatHistoryRef, setAgentStatus, setLoadingStatus);
    }, [vision]);

    const handleVoiceInputTracked = useCallback(async () => {
        trackVoiceUsed();
        return voice.handleVoiceInput();
    }, [voice]);

    // ── Public API ──────────────────────────────────────────────────────
    return {
        // Core state
        state,
        error,
        deviceProfile,
        loadedModel,
        loadingProgress,
        loadingStatus,
        isGenerating,
        agentStatus,
        isPythonReady,
        memoryUsageMB,
        isMemoryWarning,

        // Voice (delegated)
        isRecording: voice.isRecording,
        isVoiceReady: voice.isVoiceReady,
        isSpeaking: voice.isSpeaking,
        currentLanguage: voice.currentLanguage,
        interimText: voice.interimText,
        voiceTranscript: voice.voiceTranscript,
        setVoiceTranscript: voice.setVoiceTranscript,
        handleVoiceInput: handleVoiceInputTracked,
        handleSpeak: voice.handleSpeak,
        handleLanguageChange: voice.handleLanguageChange,

        // Vision (delegated)
        uploadedImage: vision.uploadedImage,
        isVisionReady: vision.isVisionReady,
        handleImageUpload,
        handleUnloadVision: vision.handleUnloadVision,

        // Documents (delegated)
        uploadedDocuments: documents.uploadedDocuments,
        isUploadingPDF: documents.isUploadingPDF,
        handlePDFUpload,
        handleDeleteDocument: documents.handleDeleteDocument,

        // Core handlers
        handleSendMessage,
        handleExecuteCode,
        handleDownloadArtifact,
        handleClearChat,
        handleStopGeneration,
    };
}
