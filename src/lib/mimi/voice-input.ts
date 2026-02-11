/**
 * MIMI Agent - Voice Input & Output V2.0
 * 
 * Nutzt NATIVE Web Speech API für:
 * - Speech-to-Text (Spracheingabe)
 * - Text-to-Speech (Sprachausgabe)
 * 
 * Vorteile:
 * - Funktioniert sofort ohne Downloads
 * - Offline-fähig
 * - Mehrsprachig (Deutsch, Englisch, etc.)
 * - 2026-ready mit allen modernen Browsern
 */

// === SPEECH RECOGNITION (Spracheingabe) ===

export interface TranscriptionResult {
    text: string;
    language: string;
    confidence?: number;
    isFinal: boolean;
}

export interface VoiceInputOptions {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
    onResult?: (result: TranscriptionResult) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
}

// SpeechRecognition Type für TypeScript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionType = any;

interface SpeechRecognitionResultItem {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionEvent {
    resultIndex: number;
    results: SpeechRecognitionResult[];
}

interface SpeechRecognitionErrorEvent {
    error: string;
}

declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionType;
        webkitSpeechRecognition: SpeechRecognitionType;
    }
}

/**
 * Prüft ob Speech Recognition verfügbar ist
 */
export function isSpeechRecognitionAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

/**
 * Voice Recorder mit nativer Speech Recognition
 */
export class VoiceRecorder {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private recognition: any = null;
    private _isRecording = false;
    private _language = 'de-DE';
    private _transcript = '';
    private onResultCallback?: (result: TranscriptionResult) => void;

    // NEU: Voice Activity Detection
    private silenceTimeout: NodeJS.Timeout | null = null;
    private silenceDelayMs = 2000;  // 2 Sekunden Stille = Auto-Stop
    private autoStopEnabled = true;
    private onAutoStopCallback?: () => void;

    constructor() {
        if (typeof window !== 'undefined') {
            this.initRecognition();
        }
    }

    private initRecognition(): void {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech Recognition nicht verfügbar');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this._language;

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            // NEU: Reset Silence Timer bei Sprache
            if (this.autoStopEnabled && (finalTranscript || interimTranscript)) {
                this.resetSilenceTimer();
            }

            if (finalTranscript) {
                this._transcript = finalTranscript;
                this.onResultCallback?.({
                    text: finalTranscript,
                    language: this._language,
                    confidence: event.results[event.results.length - 1][0].confidence,
                    isFinal: true
                });
            } else if (interimTranscript) {
                this.onResultCallback?.({
                    text: interimTranscript,
                    language: this._language,
                    isFinal: false
                });
            }
        };

        this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech Recognition Error:', event.error);
            this._isRecording = false;
            this.clearSilenceTimer();
        };

        this.recognition.onend = () => {
            this._isRecording = false;
            this.clearSilenceTimer();
        };
    }

    // NEU: Silence Timer Management
    private resetSilenceTimer(): void {
        this.clearSilenceTimer();
        this.silenceTimeout = setTimeout(() => {
            if (this._isRecording && this.autoStopEnabled) {
                console.log('Auto-Stop: 2 Sekunden Stille erkannt');
                this.stopRecording().then(() => {
                    this.onAutoStopCallback?.();
                });
            }
        }, this.silenceDelayMs);
    }

    private clearSilenceTimer(): void {
        if (this.silenceTimeout) {
            clearTimeout(this.silenceTimeout);
            this.silenceTimeout = null;
        }
    }

    /**
     * Konfiguriert Auto-Stop
     */
    setAutoStop(enabled: boolean, delayMs = 2000): void {
        this.autoStopEnabled = enabled;
        this.silenceDelayMs = delayMs;
    }

    /**
     * Registriert Callback für Auto-Stop
     */
    onAutoStop(callback: () => void): void {
        this.onAutoStopCallback = callback;
    }

    /**
     * Setzt die Sprache für die Erkennung
     */
    setLanguage(lang: string): void {
        this._language = lang;
        if (this.recognition) {
            this.recognition.lang = lang;
        }
    }

    /**
     * Startet die Aufnahme
     */
    async startRecording(onResult?: (result: TranscriptionResult) => void): Promise<void> {
        if (this._isRecording || !this.recognition) {
            if (!this.recognition) {
                throw new Error('Speech Recognition nicht verfügbar in diesem Browser');
            }
            return;
        }

        // Mikrofon-Berechtigung prüfen
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Sofort stoppen, nur für Permission
        } catch (error) {
            throw new Error('Mikrofon-Zugriff verweigert');
        }

        this._transcript = '';
        this.onResultCallback = onResult;
        this._isRecording = true;
        this.recognition.start();
    }

    /**
     * Stoppt die Aufnahme und gibt den Text zurück
     */
    async stopRecording(): Promise<string> {
        return new Promise((resolve) => {
            if (!this.recognition || !this._isRecording) {
                resolve(this._transcript);
                return;
            }

            const currentOnEnd = this.recognition.onend;
            this.recognition.onend = (event: Event) => {
                if (typeof currentOnEnd === 'function') {
                    currentOnEnd.call(this.recognition, event);
                }
                resolve(this._transcript);
            };

            this.recognition.stop();
        });
    }

    /**
     * Bricht die Aufnahme ab
     */
    cancelRecording(): void {
        if (this.recognition && this._isRecording) {
            this.recognition.abort();
        }
        this._isRecording = false;
        this._transcript = '';
    }

    get recording(): boolean {
        return this._isRecording;
    }

    get language(): string {
        return this._language;
    }

    // NEU: Public Getter für aktuellen Text
    get transcript(): string {
        return this._transcript;
    }
}


