import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Building2, ArrowRight, ArrowLeft, Database, Server, Map } from "lucide-react";

export const metadata: Metadata = {
    title: "Urbane Digitale Zwillinge - Smart City Lösungen",
    description: "Digitale Zwillinge für Städte und Kommunen. Verkehrsplanung, Umweltsimulation und Stadtentwicklung in Echtzeit.",
    keywords: ["Urban Digital Twin", "Smart City", "Verkehrssimulation", "Stadtplanung 3D", "Digitaler Zwilling Stadt"],
    alternates: {
        canonical: "https://www.mimitechai.com/digitale-zwillinge/urban",
    },
    openGraph: {
        type: "website",
        url: "https://www.mimitechai.com/digitale-zwillinge/urban",
        title: "Urbane Digitale Zwillinge - Smart City Lösungen",
        description: "Digitale Zwillinge für Städte und Kommunen. Verkehrsplanung, Umweltsimulation und Stadtentwicklung in Echtzeit.",
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
        title: "Urbane Digitale Zwillinge - Smart City Lösungen",
        description: "Digitale Zwillinge für Städte und Kommunen. Verkehrsplanung, Umweltsimulation und Stadtentwicklung in Echtzeit.",
        images: [
            "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/mimi_tech_ai_icon_192-Kopie-1760514890080.png",
        ],
    },
};

