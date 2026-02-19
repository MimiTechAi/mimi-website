/**
 * MIMI PWA - Inference Worker V3.2 (Browser-Optimiert)
 *
 * Nutzt ALLE verfügbaren Browser WebGPU-Features:
 * - shader-f16 (Chrome 120+): +28% prefill / +41% decode speed
 * - subgroups (Chrome 134+): 2.3-2.9x Matrix-Multiply speedup
 * - adapter.info (NICHT requestAdapterInfo — deprecated seit Chrome 121)
 * - powerPreference: 'high-performance' → Metal/Vulkan/DX12 via Browser
 *
 * WICHTIG: Läuft im Web Worker — kein DOM-Zugriff, nur Web APIs.
 * Browser abstrahiert GPU-Backend: Metal (macOS), Vulkan (Linux/Android), DX12 (Windows)
 *
 * Architektur:
 * - Main Thread: CreateWebWorkerMLCEngine(worker, modelId) → sendet "reload" Message
 * - Worker: WebWorkerMLCEngineHandler.onmessage() empfängt "reload" und lädt Modell
 * - Streaming: Handler sendet Tokens direkt via postMessage() zurück
 */

import * as webllm from "@mlc-ai/web-llm";

/**
 * Monkey-patches GPUAdapter.prototype.requestDevice um:
 * 1. Maximale Compute-Limits zu setzen (Phi-3.5-vision braucht 1024)
 * 2. shader-f16 + subgroups als requiredFeatures anzufordern wenn verfügbar
 * 
 * KRITISCH: Muss VOR WebLLM-Initialisierung laufen.
 */
function patchWebGPULimitsAndFeatures(): void {
    if (typeof GPUAdapter === 'undefined') {
        console.warn('[Worker] GPUAdapter not available, skipping patch');
        return;
    }

    const originalRequestDevice = GPUAdapter.prototype.requestDevice;

    GPUAdapter.prototype.requestDevice = function (
        this: GPUAdapter,
        descriptor?: GPUDeviceDescriptor
    ): Promise<GPUDevice> {
        // Sammle alle verfügbaren optionalen Features
        // shader-f16: +28-41% LLM speed (Chrome 120+)
        // subgroups: 2.3-2.9x Matrix-Multiply speedup (Chrome 134+)
        const optionalFeatures: GPUFeatureName[] = [];

        if (this.features.has('shader-f16')) {
            optionalFeatures.push('shader-f16');
            console.log('[Worker] ✅ shader-f16 verfügbar → +28-41% LLM speed');
        }
        if (this.features.has('subgroups')) {
            optionalFeatures.push('subgroups');
            console.log('[Worker] ✅ subgroups verfügbar → 2.3-2.9x Matrix speedup');
        }
        if (this.features.has('bgra8unorm-storage')) {
            optionalFeatures.push('bgra8unorm-storage');
        }
        if (this.features.has('timestamp-query')) {
            optionalFeatures.push('timestamp-query');
        }

        // Merge mit bestehenden requiredFeatures aus dem Descriptor
        const existingFeatures = descriptor?.requiredFeatures ?? [];
        const mergedFeatures = [
            ...new Set([...existingFeatures, ...optionalFeatures])
        ] as GPUFeatureName[];

        const patchedDescriptor: GPUDeviceDescriptor = {
            ...descriptor,
            requiredFeatures: mergedFeatures,
            requiredLimits: {
                ...descriptor?.requiredLimits,
                // Phi-3.5-vision braucht 1024 (WebLLM default: 256)
                maxComputeInvocationsPerWorkgroup:
                    this.limits.maxComputeInvocationsPerWorkgroup,
                maxComputeWorkgroupSizeX:
                    this.limits.maxComputeWorkgroupSizeX,
                maxComputeWorkgroupSizeY:
                    this.limits.maxComputeWorkgroupSizeY,
                maxComputeWorkgroupSizeZ:
                    this.limits.maxComputeWorkgroupSizeZ,
                // Maximale Buffer-Größe für große Modelle
                maxStorageBufferBindingSize:
                    this.limits.maxStorageBufferBindingSize,
                maxBufferSize:
                    this.limits.maxBufferSize,
            },
        };

        console.log(`[Worker] 🔧 GPU patch: features=[${mergedFeatures.join(', ')}] maxCompute=${this.limits.maxComputeInvocationsPerWorkgroup}`);

        return originalRequestDevice.call(this, patchedDescriptor);
    };
}