// === TEXT-TO-SPEECH (Sprachausgabe) ===

export interface SpeechOptions {
    language?: string;
    voice?: string;
    rate?: number;      // 0.1 - 10, default 1
    pitch?: number;     // 0 - 2, default 1
    volume?: number;    // 0 - 1, default 1
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
}

/**
 * Prüft ob Text-to-Speech verfügbar ist
 */
export function isTextToSpeechAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window;
}

/**
 * Holt verfügbare Stimmen
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!isTextToSpeechAvailable()) return [];
    return window.speechSynthesis.getVoices();
}

/**
 * Holt deutsche Stimmen
 */
export function getGermanVoices(): SpeechSynthesisVoice[] {
    return getAvailableVoices().filter(v => v.lang.startsWith('de'));
}

/**
 * Spricht Text mit natürlicher Stimme
 * 
 * DEFAULT: Browser TTS (Web Speech API) — funktioniert immer, sofort, zuverlässig
 * OPTIONAL: Piper TTS (ONNX) — nur mit usePiper: true (experimentell, Phoneme noch Platzhalter)
 */
export async function speak(text: string, options?: SpeechOptions & { usePiper?: boolean }): Promise<void> {
    // Piper TTS NUR wenn explizit angefordert (experimentell)
    if (options?.usePiper) {
        try {
            const { getPiperTTS } = await import('./piper-tts');
            const piperTTS = getPiperTTS();

            if (piperTTS.ready) {
                options?.onStart?.();
                await piperTTS.speak(text, {
                    speed: options?.rate || 1.0,
                    volume: options?.volume || 1.0
                });
                options?.onEnd?.();
                return;
            }
        } catch (error) {
            console.log('[TTS] Piper nicht verfügbar, Fallback auf Browser TTS:', error);
        }
    }

    // STANDARD: Browser TTS (Web Speech API — immer verfügbar, zuverlässig)
    return new Promise((resolve, reject) => {
        if (!isTextToSpeechAvailable()) {
            reject(new Error('Text-to-Speech nicht verfügbar'));
            return;
        }

        // Laufende Sprache stoppen
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Sprache setzen
        utterance.lang = options?.language || 'de-DE';

        // Stimme finden
        const voices = getAvailableVoices();
        if (options?.voice) {
            const selectedVoice = voices.find(v => v.name === options.voice);
            if (selectedVoice) utterance.voice = selectedVoice;
        } else {
            // Beste deutsche Stimme finden (lokal bevorzugt)
            const germanVoice = voices.find(v =>
                v.lang.startsWith('de') && v.localService
            ) || voices.find(v => v.lang.startsWith('de'));
            if (germanVoice) utterance.voice = germanVoice;
        }

        // Optionen
        utterance.rate = options?.rate || 1;
        utterance.pitch = options?.pitch || 1;
        utterance.volume = options?.volume || 1;

        // Events
        utterance.onstart = () => options?.onStart?.();
        utterance.onend = () => {
            options?.onEnd?.();
            resolve();
        };
        utterance.onerror = (event) => {
            options?.onError?.(event.error);
            reject(new Error(event.error));
        };

        window.speechSynthesis.speak(utterance);
    });
}

/**
 * Stoppt laufende Sprache
 */
export function stopSpeaking(): void {
    if (isTextToSpeechAvailable()) {
        window.speechSynthesis.cancel();
    }
}

/**
 * Prüft ob gerade gesprochen wird
 */
export function isSpeaking(): boolean {
    if (!isTextToSpeechAvailable()) return false;
    return window.speechSynthesis.speaking;
}


// === SINGLETON INSTANCES ===

let recorderInstance: VoiceRecorder | null = null;

export function getVoiceRecorder(): VoiceRecorder {
    if (!recorderInstance) {
        recorderInstance = new VoiceRecorder();
    }
    return recorderInstance;
}

/**
 * Prüft ob Voice Features verfügbar sind
 */
export function isVoiceAvailable(): boolean {
    return isSpeechRecognitionAvailable() && isTextToSpeechAvailable();
}

/**
 * Initialisiert Voice (lädt Stimmen)
 * Diese Funktion ist jetzt synchron und benötigt kein async Loading
 */
export async function initVoice(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Stimmen laden (kann asynchron sein)
    if (isTextToSpeechAvailable()) {
        // Chrome lädt Stimmen asynchron
        return new Promise((resolve) => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                resolve(true);
            } else {
                window.speechSynthesis.onvoiceschanged = () => {
                    resolve(true);
                };
                // Timeout falls keine Stimmen geladen werden
                setTimeout(() => resolve(isSpeechRecognitionAvailable()), 1000);
            }
        });
    }

    return isSpeechRecognitionAvailable();
}


// === SPRACH-CODES ===

export const SUPPORTED_LANGUAGES = [
    { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'de-AT', name: 'Deutsch (Österreich)', flag: '🇦🇹' },
    { code: 'de-CH', name: 'Deutsch (Schweiz)', flag: '🇨🇭' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
    { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
    { code: 'it-IT', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt-PT', name: 'Português', flag: '🇵🇹' },
    { code: 'nl-NL', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl-PL', name: 'Polski', flag: '🇵🇱' },
    { code: 'ru-RU', name: 'Русский', flag: '🇷🇺' },
    { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
    { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
    { code: 'ar-SA', name: 'العربية', flag: '🇸🇦' },
    { code: 'tr-TR', name: 'Türkçe', flag: '🇹🇷' },
];
