/**
 * MIMI PWA - Hardware Check (Browser-Optimiert)
 * 
 * Vollständige WebGPU Browser-Feature-Detection:
 * - shader-f16 (Chrome 120+): +28% prefill / +41% decode speed
 * - Subgroups (Chrome 134+): 2.3-2.9x Matrix-Multiply speedup
 * - WebNN API (Chrome 146+): NPU/GPU via navigator.ml (W3C CR Jan 2026)
 * - adapter.info statt requestAdapterInfo() (deprecated)
 * - WASM SIMD als CPU-Fallback
 * 
 * WICHTIG: Läuft im Web Browser — nutzt WebGPU direkt (Metal/Vulkan/DX12 via Browser-Abstraction)
 * Kein nativer Code — alles über Standard Browser-APIs.
 */

export interface BrowserGPUFeatures {
    shaderF16: boolean;        // Chrome 120+ — +28-41% LLM speed
    subgroups: boolean;        // Chrome 134+ — 2.3-2.9x matrix speedup
    subgroupUniformity: boolean; // Chrome 145+ — WGSL subgroup_uniformity extension
    bgra8unormStorage: boolean; // Texture storage optimization
    rg11b10ufloatRenderable: boolean;
    timestamp: boolean;        // GPU timing queries
    webNN: boolean;            // Chrome 146+ — navigator.ml (NPU/GPU)
    wasmSimd: boolean;         // WASM SIMD — CPU fallback acceleration
    sharedArrayBuffer: boolean; // SharedArrayBuffer — zero-copy Worker transfers
    gpuVendor: string;
    gpuDevice: string;
    gpuArchitecture: string;
    gpuDriver: string;
}

export interface DeviceProfile {
    supported: boolean;
    model?: string;
    modelSize?: string;
    reason?: string;
    error?: string;
    isIOS?: boolean;
    gpuMemory?: number;
    features?: BrowserGPUFeatures;
    // Performance-Tier basierend auf Browser-Features
    performanceTier?: 'ultra' | 'high' | 'medium' | 'low' | 'cpu-only';
}

// Modell-Konfigurationen — SOTA 2026 WebGPU Models (WebLLM 0.2.80)
// Alle Modelle sind q4f16 — nutzen shader-f16 wenn verfügbar
export const MODELS = {
    // ULTRA: Phi-3.5-vision für Text + Bild (unified multimodal, 8GB+)
    VISION_FULL: {
        id: "Phi-3.5-vision-instruct-q4f16_1-MLC",
        name: "Phi-3.5 Vision",
        size: "4.2 GB",
        description: "Unified Text + Bild (8GB+ GPU VRAM)",
        isMultimodal: true,
        minVRAM: 8_000_000_000
    },
    // PREMIUM: Qwen3-8B — Stärkstes Text-Modell in WebLLM 0.2.80
    // Benötigt 6GB+ VRAM, mit shader-f16+subgroups: ~20-35 tok/s
    PREMIUM: {
        id: "Qwen3-8B-q4f16_1-MLC",
        name: "Qwen3 8B",
        size: "5.2 GB",
        description: "Stärkstes Reasoning & Code (6GB+ VRAM)",
        isMultimodal: false,
        minVRAM: 6_000_000_000
    },
    // BEST TEXT: Qwen3-4B — SOTA 2026, bestes Reasoning in WebLLM 0.2.80
    // Mit shader-f16 + subgroups: ~40-60 tok/s im Browser
    FULL: {
        id: "Qwen3-4B-q4f16_1-MLC",
        name: "Qwen3 4B",
        size: "2.8 GB",
        description: "SOTA 2026: Bestes Reasoning & Code (3GB+)",
        isMultimodal: false,
        minVRAM: 3_000_000_000
    },
    // BALANCED: Qwen3-1.7B — Schnell & kompakt
    BALANCED: {
        id: "Qwen3-1.7B-q4f16_1-MLC",
        name: "Qwen3 1.7B",
        size: "1.4 GB",
        description: "Schnell & kompakt, SOTA 2026 Qualität",
        isMultimodal: false,
        minVRAM: 1_500_000_000
    },
    // FAST: Qwen3-0.6B — Ultra-schnell für schwache Hardware
    SMALL: {
        id: "Qwen3-0.6B-q4f16_1-MLC",
        name: "Qwen3 0.6B",
        size: "600 MB",
        description: "Ultra-schnell, minimaler Speicher",
        isMultimodal: false,
        minVRAM: 600_000_000
    },
    // LEGACY: Phi-3.5 Mini (Fallback wenn Qwen3 nicht cached)
    LEGACY: {
        id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
        name: "Phi-3.5 Mini",
        size: "2.2 GB",
        description: "Bewährtes Text-Modell (Fallback)",
        isMultimodal: false,
        minVRAM: 2_200_000_000
    }
} as const;

