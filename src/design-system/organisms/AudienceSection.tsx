"use client";

import { motion } from "framer-motion";
import { SectionLabel, GradientText } from "@/design-system/atoms";
import { AudienceCard } from "@/design-system/molecules";

/**
 * Organism: AudienceSection
 *
 * "Für wen wir arbeiten" — 3 target audience cards.
 */
export function AudienceSection() {
    return (
        <section className="py-20">
            <div className="mx-auto max-w-[1200px] px-6">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-12"
                >
                    <SectionLabel>Für wen wir arbeiten</SectionLabel>
                    <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.15] tracking-tight">
                        Die richtige <GradientText>KI-Lösung</GradientText>
                        <br />
                        für jeden Bedarf.
                    </h2>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
                    }}
                    className="grid gap-6 md:grid-cols-3"
                >
                    <motion.div variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}>
                        <AudienceCard
                            icon="🏢"
                            title="Unternehmen"
                            description="KI-Strategie, eigene Modelle trainiert auf Ihre Daten, NVIDIA-powered Infrastruktur."
                            href="/ki-beratung"
                            ctaLabel="Für Unternehmen"
                        />
                    </motion.div>

                    <motion.div variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}>
                        <AudienceCard
                            icon="👤"
                            title="Solo-Selbständige"
                            description="KI-Tools und Workshops, die Ihren Arbeitsalltag sofort effizienter machen."
                            href="/ki-beratung#selbstaendige"
                            ctaLabel="Für Selbständige"
                        />
                    </motion.div>

                    <motion.div variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}>
                        <AudienceCard
                            icon="🏛️"
                            title="Städte & Kommunen"
                            description="Smart City Lösungen und Digitale Zwillinge für die Stadtentwicklung der Zukunft."
                            href="/digitale-zwillinge"
                            ctaLabel="Für Kommunen"
                            accentColor="green"
                        />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
