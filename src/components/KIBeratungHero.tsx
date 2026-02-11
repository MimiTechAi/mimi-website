"use client";

import { Brain, ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import { PrimaryButtonLink } from "@/components/ui/PrimaryButtonLink";
import { sectionFadeUp, staggerContainer, itemFadeUp } from "@/lib/motion";

export default function KIBeratungHero() {
  return (
    <motion.section
      className="max-w-5xl mx-auto text-center mb-24"
      variants={sectionFadeUp}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={staggerContainer}>
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-sm text-brand-cyan mb-8"
          variants={itemFadeUp}
        >
          <Brain size={16} />
          <span>KI-Beratung</span>
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6"
          variants={itemFadeUp}
        >
          Weniger manuelle Arbeit,
          <br />
          mehr Zeit fürs Wesentliche – mit <span className="text-brand-cyan">KI</span>.
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-text-tertiary max-w-2xl mx-auto mb-2"
          variants={itemFadeUp}
        >
          Für Unternehmen &amp; Solo-Selbständige, die KI nicht als Hype, sondern als Werkzeug nutzen wollen.
        </motion.p>

        <motion.p
          className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed mb-8"
          variants={itemFadeUp}
        >
          In nur 2&nbsp;Wochen entwickeln wir mit Ihnen eine individuelle KI-Roadmap mit klaren Prioritäten und
          konkreten Automatisierungs-Ideen für Ihr Business.
        </motion.p>
      </motion.div>

      <motion.div
        className="grid gap-4 sm:grid-cols-3 text-left text-base md:text-lg text-text-secondary max-w-4xl mx-auto mb-12"
        variants={staggerContainer}
      >
        <motion.div className="flex items-start gap-3" variants={itemFadeUp}>
          <Check className="mt-1 text-brand-cyan flex-shrink-0" size={20} />
          <p>Reduzieren Sie manuelle, wiederkehrende Arbeit um viele Stunden pro Monat.</p>
        </motion.div>
        <motion.div className="flex items-start gap-3" variants={itemFadeUp}>
          <Check className="mt-1 text-brand-cyan flex-shrink-0" size={20} />
          <p>Schnellere Angebots- und Dokumentenerstellung mit passgenauen KI-Workflows.</p>
        </motion.div>
        <motion.div className="flex items-start gap-3" variants={itemFadeUp}>
          <Check className="mt-1 text-brand-cyan flex-shrink-0" size={20} />
          <p>Bessere Entscheidungen durch nutzbare, zusammengeführte Daten statt reinem Bauchgefühl.</p>
        </motion.div>
      </motion.div>

      <motion.div variants={itemFadeUp}>
        <PrimaryButtonLink href="/contact">
          Kostenlose Erstberatung
          <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
        </PrimaryButtonLink>
      </motion.div>
    </motion.section>
  );
}