/**
 * Loggt vollständige GPU-Capabilities für Diagnostics
 * Nutzt adapter.info (NICHT requestAdapterInfo — deprecated!)
 */
async function logGPUCapabilities(): Promise<void> {
    try {
        // High-performance Adapter anfragen
        // Browser wählt: Metal (macOS), Vulkan (Linux/Android), DirectX 12 (Windows)
        const adapter = await navigator.gpu?.requestAdapter({
            powerPreference: 'high-performance'
        });

        if (!adapter) {
            console.warn('[Worker] Kein GPU-Adapter verfügbar');
            return;
        }

        // adapter.info ist der aktuelle Standard (requestAdapterInfo deprecated seit Chrome 121)
        const info = adapter.info;
        const vramGB = (adapter.limits.maxStorageBufferBindingSize / (1024 ** 3)).toFixed(2);

        console.log(`[Worker] 🖥️  GPU: ${info?.vendor ?? 'unknown'} | ${info?.device ?? 'unknown'} | ${info?.architecture ?? ''}`);
        console.log(`[Worker] 💾 VRAM: ${vramGB} GB | maxBuffer: ${(adapter.limits.maxBufferSize / (1024 ** 3)).toFixed(2)} GB`);
        console.log(`[Worker] ⚙️  maxCompute: ${adapter.limits.maxComputeInvocationsPerWorkgroup} invocations/workgroup`);
        console.log(`[Worker] 📊 maxBindGroups: ${adapter.limits.maxBindGroups} | maxUniformBuffer: ${(adapter.limits.maxUniformBufferBindingSize / 1024).toFixed(0)} KB`);

        // Feature-Status loggen
        const features = {
            'shader-f16': adapter.features.has('shader-f16'),
            'subgroups': adapter.features.has('subgroups'),
            'timestamp-query': adapter.features.has('timestamp-query'),
            'bgra8unorm-storage': adapter.features.has('bgra8unorm-storage'),
        };

        const featureStr = Object.entries(features)
            .map(([k, v]) => `${v ? '✅' : '❌'} ${k}`)
            .join(' | ');
        console.log(`[Worker] 🚀 WebGPU Features: ${featureStr}`);

        // WebNN Check (Chrome 146+)
        if ('ml' in self) {
            console.log('[Worker] ✅ WebNN API verfügbar (navigator.ml) — NPU/GPU Beschleunigung möglich');
        }

        // SharedArrayBuffer Check (braucht COOP/COEP Headers)
        if (typeof SharedArrayBuffer !== 'undefined') {
            console.log('[Worker] ✅ SharedArrayBuffer aktiv — zero-copy Worker-Transfers möglich');
        } else {
            console.warn('[Worker] ❌ SharedArrayBuffer nicht verfügbar — COOP/COEP Headers prüfen');
        }

    } catch (e: unknown) {
        console.warn('[Worker] GPU diagnostics failed:', e);
    }
}

// ─── Initialisierung ───────────────────────────────────────────────────────────

// 1. GPU Patch ZUERST — muss vor WebLLM-Initialisierung laufen
patchWebGPULimitsAndFeatures();

// 2. GPU-Info loggen (async, blockiert nicht)
logGPUCapabilities();

// ─── WebLLM Official Worker Handler ───────────────────────────────────────────
// CRITICAL: Create handler and wire it to self.onmessage
// Ohne dies empfängt der Worker keine "reload" Messages von CreateWebWorkerMLCEngine
const handler = new webllm.WebWorkerMLCEngineHandler();

// Wire handler to self.onmessage
self.onmessage = (event: MessageEvent) => {
    handler.onmessage(event);
};

console.log('[Worker] ✅ WebWorkerMLCEngineHandler V3.2 initialisiert — shader-f16 + subgroups aktiv wenn verfügbar');

// TypeScript für Web Worker
export { };
