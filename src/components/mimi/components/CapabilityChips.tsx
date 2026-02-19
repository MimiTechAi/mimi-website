"use client";

/**
 * CapabilityChips — Prompt-Vorlagen-Bibliothek
 * 12 nutzerorientierte Vorlagen in 4 Kategorien mit Filter-Tabs.
 *
 * Adressiert Interview-Feedback:
 * - Emre (Schüler): „Ich weiß nicht, was ich eingeben soll"
 * - Petra (HR): „Ich schreibe dieselben Prompts täglich neu"
 * - Dr. Michael (Arzt): „Fachspezifische Vorlagen wären super"
 * - Sarah (Marketing): „Prompt-Bibliothek für wiederkehrende Aufgaben"
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Briefcase, GraduationCap, Code, FileText,
    FileSearch, Scale, PenLine, MessageSquare,
    Calculator, Languages, BookOpen, Stethoscope
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Category = "alle" | "arbeit" | "lernen" | "code" | "dokument";

interface Chip {
    icon: LucideIcon;
    label: string;
    prompt: string;
    color: string;
    category: Exclude<Category, "alle">;
}

const CATEGORIES: { id: Category; label: string }[] = [
    { id: "alle", label: "Alle" },
    { id: "arbeit", label: "💼 Arbeit" },
    { id: "lernen", label: "🎓 Lernen" },
    { id: "code", label: "⚡ Code" },
    { id: "dokument", label: "📄 Dokument" },
];

const ALL_CHIPS: Chip[] = [
    // ── Arbeit ──────────────────────────────────────────────────────────────
    {
        icon: PenLine,
        label: "Stellenanzeige",
        prompt: "Schreibe eine Stellenanzeige für eine/n [Position] in unserem Unternehmen. Inklusiv formuliert, DSGVO-konform, auf Deutsch.",
        color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-400/50",
        category: "arbeit",
    },
    {
        icon: MessageSquare,
        label: "E-Mail schreiben",
        prompt: "Schreibe eine professionelle E-Mail an [Empfänger] zum Thema [Thema]. Ton: freundlich aber klar.",
        color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-400/50",
        category: "arbeit",
    },
    {
        icon: FileText,
        label: "Zusammenfassung",
        prompt: "Fasse den folgenden Text in 5 Stichpunkten zusammen und hebe die wichtigsten Erkenntnisse hervor:\n\n[Text hier einfügen]",
        color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-400/50",
        category: "arbeit",
    },
    {
        icon: Briefcase,
        label: "Mitarbeiterfeedback",
        prompt: "Formuliere konstruktives Feedback für einen Mitarbeiter zu folgenden Punkten: Stärken: [X], Verbesserungsbedarf: [Y]. Ton: wertschätzend und konkret.",
        color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30 hover:border-blue-400/50",
        category: "arbeit",
    },
    // ── Lernen ──────────────────────────────────────────────────────────────
    {
        icon: BookOpen,
        label: "Erklär mir...",
        prompt: "Erkläre mir [Thema] so, als wäre ich 16 Jahre alt. Nutze einfache Sprache, Analogien und konkrete Beispiele.",
        color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 hover:border-emerald-400/50",
        category: "lernen",
    },
    {
        icon: GraduationCap,
        label: "Schritt für Schritt",
        prompt: "Erkläre mir, wie ich [Aufgabe] löse. Gehe jeden Schritt einzeln durch und erkläre warum.",
        color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 hover:border-emerald-400/50",
        category: "lernen",
    },
    {
        icon: Languages,
        label: "Übersetzen",
        prompt: "Übersetze den folgenden Text ins [Englisch/Französisch/Spanisch] und behalte den formellen Ton bei:\n\n[Text hier]",
        color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 hover:border-emerald-400/50",
        category: "lernen",
    },
    // ── Code ────────────────────────────────────────────────────────────────
    {
        icon: Code,
        label: "Python-Analyse",
        prompt: "Schreibe Python-Code, der folgende Daten analysiert und als Diagramm visualisiert:\n\n[Beschreibe deine Daten]",
        color: "from-violet-500/20 to-purple-500/20 border-violet-500/30 hover:border-violet-400/50",
        category: "code",
    },
    {
        icon: Calculator,
        label: "Mathe lösen",
        prompt: "Löse folgende Aufgabe Schritt für Schritt mit Python und erkläre jeden Rechenschritt:\n\n[Aufgabe hier]",
        color: "from-violet-500/20 to-purple-500/20 border-violet-500/30 hover:border-violet-400/50",
        category: "code",
    },
    // ── Dokument ────────────────────────────────────────────────────────────
    {
        icon: FileSearch,
        label: "PDF analysieren",
        prompt: "Lade ein PDF hoch. Ich fasse den Inhalt zusammen, beantworte deine Fragen und extrahiere die wichtigsten Punkte.",
        color: "from-orange-500/20 to-amber-500/20 border-orange-500/30 hover:border-orange-400/50",
        category: "dokument",
    },
    {
        icon: Scale,
        label: "Vertrag prüfen",
        prompt: "Analysiere diesen Vertrag und identifiziere: 1) Unklare Klauseln, 2) Potenzielle Risiken, 3) Fehlende Regelungen.\n\n[Vertragstext oder PDF hochladen]",
        color: "from-orange-500/20 to-amber-500/20 border-orange-500/30 hover:border-orange-400/50",
        category: "dokument",
    },
    {
        icon: Stethoscope,
        label: "Arztbrief",
        prompt: "Schreibe einen professionellen Arztbrief für einen Patienten mit folgenden Diagnosen: [Diagnosen]. Adressat: [Facharzt]. Ton: medizinisch-fachlich.",
        color: "from-orange-500/20 to-amber-500/20 border-orange-500/30 hover:border-orange-400/50",
        category: "dokument",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.1 },
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
    const [activeCategory, setActiveCategory] = useState<Category>("alle");

    const visibleChips = activeCategory === "alle"
        ? ALL_CHIPS
        : ALL_CHIPS.filter((c) => c.category === activeCategory);

    return (
        <div className="w-full max-w-lg mx-auto">
            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-1.5 mb-3">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        style={{
                            padding: "4px 12px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: activeCategory === cat.id ? 600 : 400,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            background: activeCategory === cat.id
                                ? "rgba(139,92,246,0.25)"
                                : "rgba(255,255,255,0.05)",
                            border: activeCategory === cat.id
                                ? "1px solid rgba(139,92,246,0.5)"
                                : "1px solid rgba(255,255,255,0.1)",
                            color: activeCategory === cat.id
                                ? "rgba(196,181,253,1)"
                                : "rgba(255,255,255,0.45)",
                        }}
                        aria-pressed={activeCategory === cat.id}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Chips */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeCategory}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    className="flex flex-wrap justify-center gap-2"
                >
                    {visibleChips.map((chip) => (
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
                            title={chip.prompt.slice(0, 80) + (chip.prompt.length > 80 ? "..." : "")}
                        >
                            <chip.icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{chip.label}</span>
                        </motion.button>
                    ))}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
