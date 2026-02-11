"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SpotlightCard from "@/components/SpotlightCard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Brain, Lightbulb, Zap, Cpu, Network, ArrowRight, CheckCircle, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import InteractiveDemo from "@/components/InteractiveDemo";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { RelatedServices } from "@/components/RelatedServices";

// Motion component aliases (motion already imported above)
const MotionDiv = motion.div;
const MotionSection = motion.section;
const MotionH1 = motion.h1;
const MotionH2 = motion.h2;
const MotionP = motion.p;
const MotionUl = motion.ul;
const MotionLi = motion.li;

export default function KiErklaertPage() {
  const basics = [
    {
      icon: Brain,
      title: "Was ist KI?",
      description: "Computerprogramme, die menschenähnlich denken und lernen können. Sie helfen bei der Lösung von Aufgaben.",
    },
    {
      icon: Lightbulb,
      title: "Machine Learning",
      description: "Ein Bereich der KI, bei dem Systeme aus Beispielen lernen, ohne alles genau vorgezeigt zu bekommen.",
    },
    {
      icon: Zap,
      title: "Neuronale Netzwerke",
      description: "Technik, die vom menschlichen Gehirn inspiriert ist. Sie verarbeitet Informationen in Schichten.",
    },
  ];

  const applications = [
    {
      title: "Bilderkennung",
      description: "KI erkennt Dinge auf Fotos - z.B. in der Qualitätssicherung oder medizinischen Untersuchungen.",
    },
    {
      title: "Sprachverarbeitung",
      description: "Von Sprachassistenten bis zur Übersetzung - KI versteht und schreibt Texte wie ein Mensch.",
    },
    {
      title: "Vorhersagen",
      description: "KI schaut sich Muster an, um die Zukunft vorherzusagen - z.B. wann etwas kaputt geht.",
    },
    {
      title: "Automatisierung",
      description: "KI übernimmt sich wiederholende Aufgaben, vom Ausfüllen von Formularen bis zum Kundenservice.",
    },
  ];

  const benefits = [
    "Arbeit schneller erledigen",
    "Bessere Entscheidungen treffen",
    "Langfristig Geld sparen",
    "Neue Produkte entwickeln",
    "Vorteile gegenüber Mitbewerbern",
    "Kunden besser verstehen",
  ];

  const nvidiaBenefits = [
    {
      title: "Höchste Leistung",
      description: "Mit NVIDIA-GPUs rechnen KI-Systeme viel schneller.",
    },
    {
      title: "Moderne Technologie",
      description: "Zugang zu den neuesten KI-Tools und Programmen von NVIDIA.",
    },
    {
      title: "Skalierbarkeit",
      description: "Lösungen passen sich Ihren Anforderungen an.",
    },
    {
      title: "Zuverlässigkeit",
      description: "Unterstützung durch bewährte Unternehmens-Technologie von NVIDIA.",
    },
  ];

  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-brand-cyan/30">
      <Navigation />

      <Breadcrumb items={[{ label: "KI erklärt", href: "/ki-erklaert" }]} />

      {/* Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-0 left-1/4 w-96 h-96 bg-nvidia-green/20 rounded-full blur-[100px] ${prefersReducedMotion ? "" : "animate-pulse-slow"}`}
        />
        <div
          className={`absolute bottom-0 right-1/4 w-96 h-96 bg-brand-cyan/20 rounded-full blur-[100px] ${prefersReducedMotion ? "" : "animate-pulse-slow delay-1000"}`}
        />
      </div>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              className="flex items-center justify-center gap-2 mb-6"
              initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            >
              <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2">
                <Brain className="text-brand-cyan" size={16} />
                <span className="text-sm font-medium text-gray-300">Einfach erklärt</span>
              </div>
            </motion.div>
            <MotionH1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-[1.1] tracking-tight text-glow"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            >
              Künstliche <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-nvidia-green">Intelligenz</span> einfach erklärt
            </MotionH1>
            <MotionP
              className="text-xl sm:text-2xl md:text-3xl text-gray-300 mb-8 font-light leading-relaxed"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            >
              Verstehen Sie die Grundlagen von KI - ohne Vorkenntnisse.
              Wir erklären Ihnen in einfachen Worten, was KI ist und wie sie Ihr Unternehmen unterstützen kann.
            </MotionP>
          </motion.div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <MotionSection className="py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <MotionH2
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight text-white"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              So funktioniert KI
            </MotionH2>
            <MotionP
              className="text-xl sm:text-2xl md:text-3xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            >
              Erfahren Sie interaktiv, wie Künstliche Intelligenz lernt und arbeitet
            </MotionP>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="glass-panel p-8 rounded-2xl"
          >
            <InteractiveDemo />
          </motion.div>
        </div>
      </MotionSection>

      {/* Basics Section */}
      <MotionSection className="py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <MotionH2
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight text-white"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              Die Grundlagen von KI
            </MotionH2>
            <MotionP
              className="text-xl sm:text-2xl md:text-3xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            >
              Alles, was Sie über Künstliche Intelligenz wissen müssen
            </MotionP>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            {basics.map((basic, index) => (
              <motion.div
                key={basic.title}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                }}
                whileHover={{
                  y: !prefersReducedMotion ? -10 : 0,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
              >
                <div className="glass-panel p-8 rounded-2xl h-full text-center hover:border-brand-cyan/30 transition-all duration-300 group">
                  <motion.div
                    className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-300"
                  >
                    <basic.icon className="text-brand-cyan" size={32} />
                  </motion.div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">{basic.title}</h3>
                  <p className="text-lg md:text-xl leading-relaxed text-gray-300">
                    {basic.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </MotionSection>

      {/* Applications Section */}
      <MotionSection className="py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              className="flex items-center justify-center gap-2 mb-6"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="p-2 rounded-full bg-white/5 border border-white/10">
                <Zap className="text-nvidia-green" size={24} />
              </div>
            </motion.div>
            <MotionH2
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight text-white"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            >
              Wo KI bereits eingesetzt wird
            </MotionH2>
            <MotionP
              className="text-xl sm:text-2xl md:text-3xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            >
              KI ist bereits heute in vielen Bereichen unseres Alltags präsent
            </MotionP>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08 }
              }
            }}
          >
            {applications.map((app, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                }}
                whileHover={{
                  y: !prefersReducedMotion ? -8 : 0,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
              >
                <div className="glass-panel p-6 rounded-xl h-full hover:bg-white/10 transition-colors duration-300">
                  <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">{app.title}</h3>
                  <p className="text-base md:text-lg leading-relaxed text-gray-300">
                    {app.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </MotionSection>

      {/* Benefits Section */}
      <MotionSection className="py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <motion.div
                className="text-center lg:text-left mb-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <MotionH2
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight text-white"
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  Warum <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-nvidia-green">KI</span> für Ihr Unternehmen?
                </MotionH2>
                <MotionP
                  className="text-xl sm:text-2xl text-gray-300 font-light leading-relaxed"
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                >
                  Die Vorteile von Künstlicher Intelligenz für Ihr Business
                </MotionP>
              </motion.div>

              <MotionUl
                className="space-y-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 }
                  }
                }}
              >
                {benefits.map((benefit, index) => (
                  <MotionLi
                    key={index}
                    className="flex items-start gap-3"
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } }
                    }}
                    whileHover={{
                      x: !prefersReducedMotion ? 5 : 0,
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                  >
                    <CheckCircle className="text-brand-cyan flex-shrink-0 mt-1" size={24} />
                    <span className="text-lg text-gray-300">{benefit}</span>
                  </MotionLi>
                ))}
              </MotionUl>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            >
              <div className="glass-panel p-8 rounded-2xl h-full border border-brand-cyan/20 bg-brand-cyan/5">
                <motion.div
                  className="w-16 h-16 rounded-full bg-brand-cyan/10 flex items-center justify-center mx-auto mb-6 border border-brand-cyan/20"
                  whileHover={{
                    scale: !prefersReducedMotion ? 1.1 : 1,
                    transition: { duration: 0.3, ease: "easeOut" }
                  }}
                >
                  <Lightbulb className="text-brand-cyan" size={32} />
                </motion.div>
                <h3 className="text-2xl md:text-3xl font-bold text-center mb-4 text-white">Ihre KI-Strategie</h3>
                <p className="text-lg md:text-xl text-center leading-relaxed text-gray-300 mb-8">
                  Jedes Unternehmen ist anders. Wir entwickeln maßgeschneiderte KI-Lösungen,
                  die genau zu Ihren Anforderungen passen.
                </p>
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97, y: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <Button asChild size="lg" className="w-full bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-brand-cyan/90 hover:to-brand-blue/90 text-white border-0 shadow-lg shadow-brand-cyan/20">
                    <Link href="/contact">
                      Jetzt Beratung anfragen
                      <ArrowRight className="ml-2" size={20} />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </MotionSection>

      {/* NVIDIA Technology Section */}
      <MotionSection className="py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              className="flex items-center justify-center gap-2 mb-6"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="p-2 rounded-full bg-white/5 border border-white/10">
                <Cpu className="text-brand-cyan" size={24} />
              </div>
            </motion.div>
            <MotionH2
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight text-white"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            >
              Moderne KI durch <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-nvidia-green">NVIDIA</span>
            </MotionH2>
            <MotionP
              className="text-xl sm:text-2xl md:text-3xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            >
              Als Mitglied im NVIDIA Connect Programm nutzen wir modernste KI-Technologie
            </MotionP>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08 }
              }
            }}
          >
            {nvidiaBenefits.map((benefit, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                }}
                whileHover={{
                  y: !prefersReducedMotion ? -8 : 0,
                  transition: { duration: 0.3, ease: "easeOut" }
                }}
              >
                <div className="glass-panel p-6 rounded-xl h-full hover:bg-white/10 transition-colors duration-300">
                  <h3 className="text-xl md:text-2xl font-bold mb-3 text-white">{benefit.title}</h3>
                  <p className="text-base md:text-lg leading-relaxed text-gray-300">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="glass-panel p-8 rounded-2xl max-w-3xl mx-auto border border-brand-cyan/20 bg-brand-cyan/5">
              <h3 className="text-2xl md:text-3xl font-bold mb-3 text-white">Vorteile der NVIDIA Partnerschaft</h3>
              <p className="text-lg md:text-xl leading-relaxed text-gray-300 mb-8">
                Als Mitglied im NVIDIA Connect Programm haben wir Zugang zu:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <motion.li
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                >
                  <CheckCircle className="text-brand-cyan flex-shrink-0" size={20} />
                  <span className="text-gray-300">Neuesten KI-Technologien und SDKs</span>
                </motion.li>
                <motion.li
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                >
                  <CheckCircle className="text-brand-cyan flex-shrink-0" size={20} />
                  <span className="text-gray-300">Exklusiven technischen Schulungen</span>
                </motion.li>
                <motion.li
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                >
                  <CheckCircle className="text-brand-cyan flex-shrink-0" size={20} />
                  <span className="text-gray-300">Frühem Zugang zu neuen Lösungen</span>
                </motion.li>
                <motion.li
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                >
                  <CheckCircle className="text-brand-cyan flex-shrink-0" size={20} />
                  <span className="text-gray-300">Technischer Unterstützung durch NVIDIA-Experten</span>
                </motion.li>
              </ul>
            </div>
          </motion.div>
        </div>
      </MotionSection>

      {/* Myths Section */}
      <MotionSection className="py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div
              className="flex items-center justify-center gap-2 mb-6"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="p-2 rounded-full bg-white/5 border border-white/10">
                <BookOpen className="text-nvidia-green" size={24} />
              </div>
            </motion.div>
            <MotionH2
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight text-white"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            >
              Häufige <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-nvidia-green">KI-Mythen</span>
            </MotionH2>
            <MotionP
              className="text-xl sm:text-2xl md:text-3xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            >
              Klären wir einige Missverständnisse über Künstliche Intelligenz
            </MotionP>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
              }}
              whileHover={{
                y: !prefersReducedMotion ? -8 : 0,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
            >
              <div className="glass-panel p-8 rounded-2xl h-full border-l-4 border-l-red-500/50">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-red-400">Mythos</h3>
                <p className="text-lg md:text-xl leading-relaxed text-gray-300 mb-4 font-medium">
                  KI wird alle Arbeitsplätze ersetzen
                </p>
                <p className="text-gray-300">
                  Tatsache: KI ergänzt menschliche Fähigkeiten und übernimmt repetitive Aufgaben.
                  Neue Arbeitsfelder entstehen, und die Rolle der Menschen verlagert sich auf kreative
                  und strategische Tätigkeiten.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
              }}
              whileHover={{
                y: !prefersReducedMotion ? -8 : 0,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
            >
              <div className="glass-panel p-8 rounded-2xl h-full border-l-4 border-l-green-500/50">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-green-400">Fakt</h3>
                <p className="text-lg md:text-xl leading-relaxed text-gray-300 mb-4 font-medium">
                  KI benötigt menschliche Expertise
                </p>
                <p className="text-gray-300">
                  KI-Systeme sind nur so gut wie die Daten und menschliche Expertise, mit der sie trainiert werden.
                  Unternehmen benötigen weiterhin qualifizierte Mitarbeiter, um KI effektiv einzusetzen.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
              }}
              whileHover={{
                y: !prefersReducedMotion ? -8 : 0,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
            >
              <div className="glass-panel p-8 rounded-2xl h-full border-l-4 border-l-red-500/50">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-red-400">Mythos</h3>
                <p className="text-lg md:text-xl leading-relaxed text-gray-300 mb-4 font-medium">
                  KI ist zu teuer für kleine Unternehmen
                </p>
                <p className="text-gray-300">
                  Tatsache: Cloud-basierte KI-Dienste machen KI für Unternehmen jeder Größe erschwinglich.
                  Mit maßgeschneiderter Beratung finden wir Lösungen, die zu Ihrem Budget passen.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
              }}
              whileHover={{
                y: !prefersReducedMotion ? -8 : 0,
                transition: { duration: 0.3, ease: "easeOut" }
              }}
            >
              <div className="glass-panel p-8 rounded-2xl h-full border-l-4 border-l-green-500/50">
                <h3 className="text-2xl md:text-3xl font-bold mb-4 text-green-400">Fakt</h3>
                <p className="text-lg md:text-xl leading-relaxed text-gray-300 mb-4 font-medium">
                  KI ist bereits in vielen Tools integriert
                </p>
                <p className="text-gray-300">
                  Viele Tools, die Sie bereits nutzen (E-Mails, Kalender, Suchmaschinen), verwenden KI.
                  Die Technologie ist bereits Teil unseres Alltags.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </MotionSection>

      {/* CTA Section */}
      <MotionSection className="py-20 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="glass-panel p-6 md:p-12 rounded-3xl text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 via-transparent to-nvidia-green/10 opacity-50" />
              <div className="relative z-10">
                <Brain className="text-white mb-6 mx-auto" size={48} />
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 text-white">
                  Bereit für Ihre <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-nvidia-green">KI-Reise?</span>
                </h2>
                <p className="text-lg md:text-xl leading-relaxed mb-8 text-gray-300 max-w-2xl mx-auto">
                  Lassen Sie uns gemeinsam herausfinden, wie KI Ihr Unternehmen voranbringen kann.
                </p>
                <motion.div
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97, y: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <Button asChild size="lg" className="bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-brand-cyan/90 hover:to-brand-blue/90 text-white border-0 shadow-lg shadow-brand-cyan/20 px-8 py-6 text-lg">
                    <Link href="/contact">
                      Jetzt Beratung anfragen
                      <ArrowRight className="ml-2" size={24} />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </MotionSection>

      <RelatedServices currentSlug="ki-erklaert" />
      <Footer />
    </div>
  );
}