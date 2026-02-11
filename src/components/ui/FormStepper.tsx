"use client";

/**
 * FormStepper — Multi-Step Form Component
 * Reusable stepper with animated step transitions,
 * step-based validation, and progress visualization.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FormStep {
    title: string;
    description?: string;
    content: ReactNode;
    validate?: () => boolean;
}

interface FormStepperProps {
    steps: FormStep[];
    onComplete: () => void;
    isSubmitting?: boolean;
    submitLabel?: string;
    className?: string;
}

export function FormStepper({
    steps,
    onComplete,
    isSubmitting = false,
    submitLabel = "Absenden",
    className,
}: FormStepperProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

    const isLastStep = currentStep === steps.length - 1;
    const step = steps[currentStep];

    const handleNext = useCallback(() => {
        if (step.validate && !step.validate()) return;

        if (isLastStep) {
            onComplete();
        } else {
            setDirection(1);
            setCurrentStep((prev) => prev + 1);
        }
    }, [step, isLastStep, onComplete]);

    const handleBack = useCallback(() => {
        if (currentStep > 0) {
            setDirection(-1);
            setCurrentStep((prev) => prev - 1);
        }
    }, [currentStep]);

    const variants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 60 : -60,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (dir: number) => ({
            x: dir > 0 ? -60 : 60,
            opacity: 0,
        }),
    };

    return (
        <div className={cn("space-y-6", className)}>
            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-8">
                {steps.map((s, i) => (
                    <div key={s.title} className="flex items-center flex-1">
                        {/* Step Circle */}
                        <div className="flex flex-col items-center gap-1.5 relative">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2",
                                    i < currentStep
                                        ? "bg-cyan-500 border-cyan-500 text-white"
                                        : i === currentStep
                                            ? "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                                            : "bg-white/5 border-white/20 text-white/40"
                                )}
                            >
                                {i < currentStep ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    i + 1
                                )}
                            </div>
                            <span
                                className={cn(
                                    "text-xs font-medium transition-colors whitespace-nowrap",
                                    i <= currentStep ? "text-white/80" : "text-white/30"
                                )}
                            >
                                {s.title}
                            </span>
                        </div>

                        {/* Connecting Line */}
                        {i < steps.length - 1 && (
                            <div className="flex-1 mx-2 mt-[-1.25rem]">
                                <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-cyan-500"
                                        initial={{ width: "0%" }}
                                        animate={{
                                            width: i < currentStep ? "100%" : "0%",
                                        }}
                                        transition={{ duration: 0.4 }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div className="relative overflow-hidden min-h-[200px]">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {step.description && (
                            <p className="text-white/50 text-sm mb-4">
                                {step.description}
                            </p>
                        )}
                        {step.content}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t border-white/10">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className="gap-2 text-white/60 hover:text-white"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Zurück
                </Button>

                <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-500/90 hover:to-blue-500/90 text-white border-0 shadow-lg shadow-cyan-500/20"
                >
                    {isSubmitting ? (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            />
                            Wird gesendet...
                        </>
                    ) : isLastStep ? (
                        submitLabel
                    ) : (
                        <>
                            Weiter
                            <ChevronRight className="w-4 h-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
