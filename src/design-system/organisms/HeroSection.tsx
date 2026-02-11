"use client";

import { motion } from "framer-motion";
import { TrustBadge, GradientText } from "@/design-system/atoms";
import { CTAGroup } from "@/design-system/molecules";

/**
 * Organism: HeroSection
 *
 * Full viewport hero with:
 * - Trust pills (NVIDIA, DSGVO)
 * - H1 with gradient text
 * - Subtitle
 * - CTA group (primary + ghost)
 * - Scroll indicator
 */
export function HeroSection() {
    return (
        <section className="relative flex min-h-screen items-center overflow-hidden pt-[calc(60px+3rem)]">
            {/* Background radial glow */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: [
                        "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,230,255,0.08), transparent)",
                        "radial-gradient(ellipse 60% 50% at 80% 60%, rgba(118,185,0,0.04), transparent)",
                    ].join(", "),
                }}
            />

            <div className="relative z-10 mx-auto w-full max-w-[1200px] px-6">
                <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-[800px]"
                >
                    {/* Trust pills */}
                    <div className="mb-8 flex flex-wrap gap-2">
                        <TrustBadge icon="🟢" label="NVIDIA Connect Partner" />
                        <TrustBadge icon="🔒" label="DSGVO-konform" />
                    </div>

                    {/* H1 */}
                    <h1 className="mb-6 text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.1] tracking-tight">
                        Ihr <GradientText>KI-Partner</GradientText> für
                        <br />
                        maßgeschneiderte Lösungen.
                    </h1>

                    {/* Subtitle */}
                    <p className="mb-8 max-w-[600px] text-[clamp(1rem,2vw,1.25rem)] leading-relaxed text-[hsl(220,5%,70%)]">
                        Wir entwickeln und trainieren KI-Modelle, die lokal auf Ihren
                        Unternehmensdaten laufen – DSGVO-konform, ohne Cloud-Abhängigkeit,
                        mit messbaren Ergebnissen.
                    </p>

                    {/* CTAs */}
                    <CTAGroup
                        primaryLabel="Kostenlose Beratung →"
                        primaryHref="/kontakt"
                        secondaryLabel="Leistungen entdecken"
                        secondaryHref="#leistungen"
                    />
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 animate-bounce flex-col items-center gap-2 text-xs text-[hsl(220,5%,50%)]">
                <span>Mehr erfahren</span>
                <span>↓</span>
            </div>
        </section>
    );
}
