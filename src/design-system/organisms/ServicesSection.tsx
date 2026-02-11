"use client";

import { motion } from "framer-motion";
import { SectionLabel, GradientText } from "@/design-system/atoms";
import { ServiceCard } from "@/design-system/molecules";

/**
 * Organism: ServicesSection
 *
 * "Beraten. Trainieren. Simulieren." — The Dreiklang.
 * 3 ServiceCards in a responsive grid.
 */
export function ServicesSection() {
    return (
        <section id="leistungen" className="py-20">
            <div className="mx-auto max-w-[1200px] px-6">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-12"
                >
                    <SectionLabel>Unsere Leistungen</SectionLabel>
                    <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.15] tracking-tight">
                        Beraten. Trainieren. <GradientText>Simulieren.</GradientText>
                    </h2>
                    <p className="mt-3 max-w-[600px] text-[1.05rem] text-[hsl(220,5%,70%)]">
                        Drei Säulen für Ihren KI-Erfolg – von der Strategie bis zum
                        digitalen Abbild.
                    </p>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: { staggerChildren: 0.15 },
                        },
                    }}
                    className="grid gap-6 md:grid-cols-3"
                >
                    <motion.div variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}>
                        <ServiceCard
                            icon="🧠"
                            title="KI-Beratung & Strategie"
                            description="NVIDIA-powered KI-Strategie für Ihr Unternehmen. Von der Analyse bis zum produktiven Einsatz."
                            features={[
                                "Ist-Analyse & KI-Readiness",
                                "Individuelle KI-Roadmap",
                                "Lokale Modell-Entwicklung",
                                "NVIDIA Enterprise GPU-Stack",
                            ]}
                            href="/ki-beratung"
                            accentColor="cyan"
                        />
                    </motion.div>

                    <motion.div variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}>
                        <ServiceCard
                            icon="📚"
                            title="KI-Schulung & Training"
                            description="Vom KI-Grundlagen-Workshop bis zur Prompt-Engineering Masterclass."
                            features={[
                                "Workshops für Teams",
                                "Live-Coding Sessions",
                                "Hands-on mit echten Daten",
                                "Zertifikate & Follow-up",
                            ]}
                            href="/ki-beratung#schulung"
                            accentColor="cyan"
                        />
                    </motion.div>

                    <motion.div variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}>
                        <ServiceCard
                            icon="🏗️"
                            title="Digitale Zwillinge"
                            description="Virtuelle Abbilder Ihrer Anlagen, Gebäude und Städte für Simulation & Optimierung."
                            features={[
                                "Smart City & Urban",
                                "Bau & Sanierung",
                                "Enterprise & Industrie",
                                "Echtzeit-Datenanbindung",
                            ]}
                            href="/digitale-zwillinge"
                            accentColor="green"
                        />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