export default function UrbanTwinsPage() {
    return (
        <div className="min-h-screen bg-bg-void text-white">
            <main className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto mb-4">
                    <Link
                        href="/digitale-zwillinge"
                        className="inline-flex items-center text-sm text-text-secondary hover:text-brand-cyan transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Zurück zur Übersicht Digitale Zwillinge
                    </Link>
                </div>
                {/* Hero Section */}
                <section className="max-w-6xl mx-auto mb-16 md:mb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-sm text-brand-cyan mb-8">
                            <Building2 size={16} />
                            <span>Smart City Solutions</span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-8">
                            Die Stadt der Zukunft <br />
                            <span className="text-brand-cyan">heute simulieren</span>
                        </h1>

                        <p className="text-xl text-text-secondary leading-relaxed mb-10">
                            Urbane digitale Zwillinge ermöglichen datenbasierte Entscheidungen für
                            Verkehr, Umwelt und Infrastruktur. Planen Sie nicht ins Blaue – simulieren Sie die Realität.
                        </p>

                        <Link
                            href="/contact"
                            className="btn-primary px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center gap-2 group"
                        >
                            Demo anfordern
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </Link>
                    </div>

                    {/* Abstract City Visualization Placeholder */}
                    <div className="relative aspect-square rounded-2xl border border-brand-cyan/30 bg-bg-elevated overflow-hidden flex items-center justify-center group">
                        <div className="absolute inset-0">
                            <Image
                                src="/images/ChatGPT Image 6. Dez. 2025, 22_51_47.png"
                                alt="Digitaler Zwilling einer Stadt mit Analyse- und Simulationsansicht auf einem Monitor"
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>

                        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                            <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/80" />
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="max-w-7xl mx-auto mb-20 md:mb-32">
                    <h2 className="text-3xl font-bold mb-10 md:mb-16 text-center">Einsatzgebiete</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            title="Verkehrsfluss"
                            description="Simulation von Verkehrsströmen, Stauprognosen und Optimierung von Ampelschaltungen in Echtzeit."
                        />
                        <FeatureCard
                            title="Umwelt & Klima"
                            description="Modellierung von Luftströmungen, Hitzeinseln und Ausbreitung von Emissionen."
                        />
                        <FeatureCard
                            title="Infrastruktur"
                            description="Predictive Maintenance für Brücken, Straßen und Versorgungsleitungen."
                        />
                        <FeatureCard
                            title="Katastrophenschutz"
                            description="Simulation von Hochwasser-Szenarien und Evakuierungsplänen."
                        />
                        <FeatureCard
                            title="Stadtplanung"
                            description="Visualisierung von Neubauprojekten und deren Auswirkungen auf die Umgebung."
                        />
                    </div>
                </section>

                {/* Technical Deep Dive */}
                <section className="max-w-7xl mx-auto mb-20 md:mb-32 bg-bg-elevated rounded-2xl p-6 md:p-12 border border-border-subtle">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        <div>
                            <h2 className="text-3xl font-bold mb-6">Technologie-Stack</h2>
                            <p className="text-text-secondary mb-8">
                                Unsere Lösungen basieren auf offenen Standards und modernster Web-Technologie.
                                Keine proprietären Lock-ins, volle Datenhoheit.
                            </p>
                            <ul className="space-y-4 font-mono text-sm text-brand-cyan">
                                <li className="border-b border-white/10 pb-2">CesiumJS / Three.js Visualization</li>
                                <li className="border-b border-white/10 pb-2">OGC Standards (CityGML, 3D Tiles)</li>
                                <li className="border-b border-white/10 pb-2">Real-time IoT Integration (MQTT)</li>
                                <li className="border-b border-white/10 pb-2">AI-based Prediction Models</li>
                            </ul>
                        </div>
                        <div className="flex items-center justify-center">
                            {/* Tech Viz Placeholder */}
                            <div className="w-full h-full min-h-[220px] md:min-h-[220px] rounded-xl bg-black/40 border border-white/10 p-4 md:p-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-xs font-mono uppercase tracking-[0.18em] text-text-tertiary">
                                        Architektur: Urbaner Digitaler Zwilling
                                    </p>
                                    <span className="px-2 py-1 rounded-full border border-border-subtle text-[11px] text-text-tertiary">
                                        Stadt & Infrastruktur
                                    </span>
                                </div>

                                <div className="flex-1 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.1fr)_auto_minmax(0,1.1fr)] md:items-center">
                                    <div className="space-y-3 text-xs md:text-[11px]">
                                        <div className="flex items-start gap-3 p-2 rounded-lg bg-bg-void/70 border border-border-subtle">
                                            <Database className="text-brand-cyan mt-0.5" size={16} />
                                            <div>
                                                <div className="font-semibold text-text-secondary">Datenquellen</div>
                                                <p className="text-text-tertiary">
                                                    Verkehrszählung, Floating-Car-Daten, ÖPNV, Parkraumsensoren.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-2 rounded-lg bg-bg-void/70 border border-border-subtle">
                                            <Map className="text-brand-cyan mt-0.5" size={16} />
                                            <div>
                                                <div className="font-semibold text-text-secondary">Raumbezug</div>
                                                <p className="text-text-tertiary">
                                                    3D-Stadtmodell, Straßennetz, Gebäude, Zonen.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center gap-3 text-xs md:text-[11px] text-text-tertiary">
                                        <div className="hidden md:block h-10 w-px bg-gradient-to-b from-brand-cyan/0 via-brand-cyan/70 to-brand-cyan/0" />
                                        <div className="px-3 py-2 rounded-lg border border-brand-cyan/60 bg-brand-cyan/10 shadow-[0_0_22px_rgba(0,230,255,0.35)] flex flex-col items-center gap-1">
                                            <Server size={16} className="text-brand-cyan" />
                                            <span className="text-[11px] font-semibold text-text-secondary">
                                                Urban Twin Plattform
                                            </span>
                                            <span className="text-[10px] text-text-tertiary">
                                                Datenfusion, Simulation, APIs
                                            </span>
                                        </div>
                                        <div className="w-12 h-1.5 rounded-full bg-gradient-to-r from-brand-cyan/40 to-brand-cyan" />
                                    </div>

                                    <div className="space-y-3 text-xs md:text-[11px]">
                                        <div className="p-2 rounded-lg bg-bg-void/70 border border-border-subtle">
                                            <div className="font-semibold text-text-secondary flex items-center gap-2 mb-1">
                                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                                                <span>Verkehr & Mobilität</span>
                                            </div>
                                            <p className="text-text-tertiary">
                                                Live-Auslastung, Stauprognosen, Ampel-Optimierung.
                                            </p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-bg-void/70 border border-border-subtle">
                                            <div className="font-semibold text-text-secondary flex items-center gap-2 mb-1">
                                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-cyan" />
                                                <span>Umwelt & Stadtplanung</span>
                                            </div>
                                            <p className="text-text-tertiary">
                                                Luftqualität, Lärm, Hitzeinseln, Szenarien für neue Quartiere.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <p className="mt-4 text-xs md:text-[11px] text-text-tertiary leading-relaxed">
                                    Daten aus Verkehr, Umwelt und Infrastruktur werden in einer gemeinsamen Urban-Twin-Plattform
                                    zusammengeführt und als konkrete Entscheidungsgrundlagen für Verwaltung und Stadtwerke
                                    bereitgestellt.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function FeatureCard({ title, description }: { title: string, description: string }) {
    return (
        <div className="bg-bg-surface border border-border-subtle rounded-xl p-6 md:p-8 hover:border-brand-cyan transition-colors duration-300">
            <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
            <p className="text-text-secondary leading-relaxed">{description}</p>
        </div>
    );
}
