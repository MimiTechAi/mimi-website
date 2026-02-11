"use client";

import Link from "next/link";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import OptimizedImage from "@/components/OptimizedImage";
import { PrimaryButtonLink } from "@/components/ui/PrimaryButtonLink";
import Image from "next/image";
import React, { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Shield, Brain, FileText, Sparkles } from "lucide-react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

interface HomeLandingProps {
  structuredData: any;
}

export default function HomeLanding({ structuredData }: HomeLandingProps) {
  const servicesRef = useRef<HTMLDivElement | null>(null);
  const isServicesInView = useInView(servicesRef, { once: true, margin: "-100px" });
  const prefersReducedMotion = useReducedMotion();

  // Apple-style scroll-driven parallax for neural network background
  const { scrollYProgress } = useScroll();
  const bgScale = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [1.2, 1.1, 1.05, 1.0, 1.1]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [0.3, 0.15, 0.08, 0.05, 0.15]);
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '-20%']);
  const bgRotate = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [0, 1, -1, 0, 1]);
  const bgHue = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [0, 10, 20, 30, 0]);
  const bgFilter = useTransform(bgHue, (v) => `hue-rotate(${v}deg) saturate(1.2)`);

  return (
    <div className="min-h-screen flex flex-col bg-void text-white selection:bg-brand-cyan/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Apple-style scroll-driven parallax background */}
      <motion.div
        className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
        style={prefersReducedMotion ? { opacity: 0.1 } : {
          scale: bgScale,
          opacity: bgOpacity,
          y: bgY,
          rotate: bgRotate,
        }}
      >
        <motion.div
          className="absolute inset-0 neural-pulse"
          style={prefersReducedMotion ? {} : {
            filter: bgFilter,
          }}
        >
          <Image
            src="/images/hero-neural-network.png"
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
            aria-hidden="true"
          />
        </motion.div>
        {/* Gradient overlay for smooth blending into content */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-void/50 to-void" />
      </motion.div>

      {/* Keyframe for subtle pulse glow */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes neuralPulse {
          0%, 100% { filter: brightness(1) blur(0px); }
          50% { filter: brightness(1.15) blur(1px); }
        }
        .neural-pulse {
          animation: neuralPulse 4s ease-in-out infinite;
          will-change: transform, opacity, filter;
        }
        @media (prefers-reduced-motion: reduce) {
          .neural-pulse { animation: none; }
        }
      `}} />

      <Navigation />

      <main className="flex-1 relative z-[1]">
        {/* Hero Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-32 overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(hsl(220, 15%, 20%) 1px, transparent 1px), linear-gradient(90deg, hsl(220, 15%, 20%) 1px, transparent 1px)",
              backgroundSize: "50px 50px",
            }}
          />

          <div className="w-full max-w-6xl mx-auto text-center space-y-16 relative z-10">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 40 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={
                prefersReducedMotion ? undefined : { duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }
              }
              className="space-y-8"
            >
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-tight">
                <span className="block text-white mb-4">KI-Beratung &amp; Digitale Zwillinge</span>
                <span className="block text-brand-cyan">aus dem Schwarzwald</span>
                <span className="block text-white/80 text-3xl sm:text-4xl md:text-5xl lg:text-6xl mt-6 font-semibold">
                  die Ihre Prozesse spürbar effizienter machen.
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
                Wir helfen Unternehmen, Solo-Selbständigen und Städten, mit KI und digitalen Zwillingen Prozesse zu
                automatisieren, Entscheidungen zu verbessern und Projekte planbarer zu machen.
              </p>

              <div className="flex justify-center mt-4">
                <div className="glass-panel inline-flex items-center gap-3 px-4 py-3 rounded-full border border-white/10 bg-white/5 text-xs sm:text-sm text-gray-300">
                  <div className="relative h-10 w-40 rounded-md bg-white/90 px-3 py-1 overflow-hidden shadow-sm">
                    <Image
                      src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/nvidia-logo-horz-2-1760533860052.png"
                      alt="NVIDIA Logo"
                      fill
                      className="object-contain"
                      priority
                      sizes="160px"
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="font-semibold text-white">Mitglied im NVIDIA Connect Programm</span>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-gray-300">
                        Für KI-Lösungen auf Basis moderner NVIDIA-Technologien.
                      </span>
                      <Link
                        href="https://www.nvidia.com/en-us/programs/isv/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-nvidia-green hover:text-brand-nvidia-green-hover underline decoration-brand-nvidia-green/40 underline-offset-4 font-semibold"
                      >
                        Mehr über NVIDIA Connect
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? undefined : { duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <PrimaryButtonLink href="/contact">
                Kostenloses Erstgespräch buchen
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </PrimaryButtonLink>

              <Link
                href="#services"
                className="px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center gap-2 border-2 border-brand-cyan text-white hover:bg-brand-cyan/10 transition-all duration-300 hover:shadow-[0_0_24px_rgba(0,230,255,0.3)]"
              >
                In 3 Minuten verstehen, was wir tun
              </Link>
            </motion.div>

            <motion.div
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 0 }}
              animate={prefersReducedMotion ? undefined : { opacity: [0, 0.7, 0.5], y: [0, 6, 0] }}
              transition={
                prefersReducedMotion
                  ? undefined
                  : { delay: 1, duration: 1.8, repeat: Infinity, ease: "easeInOut" }
              }
              className="mt-16 flex flex-col items-center gap-2"
            >
              <span className="text-xs uppercase tracking-widest text-gray-500">Entdecken</span>
              <ArrowRight className="rotate-90 text-brand-cyan" size={16} />
            </motion.div>
          </div>
        </section>

        {/* Für wen wir arbeiten */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Für wen wir arbeiten</h2>
              <p className="mt-4 text-lg text-text-secondary max-w-3xl mx-auto">
                Drei Gruppen, ein Ziel: weniger operative Reibung und klarere Entscheidungen mit KI und digitalen
                Zwillingen.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-bg-elevated border border-border-subtle rounded-xl p-6 text-left">
                <h3 className="text-xl font-semibold mb-4">Unternehmen</h3>
                <ul className="space-y-2 text-text-secondary">
                  <li>Zu viele manuelle Reports und Abstimmungen.</li>
                  <li>Daten sind vorhanden, werden aber kaum genutzt.</li>
                  <li>Entscheidungen basieren eher auf Bauchgefühl als auf Daten.</li>
                </ul>
                <p className="mt-4 text-text-primary font-medium">
                  Weniger manuelle Reports, mehr Zeit für Entscheidungen.
                </p>
              </div>
              <div className="bg-bg-elevated border border-border-subtle rounded-xl p-6 text-left">
                <h3 className="text-xl font-semibold mb-4">Solo-Selbständige</h3>
                <ul className="space-y-2 text-text-secondary">
                  <li>Zu viel Zeit für Administration, Angebote und E-Mails.</li>
                  <li>Marketing und Akquise sind nicht skalierbar.</li>
                  <li>Unsicherheit, welche KI-Tools wirklich sinnvoll sind.</li>
                </ul>
                <p className="mt-4 text-text-primary font-medium">Mehr Aufträge ohne mehr Stunden.</p>
              </div>
              <div className="bg-bg-elevated border border-border-subtle rounded-xl p-6 text-left">
                <h3 className="text-xl font-semibold mb-4">Städte &amp; Kommunen</h3>
                <ul className="space-y-2 text-text-secondary">
                  <li>Langsame, manuelle Abstimmungsprozesse.</li>
                  <li>Daten liegen in Silos und sind schwer nutzbar.</li>
                  <li>Planung von Bau- und Infrastrukturprojekten ist schwer vergleichbar.</li>
                </ul>
                <p className="mt-4 text-text-primary font-medium">
                  Planbarere Projekte und transparentere Entscheidungen.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Was wir liefern */}
        <section id="services" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8" ref={servicesRef}>
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isServicesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-center mb-10 md:mb-20"
            >
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
                Was wir <span className="text-brand-cyan">liefern</span>
              </h2>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                Drei Kernleistungen, die sich modular kombinieren lassen – von der ersten Idee bis zum laufenden
                System.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate={isServicesInView ? "visible" : "hidden"}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.2,
                  },
                },
              }}
            >
              <ServiceCard
                title="KI-Strategie &amp; Beratung"
                description="Wir identifizieren gemeinsam die 2-3 sinnvollsten KI-Use-Cases und entwickeln eine klare Roadmap mit messbaren Zielen."
                href="/ki-beratung"
                imageSrc="/images/Bild.jpg"
                imageAlt="Strategische KI-Beratung am Bildschirm"
              />

              <ServiceCard
                title="Prozess-Automatisierung mit KI"
                description="Wir automatisieren wiederkehrende Aufgaben wie Dokumente, Anfragen und Reporting mit KI-gestützten Workflows in Ihren bestehenden Tools."
                href="/ki-beratung#automatisierung"
                imageSrc="/images/digital-twin-factory.png"
                imageAlt="Automatisierte Workflows mit KI"
              />

              <ServiceCard
                title="Digitale Zwillinge (Bau / Urban / Industrie)"
                description="Wir bauen digitale Zwillinge, die Daten aus Planung, Betrieb und Umfeld bündeln, um Szenarien zu simulieren und Risiken früh zu erkennen."
                href="/digitale-zwillinge/urban"
                imageSrc="/images/digital-twins-city.png"
                imageAlt="Digitale Zwillinge für Stadt, Bau und Industrie"
              />
            </motion.div>
          </div>
        </section>

        {/* Wie wir arbeiten */}
        <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-bg-surface">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
              >
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">
                  Wie wir <span className="text-brand-cyan">arbeiten</span>
                </h2>

                <p className="text-xl text-text-secondary leading-relaxed">
                  Ein klarer, transparenter Prozess – von der ersten Idee bis zum laufenden System.
                </p>

                <ul className="space-y-4">
                  <TechFeature text="Analyse – Wir verstehen Ihre Prozesse, Datenquellen und Ziele und definieren, was ein erster Erfolg für Sie bedeutet." />
                  <TechFeature text="Prototyp – Wir entwickeln einen fokussierten Proof of Concept mit klar definierten Erfolgskriterien." />
                  <TechFeature text="Rollout – Wir integrieren die Lösung in Ihre bestehenden Tools und Teams." />
                  <TechFeature text="Begleitung – Schulung, Monitoring und kontinuierliche Optimierung." />
                </ul>

                <PrimaryButtonLink href="/contact" className="mt-8">
                  Kostenloses Erstgespräch buchen
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </PrimaryButtonLink>

                <div className="mt-10 space-y-3">
                  <h3 className="text-lg font-semibold text-white">Was passiert konkret im Erstgespräch?</h3>
                  <p className="text-text-secondary">
                    In 30 bis 45 Minuten schaffen wir Klarheit, ob und wie wir Ihnen mit KI und digitalen Zwillingen
                    wirklich helfen können.
                  </p>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    <li>Wir klären Ihre Ziele, Rahmenbedingungen und aktuelle Herausforderungen.</li>
                    <li>Wir identifizieren 1 bis 2 potenzielle Quick-Wins mit KI oder digitalen Zwillingen.</li>
                    <li>Wir besprechen realistische Zeithorizonte und Aufwände für die nächsten 90 Tage.</li>
                    <li>Sie erhalten im Anschluss eine kurze Zusammenfassung mit konkreten nächsten Schritten.</li>
                  </ul>
                </div>
              </motion.div>

              <motion.div
                className="relative perspective-container"
                initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                style={{ perspective: 1400 }}
              >
                <motion.div
                  className="relative w-full aspect-square max-w-md mx-auto lg:max-w-full float-3d"
                  whileHover={{ rotateX: -6, rotateY: 8 }}
                  transition={{ type: "spring", stiffness: 140, damping: 18 }}
                >
                  <div className="relative w-full max-w-xl mx-auto aspect-video rounded-3xl overflow-hidden border border-white/10 bg-bg-elevated shadow-premium">
                    <OptimizedImage
                      src="/images/digital-twin-factory.png"
                      alt="Visualisierung eines digitalen Zwillings einer Fabrik mit hervorgehobenen Datenpunkten"
                      width={1200}
                      height={675}
                      className="h-full w-full object-cover opacity-90"
                      showLoader={false}
                    />

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-brand-cyan/20" />

                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute top-6 left-10 w-3 h-3 rounded-full bg-brand-cyan shadow-[0_0_16px_rgba(0,230,255,0.8)]" />
                      <div className="absolute bottom-10 left-1/3 w-3 h-3 rounded-full bg-brand-cyan shadow-[0_0_16px_rgba(0,230,255,0.8)]" />
                      <div className="absolute top-1/3 right-12 w-3 h-3 rounded-full bg-brand-cyan shadow-[0_0_16px_rgba(0,230,255,0.8)]" />
                    </div>

                    <div className="absolute bottom-4 right-4 px-4 py-3 rounded-2xl bg-black/70 border border-white/10 backdrop-blur-md shadow-[0_18px_45px_rgba(0,0,0,0.6)]">
                      <p className="text-xs text-text-tertiary">Live-Daten</p>
                      <p className="text-sm font-semibold text-white">Energieverbrauch: -18%</p>
                      <p className="text-xs text-text-secondary">Anlagenverfügbarkeit: 97,4%</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* MIMI Agent Showcase */}
        <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Background glow effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-cyan/5 rounded-full blur-[120px]" />
            <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 30 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={prefersReducedMotion ? undefined : { duration: 0.7 }}
              className="text-center mb-12 md:mb-16"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-sm font-medium mb-6">
                <Sparkles size={16} />
                <span>Neu: Kostenlos im Browser testen</span>
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
                Lernen Sie <span className="text-brand-cyan">MIMI</span> kennen
              </h2>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
                Ihr persönlicher KI-Agent — läuft komplett in Ihrem Browser, ganz ohne Cloud.
              </p>
            </motion.div>

            {/* Main showcase card */}
            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 40 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={prefersReducedMotion ? undefined : { duration: 0.8, delay: 0.1 }}
              className="relative mb-12"
            >
              <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 md:p-12 overflow-hidden">
                {/* Inner glow */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-brand-cyan/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                  {/* Left: Visual */}
                  <div className="flex justify-center lg:justify-start order-2 lg:order-1">
                    <div className="relative">
                      {/* Animated pulsing orb */}
                      <motion.div
                        className="w-48 h-48 md:w-64 md:h-64 rounded-full relative"
                        animate={prefersReducedMotion ? undefined : {
                          boxShadow: [
                            "0 0 40px rgba(0,230,255,0.15), inset 0 0 40px rgba(0,230,255,0.1)",
                            "0 0 80px rgba(0,230,255,0.25), inset 0 0 60px rgba(0,230,255,0.15)",
                            "0 0 40px rgba(0,230,255,0.15), inset 0 0 40px rgba(0,230,255,0.1)",
                          ],
                        }}
                        transition={prefersReducedMotion ? undefined : {
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-cyan/20 via-purple-500/10 to-brand-cyan/20 border border-brand-cyan/30" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-5xl md:text-6xl font-black text-white tracking-tight">
                              MI<span className="text-brand-cyan">MI</span>
                            </div>
                            <div className="text-xs text-text-secondary mt-1 tracking-widest uppercase">
                              KI-Agent
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Floating capability badges */}
                      <motion.div
                        className="absolute -top-2 -right-4 px-3 py-1.5 rounded-full bg-bg-elevated border border-white/10 text-xs text-white shadow-lg"
                        animate={prefersReducedMotion ? undefined : { y: [0, -6, 0] }}
                        transition={prefersReducedMotion ? undefined : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        🧠 Vision
                      </motion.div>
                      <motion.div
                        className="absolute -bottom-2 -left-4 px-3 py-1.5 rounded-full bg-bg-elevated border border-white/10 text-xs text-white shadow-lg"
                        animate={prefersReducedMotion ? undefined : { y: [0, 6, 0] }}
                        transition={prefersReducedMotion ? undefined : { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                      >
                        💻 Code
                      </motion.div>
                      <motion.div
                        className="absolute top-1/2 -right-8 px-3 py-1.5 rounded-full bg-bg-elevated border border-white/10 text-xs text-white shadow-lg"
                        animate={prefersReducedMotion ? undefined : { x: [0, 6, 0] }}
                        transition={prefersReducedMotion ? undefined : { duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      >
                        📄 PDFs
                      </motion.div>
                    </div>
                  </div>

                  {/* Right: Text content */}
                  <div className="space-y-6 order-1 lg:order-2">
                    <h3 className="text-2xl md:text-3xl font-bold text-white leading-snug">
                      KI, die auf Ihrem Gerät läuft — <br className="hidden md:inline" />
                      <span className="text-brand-cyan">nicht in der Cloud.</span>
                    </h3>
                    <p className="text-text-secondary text-lg leading-relaxed">
                      MIMI ist ein vollständiger KI-Agent, der direkt in Ihrem Browser arbeitet.
                      Keine Daten verlassen Ihr Gerät — alles bleibt privat und unter Ihrer Kontrolle.
                    </p>
                    <p className="text-text-secondary leading-relaxed">
                      Stellen Sie Fragen, lassen Sie PDFs analysieren, Bilder beschreiben oder Code schreiben.
                      MIMI denkt in Schritten, plant eigenständig und nutzt verschiedene Werkzeuge —
                      wie ein echter Assistent.
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/mimi"
                        className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl text-lg font-semibold bg-gradient-to-r from-brand-cyan to-cyan-400 text-black hover:shadow-[0_0_32px_rgba(0,230,255,0.4)] transition-all duration-300 hover:scale-[1.03]"
                      >
                        MIMI jetzt kostenlos testen
                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature cards */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.12, delayChildren: 0.2 },
                },
              }}
            >
              <MimiFeatureCard
                icon={<Shield size={28} />}
                title="100% Privat"
                description="Keine Cloud, keine Server, keine Datenübertragung. MIMI läuft vollständig auf Ihrem Gerät mit WebGPU."
              />
              <MimiFeatureCard
                icon={<Brain size={28} />}
                title="Denkt & handelt"
                description="MIMI plant Schritt für Schritt, führt Python-Code aus und nutzt Werkzeuge — wie ein echter KI-Assistent."
              />
              <MimiFeatureCard
                icon={<FileText size={28} />}
                title="Versteht alles"
                description="PDFs analysieren, Bilder beschreiben, Code schreiben, Spracheingabe — alles in einem Agent."
              />
            </motion.div>
          </div>
        </section>

        {/* Abschluss-CTA */}
        <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
                Lassen Sie uns gemeinsam Ihren ersten <span className="text-brand-cyan">KI-Erfolg</span> planen.
              </h2>
              <p className="text-xl text-text-secondary mb-8">
                Im Erstgespräch schaffen wir Klarheit, wo KI und digitale Zwillinge in Ihrem Kontext den größten
                Hebel haben.
              </p>

              <ul className="text-left max-w-2xl mx-auto space-y-2 text-text-secondary mb-10">
                <li>Eine bis zwei konkrete Use-Cases, die für Sie wirklich Sinn machen.</li>
                <li>Eine realistische Einschätzung, was in 90 Tagen erreichbar ist.</li>
                <li>Klarheit, welche Daten und Ressourcen Sie wirklich brauchen – und welche nicht.</li>
              </ul>

              <PrimaryButtonLink href="/contact" className="px-8 py-4 md:px-10 md:py-5 text-lg md:text-xl">
                Kostenloses Erstgespräch buchen
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={24} />
              </PrimaryButtonLink>

              <p className="text-sm text-text-tertiary mt-6">
                100% kostenfrei · Unverbindlich · Kein Verkaufsdruck
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

interface ServiceCardProps {
  title: string;
  description: string;
  href: string;
  imageSrc?: string;
  imageAlt?: string;
}

function ServiceCard({ title, description, href, imageSrc, imageAlt }: ServiceCardProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 40 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] },
        },
      }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link href={href} className="block h-full focus-visible:outline-none">
        <div className="group relative h-full bg-bg-elevated border border-transparent rounded-xl p-8 transition-all duration-300 hover:border-brand-cyan hover:shadow-[0_0_32px_rgba(0,230,255,0.3)]">
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,230,255,0.05) 0%, transparent 50%, rgba(0,230,255,0.05) 100%)",
            }}
          />

          <div className="relative z-10 space-y-4">
            {imageSrc && (
              <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl border border-white/10">
                <OptimizedImage
                  src={imageSrc}
                  alt={imageAlt || title}
                  fill
                  className="object-cover"
                  showLoader={false}
                />
              </div>
            )}

            <h3 className="text-2xl font-semibold text-white group-hover:text-brand-cyan transition-colors duration-300">
              {title}
            </h3>

            <p className="text-text-secondary leading-relaxed">{description}</p>

            <div className="flex items-center gap-2 text-brand-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-sm font-medium">Mehr erfahren</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function TechFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-brand-cyan/20 border border-brand-cyan flex items-center justify-center flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-brand-cyan" />
      </div>
      <span className="text-text-primary">{text}</span>
    </li>
  );
}

interface MimiFeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function MimiFeatureCard({ icon, title, description }: MimiFeatureCardProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] },
        },
      }}
      className="group relative rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 hover:border-brand-cyan/40 hover:shadow-[0_0_24px_rgba(0,230,255,0.15)] transition-all duration-300"
    >
      <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center mb-4 text-brand-cyan group-hover:bg-brand-cyan/20 transition-colors duration-300">
        {icon}
      </div>
      <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
      <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

