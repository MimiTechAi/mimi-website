"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

// Generate particle positions - memoized to avoid hydration issues
interface Particle {
  id: number;
  initialX: number;
  initialY: number;
  targetX: number;
  targetY: number;
  duration: number;
  delay: number;
  color: 'cyan' | 'green';
}

export default function IntroAnimation() {
  const [isVisible, setIsVisible] = useState(true);
  const [stage, setStage] = useState<"logo" | "loading" | "fadeout">("logo");
  const [showSkip, setShowSkip] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const prefersReducedMotion = useReducedMotion();

  const handleSkip = () => {
    setStage("fadeout");
    setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem("introShown", "true");
    }, 500);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (prefersReducedMotion) {
      setIsVisible(false);
      window.sessionStorage.setItem("introShown", "true");
      return;
    }

    const introShown = sessionStorage.getItem("introShown");
    if (introShown) {
      setIsVisible(false);
      return;
    }

    // Initialize particles client-side with 50% Cyan + 50% Green mix
    const initialParticles: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      initialX: Math.random() * window.innerWidth,
      initialY: Math.random() * window.innerHeight,
      targetX: Math.random() * window.innerWidth,
      targetY: Math.random() * window.innerHeight,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 2,
      color: Math.random() > 0.5 ? 'cyan' : 'green', // 50/50 mix
    }));
    setParticles(initialParticles);

    // Show skip button after 0.8s
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 800);

    // Animation sequence - optimized timing (3.7s total)
    const logoTimer = setTimeout(() => {
      setStage("loading");
    }, 1200); // Logo shows for 1.2 seconds

    const loadingTimer = setTimeout(() => {
      setStage("fadeout");
    }, 2700); // Loading shows for 1.5 seconds

    const fadeoutTimer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem("introShown", "true");
    }, 3700); // Fadeout takes 1 second

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(logoTimer);
      clearTimeout(loadingTimer);
      clearTimeout(fadeoutTimer);
    };
  }, [prefersReducedMotion]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-[9999] bg-background flex items-center justify-center overflow-hidden"
      >
        {/* Skip Button */}
        <AnimatePresence>
          {showSkip && stage !== "fadeout" && (
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onClick={handleSkip}
              className="absolute top-8 right-8 z-10 px-6 py-3 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-medium transition-all duration-300 hover:scale-105 flex items-center gap-2 group"
              aria-label="Intro überspringen"
            >
              <span className="text-foreground">Überspringen</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Animated background particles with Cyan/Green mix */}
        <div className="absolute inset-0 opacity-20">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className={`absolute w-1 h-1 rounded-full ${particle.color === 'cyan' ? 'bg-brand-cyan' : 'bg-nvidia-green'
                }`}
              initial={{
                x: particle.initialX,
                y: particle.initialY,
                opacity: 0,
                scale: 0
              }}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [0, 1, 0],
                x: particle.targetX,
                y: particle.targetY,
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Logo Stage */}
        {stage === "logo" && (
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotateY: -90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{
              duration: 1,
              ease: [0.16, 1, 0.3, 1]
            }}
            className="relative w-72 h-72"
          >
            <motion.div
              animate={{
                filter: [
                  "drop-shadow(0 0 40px var(--brand-cyan)) drop-shadow(0 0 80px rgba(0, 217, 255, 0.5))",
                  "drop-shadow(0 0 60px var(--brand-cyan)) drop-shadow(0 0 120px rgba(0, 217, 255, 0.7))",
                  "drop-shadow(0 0 40px var(--brand-cyan)) drop-shadow(0 0 80px rgba(0, 217, 255, 0.5))"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/70002c97-6552-4afc-997c-2f176617444f-Kopie-1760516074869.png"
                alt="MiMi Tech AI Logo"
                fill
                sizes="(max-width: 768px) 256px, 288px"
                className="object-contain"
                priority
              />
            </motion.div>
          </motion.div>
        )}

        {/* Loading Stage */}
        {stage === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center gap-12"
          >
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-56 h-56"
            >
              <motion.div
                animate={{
                  rotate: [0, 360],
                  filter: [
                    "drop-shadow(0 0 30px var(--brand-cyan))",
                    "drop-shadow(0 0 50px var(--brand-cyan))",
                    "drop-shadow(0 0 30px var(--brand-cyan))"
                  ]
                }}
                transition={{
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  filter: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <Image
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/70002c97-6552-4afc-997c-2f176617444f-Kopie-1760516074869.png"
                  alt="MiMi Tech AI Logo"
                  fill
                  sizes="(max-width: 768px) 224px, 224px"
                  className="object-contain opacity-70"
                  priority
                />
              </motion.div>
            </motion.div>

            {/* Loading Animation */}
            <div className="flex flex-col items-center gap-6">
              <motion.div
                className="relative w-80 h-2 bg-muted/30 rounded-full overflow-hidden backdrop-blur-sm"
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-brand-cyan via-primary to-brand-cyan-dark rounded-full relative"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: 1.3,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  style={{
                    boxShadow: "0 0 25px var(--brand-cyan), 0 0 50px rgba(0, 217, 255, 0.4)",
                  }}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0.7, 1] }}
                transition={{
                  delay: 0.3,
                  duration: 1.2,
                  times: [0, 0.2, 0.5, 0.7, 1],
                  repeat: Infinity
                }}
                className="text-center"
              >
                <p className="text-muted-foreground text-base font-medium tracking-wide">
                  Initialisiere KI-System
                </p>
                <motion.div
                  className="flex gap-1 justify-center mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                      className="text-primary text-xl"
                    >
                      •
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Fadeout Stage */}
        {stage === "fadeout" && (
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 1.2, filter: "blur(20px)" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-56 h-56"
          >
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/70002c97-6552-4afc-997c-2f176617444f-Kopie-1760516074869.png"
              alt="MiMi Tech AI Logo"
              fill
              sizes="(max-width: 768px) 224px, 224px"
              className="object-contain opacity-50"
              priority
            />
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}