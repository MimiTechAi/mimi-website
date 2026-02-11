import type { Metadata } from "next";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import DigitalTwinScrollStory from "@/components/DigitalTwinScrollStory";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { RelatedServices } from "@/components/RelatedServices";
import { Cpu, ArrowRight, Zap } from "lucide-react";

export const metadata: Metadata = {
    title: "Digitale Zwillinge - MiMi Tech AI",
    description: "Digitale Zwillinge für Städte, Gebäude und Unternehmen. Von urbanen digitalen Zwillingen bis zur Enterprise-Prozessoptimierung.",
    keywords: ["Digitale Zwillinge", "Digital Twins", "Urban Digital Twin", "BIM", "Smart City", "3D Modellierung"],
    alternates: {
        canonical: "https://www.mimitechai.com/digitale-zwillinge",
    },
    openGraph: {
        type: "website",
        url: "https://www.mimitechai.com/digitale-zwillinge",
        title: "Digitale Zwillinge - MiMi Tech AI",
        description: "Digitale Zwillinge für Städte, Gebäude und Unternehmen. Von urbanen digitalen Zwillingen bis zur Enterprise-Prozessoptimierung.",
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
        title: "Digitale Zwillinge - MiMi Tech AI",
        description: "Digitale Zwillinge für Städte, Gebäude und Unternehmen. Von urbanen digitalen Zwillingen bis zur Enterprise-Prozessoptimierung.",
        images: [
            "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/mimi_tech_ai_icon_192-Kopie-1760514890080.png",
        ],
    },
};

