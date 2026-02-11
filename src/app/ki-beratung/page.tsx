import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ApproachSection from "@/components/ApproachSection";
import KIBeratungHero from "@/components/KIBeratungHero";
import ForWhomSection from "@/components/ki-beratung/ForWhomSection";
import ServicesSection from "@/components/ki-beratung/ServicesSection";
import { PrimaryButtonLink } from "@/components/ui/PrimaryButtonLink";
import { RelatedServices } from "@/components/RelatedServices";
import { Brain, ArrowRight, Check } from "lucide-react";

export const metadata: Metadata = {
    title: "KI-Beratung - MiMi Tech AI",
    description: "Professionelle KI-Beratung für Unternehmen und Solo-Selbständige. Strategische KI-Integration, Prozessoptimierung und maßgeschneiderte Lösungen.",
    keywords: ["KI-Beratung", "AI Consulting", "KI Strategie", "Künstliche Intelligenz Beratung", "Machine Learning Beratung"],
    alternates: {
        canonical: "https://www.mimitechai.com/ki-beratung",
    },
    openGraph: {
        type: "website",
        url: "https://www.mimitechai.com/ki-beratung",
        title: "KI-Beratung - MiMi Tech AI",
        description: "Professionelle KI-Beratung für Unternehmen und Solo-Selbständige. Strategische KI-Integration, Prozessoptimierung und maßgeschneiderte Lösungen.",
        images: [
            {
                url: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/mimi_tech_ai_icon_192-Kopie-1760514890080.png",
                width: 1200,
                height: 630,
                alt: "MiMi Tech AI Logo",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "KI-Beratung - MiMi Tech AI",
        description: "Professionelle KI-Beratung für Unternehmen und Solo-Selbständige. Strategische KI-Integration, Prozessoptimierung und maßgeschneiderte Lösungen.",
        images: [
            "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/mimi_tech_ai_icon_192-Kopie-1760514890080.png",
        ],
    },
};

export default function KIBeratungPage() {
    return (
        <div className="min-h-screen flex flex-col bg-bg-void text-white">
            <Navigation />
            <main className="flex-1 pt-24 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <KIBeratungHero />

                {/* Our Approach Section */}
                <ApproachSection />

                <ForWhomSection />

                {/* Services Section */}
                <ServicesSection />

                {/* CTA Section */}
                <section className="max-w-4xl mx-auto text-center py-20 px-4 rounded-2xl bg-gradient-to-br from-brand-cyan/10 to-transparent border border-brand-cyan/20">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Bereit für KI in Ihrem <span className="text-brand-cyan">Unternehmen</span>?
                    </h2>
                    <p className="text-xl text-text-secondary mb-10">
                        Lassen Sie uns in einem kostenlosen Erstgespräch Ihre Möglichkeiten erkunden.
                    </p>

                    <PrimaryButtonLink href="/contact" className="px-8 py-4 md:px-10 md:py-5 text-lg md:text-xl">
                        Jetzt Beratung buchen
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
                    </PrimaryButtonLink>

                    <p className="text-sm text-text-tertiary mt-6">
                        100% kostenfrei • Unverbindlich • Keine Verpflichtungen
                    </p>
                </section>
            </main>
            <RelatedServices currentSlug="ki-beratung" />
            <Footer />
        </div>
    );
}

