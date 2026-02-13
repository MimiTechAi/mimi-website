"use client";

/**
 * OnboardingTour — 3-Step Guided Tour for MIMI Agent
 * Steps: Willkommen → Werkzeuge → Los geht's
 * Focus-trapped overlay with spotlight and keyboard support.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Wrench, Rocket, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface TourStep {
    icon: LucideIcon;
    title: string;
    description: string;
    detail: string;
}

const tourSteps: TourStep[] = [
    {
        icon: Brain,
        title: "Willkommen bei MIMI",
        description: "Ihr persönlicher KI-Agent — 100% lokal auf Ihrem Gerät.",
        detail: "MIMI verarbeitet alles direkt in Ihrem Browser mit WebGPU. Keine Daten verlassen Ihr Gerät. Kein Server, kein Cloud-Dienst.",
    },
    {
        icon: Wrench,
        title: "Ihre Werkzeuge",
        description: "MIMI kann mehr als nur chatten.",
        detail: "Frage stellen · Code schreiben & ausführen · PDFs analysieren · Bilder beschreiben · Spracheingabe & -ausgabe · Dokumente erstellen",
    },
    {
        icon: Rocket,
        title: "Los geht's!",
        description: "Starten Sie mit einem Klick auf die Fähigkeits-Chips — oder tippen Sie einfach Ihre Frage ein.",
        detail: "Tipp: MIMI denkt Schritt für Schritt. Je klarer Ihre Frage, desto besser die Antwort. Sie können auch PDFs und Bilder hochladen.",
    },
];

interface OnboardingTourProps {
    onComplete: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const isLastStep = currentStep === tourSteps.length - 1;
    const step = tourSteps[currentStep];

    const handleNext = useCallback(() => {
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStep((prev) => prev + 1);
        }
    }, [isLastStep, onComplete]);

    const handleSkip = useCallback(() => {
        onComplete();
    }, [onComplete]);

    // Keyboard: Enter = Next, Escape = Skip
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleNext();
            } else if (e.key === "Escape") {
                e.preventDefault();
                handleSkip();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleNext, handleSkip]);

    // Focus trap
    useEffect(() => {
        containerRef.current?.focus();
    }, [currentStep]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="MIMI Onboarding Tour"
        >
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleSkip}
            />

            {/* Tour Card */}
            <div
                ref={containerRef}
                tabIndex={-1}
                className="relative z-10 outline-none"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 40, scale: 0.96 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -40, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="
                            relative w-[90vw] max-w-md p-6 sm:p-8 rounded-2xl
                            bg-gradient-to-b from-white/10 to-white/5
                            border border-white/10 backdrop-blur-xl
                            shadow-2xl shadow-cyan-500/10
                        "
                    >
                        {/* Skip Button */}
                        <button
                            onClick={handleSkip}
                            className="absolute top-3 right-3 p-1.5 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
                            aria-label="Tour überspringen"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Step Icon */}
                        <motion.div
                            initial={{ scale: 0.5, rotate: -15 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                            className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 flex items-center justify-center"
                        >
                            <step.icon className="w-8 h-8 text-purple-400" />
                        </motion.div>

                        {/* Content */}
                        <div className="text-center space-y-3">
                            <h2 className="text-xl sm:text-2xl font-bold text-white">
                                {step.title}
                            </h2>
                            <p className="text-white/70 text-sm sm:text-base leading-relaxed">
                                {step.description}
                            </p>
                            <p className="text-white/50 text-xs sm:text-sm leading-relaxed">
                                {step.detail}
                            </p>
                        </div>

                        {/* Progress Dots */}
                        <div className="flex justify-center gap-2 mt-6" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={tourSteps.length}>
                            {tourSteps.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep
                                        ? "w-6 bg-purple-400"
                                        : i < currentStep
                                            ? "w-1.5 bg-purple-400/50"
                                            : "w-1.5 bg-white/20"
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-6">
                            <button
                                onClick={handleSkip}
                                className="text-xs text-white/40 hover:text-white/70 transition-colors"
                            >
                                Überspringen
                            </button>

                            <Button
                                onClick={handleNext}
                                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/20 px-5 gap-2"
                                size="sm"
                            >
                                {isLastStep ? "Starten" : "Weiter"}
                                {isLastStep ? (
                                    <Rocket className="w-3.5 h-3.5" />
                                ) : (
                                    <ArrowRight className="w-3.5 h-3.5" />
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
