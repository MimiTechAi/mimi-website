/**
 * MIMI Agent - Vision Engine V2.0 (SOTA 2026)
 * 
 * Lokale Bildanalyse mit SmolVLM (Primary) + Florence-2 (Fallback)
 * - Läuft 100% im Browser
 * - WebGPU-Beschleunigung mit WASM-Fallback
 * - Unterstützt: VQA, Captioning, OCR, Object Detection
 * 
 * Model Strategy (per Roadmap):
 * 1. SmolVLM-256M-Instruct → echtes VLM, VQA, Chat über Bilder (WebGPU)
 * 2. Florence-2-base-ft → OCR, Captioning (WASM fallback)
 * 3. vit-gpt2-image-captioning → Legacy fallback
 * 4. vit-base-patch16-224 → Ultimate classification fallback
 * 
 * Phase 2 (geplant): Phi-3.5-vision via WebLLM als unified Text+Bild LLM
 */

export interface ImageAnalysisResult {
    description: string;
    objects: DetectedObject[];
    text?: string;                // OCR-Ergebnis wenn Text erkannt
    confidence: number;
}

export interface DetectedObject {
    label: string;
    confidence: number;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface VQAResult {
    answer: string;
    confidence: number;
}

/**
 * Vision Memory für Kontext über mehrere Bilder
 */
interface VisionMemory {
    imageId: string;
    description: string;
    timestamp: number;
}

type PipelineType = 'vlm' | 'florence' | 'captioning' | 'classification';

/**
 * Vision Engine V2.0 - SmolVLM + Florence-2 + Fallbacks
 */
class VisionEngine {
    private pipeline: any = null;
    private tokenizer: any = null;
    private processor: any = null;
    private isInitialized = false;
    private initPromise: Promise<void> | null = null;
    private memory: VisionMemory[] = [];
    private maxMemorySize = 10;
    private pipelineType: PipelineType = 'captioning';
    private deviceUsed: 'webgpu' | 'wasm' = 'wasm';
    private modelName: string = '';

