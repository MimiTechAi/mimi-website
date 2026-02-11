import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import FadeIn from "@/components/animations/FadeIn";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export const metadata: Metadata = {
    title: "KI-Beratung für Unternehmen - MiMi Tech AI",
    description: "Strategische KI-Integration für den Mittelstand und Großunternehmen. Prozessoptimierung, Automatisierung und Mitarbeiterschulung.",
    keywords: ["KI Unternehmen", "AI Business Consulting", "Prozessautomatisierung", "KI Strategie", "Mittelstand Digitalisierung"],
    alternates: {
        canonical: "https://www.mimitechai.com/ki-beratung/unternehmen",
    },
    openGraph: {
        type: "website",
        url: "https://www.mimitechai.com/ki-beratung/unternehmen",
        title: "KI-Beratung für Unternehmen - MiMi Tech AI",
        description: "Strategische KI-Integration für den Mittelstand und Großunternehmen. Prozessoptimierung, Automatisierung und Mitarbeiterschulung.",
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
        title: "KI-Beratung für Unternehmen - MiMi Tech AI",
        description: "Strategische KI-Integration für den Mittelstand und Großunternehmen. Prozessoptimierung, Automatisierung und Mitarbeiterschulung.",
        images: [
            "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/mimi_tech_ai_icon_192-Kopie-1760514890080.png",
        ],
    },
};

