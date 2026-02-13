"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Zap, Cpu, Play, Pause, RotateCcw } from "lucide-react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

interface DemoStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  explanation: string;
  example: string;
}

export default function InteractiveDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const demoSteps: DemoStep[] = [
    {
      id: 1,
      title: "Eingabe",
      description: "Daten sammeln",
      icon: <Brain className="text-brand-cyan" size={32} />,
      explanation: "KI-Systeme benötigen Daten, um zu lernen. Das können Texte, Bilder, Zahlen oder andere Informationen sein.",
      example: "Beispiel: Ein KI-System zur Bilderkennung benötigt tausende von Bildern, um zu lernen, was ein Hund ist."
    },
    {
      id: 2,
      title: "Verarbeitung",
      description: "Muster erkennen",
      icon: <Zap className="text-nvidia-green" size={32} />,
      explanation: "Die KI analysiert die Daten und sucht nach Mustern und Zusammenhängen, ähnlich wie das menschliche Gehirn.",
      example: "Beispiel: Das System erkennt, dass Bilder mit langen Schnauzen, spitzen Ohren und einem Schwanz Hunde darstellen."
    },
    {
      id: 3,
      title: "Ausgabe",
      description: "Ergebnis liefern",
      icon: <Cpu className="text-brand-cyan" size={32} />,
      explanation: "Basierend auf dem Gelernten trifft die KI Entscheidungen oder erstellt neue Inhalte.",
      example: "Beispiel: Wenn ein neues Bild hochgeladen wird, sagt das System: 'Das ist ein Hund' oder 'Das ist kein Hund'."
    }
  ];

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % demoSteps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + demoSteps.length) % demoSteps.length);
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        nextStep();
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-bold mb-2 text-white">Interaktive Demo</h3>
        <p className="text-gray-400">
          Schauen Sie sich an, wie KI lernt und Entscheidungen trifft
        </p>
      </div>

      <div className="space-y-8">
        {/* Progress indicators */}
        <div className="flex justify-center items-center gap-4">
          {demoSteps.map((step, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <button
                onClick={() => setCurrentStep(index)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${index === currentStep
                    ? "bg-brand-cyan/20 border-brand-cyan text-brand-cyan scale-110 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
                    : "bg-white/5 border-white/10 text-gray-500 hover:border-white/30"
                  }`}
                aria-label={`Schritt ${index + 1}: ${step.title}`}
                aria-current={index === currentStep ? "step" : undefined}
              >
                <span className="font-bold">{index + 1}</span>
              </button>
              <span className={`text-sm font-medium transition-colors duration-300 ${index === currentStep ? "text-brand-cyan" : "text-gray-500"}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Demo visualization */}
        <div
          className="relative min-h-[240px] md:min-h-[300px] rounded-2xl bg-black/40 border border-white/10 overflow-hidden"
          aria-live="polite"
          aria-atomic="true"
          role="region"
          aria-label={`Schritt ${currentStep + 1} von ${demoSteps.length}: ${demoSteps[currentStep].title}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 to-nvidia-green/5" />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: prefersReducedMotion ? 0 : -50 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="relative z-10 p-6 md:p-12 flex flex-col items-center text-center h-full justify-center"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-lg">
                {demoSteps[currentStep].icon}
              </div>

              <h3 className="text-2xl font-bold mb-2 text-white">{demoSteps[currentStep].title}</h3>
              <p className="text-xl text-brand-cyan mb-6">{demoSteps[currentStep].description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left mt-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                  <p className="font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                    Erklärung
                  </p>
                  <p className="text-gray-300 leading-relaxed">{demoSteps[currentStep].explanation}</p>
                </div>

                <div className="bg-brand-cyan/5 border border-brand-cyan/20 rounded-xl p-5">
                  <p className="font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-nvidia-green" />
                    Beispiel
                  </p>
                  <p className="text-gray-300 leading-relaxed">{demoSteps[currentStep].example}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={isPlaying}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            Zurück
          </Button>

          <Button
            variant="default"
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={prefersReducedMotion}
            className="bg-brand-cyan text-black hover:bg-brand-cyan/90 min-w-[120px]"
          >
            {isPlaying ? (
              <>
                <Pause className="mr-2 h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Abspielen
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={nextStep}
            disabled={isPlaying}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            Weiter
          </Button>

          <Button
            variant="ghost"
            onClick={resetDemo}
            className="text-gray-400 hover:text-white hover:bg-white/5"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>

        {prefersReducedMotion && (
          <p className="text-center text-sm text-gray-500">
            Animationen sind deaktiviert, da Ihr System reduzierte Bewegungen bevorzugt.
          </p>
        )}
      </div>
    </div>
  );
}