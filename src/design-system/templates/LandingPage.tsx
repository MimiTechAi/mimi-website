"use client";

import { Divider } from "@/design-system/atoms";
import {
    HeroSection,
    TrustBar,
    ServicesSection,
    USPSection,
    AudienceSection,
    ProcessSection,
    FinalCTA,
} from "@/design-system/organisms";

/**
 * Template: LandingPage
 *
 * Composes all organisms in the correct order
 * with section dividers between each major section.
 *
 * Section order (from wireframe):
 * 1. Hero + Trust Pills
 * 2. Trust Bar
 * 3. Services (Dreiklang)
 * 4. USP (NVIDIA + Comparison)
 * 5. Audience (3 Zielgruppen)
 * 6. Process (4 Steps)
 * 7. Final CTA
 * 8. Footer (existing component)
 */
export function LandingPage() {
    return (
        <main>
            <HeroSection />
            <TrustBar />
            <Divider />
            <ServicesSection />
            <Divider />
            <USPSection />
            <Divider />
            <AudienceSection />
            <Divider />
            <ProcessSection />
            <Divider />
            <FinalCTA />
        </main>
    );
}
