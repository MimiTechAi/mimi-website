"use client";

/**
 * MIMI Agent - Welcome Screen Component
 * Displayed when no messages are in the chat.
 * Integrates onboarding tour + capability chips.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Brain, Code, FileDown, Mic } from "lucide-react";
import { useOnboarding } from "@/hooks/mimi/useOnboarding";
import { CapabilityChips } from "./CapabilityChips";
import { OnboardingTour } from "./OnboardingTour";

interface WelcomeScreenProps {
    onPromptSelect?: (prompt: string) => void;
}

export function WelcomeScreen({ onPromptSelect }: WelcomeScreenProps) {
    const { hasSeenTour, isLoading, markTourSeen } = useOnboarding();

    const capabilities = [
        { icon: Brain, text: "Analysiert & plant strukturiert" },
        { icon: Code, text: "Schreibt & führt Code aus" },
        { icon: FileDown, text: "Erstellt Dokumente" },
        { icon: Mic, text: "Versteht & spricht" },
    ];

    return (
        <>
            {/* Onboarding Tour — only on first visit */}
            <AnimatePresence>
                {!isLoading && !hasSeenTour && (
                    <OnboardingTour onComplete={markTourSeen} />
                )}
            </AnimatePresence>

            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6"
                >
                    <Brain className="w-12 h-12 text-purple-400" />
                </motion.div>

                <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl font-bold text-white mb-2"
                >
                    MIMI – Ihre Souveräne Intelligenz
                </motion.h3>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-white/50 text-sm max-w-md mb-8"
                >
                    Keine Cloud. Keine API-Calls. Ihre Daten bleiben auf Ihrem Gerät.
                    MIMI denkt, plant und handelt – komplett lokal.
                </motion.p>

                {/* Feature Icons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 gap-3 max-w-sm mb-8"
                >
                    {capabilities.map((cap, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70"
                        >
                            <cap.icon className="w-4 h-4 text-purple-400" />
                            <span>{cap.text}</span>
                        </div>
                    ))}
                </motion.div>

                {/* Capability Chips — interactive prompt starters */}
                {onPromptSelect && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <p className="text-white/30 text-xs mb-3 uppercase tracking-wider">
                            Probiere es aus
                        </p>
                        <CapabilityChips onPromptSelect={onPromptSelect} />
                    </motion.div>
                )}
            </div>
        </>
    );
}
