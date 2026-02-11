import type { Metadata } from "next";
import Link from "next/link";
import { Wrench, HardHat, ArrowRight, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Digitale Zwillinge für Bau & Sanierung - MiMi Tech AI",
    description: "BIM-Integration und digitale Zwillinge für Bauprojekte. Optimieren Sie Planung, Bau und Betrieb von Immobilien.",
    keywords: ["BIM", "Bau Digitalisierung", "Sanierung Digitaler Zwilling", "Construction Tech", "3D Scan Gebäude"],
    alternates: {
        canonical: "https://www.mimitechai.com/digitale-zwillinge/bau",
    },
    openGraph: {
        type: "website",
        url: "https://www.mimitechai.com/digitale-zwillinge/bau",
        title: "Digitale Zwillinge für Bau & Sanierung - MiMi Tech AI",
        description: "BIM-Integration und digitale Zwillinge für Bauprojekte. Optimieren Sie Planung, Bau und Betrieb von Immobilien.",
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
        title: "Digitale Zwillinge für Bau & Sanierung - MiMi Tech AI",
        description: "BIM-Integration und digitale Zwillinge für Bauprojekte. Optimieren Sie Planung, Bau und Betrieb von Immobilien.",
        images: [
            "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/mimi_tech_ai_icon_192-Kopie-1760514890080.png",
        ],
    },
};

export default function BauTwinsPage() {
    return (
        <div className="min-h-screen bg-bg-void text-white">
            <main className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto mb-4">
                    <Link
                        href="/digitale-zwillinge"
                        className="inline-flex items-center text-sm text-text-secondary hover:text-brand-cyan transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Zurück zur Übersicht Digitale Zwillinge
                    </Link>
                </div>
                {/* Hero Section */}
                <section className="max-w-5xl mx-auto text-center mb-16 md:mb-24">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-sm text-brand-cyan mb-8">
                        <HardHat size={16} />
                        <span>Construction Tech</span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-8">
                        Bauen mit <span className="text-brand-cyan">digitaler Präzision</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed mb-12">
                        Vom 3D-Scan bis zum BIM-Modell. Wir digitalisieren Bestandsgebäude und
                        begleiten Neubauprojekte mit digitalen Zwillingen.
                    </p>

                    <Link
                        href="/contact"
                        className="btn-primary px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center gap-2 group"
                    >
                        Projekt anfragen
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                    </Link>
                </section>

                {/* Process Steps */}
                <section className="max-w-7xl mx-auto mb-20 md:mb-32">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-brand-cyan/20 via-brand-cyan to-brand-cyan/20 -z-10" />

                        <ProcessCard
                            step="01"
                            title="Erfassung"
                            description="Laserscan und Photogrammetrie des Bestands oder Import von CAD-Daten."
                        />
                        <ProcessCard
                            step="02"
                            title="Modellierung"
                            description="Erstellung eines semantischen BIM-Modells (LOD 100-500)."
                        />
                        <ProcessCard
                            step="03"
                            title="Nutzung"
                            description="Simulation, Massenermittlung und Facility Management Integration."
                        />
                    </div>
                </section>

                {/* Use Cases */}
                <section className="max-w-7xl mx-auto mb-20 md:mb-32">
                    <h2 className="text-3xl font-bold mb-10 md:mb-16 text-center">Anwendungsfälle</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-bg-elevated border border-border-subtle rounded-xl p-6 md:p-8">
                            <h3 className="text-2xl font-bold mb-4 text-white">Sanierung im Bestand</h3>
                            <p className="text-text-secondary mb-6">
                                Besonders bei Altbauten fehlen oft Pläne. Ein digitaler Zwilling schafft Planungssicherheit.
                                Erkennen Sie Kollisionen bevor der Bagger anrollt.
                            </p>
                            <ul className="space-y-2 text-text-primary">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />Bestandsaufnahme per Laserscan</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />Massenermittlung für Ausschreibungen</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />Denkmalschutz-Dokumentation</li>
                            </ul>
                        </div>

                        <div className="bg-bg-elevated border border-border-subtle rounded-xl p-6 md:p-8">
                            <h3 className="text-2xl font-bold mb-4 text-white">Neubau-Monitoring</h3>
                            <p className="text-text-secondary mb-6">
                                Vergleichen Sie Soll- und Ist-Zustand täglich. Dokumentieren Sie den Baufortschritt
                                lückenlos und revisionssicher.
                            </p>
                            <ul className="space-y-2 text-text-primary">
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />Soll-Ist-Vergleich</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />Mängelmanagement</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />Digitale Bauakte</li>
                            </ul>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function ProcessCard({ step, title, description }: { step: string, title: string, description: string }) {
    return (
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 md:p-8 text-center relative z-10">
            <div className="inline-block px-3 py-1 rounded-full bg-bg-elevated border border-white/10 text-xs font-mono text-brand-cyan mb-6">
                STEP {step}
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
            <p className="text-text-secondary leading-relaxed">{description}</p>
        </div>
    );
}
