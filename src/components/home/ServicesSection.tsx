"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Building2, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function ServicesSection() {
  const services = [
    {
      id: "ai-consulting",
      icon: Brain,
      title: "KI Beratung & Schulung",
      description: "Maßgeschneiderte KI-Beratung und praxisnahe Schulungen für Unternehmer und Mitarbeiter.",
      link: "/ki-beratung",
      color: "text-brand-cyan",
      bg: "bg-brand-cyan/10",
      glow: "shadow-[0_0_20px_rgba(0,240,255,0.3)]"
    },
    {
      id: "digital-twins",
      icon: Building2,
      title: "Digitale Zwillinge",
      description: "Von Anlagen bis zu urbanen Infrastrukturen – digitale Abbilder für optimierte Prozesse.",
      link: "/digitale-zwillinge",
      color: "text-nvidia-green",
      bg: "bg-nvidia-green/10",
      glow: "shadow-[0_0_20px_rgba(118,185,0,0.3)]"
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as any
      }
    }
  };

  return (
    <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden" aria-labelledby="services-heading">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 mb-4 glass-panel px-4 py-1.5 rounded-full">
            <Sparkles size={14} className="text-nvidia-green" />
            <span className="text-sm font-medium text-muted-foreground">Unsere Expertise</span>
          </div>

          <h2 id="services-heading" className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight">
            <span className="text-foreground">Unsere </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-nvidia-green">Services</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            Umfassende KI-Lösungen für Unternehmen jeder Größe. <Link href="/ki-erklaert" className="text-brand-cyan hover:text-brand-cyan-dark transition-colors underline decoration-brand-cyan/30 underline-offset-4">Noch keine Vorkenntnisse?</Link> Wir erklären Ihnen KI einfach und verständlich.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {services.map((service) => (
            <motion.div
              key={service.title}
              variants={itemVariants}
              whileHover={{ y: -10 }}
              className="perspective-container h-full"
            >
              <Link
                href={service.link}
                className="block h-full group"
                style={{ viewTransitionName: `service-card-${service.id}` } as React.CSSProperties}
              >
                <div className="glass-panel rounded-3xl p-8 h-full border border-white/5 hover:border-white/20 transition-all duration-500 relative overflow-hidden group-hover:shadow-[0_0_40px_rgba(0,0,0,0.2)]">
                  {/* Hover Gradient Background */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-${service.color.replace('text-', '')} to-transparent`} />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="mb-8 flex justify-between items-start">
                      <motion.div
                        className={`w-16 h-16 rounded-2xl ${service.bg} flex items-center justify-center ${service.glow} transition-all duration-500 group-hover:scale-110`}
                        style={{ viewTransitionName: `service-icon-${service.id}` } as React.CSSProperties}
                      >
                        <service.icon className={`${service.color}`} size={32} />
                      </motion.div>

                      <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all duration-300">
                        <ArrowRight className="text-muted-foreground group-hover:text-foreground transition-colors" size={20} />
                      </div>
                    </div>

                    <h3
                      className="text-3xl font-bold mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/80 transition-all duration-300"
                      style={{ viewTransitionName: `service-title-${service.id}` } as React.CSSProperties}
                    >
                      {service.title}
                    </h3>

                    <p className="text-lg text-muted-foreground leading-relaxed mb-8 flex-grow">
                      {service.description}
                    </p>

                    <div className="mt-auto">
                      <span className={`text-sm font-semibold uppercase tracking-wider ${service.color} flex items-center gap-2`}>
                        Details ansehen
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}