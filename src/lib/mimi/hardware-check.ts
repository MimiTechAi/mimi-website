/**
 * MIMI PWA - Hardware Check
 * Gemäß Lastenheft §1.1 & §4.1
 * 
 * Prüft WebGPU-Support und wählt optimales Modell basierend auf Hardware.
 */

export interface DeviceProfile {
    supported: boolean;
    model?: string;
    modelSize?: string;
    reason?: string;
    error?: string;
    isIOS?: boolean;
    gpuMemory?: number;
}

// Modell-Konfigurationen - Best 2026 WebGPU Models
export const MODELS = {
    // PREMIUM: Phi-3.5-vision für Text + Bild (unified multimodal)
    VISION_FULL: {
        id: "Phi-3.5-vision-instruct-q4f16_1-MLC",
        name: "Phi-3.5 Vision",
        size: "4.2 GB",
        description: "Unified Text + Bild für Desktop (16GB+ RAM)",
        isMultimodal: true
    },
    // BEST TEXT: Phi-3.5 Mini — Bestes verfügbares Text-Modell in WebLLM 0.2.80
    FULL: {
        id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
        name: "Phi-3.5 Mini",
        size: "2.2 GB",
        description: "Bestes Reasoning & Code",
        isMultimodal: false
    },
    // BALANCED: Qwen 2.5 1.5B — Bestes Deutsch + Code, effizient
    BALANCED: {
        id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
        name: "Qwen 2.5 1.5B",
        size: "1.0 GB",
        description: "Bestes Deutsch + Code, schnell",
        isMultimodal: false
    },
    // FAST: Llama 3.2 für schnelle Antworten
    SMALL: {
        id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
        name: "Llama 3.2 1B",
        size: "750 MB",
        description: "Schnell und kompakt",
        isMultimodal: false
    },
    // LEGACY: Phi-3.5 Mini (bisheriges Default-Modell)
    LEGACY: {
        id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
        name: "Phi-3.5 Mini",
        size: "2.2 GB",
        description: "Bewährtes Text-Modell",
        isMultimodal: false
    }
} as const;

/**
 * Prüft WebGPU-Unterstützung und Hardware-Kapazität
 */
export async function checkWebGPU(): Promise<DeviceProfile> {
    // 1. WebGPU Support prüfen
    if (typeof navigator === 'undefined') {
        return {
            supported: false,
            error: "Server-side rendering - WebGPU nicht verfügbar"
        };
    }

    if (!('gpu' in navigator)) {
        return {
            supported: false,
            error: "Ihr Browser unterstützt kein WebGPU. Bitte nutzen Sie Chrome, Edge oder Brave (Version 113+)."
        };
    }

    try {
        // 2. GPU Adapter anfragen
        const adapter = await navigator.gpu.requestAdapter();

        if (!adapter) {
            return {
                supported: false,
                error: "Keine kompatible GPU gefunden. WebGPU benötigt eine moderne Grafikkarte."
            };
        }

        // 3. GPU Speicher auslesen
        const maxBuffer = adapter.limits.maxStorageBufferBindingSize;
        const gpuMemoryGB = maxBuffer / (1024 * 1024 * 1024);
        const hasEnoughMemory = maxBuffer >= 1_000_000_000; // 1GB Minimum

        // 4. iOS Safari Detection (500MB Limit pro Tab)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        const isIOSSafari = isIOS && isSafari;

        // 5. Modell-Auswahl basierend auf Hardware
        if (isIOSSafari) {
            // iOS Safari hat 500MB Tab-Limit - Llama ist das Maximum
            return {
                supported: true,
                model: MODELS.SMALL.id,
                modelSize: MODELS.SMALL.size,
                reason: "iOS Safari: 500MB Tab-Limit erkannt",
                isIOS: true,
                gpuMemory: gpuMemoryGB
            };
        }

        // INTELLIGENTE MODELL-AUSWAHL:
        // Immer das BESTE Modell zuerst versuchen!
        // Nur fallback wenn Hardware es nicht schafft

        const canRunVisionFull = maxBuffer >= 4_000_000_000; // 4GB+ für Phi-3.5-vision
        const canRunFull = maxBuffer >= 2_000_000_000;      // 2GB+ für Phi-4 Mini
        const canRunBalanced = maxBuffer >= 800_000_000;     // 800MB+ für Qwen 2.5 1.5B
        const canRunSmall = maxBuffer >= 500_000_000;        // 500MB+ für Llama 3.2

        if (canRunVisionFull) {
            // PREMIUM: Phi-3.5-vision — Unified Text + Bild
            return {
                supported: true,
                model: MODELS.VISION_FULL.id,
                modelSize: MODELS.VISION_FULL.size,
                reason: `Premium Hardware (${gpuMemoryGB.toFixed(1)} GB) — Phi-3.5 Vision für Text + Bild`,
                isIOS: false,
                gpuMemory: gpuMemoryGB
            };
        }

        if (canRunFull) {
            // BEST: Phi-4 Mini — Bestes Reasoning
            return {
                supported: true,
                model: MODELS.FULL.id,
                modelSize: MODELS.FULL.size,
                reason: `Gute Hardware (${gpuMemoryGB.toFixed(1)} GB) — Phi-4 Mini für bestes Reasoning`,
                isIOS: false,
                gpuMemory: gpuMemoryGB
            };
        }

        if (canRunBalanced) {
            // BALANCED: Qwen 2.5 1.5B — Bestes Deutsch + Code
            return {
                supported: true,
                model: MODELS.BALANCED.id,
                modelSize: MODELS.BALANCED.size,
                reason: `Mittlere GPU (${gpuMemoryGB.toFixed(1)} GB) — Qwen 2.5 für bestes Deutsch`,
                isIOS: false,
                gpuMemory: gpuMemoryGB
            };
        }

        if (canRunSmall) {
            // FALLBACK 2: Llama 3.2 1B
            return {
                supported: true,
                model: MODELS.SMALL.id,
                modelSize: MODELS.SMALL.size,
                reason: `Begrenzter Speicher (${gpuMemoryGB.toFixed(1)} GB) - Llama 3.2 als Minimum`,
                isIOS: false,
                gpuMemory: gpuMemoryGB
            };
        }

        // Zu wenig GPU-Speicher für alle Modelle
        return {
            supported: false,
            error: `Unzureichender GPU-Speicher (${gpuMemoryGB.toFixed(2)} GB). Mindestens 500MB benötigt.`,
            gpuMemory: gpuMemoryGB
        };

    } catch (error) {
        return {
            supported: false,
            error: `WebGPU-Initialisierung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
        };
    }
}

/**
 * Prüft ob das Modell bereits im Cache liegt (OPFS)
 */
export async function isModelCached(modelId: string): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.storage) {
        return false;
    }

    try {
        // WebLLM nutzt IndexedDB für Model-Cache
        const databases = await indexedDB.databases();
        return databases.some(db => db.name?.includes('webllm') || db.name?.includes(modelId));
    } catch {
        return false;
    }
}

/**
 * Estimiert verfügbaren Speicher
 */
export async function getStorageEstimate(): Promise<{ available: number; used: number } | null> {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
        return null;
    }

    try {
        const estimate = await navigator.storage.estimate();
        return {
            available: estimate.quota || 0,
            used: estimate.usage || 0
        };
    } catch {
        return null;
    }
}
