"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Info, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { trackCTA } from "@/components/GoogleAnalytics";
import OptimizedImage from "@/components/OptimizedImage";
import InfoTooltip from "@/components/InfoTooltip";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 md:pt-32 pb-16 md:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 aurora-gradient opacity-40" />
        <div className="absolute inset-0 grainy-gradient" />

        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[128px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-nvidia-green/30 rounded-full blur-[128px] animate-pulse" style={{ animationDuration: '7s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            className="text-center lg:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="inline-flex items-center gap-2 mb-6 glass-panel px-4 py-2 rounded-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Sparkles size={16} className="text-brand-cyan" />
              <span className="font-medium text-sm text-foreground/80">Next-Gen AI Solutions</span>
              <div className="w-px h-4 bg-border mx-2" />
              <span className="text-xs font-bold text-brand-cyan">2025 READY</span>
            </motion.div>

            <motion.h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-8 tracking-tight leading-[1.1]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="block text-foreground">Zukunft durch</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan to-nvidia-green animate-gradient">
                KI & Digitale Zwillinge
              </span>
            </motion.h1>

            <motion.p
              className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-2xl font-light leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Transformieren Sie Ihr Unternehmen mit maßgeschneiderten KI-Lösungen und intelligenten Digitalen Zwillingen für maximale Effizienz.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-8 rounded-full text-lg shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all duration-300"
                onClick={() => trackCTA('Kostenlose Beratung', 'Hero Section')}
              >
                <Link href="/contact">
                  Kostenlose Beratung
                  <ArrowRight className="ml-2" size={20} />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="glass-button h-14 px-8 rounded-full text-lg border-white/10 text-foreground hover:bg-white/5"
                onClick={() => trackCTA('Unsere Services', 'Hero Section')}
              >
                <Link href="/#services">
                  Unsere Services
                </Link>
              </Button>
            </motion.div>

            <motion.div
              className="mt-12 flex flex-wrap gap-6 justify-center lg:justify-start text-sm font-medium text-muted-foreground"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                <span>DSGVO konform</span>
              </div>
              <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-nvidia-green shadow-[0_0_10px_rgba(118,185,0,0.5)]"></div>
                <span>ISO/IEC 27001</span>
              </div>
              <div className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-brand-cyan shadow-[0_0_10px_rgba(0,240,255,0.5)]"></div>
                <span>24/7 Support</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative order-first lg:order-last perspective-container"
            initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          >
            <div className="relative w-full aspect-square max-w-md mx-auto lg:max-w-full float-3d">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-cyan/20 to-nvidia-green/20 rounded-full blur-3xl animate-pulse" />

              <motion.div
                className="relative w-full h-full glass-panel rounded-[2rem] border border-white/10 p-8 flex items-center justify-center overflow-hidden card-3d"
                whileHover={{ scale: 1.02 }}
              >
                {/* Abstract Tech Grid Background */}
                <div className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                  }}
                />

                <div className="relative z-10 w-3/4 h-3/4">
                  <OptimizedImage
                    src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/70002c97-6552-4afc-997c-2f176617444f-Kopie-1760516074869.png"
                    alt="MiMi Tech AI Logo"
                    fill
                    className="object-contain drop-shadow-[0_0_30px_rgba(0,240,255,0.4)]"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                {/* Floating Elements */}
                <div className="absolute top-10 right-10 w-20 h-20 glass-panel rounded-2xl rotate-12 animate-bounce delay-700 border border-white/20" />
                <div className="absolute bottom-10 left-10 w-16 h-16 glass-panel rounded-full -rotate-12 animate-bounce delay-1000 border border-white/20" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}