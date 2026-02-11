import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import ScrollTiltWrapper from "@/components/animations/ScrollTiltWrapper";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";

export const metadata: Metadata = {
    title: "KI für Selbständige & Freelancer - MiMi Tech AI",
    description: "KI-Tools und Strategien für Solo-Selbständige. Sparen Sie Zeit, automatisieren Sie Aufgaben und steigern Sie Ihre Produktivität.",
    keywords: ["KI für Selbständige", "AI Tools Freelancer", "Produktivität steigern", "ChatGPT Workshop", "Automatisierung"],
    alternates: {
        canonical: "https://www.mimitechai.com/ki-beratung/selbstaendige",
    },
    openGraph: {
        type: "website",
        url: "https://www.mimitechai.com/ki-beratung/selbstaendige",
        title: "KI für Selbständige & Freelancer - MiMi Tech AI",
        description: "KI-Tools und Strategien für Solo-Selbständige. Sparen Sie Zeit, automatisieren Sie Aufgaben und steigern Sie Ihre Produktivität.",
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
        title: "KI für Selbständige & Freelancer - MiMi Tech AI",
        description: "KI-Tools und Strategien für Solo-Selbständige. Sparen Sie Zeit, automatisieren Sie Aufgaben und steigern Sie Ihre Produktivität.",
        images: [
            "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/mimi_tech_ai_icon_192-Kopie-1760514890080.png",
        ],
    },
};

export default function KISelbstaendigePage() {
    return (
        <div className="min-h-screen flex flex-col bg-bg-void text-white">
            <Navigation />

            <Breadcrumb items={[
                { label: "KI-Beratung", href: "/ki-beratung" },
                { label: "Für Selbständige" }
            ]} />

            <main className="flex-1 relative z-10 pt-24 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <section className="max-w-4xl mx-auto text-center mb-16 md:mb-24">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-sm text-brand-cyan mb-8">
                        <Sparkles size={16} />
                        <span>Für Solo-Selbständige & Freelancer</span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-8">
                        Ihr digitaler <span className="text-brand-cyan">Super-Assistent</span>
                    </h1>

                    <p className="text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mb-12">
                        Nutzen Sie KI, um Aufgaben in Minuten statt Stunden zu erledigen.
                        Mehr Zeit für Ihre Kunden, weniger Zeit für Bürokratie.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/contact"
                            className="btn-primary px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center gap-2 group"
                        >
                            Kostenloses Erstgespräch
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </Link>
                    </div>
                </section>

                {/* Pain Points & Solutions */}
                <section className="max-w-6xl mx-auto mb-20 md:mb-32">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <PainPointCard
                            title="Keine Zeit?"
                            description="KI übernimmt Recherche, E-Mails und Content-Erstellung für Sie."
                        />
                        <PainPointCard
                            title="Überfordert?"
                            description="Wir zeigen Ihnen genau die Tools, die Sie wirklich brauchen."
                        />
                        <PainPointCard
                            title="Mehr Umsatz?"
                            description="Optimieren Sie Ihr Marketing und Ihre Kundenkommunikation mit KI."
                        />
                    </div>
                </section>

                {/* Services */}
                <section className="max-w-5xl mx-auto mb-20 md:mb-32">
                    <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">Wie wir Ihnen <span className="text-brand-cyan">helfen</span></h2>

                    <div className="space-y-8">
                        <ServiceRow
                            title="KI-Tool Setup"
                            description="Wir richten die passenden KI-Tools (ChatGPT, Midjourney, Perplexity) für Sie ein und integrieren sie in Ihren Workflow."
                            price="Ab 490€"
                        />
                        <ServiceRow
                            title="Workflow Automatisierung"
                            description="Verbinden Sie Ihre Apps (E-Mail, Kalender, CRM) mit KI, um Routineaufgaben komplett zu automatisieren."
                            price="Individuelles Angebot"
                        />
                        <ServiceRow
                            title="1:1 Coaching"
                            description="Persönliches Training an Ihren echten Aufgaben. Wir bearbeiten gemeinsam Ihre Projekte mit KI."
                            price="150€ / Stunde"
                        />
                    </div>
                </section>

                {/* Testimonial Placeholder (Authentic style - no fake names yet) */}
                <section className="max-w-4xl mx-auto mb-20 md:mb-32 text-center">
                    <div className="bg-bg-elevated border border-border-subtle rounded-2xl p-6 md:p-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-cyan to-transparent" />
                        <h3 className="text-2xl font-bold mb-6">Warum KI für Selbständige?</h3>
                        <p className="text-xl text-text-secondary italic leading-relaxed max-w-2xl mx-auto">
                            "KI ist wie ein Mitarbeiter, der nie schläft, nie krank ist und Zugriff auf das gesamte Wissen der Welt hat.
                            Für Solo-Selbständige ist das der größte Hebel seit der Erfindung des Internets."
                        </p>
                    </div>
                </section>

                {/* CTA */}
                <section className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-6">Starten Sie jetzt durch</h2>
                    <p className="text-text-secondary mb-8">
                        Lassen Sie uns schauen, wo KI Ihnen am meisten Zeit sparen kann.
                    </p>
                    <Link
                        href="/contact"
                        className="btn-primary px-10 py-4 rounded-lg text-lg font-semibold inline-flex items-center gap-2"
                    >
                        Termin buchen
                    </Link>
                </section>
            </main>

            <Footer />
        </div>
    );
}

function PainPointCard({ title, description }: { title: string, description: string }) {
    return (
        <div className="bg-bg-elevated border border-border-subtle rounded-xl p-8 text-center hover:border-brand-cyan transition-colors duration-300">
            <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
            <p className="text-text-secondary">{description}</p>
        </div>
    );
}

function ServiceRow({ title, description, price }: { title: string, description: string, price: string }) {
    return (
        <ScrollTiltWrapper>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-bg-elevated border border-border-subtle rounded-xl p-8 hover:border-brand-cyan/50 transition-colors duration-300">
                <div className="flex items-start gap-4">
                    <div className="mt-1 bg-brand-cyan/20 p-2 rounded-lg">
                        <CheckCircle className="text-brand-cyan" size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-text-secondary max-w-xl">{description}</p>
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <span className="inline-block px-4 py-2 rounded-lg bg-white/5 border border-white/10 font-mono text-brand-cyan font-semibold">
                        {price}
                    </span>
                </div>
            </div>
        </ScrollTiltWrapper>
    );
}
