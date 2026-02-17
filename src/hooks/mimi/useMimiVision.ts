"use client";

/**
 * useMimiVision — Vision Engine Sub-Hook V2.1
 * Handles: image upload, vision model loading, image analysis, unloading
 * 
 * V2.1 Audit Fixes:
 * - P1-3: Error boundary around vision engine initialization
 * - P2-1: Auto-resize images >2048px before processing (saves memory)
 * - P2-2: Replace blocking confirm() with automated resize + status message
 */

import { useState, useCallback, useRef } from "react";
import type { AgentStatus, ChatMessage } from "./types";
import { getVisionEngine } from "@/lib/mimi/vision-engine";
import { getMemoryManager } from "@/lib/mimi/memory-manager";
import { getOrchestrator } from "@/lib/mimi/agent-orchestrator";
import { ImageStore } from "@/lib/mimi/image-store";

// ─── P2-1: Image Resizing Utility ──────────────────────
const MAX_VISION_DIMENSION = 2048;

function resizeImageIfNeeded(base64: string, maxDim: number = MAX_VISION_DIMENSION): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            if (img.width <= maxDim && img.height <= maxDim) {
                resolve(base64); // No resize needed
                return;
            }

            // Calculate new dimensions preserving aspect ratio
            const scale = Math.min(maxDim / img.width, maxDim / img.height);
            const newWidth = Math.round(img.width * scale);
            const newHeight = Math.round(img.height * scale);

            const canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(base64); // Fallback to original
                return;
            }

            // Use high-quality downsampling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            const resized = canvas.toDataURL('image/jpeg', 0.85);
            console.log(`[Vision] 📐 Resized ${img.width}x${img.height} → ${newWidth}x${newHeight} (saved ~${Math.round((1 - resized.length / base64.length) * 100)}% memory)`);
            resolve(resized);
        };
        img.onerror = () => resolve(base64); // Fallback to original
        img.src = base64;
    });
}

export interface UseMimiVisionReturn {
    uploadedImage: string | null;
    isVisionReady: boolean;
    handleImageUpload: (
        event: React.ChangeEvent<HTMLInputElement>,
        chatHistoryRef: React.MutableRefObject<ChatMessage[]>,
        setAgentStatus: (s: AgentStatus) => void,
        setLoadingStatus: (s: string) => void,
    ) => Promise<void>;
    handleUnloadVision: () => Promise<void>;
}

export function useMimiVision(): UseMimiVisionReturn {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isVisionReady, setIsVisionReady] = useState(false);

    const handleUnloadVision = useCallback(async () => {
        try {
            const memoryManager = getMemoryManager();
            await memoryManager.unloadVision();
            setIsVisionReady(false);
            setUploadedImage(null);
            console.log('✅ Vision-Modell entladen');
        } catch (error) {
            console.error('Fehler beim Entladen von Vision:', error);
        }
    }, []);

    const handleImageUpload = useCallback(async (
        event: React.ChangeEvent<HTMLInputElement>,
        chatHistoryRef: React.MutableRefObject<ChatMessage[]>,
        setAgentStatus: (s: AgentStatus) => void,
        setLoadingStatus: (s: string) => void,
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Bitte eine Bilddatei auswählen (JPEG, PNG, WebP, etc.)');
            event.target.value = '';
            return;
        }

        const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_IMAGE_SIZE) {
            alert(`Bild ist zu groß (${Math.round(file.size / 1024 / 1024)}MB). Maximum: 10MB`);
            event.target.value = '';
            return;
        }

        if (file.size === 0) {
            alert('Bilddatei ist leer');
            event.target.value = '';
            return;
        }

        setAgentStatus('analyzing');

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const rawBase64 = e.target?.result as string;

                    // P2-1: Auto-resize large images (replaces blocking confirm dialog — P2-2)
                    const base64 = await resizeImageIfNeeded(rawBase64, MAX_VISION_DIMENSION);

                    setUploadedImage(base64);

                    // P1-3: Error boundary around Vision Engine initialization
                    let visionEngine;
                    try {
                        visionEngine = getVisionEngine();
                        if (!visionEngine.ready) {
                            setLoadingStatus('Vision-Modell wird geladen...');
                            await visionEngine.init((status) => {
                                setLoadingStatus(status);
                            });
                            setIsVisionReady(true);
                            const memoryManager = getMemoryManager();
                            const visionKey = visionEngine.model?.includes('SmolVLM') ? 'vision-smolvlm'
                                : visionEngine.model?.includes('Florence') ? 'vision-florence'
                                    : 'vision-vit';
                            memoryManager.registerModel(visionKey);
                            memoryManager.checkMemory();
                        }
                    } catch (visionInitError) {
                        console.error('[Vision] ❌ Vision Engine initialization failed:', visionInitError);
                        const errorMessage = `⚠️ **Vision-Modell konnte nicht geladen werden**\n\nDas Bild wurde hochgeladen, aber die Bildanalyse ist nicht verfügbar.\nMögliche Ursachen:\n- WebGPU/WASM nicht unterstützt\n- Nicht genug Speicher\n- Netzwerkfehler beim Model-Download\n\nDu kannst trotzdem Fragen stellen — ich beantworte sie basierend auf dem Kontext.`;
                        chatHistoryRef.current.push({
                            role: "assistant",
                            content: errorMessage,
                        });
                        setAgentStatus('idle');
                        return;
                    }

                    const result = await visionEngine.analyzeImage(base64);
                    const imageMessage = `📷 **Bild hochgeladen**\n\n*Vision Analyse (${visionEngine.model || 'Vision'}):*\n${result.description}${result.text ? `\n\n📝 **Erkannter Text:**\n${result.text}` : ''}\n\n---\n\nDu kannst mir jetzt Fragen zu diesem Bild stellen!`;

                    chatHistoryRef.current.push({
                        role: "assistant",
                        content: imageMessage,
                    });

                    // Push image context to orchestrator so LLM gets it
                    try {
                        const orchestrator = getOrchestrator();
                        orchestrator.updateContext({
                            imageContext: result.description + (result.text ? `\nErkannter Text: ${result.text}` : '')
                        });
                    } catch (e) {
                        console.warn('[Vision] Could not update orchestrator context:', e);
                    }

                    // Store image ref using typed ImageStore (B-02)
                    ImageStore.set(base64);

                    // BUG-2 fix: Auto-cleanup after 5 min to prevent memory leaks
                    setTimeout(() => {
                        if (ImageStore.get() === base64) {
                            ImageStore.clear();
                            console.log('[Vision] 🧹 Cleaned up uploaded image (timeout)');
                        }
                    }, 5 * 60 * 1000);

                    console.log(`✅ Bild analysiert via ${visionEngine.model || 'Vision Engine'} (${visionEngine.device})`);
                } catch (innerError) {
                    console.error('Image processing error:', innerError);
                    throw innerError;
                } finally {
                    setAgentStatus('idle');
                }
            };

            // BUG-7 fix: Wrap FileReader in proper error handling
            // (throw inside onerror callback won't be caught by outer try/catch)
            reader.onerror = () => {
                console.error('[Vision] FileReader error:', reader.error);
                setAgentStatus('idle');
                alert('Fehler beim Lesen der Datei. Bitte versuche es erneut.');
            };

            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Image-Upload Fehler:', error);
            alert('Fehler beim Verarbeiten des Bildes. Bitte versuche es erneut.');
            setAgentStatus('idle');
        } finally {
            event.target.value = '';
        }
    }, []);

    return {
        uploadedImage,
        isVisionReady,
        handleImageUpload,
        handleUnloadVision,
    };
}
