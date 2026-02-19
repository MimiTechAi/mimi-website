/**
 * MIMI WebNN Service — Chrome 146+ (W3C Candidate Recommendation Jan 2026)
 *
 * WebNN (Web Neural Network API) ermöglicht Hardware-beschleunigte ML-Inferenz
 * via navigator.ml — nutzt NPU, GPU oder CPU je nach verfügbarer Hardware.
 *
 * Einsatz in MIMI:
 * - Embedding-Berechnungen für RAG/Vektorsuche (schneller als WASM)
 * - Nicht für LLM-Inferenz (WebLLM/WebGPU ist dafür optimiert)
 *
 * Spec: https://www.w3.org/TR/webnn/
 * Chrome 146 Beta (Feb 12, 2026): navigator.ml.createContext({deviceType: 'gpu'})
 */

export type WebNNDeviceType = 'gpu' | 'npu' | 'cpu';

export interface WebNNContext {
    deviceType: WebNNDeviceType;
    context: unknown; // MLContext — typisiert als unknown für Browser-Kompatibilität
}

export interface WebNNStatus {
    available: boolean;
    deviceType?: WebNNDeviceType;
    reason?: string;
}

/**
 * Prüft ob WebNN verfügbar ist (Chrome 146+)
 */
export function isWebNNAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'ml' in navigator;
}

/**
 * Initialisiert WebNN-Kontext mit der besten verfügbaren Hardware
 * Priorität: NPU → GPU → CPU
 *
 * Chrome 146+ Beta: navigator.ml.createContext({deviceType: 'gpu'})
 * Nutzt GPU-Backend (Metal/Vulkan/DX12) für Embedding-Berechnungen
 */
export async function initWebNN(): Promise<WebNNContext | null> {
    if (!isWebNNAvailable()) {
        console.log('[WebNN] navigator.ml nicht verfügbar — Chrome 146+ benötigt');
        return null;
    }

    const ml = (navigator as any).ml;
    const devicePriority: WebNNDeviceType[] = ['npu', 'gpu', 'cpu'];

    for (const deviceType of devicePriority) {
        try {
            const context = await ml.createContext({ deviceType });
            console.log(`[WebNN] ✅ Kontext erstellt: deviceType=${deviceType}`);
            return { deviceType, context };
        } catch {
            console.log(`[WebNN] ${deviceType} nicht verfügbar, versuche nächste Option...`);
        }
    }

    console.warn('[WebNN] Kein WebNN-Backend verfügbar (NPU/GPU/CPU alle fehlgeschlagen)');
    return null;
}

/**
 * Gibt WebNN-Status zurück (für UI-Anzeige)
 */
export async function getWebNNStatus(): Promise<WebNNStatus> {
    if (!isWebNNAvailable()) {
        return {
            available: false,
            reason: 'Chrome 146+ mit WebNN-Support benötigt'
        };
    }

    const ctx = await initWebNN();
    if (!ctx) {
        return {
            available: false,
            reason: 'WebNN API vorhanden, aber kein Backend verfügbar'
        };
    }

    return {
        available: true,
        deviceType: ctx.deviceType,
        reason: `WebNN aktiv via ${ctx.deviceType.toUpperCase()}`
    };
}

// Singleton — wird einmal initialisiert und wiederverwendet
let webNNContextCache: WebNNContext | null | undefined = undefined;

/**
 * Gibt gecachten WebNN-Kontext zurück (lazy init)
 * Verhindert mehrfache Initialisierung
 */
export async function getWebNNContext(): Promise<WebNNContext | null> {
    if (webNNContextCache !== undefined) {
        return webNNContextCache;
    }
    webNNContextCache = await initWebNN();
    return webNNContextCache;
}
