"use client";

import { motion } from "framer-motion";
import { GradientText } from "@/design-system/atoms";
import { CTAGroup } from "@/design-system/molecules";

/**
 * Organism: FinalCTA
 *
 * Full-width glass card with gradient border.
 * "Bereit für KI? Wir sind Ihr Partner."
 */
export function FinalCTA() {
    return (
        <section className="py-20">
            <div className="mx-auto max-w-[1200px] px-6">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="relative overflow-hidden rounded-2xl border border-white/10 px-8 py-16 text-center"
                    style={{
                        background: "linear-gradient(135deg, rgba(0,230,255,0.03), rgba(118,185,0,0.03))",
                    }}
                >
                    {/* Gradient border overlay */}
                    <div
                        className="pointer-events-none absolute inset-[-2px] rounded-2xl"
                        style={{
                            padding: "2px",
                            background: "linear-gradient(135deg, rgba(0,230,255,0.2), transparent, rgba(118,185,0,0.2))",
                            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                        }}
                    />

                    <h2 className="mb-4 text-[clamp(2rem,4vw,3rem)] font-extrabold">
                        Bereit für KI?
                        <br />
                        <GradientText>Wir sind Ihr Partner.</GradientText>
                    </h2>
                    <p className="mx-auto mb-8 max-w-[500px] text-lg text-[hsl(220,5%,70%)]">
                        Lassen Sie uns in einem kostenlosen Erstgespräch herausfinden, wie KI
                        Ihr Unternehmen voranbringt.
                    </p>

                    <CTAGroup
                        primaryLabel="Kostenloses Erstgespräch buchen →"
                        primaryHref="/kontakt"
                        className="justify-center"
                    />

                    <p className="mt-4 text-sm text-[hsl(220,5%,50%)]">
                        Oder rufen Sie direkt an: +49 7052 ...
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
