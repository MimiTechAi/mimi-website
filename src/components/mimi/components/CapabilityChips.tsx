"use client";

/**
 * CapabilityChips — Interactive Prompt Suggestions
 * Displays clickable chips that inject pre-built prompts into the chat.
 * Framer Motion staggerChildren animation.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { motion } from "framer-motion";
import { Brain, Code, FileText, Mic, Image, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Chip {
    icon: LucideIcon;
    label: string;
    prompt: string;
    color: string;
}

const chips: Chip[] = [
    {
        icon: Brain,
        label: "Frage stellen",
        prompt: "Erkläre mir die Vor- und Nachteile von WebGPU gegenüber WebGL für KI-Anwendungen.",
        color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 hover:border-cyan-400/50",
    },
    {
        icon: Search,
        label: "Analyse",
        prompt: "Analysiere die aktuelle Marktentwicklung im Bereich Edge-AI und fasse die wichtigsten Trends zusammen.",
        color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 hover:border-emerald-400/50",
    },
    {
        icon: Code,
        label: "Code schreiben",
        prompt: "Schreibe eine Python-Funktion, die Fibonacci-Zahlen bis n berechnet und als Balkendiagramm visualisiert.",
        color: "from-violet-500/20 to-purple-500/20 border-violet-500/30 hover:border-violet-400/50",
    },
    {
        icon: FileText,
        label: "PDF analysieren",
        prompt: "Lade ein PDF hoch und ich analysiere den Inhalt für dich.",
        color: "from-orange-500/20 to-amber-500/20 border-orange-500/30 hover:border-orange-400/50",
    },
    {
        icon: Mic,
        label: "Spracheingabe",
        prompt: "Klicke auf das Mikrofon-Symbol, um per Sprache mit mir zu kommunizieren.",
        color: "from-rose-500/20 to-pink-500/20 border-rose-500/30 hover:border-rose-400/50",
    },
    {
        icon: Image,
        label: "Bild analysieren",
        prompt: "Lade ein Bild hoch und ich beschreibe und analysiere es für dich.",
        color: "from-sky-500/20 to-indigo-500/20 border-sky-500/30 hover:border-sky-400/50",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.2 },
    },
};

const chipVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
};

interface CapabilityChipsProps {
    onPromptSelect: (prompt: string) => void;
}

export function CapabilityChips({ onPromptSelect }: CapabilityChipsProps) {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto"
        >
            {chips.map((chip) => (
                <motion.button
                    key={chip.label}
                    variants={chipVariants}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onPromptSelect(chip.prompt)}
                    className={`
                        flex items-center gap-2 px-3 py-2 rounded-full
                        bg-gradient-to-r ${chip.color}
                        border backdrop-blur-sm
                        text-xs sm:text-sm text-white/80 hover:text-white
                        transition-colors duration-200 cursor-pointer
                        focus:outline-none focus:ring-2 focus:ring-cyan-500/50
                    `}
                    aria-label={`${chip.label}: ${chip.prompt}`}
                >
                    <chip.icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{chip.label}</span>
                </motion.button>
            ))}
        </motion.div>
    );
}
