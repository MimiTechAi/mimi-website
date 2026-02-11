"use client";

/**
 * useMimiVoice — Voice Input/Output Sub-Hook
 * Handles: recording, interim text, TTS speak, language selection
 */

import { useState, useCallback, useRef } from "react";
import type { VoiceRecorderType } from "./types";

export interface UseMimiVoiceReturn {
    isRecording: boolean;
    isVoiceReady: boolean;
    isSpeaking: boolean;
    currentLanguage: string;
    interimText: string;
    voiceTranscript: string;
    setVoiceTranscript: (text: string) => void;
    handleVoiceInput: () => Promise<void>;
    handleSpeak: (text: string) => Promise<void>;
    handleLanguageChange: (lang: string) => void;
    initVoice: () => Promise<void>;
}

export function useMimiVoice(): UseMimiVoiceReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [isVoiceReady, setIsVoiceReady] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState("de-DE");
    const [interimText, setInterimText] = useState("");
    const [voiceTranscript, setVoiceTranscript] = useState<string>("");

    const voiceRecorderRef = useRef<VoiceRecorderType | null>(null);
    const speakFnRef = useRef<((text: string) => Promise<void>) | null>(null);

    const initVoice = useCallback(async () => {
        try {
            const voiceModule = await import("@/lib/mimi/voice-input");
            if (voiceModule.isVoiceAvailable()) {
                voiceRecorderRef.current = voiceModule.getVoiceRecorder();
                speakFnRef.current = voiceModule.speak;
                await voiceModule.initVoice();
                setIsVoiceReady(true);
                console.log("✅ Voice Features aktiviert (Web Speech API)");
            }
        } catch (e) {
            console.log("Voice nicht verfügbar:", e);
        }
    }, []);

    const handleVoiceInput = useCallback(async () => {
        const recorder = voiceRecorderRef.current;
        if (!recorder) {
            console.error("Voice Recorder nicht initialisiert");
            return;
        }

        if (recorder.recording) {
            setIsRecording(false);
            setInterimText("");
            try {
                const transcribedText = await recorder.stopRecording();
                if (transcribedText.trim()) {
                    setVoiceTranscript(transcribedText.trim());
                }
            } catch (error) {
                console.error("Transkriptionsfehler:", error);
            }
        } else {
            try {
                recorder.onAutoStop(() => {
                    setIsRecording(false);
                    setInterimText("");
                    const text = recorder.transcript;
                    if (text?.trim()) {
                        setVoiceTranscript(text.trim());
                    }
                });

                await recorder.startRecording((result) => {
                    if (!result.isFinal) {
                        setInterimText(result.text);
                    } else {
                        setInterimText("");
                    }
                });
                setIsRecording(true);
            } catch (error) {
                console.error("Mikrofon-Fehler:", error);
                alert("Bitte erlaube den Mikrofon-Zugriff für die Spracheingabe.");
            }
        }
    }, []);

    const handleSpeak = useCallback(async (text: string) => {
        if (!speakFnRef.current) return;
        setIsSpeaking(true);
        try {
            await speakFnRef.current(text);
        } finally {
            setIsSpeaking(false);
        }
    }, []);

    const handleLanguageChange = useCallback((lang: string) => {
        setCurrentLanguage(lang);
        if (voiceRecorderRef.current) {
            voiceRecorderRef.current.setLanguage(lang);
        }
    }, []);

    return {
        isRecording,
        isVoiceReady,
        isSpeaking,
        currentLanguage,
        interimText,
        voiceTranscript,
        setVoiceTranscript,
        handleVoiceInput,
        handleSpeak,
        handleLanguageChange,
        initVoice,
    };
}
