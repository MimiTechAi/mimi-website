"use client";

/**
 * RelatedServices — Cross-Selling Component
 * Displays recommended services based on current page context.
 * Uses service mapping data to suggest relevant offerings.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { motion } from "framer-motion";
import { ArrowRight, Brain, Cpu, GraduationCap, MessageSquare, Sparkles, Globe } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

// --- Service Data ---

export interface ServiceEntry {
    slug: string;
    title: string;
    shortTitle: string;
    description: string;
    icon: LucideIcon;
    href: string;
    gradient: string;
    borderColor: string;
}

export const allServices: ServiceEntry[] = [
    {
        slug: "ki-beratung",
        title: "KI Beratung & Strategie",
        shortTitle: "KI Beratung",
        description: "Strategische Integration von künstlicher Intelligenz in Ihre Geschäftsprozesse.",
        icon: Brain,
        href: "/ki-beratung",
        gradient: "from-cyan-500/10 to-blue-500/10",
        borderColor: "border-cyan-500/20 hover:border-cyan-500/40",
    },
    {
        slug: "digitale-zwillinge",
        title: "Digitale Zwillinge",
        shortTitle: "Digitale Zwillinge",
        description: "Virtuelle Abbilder Ihrer physischen Assets für Simulation und Optimierung.",
        icon: Globe,
        href: "/digitale-zwillinge",
        gradient: "from-emerald-500/10 to-teal-500/10",
        borderColor: "border-emerald-500/20 hover:border-emerald-500/40",
    },
    {
        slug: "ki-erklaert",
        title: "KI Erklärt",
        shortTitle: "KI Erklärt",
        description: "Verständliche Erklärungen rund um künstliche Intelligenz und ihre Anwendungen.",
        icon: GraduationCap,
        href: "/ki-erklaert",
        gradient: "from-violet-500/10 to-purple-500/10",
        borderColor: "border-violet-500/20 hover:border-violet-500/40",
    },
    {
        slug: "mimi",
        title: "MIMI – Souveräne KI",
        shortTitle: "MIMI Agent",
        description: "Erleben Sie die Zukunft: Ein vollständiger KI-Agent, der 100% lokal in Ihrem Browser läuft.",
        icon: Sparkles,
        href: "/mimi",
        gradient: "from-amber-500/10 to-orange-500/10",
        borderColor: "border-amber-500/20 hover:border-amber-500/40",
    },
    {
        slug: "contact",
        title: "Kontakt & Beratung",
        shortTitle: "Kontakt",
        description: "Lassen Sie uns gemeinsam Ihre KI-Strategie entwickeln. Kostenlose Erstberatung.",
        icon: MessageSquare,
        href: "/contact",
        gradient: "from-rose-500/10 to-pink-500/10",
        borderColor: "border-rose-500/20 hover:border-rose-500/40",
    },
    {
        slug: "about",
        title: "Über MIMI Tech AI",
        shortTitle: "Über uns",
        description: "Erfahren Sie mehr über unsere Mission, Vision und das Team hinter MIMI Tech AI.",
        icon: Cpu,
        href: "/about",
        gradient: "from-sky-500/10 to-indigo-500/10",
        borderColor: "border-sky-500/20 hover:border-sky-500/40",
    },
];

// --- Recommendation Mapping ---

const serviceRecommendations: Record<string, string[]> = {
    "ki-beratung": ["digitale-zwillinge", "mimi", "contact"],
    "digitale-zwillinge": ["ki-beratung", "ki-erklaert", "contact"],
    "ki-erklaert": ["ki-beratung", "mimi", "contact"],
    "mimi": ["ki-beratung", "ki-erklaert", "contact"],
    "about": ["ki-beratung", "mimi", "contact"],
    "contact": ["ki-beratung", "digitale-zwillinge", "mimi"],
};

export function getRelatedServices(currentSlug: string, maxCount = 3): ServiceEntry[] {
    const recommended = serviceRecommendations[currentSlug] || [];
    return recommended
        .map((slug) => allServices.find((s) => s.slug === slug))
        .filter((s): s is ServiceEntry => !!s)
        .slice(0, maxCount);
}

// --- Component ---

interface RelatedServicesProps {
    currentSlug: string;
    title?: string;
    subtitle?: string;
    maxCount?: number;
    className?: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
};

export function RelatedServices({
    currentSlug,
    title = "Das könnte Sie auch interessieren",
    subtitle,
    maxCount = 3,
    className = "",
}: RelatedServicesProps) {
    const related = getRelatedServices(currentSlug, maxCount);

    if (related.length === 0) return null;

    return (
        <section className={`py-16 md:py-20 px-4 sm:px-6 lg:px-8 ${className}`}>
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {subtitle}
                        </p>
                    )}
                </motion.div>

                {/* Service Cards */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-60px" }}
                >
                    {related.map((service) => (
                        <motion.div key={service.slug} variants={cardVariants}>
                            <Link href={service.href} className="block h-full group">
                                <Card
                                    className={`
                                        relative h-full overflow-hidden transition-all duration-300
                                        bg-gradient-to-br ${service.gradient}
                                        ${service.borderColor}
                                        hover:shadow-lg hover:shadow-primary/5
                                        group-hover:-translate-y-1
                                    `}
                                >
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                                <service.icon className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
                                        </div>
                                        <CardTitle className="text-lg font-bold group-hover:text-white transition-colors">
                                            {service.shortTitle}
                                        </CardTitle>
                                        <CardDescription className="text-sm leading-relaxed">
                                            {service.description}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-10"
                >
                    <Button variant="ghost" asChild className="text-white/50 hover:text-white gap-2">
                        <Link href="/contact">
                            Alle Leistungen entdecken
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}
