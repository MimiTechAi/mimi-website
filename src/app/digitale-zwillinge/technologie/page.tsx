import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Cpu, ArrowLeft, Server, Network } from "lucide-react";

export const metadata: Metadata = {
    title: "Technologie & Plattform - MiMi Tech AI",
    description: "Technologie-Stack und Plattform von MiMi Tech AI: NVIDIA-basierte KI, digitale Zwillinge mit WebGL/Three.js und skalierbare Cloud-Architektur.",
    alternates: {
        canonical: "https://www.mimitechai.com/digitale-zwillinge/technologie",
    },
};

export default function TechnologiePlattformPage() {
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

                <section className="max-w-5xl mx-auto text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-sm text-brand-cyan mb-8">
                        <Cpu size={16} />
                        <span>Technologie & Plattform</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
                        Unser Technologie-Stack
                    </h1>

                    <p className="text-lg md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
                        Von NVIDIA-beschleunigter KI über WebGL/Three.js bis zu skalierbaren Cloud-Plattformen:
                        Wir kombinieren moderne Technologien zu einer stabilen Grundlage für Ihre Digital Twins.
                    </p>
                </section>

                <section className="max-w-6xl mx-auto grid gap-8 md:grid-cols-3 mb-16 md:mb-24">
                    <TechCard
                        icon={<Server className="w-6 h-6 text-brand-cyan" />}
                        title="Backend & Daten"
                        points={[
                            "API-First: REST / GraphQL",
                            "Event-Streaming & Echtzeit-Daten",
                            "Integration in bestehende Systeme",
                        ]}
                    />
                    <TechCard
                        icon={<Network className="w-6 h-6 text-brand-cyan" />}
                        title="3D & Visualisierung"
                        points={[
                            "WebGL / Three.js",
                            "Interaktive Dashboards",
                            "Responsive 3D-Frontends",
                        ]}
                    />
                    <TechCard
                        icon={<Cpu className="w-6 h-6 text-brand-cyan" />}
                        title="AI & Analytics"
                        points={[
                            "NVIDIA-beschleunigte KI-Modelle",
                            "Predictive Analytics",
                            "Anomaly Detection & Simulation",
                        ]}
                    />
                </section>

                <section className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Wie passt das zu Ihrem Setup?</h2>
                    <p className="text-lg text-text-secondary mb-8">
                        Wir docken an Ihre vorhandene IT-Infrastruktur an – ob On-Premise, Private Cloud oder Public Cloud.
                        In einem gemeinsamen Workshop definieren wir Architektur, Schnittstellen und Sicherheitsanforderungen.
                    </p>
                    <Link
                        href="/contact"
                        className="btn-primary px-10 py-5 rounded-lg text-xl font-semibold inline-flex items-center gap-3 group"
                    >
                        Technologie-Workshop anfragen
                    </Link>
                </section>
            </main>
        </div>
    );
}

interface TechCardProps {
    icon: ReactNode;
    title: string;
    points: string[];
}

function TechCard({ icon, title, points }: TechCardProps) {
    return (
        <div className="bg-bg-elevated border border-border-subtle rounded-xl p-6 md:p-8 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                {icon}
                <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <ul className="space-y-2 text-text-secondary text-sm">
                {points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                        <span>{point}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