    /**
     * Initialisiert die Vision Engine
     */
    async init(onProgress?: (status: string) => void): Promise<void> {
        if (this.isInitialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = this.doInit(onProgress);
        await this.initPromise;
    }

    private async doInit(onProgress?: (status: string) => void): Promise<void> {
        onProgress?.('Lade Vision-Modell...');

        try {
            const { pipeline, env } = await import('@huggingface/transformers');

            // Browser-Konfiguration
            env.allowLocalModels = false;
            env.useBrowserCache = true;

            // ════════════════════════════════════════════════
            // STRATEGY 1: SmolVLM-Instruct mit WebGPU (BEST)
            // Echtes VLM — kann Bilder verstehen UND Fragen beantworten
            // ════════════════════════════════════════════════
            try {
                onProgress?.('Initialisiere SmolVLM (WebGPU)...');
                console.log('[VisionEngine] Attempting SmolVLM-256M-Instruct with WebGPU...');

                this.pipeline = await pipeline(
                    'image-text-to-text' as any,
                    'HuggingFaceTB/SmolVLM-256M-Instruct',
                    {
                        device: 'webgpu',
                        dtype: 'q4f16',
                        progress_callback: (progress: any) => {
                            if (progress.status === 'progress' && progress.progress) {
                                onProgress?.(`Lade SmolVLM (WebGPU): ${Math.round(progress.progress)}%`);
                            }
                        }
                    }
                );

                this.isInitialized = true;
                this.pipelineType = 'vlm';
                this.deviceUsed = 'webgpu';
                this.modelName = 'SmolVLM-256M-Instruct';
                onProgress?.('✅ SmolVLM bereit (WebGPU)!');
                console.log('[VisionEngine] ✅ SmolVLM loaded with WebGPU');
                return;

            } catch (smolWebGPUError) {
                console.warn('[VisionEngine] SmolVLM WebGPU failed:', smolWebGPUError);
            }

            // ════════════════════════════════════════════════
            // STRATEGY 2: SmolVLM-Instruct mit WASM
            // Still a VLM, just slower
            // ════════════════════════════════════════════════
            try {
                onProgress?.('Initialisiere SmolVLM (WASM)...');
                console.log('[VisionEngine] Attempting SmolVLM-256M-Instruct with WASM...');

                this.pipeline = await pipeline(
                    'image-text-to-text' as any,
                    'HuggingFaceTB/SmolVLM-256M-Instruct',
                    {
                        dtype: 'q4',
                        progress_callback: (progress: any) => {
                            if (progress.status === 'progress' && progress.progress) {
                                onProgress?.(`Lade SmolVLM (WASM): ${Math.round(progress.progress)}%`);
                            }
                        }
                    }
                );

                this.isInitialized = true;
                this.pipelineType = 'vlm';
                this.deviceUsed = 'wasm';
                this.modelName = 'SmolVLM-256M-Instruct';
                onProgress?.('✅ SmolVLM bereit (WASM)!');
                console.log('[VisionEngine] ✅ SmolVLM loaded with WASM');
                return;

            } catch (smolWASMError) {
                console.warn('[VisionEngine] SmolVLM WASM failed:', smolWASMError);
            }

            // ════════════════════════════════════════════════
            // STRATEGY 3: Florence-2 (OCR + Captioning specialist)
            // ════════════════════════════════════════════════
            try {
                onProgress?.('Initialisiere Florence-2...');
                console.log('[VisionEngine] Attempting Florence-2-base-ft...');

                this.pipeline = await pipeline(
                    'image-to-text',
                    'onnx-community/Florence-2-base-ft',
                    {
                        dtype: 'q8',
                        progress_callback: (progress: any) => {
                            if (progress.status === 'progress' && progress.progress) {
                                onProgress?.(`Lade Florence-2: ${Math.round(progress.progress)}%`);
                            }
                        }
                    }
                );

                this.isInitialized = true;
                this.pipelineType = 'florence';
                this.deviceUsed = 'wasm';
                this.modelName = 'Florence-2-base-ft';
                onProgress?.('✅ Florence-2 bereit!');
                console.log('[VisionEngine] ✅ Florence-2 loaded');
                return;

            } catch (florenceError) {
                console.warn('[VisionEngine] Florence-2 failed:', florenceError);
            }

            // ════════════════════════════════════════════════
            // STRATEGY 4: vit-gpt2 Captioning (Legacy)
            // ════════════════════════════════════════════════
            onProgress?.('Lade Legacy Vision-Modell...');
            console.warn('[VisionEngine] Falling back to vit-gpt2-image-captioning');

            this.pipeline = await pipeline(
                'image-to-text',
                'Xenova/vit-gpt2-image-captioning',
                {
                    progress_callback: (progress: any) => {
                        if (progress.status === 'progress' && progress.progress) {
                            onProgress?.(`Lade Legacy-Modell: ${Math.round(progress.progress)}%`);
                        }
                    }
                }
            );
            this.isInitialized = true;
            this.pipelineType = 'captioning';
            this.deviceUsed = 'wasm';
            this.modelName = 'vit-gpt2-image-captioning';
            onProgress?.('✅ Legacy Vision-Modell bereit!');
            console.log('[VisionEngine] ✅ Legacy vit-gpt2 loaded');

        } catch (error) {
            console.error('[VisionEngine] ❌ All primary models failed:', error);
            this.initPromise = null;

            // ULTIMATE FALLBACK: Image Classification
            try {
                onProgress?.('Lade minimales Klassifikationsmodell...');
                const { pipeline: fallbackPipeline, env } = await import('@huggingface/transformers');
                env.allowLocalModels = false;
                env.useBrowserCache = true;

                this.pipeline = await fallbackPipeline(
                    'image-classification',
                    'Xenova/vit-base-patch16-224',
                    {
                        progress_callback: (progress: any) => {
                            if (progress.status === 'progress' && progress.progress) {
                                onProgress?.(`Lade Klassifikationsmodell: ${Math.round(progress.progress)}%`);
                            }
                        }
                    }
                );
                this.isInitialized = true;
                this.pipelineType = 'classification';
                this.deviceUsed = 'wasm';
                this.modelName = 'vit-base-patch16-224';
                onProgress?.('✅ Klassifikationsmodell bereit!');
                console.log('[VisionEngine] ✅ Classification fallback loaded');
            } catch (fallbackError) {
                console.error('[VisionEngine] ❌ ALL models failed:', fallbackError);
                throw new Error('Kein Vision-Modell verfügbar');
            }
        }
    }

    /**
     * Analysiert ein Bild
     */
    async analyzeImage(
        imageInput: File | Blob | HTMLImageElement | string,
        prompt?: string
    ): Promise<ImageAnalysisResult> {
        if (!this.isInitialized || !this.pipeline) {
            throw new Error('Vision Engine nicht initialisiert');
        }

        try {
            const imageUrl = await this.prepareImage(imageInput);

            let description: string;
            let objects: DetectedObject[] = [];
            let text: string | undefined;
            let confidence = 0.85;

            if (this.pipelineType === 'vlm') {
                // ═══════════════════════════════════════════
                // SmolVLM: Echtes VLM — detaillierte Bildbeschreibung
                // ═══════════════════════════════════════════
                const analysisPrompt = prompt || 'Describe this image in detail. Include all visible objects, text, colors, and composition.';

                const result = await this.pipeline(imageUrl, {
                    text: analysisPrompt,
                    max_new_tokens: 256,
                });

                description = this.extractGeneratedText(result);
                confidence = 0.92;

                // Try to extract text if image might contain text
                try {
                    const ocrResult = await this.pipeline(imageUrl, {
                        text: 'Read and transcribe all visible text in this image. Only output the text.',
                        max_new_tokens: 256,
                    });
                    const ocrText = this.extractGeneratedText(ocrResult);
                    if (ocrText && ocrText !== description && ocrText.length > 5) {
                        text = ocrText;
                    }
                } catch {
                    // OCR optional
                }

            } else if (this.pipelineType === 'florence') {
                // ═══════════════════════════════════════════
                // Florence-2: Captioning + OCR specialist
                // ═══════════════════════════════════════════
                const captionResult = await this.pipeline(imageUrl, {
                    max_new_tokens: 256,
                    num_beams: 3,
                });
                description = this.extractGeneratedText(captionResult);
                confidence = 0.88;

                // Try OCR
                try {
                    const ocrResult = await this.pipeline(imageUrl, {
                        max_new_tokens: 512,
                        num_beams: 1,
                    });
                    const ocrText = this.extractGeneratedText(ocrResult);
                    if (ocrText && ocrText !== description && ocrText.length > 5) {
                        text = ocrText;
                    }
                } catch {
                    // OCR optional
                }

            } else if (this.pipelineType === 'captioning') {
                // ═══════════════════════════════════════════
                // vit-gpt2: Einfache Caption
                // ═══════════════════════════════════════════
                const result = await this.pipeline(imageUrl);
                description = this.extractGeneratedText(result);
                confidence = 0.7;

            } else {
                // ═══════════════════════════════════════════
                // Classification: Nur Labels
                // ═══════════════════════════════════════════
                const result = await this.pipeline(imageUrl);
                objects = this.extractObjects(result);
                const topLabels = objects.slice(0, 5).map(o => o.label).join(', ');
                description = `Erkannte Objekte: ${topLabels}`;
                confidence = objects[0]?.confidence || 0.6;
            }

            // In Memory speichern
            const imageId = `img_${Date.now()}`;
            this.addToMemory(imageId, description);

            console.log(`[VisionEngine] ✅ Analyse (${this.modelName}/${this.deviceUsed}): ${description.slice(0, 100)}...`);

            return { description, objects, text, confidence };

        } catch (error) {
            console.error('[VisionEngine] ❌ Bildanalyse fehlgeschlagen:', error);
            throw new Error('Bildanalyse fehlgeschlagen');
        }
    }

    /**
     * Visual Question Answering - Beantwortet Fragen zu einem Bild
     */
    async askAboutImage(
        imageInput: File | Blob | HTMLImageElement | string,
        question: string
    ): Promise<VQAResult> {
        if (!this.isInitialized || !this.pipeline) {
            throw new Error('Vision Engine nicht initialisiert');
        }

        try {
            const imageUrl = await this.prepareImage(imageInput);

            if (this.pipelineType === 'vlm') {
                // ═══════════════════════════════════════════
                // SmolVLM: Echtes VQA — versteht Frage + Bild
                // ═══════════════════════════════════════════
                const result = await this.pipeline(imageUrl, {
                    text: question,
                    max_new_tokens: 256,
                });

                return {
                    answer: this.extractGeneratedText(result),
                    confidence: 0.9
                };

            } else if (this.pipelineType === 'florence') {
                // Florence-2: Caption-basierte Antwort
                const result = await this.pipeline(imageUrl, {
                    max_new_tokens: 256,
                    num_beams: 3,
                });
                const caption = this.extractGeneratedText(result);
                return {
                    answer: this.buildAnswerFromCaption(caption, question),
                    confidence: 0.8
                };

            } else if (this.pipelineType === 'captioning') {
                // vit-gpt2: Einfache Caption als Antwort
                const result = await this.pipeline(imageUrl, {
                    max_new_tokens: 128,
                });
                return {
                    answer: this.extractGeneratedText(result),
                    confidence: 0.65
                };

            } else {
                // Classification: Label-basierte Antwort
                const result = await this.pipeline(imageUrl);
                const objects = this.extractObjects(result);
                const topLabels = objects.slice(0, 5);
                const lowerQ = question.toLowerCase();
                let answer: string;

                if (lowerQ.includes('was') || lowerQ.includes('what')) {
                    answer = `Im Bild erkenne ich: ${topLabels.map(o => o.label).join(', ')}`;
                } else if (lowerQ.includes('text') || lowerQ.includes('lesen') || lowerQ.includes('ocr')) {
                    answer = `OCR ist mit dem aktuellen Modell nicht verfügbar. Erkannte Objekte: ${topLabels.map(o => o.label).join(', ')}`;
                } else {
                    answer = `Basierend auf meiner Analyse: ${topLabels.map(o => `${o.label} (${Math.round(o.confidence * 100)}%)`).join(', ')}`;
                }

                return { answer, confidence: topLabels[0]?.confidence || 0.6 };
            }

        } catch (error) {
            console.error('[VisionEngine] ❌ VQA fehlgeschlagen:', error);
            throw new Error('Frage konnte nicht beantwortet werden');
        }
    }

    /**
     * Baut eine kontextuelle Antwort aus Caption + Frage (für non-VLM models)
     */
    private buildAnswerFromCaption(caption: string, question: string): string {
        const lowerQ = question.toLowerCase();

        if (lowerQ.includes('text') || lowerQ.includes('lesen') || lowerQ.includes('ocr') || lowerQ.includes('schrift')) {
            return `Im Bild sehe ich: ${caption}. Für präzise Texterkennung nutze bitte die OCR-Funktion.`;
        }
        if (lowerQ.includes('farbe') || lowerQ.includes('color')) {
            return `Bildbeschreibung: ${caption}. Detaillierte Farbanalyse erfordert ein VLM-Modell.`;
        }
        if (lowerQ.includes('wie viele') || lowerQ.includes('anzahl') || lowerQ.includes('how many')) {
            return `Basierend auf meiner Analyse: ${caption}`;
        }
        return caption;
    }

    /**
     * OCR - Texterkennung im Bild
     */
    async extractText(
        imageInput: File | Blob | HTMLImageElement | string
    ): Promise<string> {
        if (!this.isInitialized || !this.pipeline) {
            throw new Error('Vision Engine nicht initialisiert');
        }

        const imageUrl = await this.prepareImage(imageInput);

        if (this.pipelineType === 'vlm') {
            // SmolVLM: Direct OCR via VQA
            const result = await this.pipeline(imageUrl, {
                text: 'Read and transcribe ALL visible text in this image. Output only the text content.',
                max_new_tokens: 512,
            });
            return this.extractGeneratedText(result);
        }

        if (this.pipelineType === 'florence') {
            // Florence-2: OCR specialist
            try {
                const result = await this.pipeline(imageUrl, {
                    max_new_tokens: 512,
                    num_beams: 1,
                });
                return this.extractGeneratedText(result);
            } catch {
                // fallthrough
            }
        }

        // Fallback: VQA-based approach
        const result = await this.askAboutImage(
            imageInput,
            'Read and transcribe all visible text in this image. Only output the text content.'
        );
        return result.answer;
    }

    /**
     * Vergleicht zwei Bilder
     */
    async compareImages(
        image1: File | Blob | HTMLImageElement | string,
        image2: File | Blob | HTMLImageElement | string
    ): Promise<string> {
        const analysis1 = await this.analyzeImage(image1);
        const analysis2 = await this.analyzeImage(image2);

        return `**Bild 1:** ${analysis1.description}\n\n**Bild 2:** ${analysis2.description}`;
    }

    // ─── Internal helpers ────────────────────────────────────

    private async prepareImage(input: File | Blob | HTMLImageElement | string): Promise<string> {
        if (typeof input === 'string') return input;

        if (input instanceof HTMLImageElement) {
            const canvas = document.createElement('canvas');
            canvas.width = input.naturalWidth;
            canvas.height = input.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(input, 0, 0);
            return canvas.toDataURL('image/png');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(input);
        });
    }

