"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Building2, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ServiceComparisonWidget() {
  const services = [
    {
      icon: Brain,
      title: "KI Beratung & Schulung",
      description: "Für Unternehmen, die KI-Potenziale identifizieren und Teams befähigen möchten",
      href: "/ki-beratung",
      highlights: [
        "KI-Strategie entwickeln",
        "Mitarbeiter schulen",
        "Use Cases identifizieren",
        "Implementierungs-Support"
      ],
      bestFor: "Unternehmer & Teams",
      color: "from-blue-500/10 to-cyan-500/10"
    },
    {
      icon: Building2,
      title: "Digitale Zwillinge",
      description: "Für Unternehmen mit Anlagen, Gebäuden oder urbanen Infrastrukturen",
      href: "/digitale-zwillinge",
      highlights: [
        "Anlagen-Monitoring",
        "Gebäude-Management",
        "Smart City Lösungen",
        "Echtzeit-Simulation"
      ],
      bestFor: "Industrie & Städte",
      color: "from-primary/10 to-primary/5"
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight">
            Welcher Service passt zu <span className="neon-text">Ihnen</span>?
          </h2>
          <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
            Vergleichen Sie unsere Kernleistungen und finden Sie die passende Lösung für Ihr Unternehmen
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.2 }
            }
          }}
        >
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
              }}
            >
              <Card 
                className={`relative overflow-hidden h-full border-primary/30 hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 bg-gradient-to-br ${service.color} grainy-gradient`}
              >
                {/* Subtle mesh gradient overlay */}
                <div className="absolute inset-0 mesh-gradient opacity-10 blur-2xl" />
                <CardHeader className="relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <service.icon className="text-primary" size={32} />
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2 w-fit">
                    {service.bestFor}
                  </div>
                  <CardTitle className="text-3xl md:text-4xl font-bold">{service.title}</CardTitle>
                  <CardDescription className="text-lg md:text-xl leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6 relative z-10">
                  <div className="space-y-3">
                    {service.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle className="text-primary flex-shrink-0 mt-0.5" size={18} />
                        <span className="text-foreground">{highlight}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    asChild 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group"
                  >
                    <Link href={service.href}>
                      Mehr erfahren
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Decision Helper */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="bg-card/50 border-primary/10 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl font-bold">Noch unsicher?</CardTitle>
              <CardDescription className="text-lg md:text-xl leading-relaxed">
                Beide Services lassen sich ideal kombinieren! Kontaktieren Sie uns für eine 
                kostenlose Beratung und wir finden gemeinsam die beste Lösung für Ihr Unternehmen.
              </CardDescription>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/contact">
                  Beratungsgespräch vereinbaren
                </Link>
              </Button>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}