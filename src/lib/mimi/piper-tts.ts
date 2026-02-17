/**
 * MIMI Agent - Piper TTS (Text-to-Speech) V1.0
 * 
 * Lokale Premium-Stimmsynthese mit Piper WASM
 * - Läuft 100% im Browser
 * - Deutsche Premium-Stimmen
 * - Cross-Browser Kompatibilität
 */

// Helper: Turbopack-safe dynamic import for onnxruntime-web
// Uses runtime string construction to bypass Turbopack's static module analysis
const loadOnnxRuntime = () => {
    const moduleName = ['onnxruntime', 'web'].join('-');
    return new Function('m', 'return import(m)')(moduleName);
};

export interface PiperVoice {
    id: string;
    name: string;
    language: 'de' | 'en' | 'es' | 'fr';
    quality: 'low' | 'medium' | 'high';
    modelUrl: string;
    configUrl: string;
    sampleRate: number;
}

export interface TTSOptions {
    speed?: number;      // 0.5 - 2.0
    pitch?: number;      // 0.5 - 2.0
    volume?: number;     // 0.0 - 1.0
}

export interface TTSResult {
    audio: AudioBuffer;
    duration: number;
    sampleRate: number;
}

// Verfügbare Deutsche Piper-Stimmen
export const PIPER_VOICES: PiperVoice[] = [
    {
        id: 'thorsten-high',
        name: 'Thorsten (Hochdeutsch)',
        language: 'de',
        quality: 'high',
        modelUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/high/de_DE-thorsten-high.onnx',
        configUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/high/de_DE-thorsten-high.onnx.json',
        sampleRate: 22050
    },
    {
        id: 'thorsten-medium',
        name: 'Thorsten (Standard)',
        language: 'de',
        quality: 'medium',
        modelUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx',
        configUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx.json',
        sampleRate: 22050
    },
    {
        id: 'eva-medium',
        name: 'Eva (Weiblich)',
        language: 'de',
        quality: 'medium',
        modelUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/eva_k/medium/de_DE-eva_k-medium.onnx',
        configUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/eva_k/medium/de_DE-eva_k-medium.onnx.json',
        sampleRate: 22050
    },
    // English voice (Fallback)
    {
        id: 'amy-medium',
        name: 'Amy (English)',
        language: 'en',
        quality: 'medium',
        modelUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx',
        configUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json',
        sampleRate: 22050
    }
];

/** B-06: Typed ONNX session interface (subset of onnxruntime-web's InferenceSession) */
interface OnnxInferenceSession {
    run(feeds: Record<string, unknown>): Promise<Record<string, { data: Float32Array; dims: number[] }>>;
    release(): Promise<void>;
}

/** B-06: Typed Piper voice configuration */
interface PiperVoiceConfig {
    audio?: { sample_rate?: number };
    num_symbols?: number;
    phoneme_map?: Record<string, number[]>;
    inference?: { noise_scale?: number; length_scale?: number; noise_w?: number };
    [key: string]: unknown;
}

/**
 * Piper TTS Engine - Lokale Stimmsynthese
 */
class PiperTTSEngine {
    private audioContext: AudioContext | null = null;
    private currentVoice: PiperVoice | null = null;
    private isInitialized = false;
    private onnxSession: OnnxInferenceSession | null = null;
    private voiceConfig: PiperVoiceConfig | null = null;
    private initPromise: Promise<void> | null = null;

