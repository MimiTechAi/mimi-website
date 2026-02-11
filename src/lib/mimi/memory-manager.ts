/**
 * MIMI Agent - Memory Manager V1.0
 * 
 * Orchestriert RAM-Nutzung für Browser mit begrenztem Speicher
 * - Überwacht geschätzte Speichernutzung
 * - Entlädt nicht-aktive Modelle automatisch
 * - Verhindert OOM (Out of Memory) Crashes
 */

import { getVisionEngine } from './vision-engine';
import { getPiperTTS } from './piper-tts';

// Geschätzte Modellgrößen in MB
const MODEL_SIZES = {
    LLM_PHI35: 2200,      // Phi-3.5 Mini
    LLM_PHI35_VISION: 4200, // Phi-3.5 Vision (multimodal)
    LLM_PHI4: 2300,       // Phi-4 Mini
    LLM_PHI3: 1100,       // Phi-3 Mini
    LLM_QWEN25: 1000,     // Qwen 2.5 1.5B
    LLM_QWEN: 350,        // Qwen-0.5B
    VISION: 500,          // SmolVLM-256M-Instruct (q4)
    TTS: 150,             // Piper TTS
    PYODIDE: 200,         // Python Runtime
} as const;

// Schwellenwerte
const MEMORY_THRESHOLDS = {
    WARNING: 2500,        // MB - Warnung ausgeben
    CRITICAL: 3000,       // MB - Aggressive Entladung
    MOBILE_CRITICAL: 1500 // MB - Mobiles Limit
} as const;

export interface MemoryStatus {
    estimatedUsageMB: number;
    isWarning: boolean;
    isCritical: boolean;
    activeModels: string[];
}

/**
 * Memory Manager - Zentrale Speicherverwaltung
 */
class MemoryManager {
    private activeModels: Set<string> = new Set();
    private isMobile: boolean;

    constructor() {
        this.isMobile = this.detectMobile();
    }

    private detectMobile(): boolean {
        if (typeof navigator === 'undefined') return false;
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }

    /**
     * Registriert ein geladenes Modell
     */
    registerModel(modelId: string): void {
        this.activeModels.add(modelId);
        this.checkMemory();
    }

    /**
     * Deregistriert ein entladenes Modell
     */
    unregisterModel(modelId: string): void {
        this.activeModels.delete(modelId);
    }

    /**
     * Schätzt aktuelle Speichernutzung
     */
    getEstimatedUsage(): number {
        let total = 0;

        if (this.activeModels.has('vision')) {
            total += MODEL_SIZES.VISION;
        }
        if (this.activeModels.has('tts')) {
            total += MODEL_SIZES.TTS;
        }
        if (this.activeModels.has('pyodide')) {
            total += MODEL_SIZES.PYODIDE;
        }
        if (this.activeModels.has('llm-phi35-vision')) {
            total += MODEL_SIZES.LLM_PHI35_VISION;
            // Note: Vision model replaces separate SmolVLM — no need to add VISION size
        } else if (this.activeModels.has('llm-phi4')) {
            total += MODEL_SIZES.LLM_PHI4;
        } else if (this.activeModels.has('llm-phi35')) {
            total += MODEL_SIZES.LLM_PHI35;
        } else if (this.activeModels.has('llm-qwen25')) {
            total += MODEL_SIZES.LLM_QWEN25;
        } else if (this.activeModels.has('llm-phi3')) {
            total += MODEL_SIZES.LLM_PHI3;
        } else if (this.activeModels.has('llm-llama')) {
            total += 750; // Llama 3.2 1B
        } else if (this.activeModels.has('llm-qwen')) {
            total += MODEL_SIZES.LLM_QWEN;
        }

        return total;
    }

    /**
     * Prüft Speicherstatus
     */
    getStatus(): MemoryStatus {
        const usage = this.getEstimatedUsage();
        const threshold = this.isMobile ? MEMORY_THRESHOLDS.MOBILE_CRITICAL : MEMORY_THRESHOLDS.CRITICAL;

        return {
            estimatedUsageMB: usage,
            isWarning: usage >= MEMORY_THRESHOLDS.WARNING,
            isCritical: usage >= threshold,
            activeModels: Array.from(this.activeModels)
        };
    }

    /**
     * Prüft Speicher und entlädt wenn nötig
     */
    checkMemory(): void {
        const status = this.getStatus();

        if (status.isCritical) {
            console.warn(`[MemoryManager] CRITICAL: ${status.estimatedUsageMB}MB - Entlade nicht-essentielle Modelle`);
            this.unloadNonEssential();
        } else if (status.isWarning) {
            console.log(`[MemoryManager] WARNING: ${status.estimatedUsageMB}MB - Speicher wird knapp`);
        }
    }

    /**
     * Entlädt Vision-Modell
     */
    async unloadVision(): Promise<void> {
        if (!this.activeModels.has('vision')) return;

        try {
            const vision = getVisionEngine();
            vision.dispose();
            this.unregisterModel('vision');
            console.log('[MemoryManager] Vision-Modell entladen');
        } catch (e) {
            console.warn('[MemoryManager] Fehler beim Entladen von Vision:', e);
        }
    }

    /**
     * Entlädt TTS-Modell
     */
    async unloadTTS(): Promise<void> {
        if (!this.activeModels.has('tts')) return;

        try {
            const tts = getPiperTTS();
            await tts.dispose();
            this.unregisterModel('tts');
            console.log('[MemoryManager] TTS-Modell entladen');
        } catch (e) {
            console.warn('[MemoryManager] Fehler beim Entladen von TTS:', e);
        }
    }

    /**
     * Entlädt alle nicht-essentiellen Modelle (behält LLM)
     */
    async unloadNonEssential(): Promise<void> {
        await Promise.all([
            this.unloadVision(),
            this.unloadTTS()
        ]);
    }

    /**
     * Prüft ob genug Speicher für ein Modell verfügbar ist
     */
    canLoadModel(modelId: string): boolean {
        const currentUsage = this.getEstimatedUsage();
        const threshold = this.isMobile ? MEMORY_THRESHOLDS.MOBILE_CRITICAL : MEMORY_THRESHOLDS.CRITICAL;

        let additionalSize = 0;
        switch (modelId) {
            case 'vision':
                additionalSize = MODEL_SIZES.VISION;
                break;
            case 'tts':
                additionalSize = MODEL_SIZES.TTS;
                break;
            case 'pyodide':
                additionalSize = MODEL_SIZES.PYODIDE;
                break;
        }

        return (currentUsage + additionalSize) < threshold;
    }

    /**
     * Bereitet Speicher für ein neues Modell vor
     * Entlädt ggf. andere Modelle
     */
    async prepareForModel(modelId: string): Promise<boolean> {
        if (this.canLoadModel(modelId)) {
            return true;
        }

        console.log(`[MemoryManager] Speicher wird für ${modelId} vorbereitet...`);
        await this.unloadNonEssential();

        return this.canLoadModel(modelId);
    }
}

// Singleton
let memoryManagerInstance: MemoryManager | null = null;

export function getMemoryManager(): MemoryManager {
    if (!memoryManagerInstance) {
        memoryManagerInstance = new MemoryManager();
    }
    return memoryManagerInstance;
}

export type { MemoryManager };
