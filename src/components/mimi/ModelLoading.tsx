"use client";

/**
 * Model Loading Component
 * Zeigt Fortschritt beim erstmaligen Download des KI-Modells
 * Enhanced: ETA-Schätzung + Feature-Tipps Carousel
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Download, WifiOff, Sparkles, Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const featureTips = [
    "💡 MIMI kann Python-Code schreiben und direkt im Browser ausführen.",
    "📄 Lade PDFs hoch — MIMI analysiert den Inhalt und beantwortet Fragen dazu.",
    "🎤 Nutze die Spracheingabe für natürliche Konversationen.",
    "🖼️ Lade Bilder hoch — die Vision-KI beschreibt und analysiert sie.",
    "🔒 Alle Daten bleiben lokal — kein Server, keine Cloud, kein Tracking.",
    "⚡ Nach dem ersten Download startet MIMI sofort aus dem Cache.",
    "📊 MIMI kann Diagramme erstellen und als Bilder herunterladen.",
    "🌐 Sprache wechseln: Deutsch, Englisch, Französisch und mehr.",
];

interface ModelLoadingProps {
    progress: number;
    status: string;
    modelSize?: string;
    isFirstTime?: boolean;
}

export default function ModelLoading({
    progress,
    status,
    modelSize = "2.2 GB",
    isFirstTime = true
}: ModelLoadingProps) {
    const [tipIndex, setTipIndex] = useState(0);
    const [eta, setEta] = useState<string | null>(null);
    const startTimeRef = useRef<number>(Date.now());
    const startProgressRef = useRef<number>(progress);

    // Rotate feature tips every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex((prev) => (prev + 1) % featureTips.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Calculate ETA based on progress rate
    useEffect(() => {
        if (progress <= 5 || progress >= 99) {
            setEta(null);
            return;
        }

        const elapsed = (Date.now() - startTimeRef.current) / 1000; // seconds
        const progressDelta = progress - startProgressRef.current;

        if (progressDelta <= 0 || elapsed < 2) return;

        const rate = progressDelta / elapsed; // percent per second
        const remaining = (100 - progress) / rate;

        if (remaining < 5) {
            setEta("Gleich fertig...");
        } else if (remaining < 60) {
            setEta(`~${Math.ceil(remaining)} Sekunden verbleibend`);
        } else {
            const minutes = Math.ceil(remaining / 60);
            setEta(`~${minutes} ${minutes === 1 ? "Minute" : "Minuten"} verbleibend`);
        }
    }, [progress]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            {/* Animiertes Brain Icon */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative mb-8"
            >
                {/* Äußerer Glow */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 blur-xl"
                />

                {/* Icon Container */}
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 rounded-full border border-dashed border-cyan-500/30"
                    />
                    <Brain className="w-12 h-12 text-cyan-400" />
                </div>

                {/* Download Indicator */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-black border border-white/20 flex items-center justify-center"
                >
                    <Download className="w-5 h-5 text-cyan-400 animate-bounce" />
                </motion.div>
            </motion.div>

            {/* Titel */}
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white mb-2 text-center"
            >
                {isFirstTime ? "Initialisiere neuronales Netz..." : "Lade MIMI..."}
            </motion.h2>

            {/* Status */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/60 text-center mb-2"
            >
                {status}
            </motion.p>

            {/* ETA */}
            {eta && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-cyan-400/70 text-sm text-center mb-4"
                >
                    ⏱ {eta}
                </motion.p>
            )}

            {/* Progress Bar */}
            <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "100%" }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-md mb-4"
            >
                <Progress
                    value={progress}
                    className="h-3 bg-white/10"
                />
                <div className="flex justify-between mt-2 text-sm text-white/50">
                    <span>{Math.round(progress)}%</span>
                    <span>{modelSize}</span>
                </div>
            </motion.div>

            {/* Feature Tips Carousel */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="w-full max-w-md mt-4 mb-6"
            >
                <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400/70" />
                    <span className="text-xs text-white/40 uppercase tracking-wider">Wusstest du?</span>
                </div>
                <div className="h-12 relative overflow-hidden rounded-lg bg-white/5 border border-white/10 px-4 flex items-center">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={tipIndex}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3 }}
                            className="text-sm text-white/60"
                        >
                            {featureTips[tipIndex]}
                        </motion.p>
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Info Badges */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-3 justify-center"
            >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Einmalig</span>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm">
                    <WifiOff className="w-4 h-4" />
                    <span>Danach offline nutzbar</span>
                </div>
            </motion.div>

            {/* Disclaimer */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-white/30 text-xs text-center mt-8 max-w-sm"
            >
                Das KI-Modell wird lokal in Ihrem Browser gespeichert.
                Bei zukünftigen Besuchen startet MIMI sofort.
            </motion.p>
        </div>
    );
}