    /**
     * Initialisiert die TTS Engine mit einer Stimme
     */
    async init(
        voiceId: string = 'thorsten-medium',
        onProgress?: (status: string) => void
    ): Promise<void> {
        if (this.isInitialized && this.currentVoice?.id === voiceId) {
            return;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this.doInit(voiceId, onProgress);
        await this.initPromise;
    }

    private async doInit(
        voiceId: string,
        onProgress?: (status: string) => void
    ): Promise<void> {
        const voice = PIPER_VOICES.find(v => v.id === voiceId);
        if (!voice) {
            throw new Error(`Stimme "${voiceId}" nicht gefunden`);
        }

        onProgress?.('Lade Piper TTS Engine...');

        try {
            // 1. AudioContext erstellen
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            // 2. ONNX Runtime laden (dynamic import)
            onProgress?.('Lade ONNX Runtime...');
            const ort = await loadOnnxRuntime();

            // 3. Stimm-Konfiguration laden
            onProgress?.(`Lade Stimme "${voice.name}"...`);
            const configResponse = await fetch(voice.configUrl);
            this.voiceConfig = await configResponse.json();

            // 4. ONNX Modell laden
            onProgress?.('Lade Stimmmodell (kann einige Sekunden dauern)...');
            this.onnxSession = await ort.InferenceSession.create(voice.modelUrl, {
                executionProviders: ['wasm'],
                graphOptimizationLevel: 'all'
            });

            this.currentVoice = voice;
            this.isInitialized = true;
            onProgress?.(`Stimme "${voice.name}" bereit!`);

        } catch (error) {
            console.error('Fehler beim Laden der TTS Engine:', error);
            this.initPromise = null;
            throw new Error('TTS Engine konnte nicht geladen werden. Nutze Browser-TTS als Fallback.');
        }
    }

    /**
     * Konvertiert Text zu Sprache
     */
    async synthesize(text: string, options?: TTSOptions): Promise<TTSResult> {
        if (!this.isInitialized || !this.onnxSession || !this.audioContext) {
            throw new Error('TTS Engine nicht initialisiert');
        }

        const speed = options?.speed ?? 1.0;
        const pitch = options?.pitch ?? 1.0;

        // Text normalisieren
        const normalizedText = this.normalizeText(text);

        // Phoneme konvertieren (vereinfacht - nutzt Espeak-NG in echtem Piper)
        const phonemes = this.textToPhonemes(normalizedText);

        // ONNX Inference
        const ort = await loadOnnxRuntime();

        // Input-Tensor erstellen
        const phonemeIds = new BigInt64Array(phonemes.map(p => BigInt(p)));
        const inputIds = new ort.Tensor('int64', phonemeIds, [1, phonemes.length]);
        const lengthArray = new BigInt64Array([BigInt(phonemes.length)]);
        const inputLengths = new ort.Tensor('int64', lengthArray, [1]);
        const scales = new ort.Tensor('float32', new Float32Array([speed, pitch, 1.0]), [3]);

        // Inference ausführen
        const feeds: Record<string, any> = {
            input: inputIds,
            input_lengths: inputLengths,
            scales: scales
        };

        const results = await this.onnxSession.run(feeds);
        const audioData = results.output.data as Float32Array;

        // AudioBuffer erstellen
        const sampleRate = this.currentVoice!.sampleRate;
        const audioBuffer = this.audioContext.createBuffer(1, audioData.length, sampleRate);
        audioBuffer.getChannelData(0).set(audioData);

        return {
            audio: audioBuffer,
            duration: audioData.length / sampleRate,
            sampleRate
        };
    }

    /**
     * Spielt Audio direkt ab
     */
    async speak(text: string, options?: TTSOptions): Promise<void> {
        try {
            const result = await this.synthesize(text, options);
            return this.playAudio(result.audio, options?.volume ?? 1.0);
        } catch (error) {
            // Fallback zu Browser TTS
            console.warn('Piper TTS fehlgeschlagen, nutze Browser-TTS:', error);
            return this.browserTTSFallback(text, options);
        }
    }

    /**
     * Spielt AudioBuffer ab
     */
    private async playAudio(buffer: AudioBuffer, volume: number): Promise<void> {
        if (!this.audioContext) return;

        return new Promise((resolve) => {
            const source = this.audioContext!.createBufferSource();
            const gainNode = this.audioContext!.createGain();

            source.buffer = buffer;
            gainNode.gain.value = volume;

            source.connect(gainNode);
            gainNode.connect(this.audioContext!.destination);

            source.onended = () => resolve();
            source.start();
        });
    }

    /**
     * Browser TTS Fallback
     */
    private async browserTTSFallback(text: string, options?: TTSOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = this.currentVoice?.language === 'de' ? 'de-DE' : 'en-US';
            utterance.rate = options?.speed ?? 1.0;
            utterance.pitch = options?.pitch ?? 1.0;
            utterance.volume = options?.volume ?? 1.0;

            utterance.onend = () => resolve();
            utterance.onerror = (e) => reject(e);

            speechSynthesis.speak(utterance);
        });
    }

    /**
     * Text normalisieren (Zahlen, Abkürzungen, etc.)
     */
    private normalizeText(text: string): string {
        return text
            .replace(/\n+/g, '. ')
            .replace(/\s+/g, ' ')
            .replace(/(\d+)/g, (match) => this.numberToWords(parseInt(match)))
            .trim();
    }

    /**
     * Zahl zu Worten konvertieren (DE)
     */
    private numberToWords(num: number): string {
        if (num < 0 || num > 9999) return num.toString();

        const ones = ['', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'];
        const teens = ['zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
        const tens = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];
        const hundreds = ['', 'einhundert', 'zweihundert', 'dreihundert', 'vierhundert', 'fünfhundert', 'sechshundert', 'siebenhundert', 'achthundert', 'neunhundert'];

        if (num === 0) return 'null';
        if (num < 10) return ones[num];
        if (num < 20) return teens[num - 10];
        if (num < 100) {
            const t = Math.floor(num / 10);
            const o = num % 10;
            return o === 0 ? tens[t] : `${ones[o]}und${tens[t]}`;
        }
        if (num < 1000) {
            const h = Math.floor(num / 100);
            const rest = num % 100;
            return rest === 0 ? hundreds[h] : `${hundreds[h]}${this.numberToWords(rest)}`;
        }

        const t = Math.floor(num / 1000);
        const rest = num % 1000;
        const tausend = t === 1 ? 'eintausend' : `${ones[t]}tausend`;
        return rest === 0 ? tausend : `${tausend}${this.numberToWords(rest)}`;
    }

    /**
     * Vereinfachte Phonem-Konvertierung
     * (In echter Implementierung würde Espeak-NG WASM verwendet)
     */
    private textToPhonemes(text: string): number[] {
        // Einfache Mapping-Tabelle (Platzhalter)
        // In echter Version: Espeak-NG für IPA-Konvertierung
        const charToPhoneme: Record<string, number> = {
            'a': 1, 'ä': 2, 'b': 3, 'c': 4, 'd': 5, 'e': 6, 'f': 7, 'g': 8,
            'h': 9, 'i': 10, 'j': 11, 'k': 12, 'l': 13, 'm': 14, 'n': 15,
            'o': 16, 'ö': 17, 'p': 18, 'q': 19, 'r': 20, 's': 21, 'ß': 22,
            't': 23, 'u': 24, 'ü': 25, 'v': 26, 'w': 27, 'x': 28, 'y': 29,
            'z': 30, ' ': 0, '.': 31, ',': 32, '!': 33, '?': 34
        };

        return text.toLowerCase().split('').map(char => charToPhoneme[char] ?? 0);
    }

    /**
     * Stoppt aktuelle Wiedergabe
     */
    stop(): void {
        speechSynthesis.cancel();
    }

    /**
     * Gibt Ressourcen frei (OOM Prevention)
     * Rufe diese Methode auf, wenn TTS nicht mehr aktiv benötigt wird
     */
    async dispose(): Promise<void> {
        this.stop(); // Stoppe laufende Wiedergabe

        if (this.onnxSession) {
            // ONNX Session cleanup
            this.onnxSession = null;
        }

        if (this.audioContext) {
            try {
                await this.audioContext.close();
            } catch (e: unknown) {
                // AudioContext may already be closed
            }
            this.audioContext = null;
        }

        this.voiceConfig = null;
        this.currentVoice = null;
        this.isInitialized = false;
        this.initPromise = null;
        console.log('[PiperTTS] Disposed - ~150MB freed');
    }

    /**
     * Prüft ob bereit
     */
    get ready(): boolean {
        return this.isInitialized;
    }

    /**
     * Aktuelle Stimme
     */
    get voice(): PiperVoice | null {
        return this.currentVoice;
    }

    /**
     * Verfügbare Stimmen
     */
    get availableVoices(): PiperVoice[] {
        return PIPER_VOICES;
    }
}

// Singleton-Instanz
let ttsInstance: PiperTTSEngine | null = null;

export function getPiperTTS(): PiperTTSEngine {
    if (!ttsInstance) {
        ttsInstance = new PiperTTSEngine();
    }
    return ttsInstance;
}

export type { PiperTTSEngine };
