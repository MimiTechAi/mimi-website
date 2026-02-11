"use client";

import { CheckCircle2, Target, Zap, Shield } from "lucide-react";
import { motion } from "framer-motion";
import SpotlightCard from "@/components/SpotlightCard";
import KineticText from "@/components/KineticText";

const promises = [
    {
        id: 1,
        icon: Target,
        title: "Maßgeschneiderte Lösungen",
        description: "Wir entwickeln KI- und Digital-Twin-Lösungen, die exakt auf Ihre spezifischen Geschäftsanforderungen zugeschnitten sind. Keine Standardprodukte, sondern individuelle Innovation.",
        benefits: ["Individuelle Beratung", "Branchenspezifische Expertise", "Skalierbare Architektur"]
    },
    {
        id: 2,
        icon: Zap,
        title: "Modernste Technologie",
        description: "Wir nutzen neueste KI-Modelle, digitale Zwillinge und bewährte Frameworks, um Ihnen einen technologischen Vorsprung zu verschaffen.",
        benefits: ["State-of-the-Art AI", "Cloud & On-Premise", "Zukunftssicher"]
    },
    {
        id: 3,
        icon: Shield,
        title: "Verlässliche Partnerschaft",
        description: "Von der ersten Beratung bis zur langfristigen Betreuung – wir begleiten Sie auf Ihrem Weg zur digitalen Transformation mit transparenter Kommunikation.",
        benefits: ["Transparente Prozesse", "Kontinuierlicher Support", "Messbare Ergebnisse"]
    }
];

export default function PromiseSection() {
    return (
        <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10 md:mb-20">
                    <KineticText className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight text-white">
                        UNSER VERSPRECHEN
                    </KineticText>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
                        Was Sie von einer Zusammenarbeit mit MiMi Tech AI erwarten können
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {promises.map((promise, index) => {
                        const Icon = promise.icon;
                        return (
                            <SpotlightCard key={promise.id} className="p-6 md:p-8 flex flex-col h-full group">
                                <div className="mb-6">
                                    <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:border-brand-cyan/50 transition-colors">
                                        <Icon className="text-brand-cyan" size={28} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-4">{promise.title}</h3>
                                    <p className="text-gray-400 leading-relaxed mb-6">
                                        {promise.description}
                                    </p>
                                </div>

                                <div className="mt-auto space-y-3 pt-6 border-t border-white/5">
                                    {promise.benefits.map((benefit, idx) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <CheckCircle2 className="text-brand-cyan flex-shrink-0" size={18} />
                                            <span className="text-sm text-gray-300">{benefit}</span>
                                        </div>
                                    ))}
                                </div>
                            </SpotlightCard>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

