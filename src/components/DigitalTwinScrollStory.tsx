"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Layers, Activity, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { sectionFadeUp, staggerContainer, itemFadeUp } from "@/lib/motion";

type LayerId = "physical" | "asset" | "sensor" | "insights";

interface Layer {
  id: LayerId;
  title: string;
  subtitle: string;
  description: string;
}

const LAYERS: Layer[] = [
  {
    id: "physical",
    title: "Physische Ebene",
    subtitle: "Gebäude, Anlagen, Räume",
    description:
      "Die räumliche Bühne: Gebäude, Anlagen, Stadtteile oder Prozesse als präzises Modell.",
  },
  {
    id: "asset",
    title: "Asset-Ebene",
    subtitle: "Maschinen & Organisationseinheiten",
    description:
      "Maschinen, Linien, Räume und Organisationseinheiten mit klaren Beziehungen zueinander.",
  },
  {
    id: "sensor",
    title: "Sensor- & Event-Ebene",
    subtitle: "Messpunkte & Zustände",
    description:
      "Messpunkte, Zustände und Ereignisse koppeln den digitalen Zwilling eng an die Realität.",
  },
  {
    id: "insights",
    title: "Daten- & Insights-Ebene",
    subtitle: "Analysen & KI-Modelle",
    description:
      "Datenflüsse, Analysen und KI-Modelle machen Muster sichtbar und unterstützen Entscheidungen.",
  },
];

interface StoryStepProps {
  layer: Layer;
  isActive: boolean;
  onInView: () => void;
}

function StoryStep({ layer, isActive, onInView }: StoryStepProps) {
  const { ref, inView } = useInView({
    threshold: 0.45,
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView) {
      onInView();
    }
  }, [inView, onInView]);

  return (
    <motion.div
      ref={ref}
      className={`rounded-xl border border-border-subtle bg-bg-void/40 p-6 transition-all duration-300
        ${isActive ? "border-brand-cyan bg-bg-surface shadow-[0_0_40px_rgba(0,230,255,0.25)]" : "opacity-80 hover:border-brand-cyan/40 hover:bg-bg-surface/60"}
      `}
      variants={itemFadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ amount: 0.4, once: false }}
      layout
    >
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="text-sm uppercase tracking-wide text-text-tertiary">
          {layer.subtitle}
        </div>
        <div
          className={`h-2 w-2 rounded-full transition-colors duration-300 ${
            isActive ? "bg-brand-cyan" : "bg-brand-cyan/40"
          }`}
        />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{layer.title}</h3>
      <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
        {layer.description}
      </p>
    </motion.div>
  );
}