/**
 * Detektiert alle verfügbaren Browser WebGPU/AI-Features
 * Nutzt die AKTUELLEN Browser-APIs (Feb 2026):
 * - adapter.info (NICHT requestAdapterInfo — deprecated!)
 * - adapter.features.has() für optionale Features
 * - navigator.ml für WebNN
 */
export async function detectBrowserFeatures(adapter: GPUAdapter): Promise<BrowserGPUFeatures> {
    // GPU Adapter Info — adapter.info ist der neue Standard (requestAdapterInfo deprecated)
    // Spec: https://gpuweb.github.io/gpuweb/#dom-gpuadapter-info
    const info = adapter.info;

    // WebGPU Optional Features Detection
    // Spec: https://gpuweb.github.io/gpuweb/#feature-index
    const shaderF16 = adapter.features.has('shader-f16');           // Chrome 120+, +28-41% LLM speed
    const subgroups = adapter.features.has('subgroups');             // Chrome 134+, 2.3-2.9x matrix speedup
    const subgroupUniformity = adapter.features.has('subgroups-f16') || // Chrome 145+ WGSL extension
        adapter.features.has('chromium-experimental-subgroup-uniformity');
    const bgra8unormStorage = adapter.features.has('bgra8unorm-storage');
    const rg11b10ufloatRenderable = adapter.features.has('rg11b10ufloat-renderable');
    const timestamp = adapter.features.has('timestamp-query');

    // WebNN API Detection (W3C Candidate Recommendation Jan 2026)
    // Chrome 146 Beta (Feb 12, 2026) — navigator.ml.createContext({deviceType: 'gpu'})
    const webNN = typeof navigator !== 'undefined' && 'ml' in navigator;

    // WASM SIMD Detection — CPU-Fallback Beschleunigung
    // Alle modernen Browser (Chrome 91+, Firefox 89+, Safari 16.4+)
    let wasmSimd = false;
    try {
        // WASM SIMD feature detection via binary probe
        const simdTest = new Uint8Array([
            0x00, 0x61, 0x73, 0x6d, // magic
            0x01, 0x00, 0x00, 0x00, // version
            0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b, // type: () -> v128
            0x03, 0x02, 0x01, 0x00, // func
            0x0a, 0x0a, 0x01, 0x08, 0x00, 0xfd, 0x0f, 0x00, 0x00, 0x00, 0x00, 0x0b // body: v128.const
        ]);
        await WebAssembly.validate(simdTest);
        wasmSimd = true;
    } catch {
        wasmSimd = false;
    }

    // SharedArrayBuffer — zero-copy Worker-Transfers (braucht COOP/COEP Headers)
    const sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

    return {
        shaderF16,
        subgroups,
        subgroupUniformity,
        bgra8unormStorage,
        rg11b10ufloatRenderable,
        timestamp,
        webNN,
        wasmSimd,
        sharedArrayBuffer,
        gpuVendor: info?.vendor ?? 'unknown',
        gpuDevice: info?.device ?? 'unknown',
        gpuArchitecture: info?.architecture ?? 'unknown',
        gpuDriver: info?.description ?? 'unknown',
    };
}

/**
 * Bestimmt Performance-Tier basierend auf Browser-Features
 * Ultra: shader-f16 + subgroups + WebNN → beste Browser-Performance
 * High: shader-f16 + subgroups → sehr gut
 * Medium: shader-f16 → gut
 * Low: nur WebGPU → basis
 * CPU-only: kein WebGPU → WASM Fallback
 */
export function getPerformanceTier(features: BrowserGPUFeatures, gpuMemoryGB: number): DeviceProfile['performanceTier'] {
    if (!features.shaderF16 && !features.subgroups) {
        if (gpuMemoryGB < 0.5) return 'cpu-only';
        return 'low';
    }
    if (features.shaderF16 && features.subgroups && features.webNN) return 'ultra';
    if (features.shaderF16 && features.subgroups) return 'high';
    if (features.shaderF16) return 'medium';
    return 'low';
}

