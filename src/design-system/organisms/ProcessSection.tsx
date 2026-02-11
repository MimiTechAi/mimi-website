"use client";

import { motion } from "framer-motion";
import { SectionLabel, GradientText } from "@/design-system/atoms";
import { ProcessStep } from "@/design-system/molecules";

const steps = [
    { number: "01", title: "Analyse", description: "Ist-Aufnahme Ihrer Prozesse und KI-Readiness Check" },
    { number: "02", title: "Strategie", description: "KI-Roadmap, KPIs definieren, Technologie-Auswahl" },
    { number: "03", title: "Umsetzung", description: "Modell-Training, Integration, Team-Schulung" },
    { number: "04", title: "Begleitung", description: "Monitoring, Optimierung, langfristiger Support" },
];

/**
 * Organism: ProcessSection
 *
 * "So arbeiten wir" — 4 steps with connector lines.
 */
export function ProcessSection() {
    return (
        <section className="py-20">
            <div className="mx-auto max-w-[1200px] px-6">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-12 text-center"
                >
                    <SectionLabel className="justify-center">So arbeiten wir</SectionLabel>
                    <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.15] tracking-tight">
                        Ihr Weg zur <GradientText>eigenen KI.</GradientText>
                    </h2>
                    <p className="mx-auto mt-3 max-w-[600px] text-[1.05rem] text-[hsl(220,5%,70%)]">
                        In vier klaren Schritten von der Analyse zum produktiven KI-Einsatz.
                    </p>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
                    }}
                    className="flex flex-col gap-6 md:flex-row md:gap-4"
                >
                    {steps.map((step, i) => (
                        <motion.div
                            key={step.number}
                            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                            className="flex-1"
                        >
                            <ProcessStep
                                number={step.number}
                                title={step.title}
                                description={step.description}
                                showConnector={i < steps.length - 1}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
