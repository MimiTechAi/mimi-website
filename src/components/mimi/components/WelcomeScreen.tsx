"use client";

/**
 * MIMI Agent - Welcome Screen Component
 * Displayed when no messages are in the chat.
 * Integrates onboarding tour + capability chips.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { motion } from "framer-motion";
import { Brain, Code, FileDown, Mic } from "lucide-react";
import { CapabilityChips } from "./CapabilityChips";

interface WelcomeScreenProps {
    onPromptSelect?: (prompt: string) => void;
}

export function WelcomeScreen({ onPromptSelect }: WelcomeScreenProps) {

    const capabilities = [
        { icon: Brain, text: "Analysiert & plant strukturiert" },
        { icon: Code, text: "Schreibt & führt Code aus" },
        { icon: FileDown, text: "Erstellt Dokumente" },
        { icon: Mic, text: "Versteht & spricht" },
    ];

    return (
        <>
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
                    className="text-white/50 text-sm max-w-md mb-5"
                >
                    Keine Cloud. Keine API-Calls. Ihre Daten bleiben auf Ihrem Gerät.
                    MIMI denkt, plant und handelt — komplett lokal.
                </motion.p>

                {/* Privacy Trust Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}
                >
                    {[
                        { icon: '🔒', label: '100% Lokal' },
                        { icon: '⚡', label: 'WebGPU' },
                        { icon: '🚫', label: 'Keine Cloud' },
                        { icon: '🇩🇪', label: 'DSGVO-konform' },
                    ].map(badge => (
                        <div
                            key={badge.label}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '4px 12px',
                                borderRadius: '999px',
                                background: 'rgba(34,197,94,0.07)',
                                border: '1px solid rgba(34,197,94,0.2)',
                                color: 'rgba(134,239,172,0.85)',
                                fontSize: '12px',
                                fontWeight: 500,
                            }}
                        >
                            <span>{badge.icon}</span>
                            <span>{badge.label}</span>
                        </div>
                    ))}
                </motion.div>

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
