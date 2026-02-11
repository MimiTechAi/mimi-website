"use client";

import { motion } from "framer-motion";
import { sectionFadeUp, staggerContainer, itemFadeUp } from "@/lib/motion";

export default function ForWhomSection() {
  return (
    <motion.section
      className="max-w-5xl mx-auto mb-24 text-center"
      variants={sectionFadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <h2 className="text-2xl md:text-3xl font-semibold mb-6">
        Für wen ist unsere <span className="text-brand-cyan">KI-Beratung</span> ideal?
      </h2>
      <p className="text-text-secondary max-w-3xl mx-auto mb-10">
        Wir arbeiten mit Unternehmen und Solo-Selbständigen, die KI nicht als kurzfristigen Hype,
        sondern als konkretes Werkzeug für messbare Ergebnisse einsetzen wollen.
      </p>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-6 text-left"
        variants={staggerContainer}
      >
        <motion.div
          className="bg-bg-elevated border border-border-subtle rounded-xl p-6"
          variants={itemFadeUp}
        >
          <h3 className="text-xl font-semibold text-white mb-4">Unternehmen</h3>
          <ul className="space-y-2 text-text-secondary">
            <li>Viele manuelle, wiederkehrende Prozesse bremsen Teams im Tagesgeschäft</li>
            <li>Daten sind vorhanden, werden aber kaum für Automatisierung und Entscheidungen genutzt</li>
            <li>Es gibt erste KI-Ideen oder Pilotprojekte, aber keine klare Gesamtstrategie</li>
          </ul>
        </motion.div>
        <motion.div
          className="bg-bg-elevated border border-border-subtle rounded-xl p-6"
          variants={itemFadeUp}
        >
          <h3 className="text-xl font-semibold text-white mb-4">Solo-Selbständige</h3>
          <ul className="space-y-2 text-text-secondary">
            <li>Sie verbringen zu viele Stunden pro Woche mit Administration, Angeboten und E-Mails</li>
            <li>Sie möchten Content, Marketing und Social Media mit KI deutlich schneller erstellen</li>
            <li>Sie sind unsicher, welche KI-Tools wirklich zu Ihrem Business und Budget passen</li>
          </ul>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