export default function KIUnternehmenPage() {
    return (
        <div className="min-h-screen flex flex-col bg-bg-void text-white">
            <Navigation />

            <Breadcrumb items={[
                { label: "KI-Beratung", href: "/ki-beratung" },
                { label: "Für Unternehmen" }
            ]} />

            <main className="flex-1 relative z-10 pt-24 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <section className="max-w-5xl mx-auto text-center mb-16 md:mb-24">
                    <FadeIn delay={0.1}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-sm text-brand-cyan mb-8">
                            <Building2 size={16} />
                            <span>Enterprise Solutions</span>
                        </div>
                    </FadeIn>

                    <FadeIn delay={0.2}>
                        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-8">
                            KI-Transformation für <br />
                            <span className="text-brand-cyan">zukunftssichere Unternehmen</span>
                        </h1>
                    </FadeIn>

                    <FadeIn delay={0.3}>
                        <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed mb-12">
                            Von der ersten Strategie bis zur Implementierung. Wir machen Ihr Unternehmen fit für das KI-Zeitalter – sicher, skalierbar und effizient.
                        </p>
                    </FadeIn>

                    <FadeIn delay={0.4}>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/contact"
                                className="btn-primary px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center gap-2 group"
                            >
                                Strategiegespräch vereinbaren
                                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                            </Link>
                        </div>
                    </FadeIn>
                </section>

                {/* Key Benefits Grid */}
                <section className="max-w-7xl mx-auto mb-20 md:mb-32">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FadeIn delay={0.2} className="h-full">
                            <BenefitCard
                                title="Effizienz steigern"
                                description="Automatisieren Sie repetitive Prozesse und senken Sie Betriebskosten um bis zu 40%."
                            />
                        </FadeIn>
                        <FadeIn delay={0.3} className="h-full">
                            <BenefitCard
                                title="Datensicherheit"
                                description="DSGVO-konforme KI-Lösungen, die Ihre Unternehmensdaten schützen. On-Premise oder Private Cloud."
                            />
                        </FadeIn>
                        <FadeIn delay={0.4} className="h-full">
                            <BenefitCard
                                title="Bessere Entscheidungen"
                                description="Nutzen Sie Predictive Analytics für datengetriebene Geschäftsentscheidungen."
                            />
                        </FadeIn>
                    </div>
                </section>

                {/* Detailed Services */}
                <section className="max-w-7xl mx-auto mb-20 md:mb-32">
                    <FadeIn>
                        <h2 className="text-4xl font-bold mb-16 text-center">Unser <span className="text-brand-cyan">Leistungsportfolio</span></h2>
                    </FadeIn>

                    <div className="space-y-16 md:space-y-24">
                        {/* Service 1 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <FadeIn direction="right" className="order-2 lg:order-1">
                                <h3 className="text-3xl font-bold mb-6">Strategische Beratung & Roadmap</h3>
                                <p className="text-text-secondary text-lg mb-8 leading-relaxed">
                                    Wir analysieren Ihren Status Quo und identifizieren High-Impact Use Cases.
                                    Das Ergebnis ist eine klare Roadmap für die KI-Einführung in Ihrem Unternehmen.
                                </p>
                                <ul className="space-y-4">
                                    <ListItem text="Reifegrad-Analyse" />
                                    <ListItem text="Use-Case Identifikation" />
                                    <ListItem text="ROI-Berechnung" />
                                    <ListItem text="Technologie-Auswahl" />
                                </ul>
                            </FadeIn>
                            <FadeIn direction="left" className="order-1 lg:order-2 h-full">
                                <div className="bg-bg-elevated border border-border-subtle rounded-2xl p-6 md:p-8 h-full min-h-[220px] md:min-h-[300px] flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative z-10 space-y-4 text-center">
                                        <h4 className="text-xl font-semibold text-white">
                                            In 2–4 Wochen erhalten Sie:
                                        </h4>
                                        <ul className="space-y-3 text-sm md:text-base">
                                            <ListItem text="Klar priorisierte KI-Roadmap mit Quick Wins und strategischen Initiativen" />
                                            <ListItem text="Übersicht zu Aufwand, Impact und Risiken pro Use Case" />
                                            <ListItem text="Konkrete nächste Schritte für Management & Fachabteilungen" />
                                        </ul>
                                    </div>
                                </div>
                            </FadeIn>
                        </div>

                        {/* Service 2 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <FadeIn direction="right" className="order-1 lg:order-2">
                                <h3 className="text-3xl font-bold mb-6">Implementierung & Integration</h3>
                                <p className="text-text-secondary text-lg mb-8 leading-relaxed">
                                    Wir integrieren KI-Modelle nahtlos in Ihre bestehende IT-Infrastruktur.
                                    Ob API-Anbindung, Custom Models oder RAG-Systeme für Ihre Wissensdatenbank.
                                </p>
                                <ul className="space-y-4">
                                    <ListItem text="Custom LLM Entwicklung" />
                                    <ListItem text="RAG (Retrieval Augmented Generation)" />
                                    <ListItem text="API Integrationen" />
                                    <ListItem text="On-Premise Deployment" />
                                </ul>
                            </FadeIn>
                            <FadeIn direction="left" className="order-2 lg:order-1 h-full">
                                <div className="bg-bg-elevated border border-border-subtle rounded-2xl p-6 md:p-8 h-full min-h-[220px] md:min-h-[300px] flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative z-10 space-y-4">
                                        <h4 className="text-xl font-semibold text-white text-center">
                                            Typische Integrationen
                                        </h4>
                                        <ul className="space-y-3 text-sm md:text-base">
                                            <ListItem text="CRM- und ERP-Systeme (z.B. Salesforce, SAP, HubSpot)" />
                                            <ListItem text="Dokumentenmanagement & Wissensdatenbanken" />
                                            <ListItem text="Ticket- und Supportsysteme für automatisierte Antworten" />
                                            <ListItem text="Interne Chatbots und Assistenten für Fachabteilungen" />
                                        </ul>
                                    </div>
                                </div>
                            </FadeIn>
                        </div>

                        {/* Service 3 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <FadeIn direction="right" className="order-2 lg:order-1">
                                <h3 className="text-3xl font-bold mb-6">Training & Enablement</h3>
                                <p className="text-text-secondary text-lg mb-8 leading-relaxed">
                                    Technologie ist nur so gut wie die Menschen, die sie nutzen.
                                    Wir schulen Ihre Mitarbeiter im effektiven Umgang mit KI-Tools.
                                </p>
                                <ul className="space-y-4">
                                    <ListItem text="Prompt Engineering Workshops" />
                                    <ListItem text="KI-Guidelines & Governance" />
                                    <ListItem text="Change Management" />
                                    <ListItem text="Führungskräfte-Coaching" />
                                </ul>
                            </FadeIn>
                            <FadeIn direction="left" className="order-1 lg:order-2 h-full">
                                <div className="bg-bg-elevated border border-border-subtle rounded-2xl p-6 md:p-8 h-full min-h-[220px] md:min-h-[300px] flex items-center justify-center relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <div className="relative z-10 space-y-4 text-center">
                                        <h4 className="text-xl font-semibold text-white">
                                            Für wen ist das Training?
                                        </h4>
                                        <ul className="space-y-3 text-sm md:text-base">
                                            <ListItem text="Fachabteilungen, die KI in ihren Arbeitsalltag integrieren möchten" />
                                            <ListItem text="Führungskräfte, die fundierte Entscheidungen zu KI-Projekten treffen müssen" />
                                            <ListItem text="Teams, die sichere und verantwortungsvolle KI-Nutzung etablieren wollen" />
                                        </ul>
                                    </div>
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <FadeIn delay={0.2}>
                    <section className="max-w-4xl mx-auto text-center py-20 px-4 rounded-2xl bg-gradient-to-br from-brand-cyan/10 to-transparent border border-brand-cyan/20">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Machen Sie Ihr Unternehmen <span className="text-brand-cyan">zukunftssicher</span>
                        </h2>
                        <p className="text-xl text-text-secondary mb-10">
                            Vereinbaren Sie ein unverbindliches Erstgespräch mit unseren Experten.
                        </p>
                        <Link
                            href="/contact"
                            className="btn-primary px-8 py-4 md:px-10 md:py-5 rounded-lg text-lg md:text-xl font-semibold inline-flex items-center gap-3 group"
                        >
                            Jetzt anfragen
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
                        </Link>
                    </section>
                </FadeIn>
            </main>

            <Footer />
        </div>
    );
}

function BenefitCard({ title, description }: { title: string, description: string }) {
    return (
        <div className="bg-bg-elevated border border-border-subtle rounded-xl p-8 hover:border-brand-cyan transition-all duration-300 hover:shadow-[0_0_24px_rgba(0,230,255,0.15)] group">
            <h3 className="text-xl font-bold mb-4 text-white">{title}</h3>
            <p className="text-text-secondary leading-relaxed">{description}</p>
        </div>
    );
}

function ListItem({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-3 text-text-primary">
            <CheckCircle className="text-brand-cyan flex-shrink-0" size={20} />
            <span>{text}</span>
        </li>
    );
}