    private extractGeneratedText(result: any): string {
        if (Array.isArray(result)) {
            return result[0]?.generated_text || 'Keine Beschreibung';
        }
        return result?.generated_text || 'Keine Beschreibung';
    }

    private extractObjects(result: any): DetectedObject[] {
        if (!result || !Array.isArray(result)) return [];
        return result.map(item => ({
            label: item.label || 'unknown',
            confidence: item.score || 0
        }));
    }

    private addToMemory(imageId: string, description: string): void {
        this.memory.push({ imageId, description, timestamp: Date.now() });
        if (this.memory.length > this.maxMemorySize) {
            this.memory = this.memory.slice(-this.maxMemorySize);
        }
    }

    getContext(limit = 3): string {
        if (this.memory.length === 0) return '';
        return this.memory.slice(-limit)
            .map((m, i) => `[Bild ${i + 1}]: ${m.description}`)
            .join('\n');
    }

    clearMemory(): void {
        this.memory = [];
    }

    dispose(): void {
        this.pipeline = null;
        this.processor = null;
        this.tokenizer = null;
        this.isInitialized = false;
        this.initPromise = null;
        this.memory = [];
        const sizeEstimate = this.pipelineType === 'vlm' ? '500' : this.pipelineType === 'florence' ? '450' : '80';
        console.log(`[VisionEngine] Disposed (${this.modelName}, ~${sizeEstimate}MB freed)`);
    }

    get ready(): boolean {
        return this.isInitialized;
    }

    get currentPipelineType(): PipelineType {
        return this.pipelineType;
    }

    get device(): 'webgpu' | 'wasm' {
        return this.deviceUsed;
    }

    get model(): string {
        return this.modelName;
    }
}

// Singleton-Instanz
let visionInstance: VisionEngine | null = null;

export function getVisionEngine(): VisionEngine {
    if (!visionInstance) {
        visionInstance = new VisionEngine();
    }
    return visionInstance;
}

export type { VisionEngine };
