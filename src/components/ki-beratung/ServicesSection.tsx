"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { sectionFadeUp, staggerContainer, itemFadeUp } from "@/lib/motion";

interface ServiceCardProps {
  title: string;
  description: string;
  features: string[];
  href: string;
}

function ServiceCard({ title, description, features, href }: ServiceCardProps) {
  return (
    <motion.div
      className="bg-bg-elevated border border-border-subtle rounded-xl p-6 md:p-8 hover:border-brand-cyan transition-all duration-300 hover:shadow-[0_0_32px_rgba(0,230,255,0.3)]"
      variants={itemFadeUp}
    >
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-text-secondary mb-6">{description}</p>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="text-brand-cyan flex-shrink-0 mt-0.5" size={20} />
            <span className="text-text-primary">{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className="inline-flex items-center gap-2 text-brand-cyan hover:gap-3 transition-all duration-300 font-medium"
      >
        Mehr erfahren
        <ArrowRight size={18} />
      </Link>
    </motion.div>
  );
}

export default function ServicesSection() {
  return (
    <motion.section
      className="max-w-7xl mx-auto mb-20 md:mb-32"
      variants={sectionFadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <h2 className="text-4xl md:text-5xl font-bold text-center mb-10 md:mb-16">
        Unsere <span className="text-brand-cyan">Leistungen</span>
      </h2>

      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        variants={staggerContainer}
      >
        <ServiceCard
          title="Für Unternehmen"
          description="Umfassende KI-Transformation für Ihr Unternehmen"
          features={[
            "KI-Strategie & Roadmap-Entwicklung",
            "Prozessanalyse & Optimierung",
            "Mitarbeiter-Schulungen & Workshops",
            "Tool-Auswahl & Integration",
            "Change Management & Begleitung",
          ]}
          href="/ki-beratung/unternehmen"
        />

        <ServiceCard
          title="Für Solo-Selbständige"
          description="Praktische KI-Tools für mehr Produktivität"
          features={[
            "KI-Tool-Beratung für Ihr Business",
            "Workflow-Automatisierung",
            "Kosteneffiziente Lösungen",
            "Praxisnahe Einführung",
            "Individuelles Coaching",
          ]}
          href="/ki-beratung/selbstaendige"
        />
      </motion.div>
    </motion.section>
  );
}
