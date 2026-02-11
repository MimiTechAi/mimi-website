"use client";

import { motion } from "framer-motion";
import { TrustItem } from "@/design-system/molecules";

/**
 * Organism: TrustBar
 *
 * Horizontal bar with 4 trust signals.
 * NVIDIA Connect · DSGVO · Deutsche Qualität · Schwarzwald
 */
export function TrustBar() {
    return (
        <section className="border-y border-white/5 bg-white/[0.03] py-8">
            <div className="mx-auto max-w-[1200px] px-6">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-wrap items-center justify-center gap-6 md:gap-12"
                >
                    <TrustItem
                        icon="⚡"
                        title="NVIDIA Connect"
                        subtitle="Offizieller Partner"
                        variant="nvidia"
                    />
                    <TrustItem
                        icon="🔒"
                        title="DSGVO"
                        subtitle="Vollständig konform"
                        variant="shield"
                    />
                    <TrustItem
                        icon="🇩🇪"
                        title="Deutsche Qualität"
                        subtitle="Made in Schwarzwald"
                        variant="cert"
                    />
                    <TrustItem
                        icon="🌲"
                        title="Schwarzwald"
                        subtitle="Regionaler Partner"
                        variant="region"
                    />
                </motion.div>
            </div>
        </section>
    );
}