function VisualLayer({ activeId }: { activeId: LayerId }) {
  const steps = [
    {
      id: "physical" as LayerId,
      label: "Physische Ebene",
      hint: "Gebäude, Anlagen, Standorte",
    },
    {
      id: "asset" as LayerId,
      label: "Asset-Ebene",
      hint: "Maschinen, Linien, Räume",
    },
    {
      id: "sensor" as LayerId,
      label: "Sensor- & Event-Ebene",
      hint: "Sensorwerte, Zustände, Events",
    },
    {
      id: "insights" as LayerId,
      label: "Daten- & Insights-Ebene",
      hint: "Dashboards, KI-Modelle, Aktionen",
    },
  ];

  const arrowStrength =
    activeId === "physical"
      ? "bg-brand-cyan/30"
      : activeId === "asset"
      ? "bg-brand-cyan/40"
      : activeId === "sensor"
      ? "bg-brand-cyan/60"
      : "bg-brand-cyan";

  const activeStep = steps.find((s) => s.id === activeId) ?? steps[0];
  const activeDescription =
    activeId === "physical"
      ? "Hier definieren Sie, welche Gebäude, Anlagen oder Stadtteile überhaupt Teil des digitalen Zwillings sind."
      : activeId === "asset"
      ? "Auf dieser Ebene werden einzelne Maschinen, Linien und Räume mit klaren Beziehungen modelliert."
      : activeId === "sensor"
      ? "Sensorwerte, Zustände und Events verknüpfen den digitalen Zwilling in Echtzeit mit der physischen Welt."
      : "Hier werden Daten analysiert, visualisiert und durch KI-Modelle in konkrete Entscheidungen übersetzt.";

  return (
    <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border-subtle bg-bg-elevated/80 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-mono uppercase tracking-[0.18em] text-text-tertiary">
          Ebenen im Digitalen Zwilling
        </div>
        <div className="flex items-center gap-1 text-xs text-text-tertiary">
          <span className="inline-block h-2 w-2 rounded-full bg-brand-cyan" />
          <span>Aktive Ebene</span>
        </div>
      </div>

      <div className="relative pl-4">
        <div className="absolute left-1 top-3 bottom-3 w-px bg-border-subtle/70" />

        <div className="space-y-3">
          {steps.map((step, index) => {
            const isActive = activeId === step.id;
            return (
              <div
                key={step.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`relative flex h-4 w-4 items-center justify-center rounded-full border transition-all duration-300 ${
                      isActive
                        ? "border-brand-cyan bg-brand-cyan/20 shadow-[0_0_16px_rgba(0,230,255,0.7)]"
                        : "border-border-subtle bg-bg-void"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                        isActive ? "bg-brand-cyan" : "bg-brand-cyan/40"
                      }`}
                    />
                  </div>
                  <div>
                    <div
                      className={`text-xs font-medium ${
                        isActive ? "text-white" : "text-text-secondary"
                      }`}
                    >
                      {index + 1}. {step.label}
                    </div>
                    <div className="text-[11px] text-text-tertiary">
                      {step.hint}
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <div
                    className={`h-1.5 rounded-full bg-gradient-to-r from-brand-cyan/0 to-brand-cyan/50 transition-all duration-300 ${
                      isActive ? "opacity-100" : "opacity-40"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2 text-xs text-text-tertiary sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-3 sm:text-[11px]">
        <div className="px-2 py-1 rounded-full border border-border-subtle bg-bg-void/60 text-center">
          Physische Welt
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className={`h-1.5 w-8 rounded-full ${arrowStrength} transition-all duration-300`} />
          <span className="leading-none">Datenfluss</span>
        </div>
        <div className="px-2 py-1 rounded-full border border-border-subtle bg-bg-void/60 text-center">
          Daten & Entscheidungen
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border-subtle bg-bg-void/80 p-3">
        <div className="text-xs font-semibold text-text-secondary mb-1">
          Aktuelle Ebene: {activeStep.label}
        </div>
        <div className="text-[11px] text-text-tertiary leading-relaxed">
          {activeDescription}
        </div>
      </div>
    </div>
  );
}

export default function DigitalTwinScrollStory() {
  const [activeId, setActiveId] = useState<LayerId>(LAYERS[0]?.id ?? "physical");

  return (
    <motion.section
      className="max-w-6xl mx-auto mb-20 md:mb-32 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start"
      variants={sectionFadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.25 }}
    >
      <motion.div className="space-y-6" variants={staggerContainer}>
        <h2 className="text-3xl md:text-4xl font-bold mb-2">
          Schicht für Schicht durch Ihren Digitalen Zwilling
        </h2>
        <p className="text-lg text-text-secondary leading-relaxed mb-4">
          Scrollen Sie durch die Ebenen Ihres Systems: Von der physischen Bühne über Assets und Sensorik bis hin zu
          datengetriebenen Insights.
        </p>

        <div className="space-y-4">
          {LAYERS.map((layer) => (
            <StoryStep
              key={layer.id}
              layer={layer}
              isActive={activeId === layer.id}
              onInView={() => setActiveId(layer.id)}
            />
          ))}
        </div>
      </motion.div>

      <motion.div className="lg:sticky lg:top-32" variants={itemFadeUp}>
        <div className="mb-4 flex items-center gap-2 text-sm text-text-tertiary">
          <Layers size={16} className="text-brand-cyan" />
          <span>Visualisierung der aktiven Ebene</span>
        </div>
        <VisualLayer activeId={activeId} />
      </motion.div>
    </motion.section>
  );
}
