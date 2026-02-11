import type { Metadata } from "next";
import Link from "next/link";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { Factory, ArrowRight, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Enterprise Digital Twins - Prozessoptimierung",
    description: "Digitale Zwillinge für Unternehmensprozesse und Supply Chains. Simulieren und optimieren Sie Ihre Abläufe.",
    keywords: ["Enterprise Digital Twin", "Prozesssimulation", "Supply Chain Twin", "Business Process Optimization", "Industrie 4.0"],
    alternates: {
        canonical: "https://www.mimitechai.com/digitale-zwillinge/unternehmen",
    },
    openGraph: {
        type: "website",
        url: "https://www.mimitechai.com/digitale-zwillinge/unternehmen",
        title: "Enterprise Digital Twins - Prozessoptimierung",
        description: "Digitale Zwillinge für Unternehmensprozesse und Supply Chains. Simulieren und optimieren Sie Ihre Abläufe.",
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
        title: "Enterprise Digital Twins - Prozessoptimierung",
        description: "Digitale Zwillinge für Unternehmensprozesse und Supply Chains. Simulieren und optimieren Sie Ihre Abläufe.",
        images: [
            "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/mimi_tech_ai_icon_192-Kopie-1760514890080.png",
        ],
    },
};

export default function EnterpriseTwinsPage() {
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
                        <Factory size={16} />
                        <span>Industrie 4.0 & Enterprise</span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-8">
                        Ihr Unternehmen als <br />
                        <span className="text-brand-cyan">digitales Modell</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed mb-12">
                        Simulieren Sie Produktionslinien, Lieferketten und Geschäftsprozesse.
                        Erkennen Sie Engpässe, bevor sie entstehen.
                    </p>

                    <Link
                        href="/contact"
                        className="btn-primary px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center gap-2 group"
                    >
                        Use Case besprechen
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                    </Link>
                </section>

                {/* Value Props */}
                <section className="max-w-7xl mx-auto mb-20 md:mb-32">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <ValueCard
                            title="Supply Chain"
                            description="End-to-End Transparenz Ihrer Lieferkette. Simulieren Sie Ausfälle und optimieren Sie Lagerbestände."
                        />
                        <ValueCard
                            title="Produktion"
                            description="Digitaler Zwilling Ihrer Fertigungslinie. Predictive Maintenance und OEE-Optimierung."
                        />
                        <ValueCard
                            title="Prozesse"
                            description="Business Process Mining und Simulation von Organisationsabläufen."
                        />
                    </div>
                </section>

                <section className="max-w-7xl mx-auto mb-20 md:mb-32">
                    <div className="bg-bg-elevated border border-border-subtle rounded-2xl p-6 md:p-12">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold mb-4">So sieht das in der Praxis aus</h2>
                            <p className="text-text-secondary max-w-3xl mx-auto">
                                Beispielvideo von NVIDIA: Digitale Zwillinge für Fabriken, Lager und Operations – als Inspiration für Ihren eigenen Use Case.
                            </p>
                        </div>

                        <YouTubeEmbed
                            videoId="gGg2wpzukPA"
                            title="Building a Data Center Digital Twin in NVIDIA Omniverse"
                        />

                        <div className="mt-5 flex flex-col items-center gap-2 text-sm text-text-tertiary">
                            <div>
                                Quelle: NVIDIA
                                <span className="px-2">•</span>
                                <a
                                    href="https://www.youtube.com/watch?v=gGg2wpzukPA"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-brand-cyan hover:text-white transition-colors"
                                >
                                    Auf YouTube ansehen
                                </a>
                            </div>
                        </div>

                        <div className="mt-10 text-center">
                            <Link
                                href="/contact"
                                className="btn-primary px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center gap-2 group"
                            >
                                Use-Case-Check anfragen
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                            </Link>
                            <p className="text-sm text-text-tertiary mt-4">
                                Wir zeigen dir, wie das mit deinen Daten (IoT/BIM/ERP) funktioniert.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Tech Stack Integration */}
                <section className="max-w-7xl mx-auto mb-20 md:mb-32 bg-bg-elevated rounded-2xl p-6 md:p-12 border border-border-subtle">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Nahtlose Integration</h2>
                        <p className="text-text-secondary max-w-2xl mx-auto">
                            Unsere Digital Twin Plattform verbindet sich mit Ihren bestehenden Systemen.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <IntegrationBadge name="SAP" />
                        <IntegrationBadge name="Salesforce" />
                        <IntegrationBadge name="Microsoft Azure" />
                        <IntegrationBadge name="AWS IoT" />
                        <IntegrationBadge name="Siemens Mindsphere" />
                        <IntegrationBadge name="Oracle" />
                        <IntegrationBadge name="REST / GraphQL" />
                        <IntegrationBadge name="MQTT / OPC-UA" />
                    </div>
                </section>
            </main>
        </div>
    );
}

function ValueCard({ title, description }: { title: string, description: string }) {
    return (
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 md:p-8 hover:border-brand-cyan transition-colors duration-300 group">
            <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
            <p className="text-text-secondary leading-relaxed">{description}</p>
        </div>
    );
}

function IntegrationBadge({ name }: { name: string }) {
    return (
        <div className="p-4 bg-bg-surface border border-white/5 rounded-lg text-text-secondary font-medium hover:text-white hover:border-brand-cyan/30 transition-colors">
            {name}
        </div>
    );
}