export default function DigitaleZwillingePage() {
    return (
        <div className="min-h-screen flex flex-col bg-bg-void text-white">
            <Navigation />
            <main className="flex-1 pt-24 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <section className="max-w-5xl mx-auto text-center mb-16 md:mb-24">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-sm text-brand-cyan mb-8">
                        <Cpu size={16} />
                        <span>Digitale Zwillinge</span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-8">
                        <span className="text-brand-cyan">Digitale Zwillinge</span>
                        <br />für die reale Welt
                    </h1>

                    <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed mb-12">
                        Stellen Sie sich vor, Sie könnten Ihr gesamtes System von innen sehen – jede Maschine,
                        jeder Prozess und jeder Datenpunkt in einem lebendigen digitalen Abbild.
                        Digitale Zwillinge machen diese Perspektive in Echtzeit erlebbar.
                    </p>

                    <Link
                        href="/contact"
                        className="btn-primary px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center gap-2 group"
                    >
                        Demo anfordern
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                    </Link>
                </section>

                <section className="max-w-5xl mx-auto mb-20 md:mb-32">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                        Komplexe Systeme, unsichtbare Zusammenhänge
                    </h2>

                    <div className="space-y-5 text-lg text-text-secondary leading-relaxed">
                        <p>
                            Viele Organisationen arbeiten mit isolierten Dashboards, Berichten und Fach-Tools.
                            Was fehlt, ist ein gemeinsames Bild des Systems – von der Maschine bis zum Management.
                        </p>
                        <p>
                            Die Folge: Entscheidungen werden auf Basis von Teilinformationen getroffen, Potenziale bleiben
                            ungenutzt und Probleme werden oft erst sichtbar, wenn sie teuer werden.
                        </p>
                    </div>
                </section>

                {/* What are Digital Twins */}
                <section className="max-w-5xl mx-auto mb-20 md:mb-32 py-10 md:py-16 px-4 sm:px-6 md:px-8 rounded-2xl bg-bg-surface border border-border-subtle">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">
                        Was sind <span className="text-brand-cyan">Digitale Zwillinge</span>?
                    </h2>

                    <div className="space-y-6 text-lg text-text-secondary leading-relaxed">
                        <p>
                            Ein digitaler Zwilling ist eine <span className="text-white font-medium">exakte virtuelle Replikation</span> eines
                            physischen Objekts, Systems oder Prozesses. Durch kontinuierliche Datenerfassung und
                            KI-gestützte Analysen ermöglicht er:
                        </p>

                        <ul className="space-y-4 pl-6">
                            <li className="flex items-start gap-3">
                                <Zap className="text-brand-cyan flex-shrink-0 mt-1" size={20} />
                                <span><strong className="text-white">Echtzeit-Monitoring:</strong> Überwachen Sie den Zustand Ihrer Assets live</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Zap className="text-brand-cyan flex-shrink-0 mt-1" size={20} />
                                <span><strong className="text-white">Vorhersagen:</strong> KI-gestützte Prognosen für Wartung und Performance</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Zap className="text-brand-cyan flex-shrink-0 mt-1" size={20} />
                                <span><strong className="text-white">Simulation:</strong> Testen Sie Szenarien risikofrei im virtuellen Raum</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Zap className="text-brand-cyan flex-shrink-0 mt-1" size={20} />
                                <span><strong className="text-white">Optimierung:</strong> Verbessern Sie Prozesse datenbasiert</span>
                            </li>
                        </ul>
                    </div>
                </section>

                <section className="max-w-5xl mx-auto mb-20 md:mb-32">
                    <div className="bg-bg-elevated border border-border-subtle rounded-2xl p-6 md:p-10">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Beispiel aus der Praxis</h2>
                            <p className="text-text-secondary max-w-3xl mx-auto">
                                Ein kurzes Video von NVIDIA zeigt typische Szenarien, in denen Digital Twins in Industrie und Betrieb echten Mehrwert liefern.
                            </p>
                        </div>

                        <YouTubeEmbed
                            videoId="D7F9OQnDC1M"
                            title="Transforming Industries with Digital Twins and NVIDIA Omniverse Enterprise"
                        />

                        <div className="mt-5 flex flex-col items-center gap-2 text-sm text-text-tertiary">
                            <div>
                                Quelle: NVIDIA
                                <span className="px-2">•</span>
                                <a
                                    href="https://www.youtube.com/watch?v=D7F9OQnDC1M"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-brand-cyan hover:text-white transition-colors"
                                >
                                    Auf YouTube ansehen
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                <DigitalTwinScrollStory />

                {/* Difference: Digital Twin vs. BIM & Co. */}
                <section className="max-w-5xl mx-auto mb-20 md:mb-32">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                        Wie unterscheidet sich ein <span className="text-brand-cyan">Digitaler Zwilling</span> von BIM & Co.?
                    </h2>

                    <div className="grid gap-8 md:grid-cols-2 text-lg text-text-secondary leading-relaxed">
                        <div className="space-y-3">
                            <h3 className="text-xl font-semibold text-white">Digitaler Zwilling</h3>
                            <ul className="space-y-2 list-disc list-inside">
                                <li><span className="text-white font-medium">Live-gekoppelt</span> mit Sensoren, Systemen und Betriebsdaten</li>
                                <li>Verbindet <span className="text-white font-medium">Geometrie, Stammdaten und Echtzeit-Zustände</span></li>
                                <li>Ermöglicht <span className="text-white font-medium">Simulation von Szenarien</span> (Was-wäre-wenn?)</li>
                                <li>Dient als <span className="text-white font-medium">Entscheidungswerkzeug für Betrieb & Management</span></li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-xl font-semibold text-white">BIM / 3D-Modell / Dashboard</h3>
                            <ul className="space-y-2 list-disc list-inside">
                                <li>In der Regel <span className="text-white font-medium">statisch</span> oder nur periodisch aktualisiert</li>
                                <li>Fokus auf <span className="text-white font-medium">Planung, Dokumentation und Visualisierung</span></li>
                                <li>Oft <span className="text-white font-medium">nicht durchgängig mit Live-Daten</span> verbunden</li>
                                <li>Liefert wichtige Informationen, ist aber <span className="text-white font-medium">kein verhaltensnahes Abbild</span> des Systems</li>
                            </ul>
                        </div>
                    </div>

                    <p className="mt-6 text-sm text-text-tertiary">
                        Kurz gesagt: <span className="text-white font-medium">BIM beschreibt, wie gebaut wird – der Digitale Zwilling zeigt, wie es sich im Betrieb wirklich verhält.</span>
                    </p>
                </section>

                {/* Use Cases Grid */}
                <section className="max-w-7xl mx-auto mb-20 md:mb-32">
                    <h2 className="text-4xl md:text-5xl font-bold text-center mb-10 md:mb-16">
                        Unsere <span className="text-brand-cyan">Lösungen</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Urban Digital Twins */}
                        <UseCaseCard
                            title="Urbane Digitale Zwillinge"
                            description="Intelligente Stadt-Modellierung für Smart Cities, Verkehrsplanung und Infrastruktur-Management"
                            href="/digitale-zwillinge/urban"
                            highlights={[
                                "Verkehrsfluss-Simulation",
                                "Energie-Optimierung",
                                "Stadtplanung & Entwicklung",
                            ]}
                        />

                        {/* Construction & Renovation */}
                        <UseCaseCard
                            title="Bau & Sanierung"
                            description="Digitale Zwillinge für Bauvorhaben und Sanierungsprojekte mit BIM-Integration"
                            href="/digitale-zwillinge/bau"
                            highlights={[
                                "BIM-Integration",
                                "Fortschritts-Tracking",
                                "Kostenplanung",
                            ]}
                        />

                        {/* Enterprise Digital Twins */}
                        <UseCaseCard
                            title="Enterprise Lösungen"
                            description="Prozess- und Organisations-Digitalisierung für verbesserte Effizienz"
                            href="/digitale-zwillinge/unternehmen"
                            highlights={[
                                "Prozess-Optimierung",
                                "Supply Chain Modeling",
                                "Predictive Maintenance",
                            ]}
                        />

                        {/* Technology Platform */}
                        <UseCaseCard
                            title="Technologie & Plattform"
                            description="Unsere Technologie-Stack und Integrationsmöglichkeiten"
                            href="/digitale-zwillinge/technologie"
                            highlights={[
                                "WebGL/Three.js",
                                "Real-time Data Sync",
                                "API-Integrationen",
                            ]}
                        />
                    </div>
                </section>

                {/* CTA Section */}
                <section className="max-w-4xl mx-auto text-center py-20 px-4 rounded-2xl bg-gradient-to-br from-brand-cyan/10 to-transparent border border-brand-cyan/20">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">
                        Bereit für Ihren <span className="text-brand-cyan">Digitalen Zwilling</span>?
                    </h2>
                    <p className="text-xl text-text-secondary mb-10">
                        Lassen Sie uns gemeinsam explorieren, wie ein digitaler Zwilling Ihr Projekt transformieren kann.
                    </p>

                    <Link
                        href="/contact"
                        className="btn-primary px-8 py-4 md:px-10 md:py-5 rounded-lg text-lg md:text-xl font-semibold inline-flex items-center gap-3 group"
                    >
                        Kostenlose Demo anfordern
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
                    </Link>

                    <p className="text-sm text-text-tertiary mt-6">
                        Unverbindlich • Keine Kosten • Individuelle Beratung
                    </p>
                </section>
            </main>
            <RelatedServices currentSlug="digitale-zwillinge" />
            <Footer />
        </div>
    );
}

// Use Case Card Component
interface UseCaseCardProps {
    title: string;
    description: string;
    href: string;
    highlights: string[];
}

function UseCaseCard({ title, description, href, highlights }: UseCaseCardProps) {
    return (
        <Link href={href}>
            <div className="group h-full bg-bg-elevated border border-border-subtle rounded-xl p-8 transition-all duration-300 hover:-translate-y-2 hover:border-brand-cyan hover:shadow-[0_0_32px_rgba(0,230,255,0.3)]">
                <h3 className="text-2xl font-bold text-white group-hover:text-brand-cyan transition-colors duration-300 mb-3">
                    {title}
                </h3>

                <p className="text-text-secondary mb-6 leading-relaxed">
                    {description}
                </p>

                <div className="space-y-2 mb-6">
                    {highlights.map((highlight, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-text-secondary">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                            <span>{highlight}</span>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2 text-brand-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="font-medium">Mehr erfahren</span>
                    <ArrowRight size={18} />
                </div>
            </div>
        </Link>
    );
}
