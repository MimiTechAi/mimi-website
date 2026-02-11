"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { sectionFadeUp, staggerContainer, itemFadeUp } from "@/lib/motion";

const steps = [
    {
        title: "1. Analyse",
        description: "Wir verstehen Ihre Herausforderungen und Ziele",
    },
    {
        title: "2. Strategie",
        description: "Entwicklung einer maßgeschneiderten KI-Roadmap",
    },
    {
        title: "3. Umsetzung",
        description: "Gemeinsame Implementierung der Lösung",
    },
    {
        title: "4. Optimierung",
        description: "Kontinuierliche Verbesserung und Skalierung",
    },
];

export default function ApproachSection() {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % steps.length);
        }, 6000);

        return () => clearInterval(interval);
    }, []);

    const goTo = (index: number) => {
        if (index < 0) {
            setActiveIndex(steps.length - 1);
        } else if (index >= steps.length) {
            setActiveIndex(0);
        } else {
            setActiveIndex(index);
        }
    };

    const next = () => goTo(activeIndex + 1);
    const prev = () => goTo(activeIndex - 1);

    return (
        <motion.section
            className="max-w-7xl mx-auto mb-20 md:mb-32"
            variants={sectionFadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
        >
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-10 md:mb-16">
                Unser <span className="text-brand-cyan">Ansatz</span>
            </h2>

            {/* Mobile Slider */}
            <div className="md:hidden relative">
                <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-elevated/60">
                    <div
                        className="flex transition-transform duration-500 ease-out"
                        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                    >
                        {steps.map((step, index) => {
                            const isActiveSlide = index === activeIndex;
                            return (
                                <motion.div
                                    key={step.title}
                                    className="min-w-full px-4 py-6"
                                    initial={{ opacity: 0.7, scale: 0.96 }}
                                    animate={isActiveSlide ? { opacity: 1, scale: 1 } : { opacity: 0.6, scale: 0.94 }}
                                    transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                                >
                                    <div className="bg-bg-elevated border border-border-subtle rounded-xl p-6 hover:border-brand-cyan transition-all duration-300 hover:shadow-[0_0_24px_rgba(0,230,255,0.2)]">
                                        <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                                        <p className="text-text-secondary">{step.description}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={prev}
                    aria-label="Vorheriger Schritt"
                    className="absolute inset-y-0 left-0 flex items-center pl-2"
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-elevated/80 border border-border-subtle text-text-secondary hover:text-brand-cyan hover:border-brand-cyan transition-colors duration-200">
                        <ArrowLeft size={18} />
                    </span>
                </button>

                <button
                    type="button"
                    onClick={next}
                    aria-label="Nächster Schritt"
                    className="absolute inset-y-0 right-0 flex items-center pr-2"
                >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-elevated/80 border border-border-subtle text-text-secondary hover:text-brand-cyan hover:border-brand-cyan transition-colors duration-200">
                        <ArrowRight size={18} />
                    </span>
                </button>

                <div className="flex justify-center gap-2 mt-4">
                    {steps.map((_, index) => {
                        const isActive = index === activeIndex;
                        return (
                            <button
                                key={index}
                                type="button"
                                onClick={() => goTo(index)}
                                aria-label={`Schritt ${index + 1}`}
                                className={`h-2.5 rounded-full transition-all duration-300 ${
                                    isActive ? "w-6 bg-brand-cyan" : "w-2 bg-border-subtle"
                                }`}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Desktop/Tablet Grid */}
            <motion.div
                className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                variants={staggerContainer}
                style={{ perspective: 1200 }}
            >
                {steps.map((step, index) => {
                    const isActive = index === activeIndex;
                    return (
                        <motion.div
                            key={step.title}
                            className={`bg-bg-elevated rounded-xl p-6 transition-all duration-300 hover:border-brand-cyan hover:shadow-[0_0_24px_rgba(0,230,255,0.2)] border ${
                                isActive
                                    ? "border-brand-cyan shadow-[0_0_24px_rgba(0,230,255,0.2)]"
                                    : "border-border-subtle"
                            }`}
                            variants={itemFadeUp}
                            animate={isActive ? { scale: 1.02, opacity: 1 } : { scale: 0.96, opacity: 0.85 }}
                            whileHover={{ rotateX: -4, rotateY: 4 }}
                            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                        >
                            <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                            <p className="text-text-secondary">{step.description}</p>
                        </motion.div>
                    );
                })}
            </motion.div>
        </motion.section>
    );
}