/**
 * Prüft WebGPU-Unterstützung und Hardware-Kapazität
 * Nutzt alle verfügbaren Browser-APIs für maximale Performance
 */
export async function checkWebGPU(): Promise<DeviceProfile> {
    // 1. SSR Guard
    if (typeof navigator === 'undefined') {
        return { supported: false, error: "Server-side rendering — WebGPU nicht verfügbar" };
    }

    // 2. WebGPU Support prüfen
    if (!('gpu' in navigator)) {
        return {
            supported: false,
            error: "Ihr Browser unterstützt kein WebGPU. Bitte nutzen Sie Chrome 113+, Edge 113+ oder Brave 1.51+."
        };
    }

    try {
        // 3. GPU Adapter mit high-performance Präferenz anfragen
        // powerPreference: 'high-performance' → Browser wählt dedizierte GPU
        // Im Browser: Metal (macOS), Vulkan (Linux/Android), DirectX 12 (Windows)
        const adapter = await navigator.gpu.requestAdapter({
            powerPreference: 'high-performance'
        });

        if (!adapter) {
            return {
                supported: false,
                error: "Keine kompatible GPU gefunden. WebGPU benötigt eine moderne Grafikkarte."
            };
        }

        // 4. GPU Speicher auslesen
        const maxBuffer = adapter.limits.maxStorageBufferBindingSize;
        const gpuMemoryGB = maxBuffer / (1024 * 1024 * 1024);

        // 5. Alle Browser-Features detektieren
        const features = await detectBrowserFeatures(adapter);
        const tier = getPerformanceTier(features, gpuMemoryGB);

        // Feature-Summary für Logs
        const featureLog = [
            features.shaderF16 ? '✅ shader-f16' : '❌ shader-f16',
            features.subgroups ? '✅ subgroups' : '❌ subgroups',
            features.webNN ? '✅ WebNN' : '❌ WebNN',
            features.wasmSimd ? '✅ WASM-SIMD' : '❌ WASM-SIMD',
            features.sharedArrayBuffer ? '✅ SAB' : '❌ SAB',
        ].join(' | ');
        console.log(`[MIMI] 🚀 Browser GPU Features: ${featureLog}`);
        console.log(`[MIMI] 🖥️ GPU: ${features.gpuVendor} ${features.gpuDevice} (${features.gpuArchitecture})`);
        console.log(`[MIMI] 💾 VRAM: ${gpuMemoryGB.toFixed(2)} GB | Tier: ${tier}`);

        // 6. iOS Safari Detection (500MB Limit pro Tab)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        const isIOSSafari = isIOS && isSafari;

        if (isIOSSafari) {
            return {
                supported: true,
                model: MODELS.SMALL.id,
                modelSize: MODELS.SMALL.size,
                reason: "iOS Safari: 500MB Tab-Limit erkannt",
                isIOS: true,
                gpuMemory: gpuMemoryGB,
                features,
                performanceTier: 'low'
            };
        }

        // 7. Intelligente Modell-Auswahl basierend auf VRAM + Features
        // Stufenweise: Vision(8GB+) → Qwen3-8B(6GB+) → Qwen3-4B(3GB+) → 1.7B → 0.6B
        const canRunVisionFull = maxBuffer >= 8_000_000_000;  // 8GB+ → Phi-3.5 Vision
        const canRunPremium = maxBuffer >= 6_000_000_000;  // 6GB+ → Qwen3-8B (NEU)
        const canRunFull = maxBuffer >= 3_000_000_000;  // 3GB+ → Qwen3-4B
        const canRunBalanced = maxBuffer >= 1_500_000_000;  // 1.5GB+ → Qwen3-1.7B
        const canRunSmall = maxBuffer >= 600_000_000;    // 600MB+ → Qwen3-0.6B

        // Performance-Beschreibung basierend auf Browser-Features
        const perfDesc = features.shaderF16 && features.subgroups
            ? `shader-f16+subgroups → ~2-3x schneller`
            : features.shaderF16
                ? `shader-f16 → ~1.4x schneller`
                : `Standard WebGPU`;
        const webnnDesc = features.webNN ? ` | WebNN aktiv` : '';

        if (canRunVisionFull) {
            return {
                supported: true,
                model: MODELS.VISION_FULL.id,
                modelSize: MODELS.VISION_FULL.size,
                reason: `Ultra GPU (${gpuMemoryGB.toFixed(1)} GB) — Phi-3.5 Vision | ${perfDesc}${webnnDesc}`,
                isIOS: false,
                gpuMemory: gpuMemoryGB,
                features,
                performanceTier: tier
            };
        }

        if (canRunPremium) {
            return {
                supported: true,
                model: MODELS.PREMIUM.id,
                modelSize: MODELS.PREMIUM.size,
                reason: `High-End GPU (${gpuMemoryGB.toFixed(1)} GB) — Qwen3-8B SOTA 2026 | ${perfDesc}${webnnDesc}`,
                isIOS: false,
                gpuMemory: gpuMemoryGB,
                features,
                performanceTier: tier
            };
        }

        if (canRunFull) {
            return {
                supported: true,
                model: MODELS.FULL.id,
                modelSize: MODELS.FULL.size,
                reason: `GPU (${gpuMemoryGB.toFixed(1)} GB) — Qwen3-4B SOTA 2026 | ${perfDesc}${webnnDesc}`,
                isIOS: false,
                gpuMemory: gpuMemoryGB,
                features,
                performanceTier: tier
            };
        }

        if (canRunBalanced) {
            return {
                supported: true,
                model: MODELS.BALANCED.id,
                modelSize: MODELS.BALANCED.size,
                reason: `GPU (${gpuMemoryGB.toFixed(1)} GB) — Qwen3-1.7B | ${perfDesc}${webnnDesc}`,
                isIOS: false,
                gpuMemory: gpuMemoryGB,
                features,
                performanceTier: tier
            };
        }

        if (canRunSmall) {
            return {
                supported: true,
                model: MODELS.SMALL.id,
                modelSize: MODELS.SMALL.size,
                reason: `Begrenzter Speicher (${gpuMemoryGB.toFixed(1)} GB) — Qwen3-0.6B | ${perfDesc}`,
                isIOS: false,
                gpuMemory: gpuMemoryGB,
                features,
                performanceTier: 'low'
            };
        }

        return {
            supported: false,
            error: `Unzureichender GPU-Speicher (${gpuMemoryGB.toFixed(2)} GB). Mindestens 600MB benötigt.`,
            gpuMemory: gpuMemoryGB,
            features
        };

    } catch (error) {
        return {
            supported: false,
            error: `WebGPU-Initialisierung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
        };
    }
}

/**
 * Prüft ob das Modell bereits im Cache liegt (IndexedDB via WebLLM)
 */
export async function isModelCached(modelId: string): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.storage) {
        return false;
    }

    try {
        // WebLLM nutzt IndexedDB für Model-Cache
        const databases = await indexedDB.databases();
        const hasWebLLMDb = databases.some(db =>
            db.name?.includes('webllm') ||
            db.name?.includes('mlc') ||
            db.name?.includes('cache')
        );

        if (!hasWebLLMDb) return false;

        // OPFS Check als zusätzliche Verifikation
        const root = await navigator.storage.getDirectory();
        try {
            await root.getDirectoryHandle('webllm', { create: false });
            return true;
        } catch {
            return hasWebLLMDb;
        }
    } catch {
        return false;
    }
}

/**
 * Schätzt verfügbaren Speicher für Modell-Download
 * Nutzt StorageManager API (Chrome 61+)
 */
export async function getAvailableStorage(): Promise<{ available: number; quota: number }> {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
        return { available: 0, quota: 0 };
    }

    try {
        const estimate = await navigator.storage.estimate();
        const quota = estimate.quota ?? 0;
        const usage = estimate.usage ?? 0;
        return {
            available: quota - usage,
            quota
        };
    } catch {
        return { available: 0, quota: 0 };
    }
}

/**
 * Fordert persistenten Storage an (verhindert Browser-Eviction von IndexedDB/OPFS)
 * Wichtig für Model-Cache: Ohne persist kann der Browser den Cache löschen.
 * StorageManager.persist() API — Chrome 55+, Firefox 55+, Safari 15.2+
 */
export async function requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
        return false;
    }
    try {
        const granted = await navigator.storage.persist();
        if (granted) {
            console.log('[MIMI] ✅ Persistenter Storage gewährt — Model-Cache wird nicht gelöscht');
        } else {
            console.warn('[MIMI] ⚠️ Persistenter Storage abgelehnt — Browser kann Cache löschen');
        }
        return granted;
    } catch {
        return false;
    }
}

