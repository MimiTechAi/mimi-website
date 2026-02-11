"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Target, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { trackCTA } from "@/components/GoogleAnalytics";

export default function BenefitsSection() {
  const benefits = [
    "Individuelle Beratung für Ihre KI-Strategie",
    "Praxisnahe Schulungen für Ihr Team",
    "Modernste Digitale Zwilling Technologie",
    "Erfahrene Experten mit nachweislichem Erfolg",
    "Von der Konzeption bis zur Implementierung",
    "Kontinuierliche Betreuung und Support",
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as any
      }
    }
  };

  return (
    <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 relative" aria-labelledby="benefits-heading">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 mb-6 glass-panel px-4 py-1.5 rounded-full">
              <ShieldCheck size={14} className="text-brand-cyan" />
              <span className="text-sm font-medium text-muted-foreground">Warum MiMi Tech AI?</span>
            </div>

            <h2 id="benefits-heading" className="text-4xl sm:text-5xl md:text-6xl font-black mb-8 tracking-tight leading-tight">
              <span className="text-foreground">Warum </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-nvidia-green animate-gradient">MiMi Tech AI</span>
              <span className="text-foreground">?</span>
            </h2>

            <p className="text-xl text-muted-foreground mb-10 font-light leading-relaxed">
              Wir kombinieren tiefgreifendes KI-Know-how mit praktischer Erfahrung
              in der Implementierung digitaler Zwillinge. Unser Ziel ist es,
              Ihr Unternehmen zukunftssicher zu machen. <Link href="/about" className="text-brand-cyan hover:text-brand-cyan-dark transition-colors underline decoration-brand-cyan/30 underline-offset-4">Mehr über uns</Link>
            </p>

            <motion.ul
              className="grid grid-cols-1 gap-5"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {benefits.map((benefit, index) => (
                <motion.li
                  key={index}
                  className="flex items-center gap-4 group"
                  variants={itemVariants}
                >
                  <div className="w-8 h-8 rounded-full bg-brand-cyan/10 flex items-center justify-center group-hover:bg-brand-cyan/20 transition-colors">
                    <CheckCircle className="text-brand-cyan" size={18} aria-hidden="true" />
                  </div>
                  <span className="text-lg text-foreground/90 group-hover:text-foreground transition-colors">{benefit}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotate: 2 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="perspective-container"
          >
            <div className="glass-panel rounded-[2.5rem] p-1 border border-white/10 relative overflow-hidden card-3d">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 to-nvidia-green/5" />

              <div className="bg-card/40 backdrop-blur-md rounded-[2.2rem] p-6 sm:p-8 md:p-12 relative z-10 h-full flex flex-col justify-between border border-white/5">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-cyan to-nvidia-green flex items-center justify-center mb-8 shadow-lg shadow-nvidia-green/20">
                    <Target className="text-white" size={32} />
                  </div>

                  <h3 className="text-3xl sm:text-4xl font-bold mb-6 leading-tight">
                    Bereit für die digitale Transformation?
                  </h3>

                  <p className="text-lg text-muted-foreground leading-relaxed mb-10">
                    Lassen Sie uns gemeinsam Ihre KI-Strategie entwickeln und
                    Digitale Zwillinge für Ihr Unternehmen implementieren.
                  </p>
                </div>

                <Button
                  asChild
                  size="lg"
                  className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 rounded-xl text-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-300"
                  onClick={() => trackCTA("Kostenloses Erstgespräch", "Benefits Section")}
                >
                  <Link href="/contact">
                    Kostenloses Erstgespräch
                    <ArrowRight className="ml-2" size={20} aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}