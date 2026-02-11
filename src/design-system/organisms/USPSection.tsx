"use client";

import { motion } from "framer-motion";
import { SectionLabel, GradientText, GlowDot } from "@/design-system/atoms";
import { ComparisonRow } from "@/design-system/molecules";

const comparisons = [
    { feature: "NVIDIA Partnership", mimi: "Connect Partner", other: "Kein Zugang" },
    { feature: "Lokale KI-Modelle", mimi: "On-Premise", other: "Nur Cloud-APIs" },
    { feature: "Team-Schulung inklusive", mimi: "Im Paket", other: "Aufpreis" },
    { feature: "Regionale Präsenz", mimi: "Schwarzwald / BW", other: "Remote only" },
    { feature: "Faire Mittelstandspreise", mimi: "Transparent", other: "Enterprise-Pricing" },
];

/**
 * Organism: USPSection
 *
 * "Was uns unterscheidet" with:
 * - NVIDIA Explainer highlight card
 * - Comparison table (MiMi vs Andere)
 */
export function USPSection() {
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
                    <SectionLabel>Warum MiMi Tech AI</SectionLabel>
                    <h2 className="mt-3 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.15] tracking-tight">
                        Was uns von anderen
                        <br />
                        <GradientText>KI-Beratern unterscheidet.</GradientText>
                    </h2>
                </motion.div>

                {/* NVIDIA Highlight Card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mb-8 flex flex-col items-center gap-8 rounded-2xl border border-[rgba(118,185,0,0.2)] p-8 transition-all duration-300 hover:border-[rgba(118,185,0,0.4)] hover:shadow-[0_0_40px_rgba(118,185,0,0.1)] md:flex-row"
                    style={{
                        background: "linear-gradient(135deg, rgba(118,185,0,0.05), rgba(0,230,255,0.05))",
                    }}
                >
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(118,185,0,0.1)] text-4xl">
                        ⚡
                    </div>
                    <div>
                        <h3 className="mb-2 flex items-center gap-2 text-xl font-bold">
                            NVIDIA Connect Partner <GlowDot color="green" />
                        </h3>
                        <p className="text-[0.95rem] leading-relaxed text-[hsl(220,5%,70%)]">
                            Exklusiver Zugang zu Enterprise-GPUs, Neural-Network-Frameworks
                            und technischem Support direkt von NVIDIA. Das bedeutet für Sie:{" "}
                            <strong className="text-white">
                                schnellere Modelle, bessere Ergebnisse, Zukunftssicherheit.
                            </strong>
                        </p>
                    </div>
                </motion.div>

                {/* Comparison Table */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <table className="w-full overflow-hidden rounded-xl border border-white/10">
                        <thead>
                            <tr>
                                <th className="border-b border-white/5 bg-[hsl(220,16%,12%)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[hsl(220,5%,70%)]">
                                    Merkmal
                                </th>
                                <th className="border-b border-white/5 bg-[hsl(220,16%,12%)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[rgb(0,230,255)]">
                                    MiMi Tech AI
                                </th>
                                <th className="border-b border-white/5 bg-[hsl(220,16%,12%)] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[hsl(220,5%,70%)]">
                                    Andere KI-Berater
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparisons.map((row) => (
                                <ComparisonRow
                                    key={row.feature}
                                    feature={row.feature}
                                    mimiValue={row.mimi}
                                    otherValue={row.other}
                                />
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            </div>
        </section>
    );
}
