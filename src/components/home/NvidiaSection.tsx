"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function NvidiaSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-30" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="glass-panel rounded-3xl p-6 md:p-12 border border-green-500/20 relative overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

          <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 relative z-10">
            <motion.div
              className="flex-shrink-0"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="relative w-64 h-32 filter drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                <Image
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/nvidia-logo-horz-2-1760533860052.png"
                  alt="NVIDIA Logo - Offizieller NVIDIA Connect Partner"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 192px, 256px"
                />
              </div>
            </motion.div>

            <div className="w-px h-32 bg-gradient-to-b from-transparent via-green-500/30 to-transparent hidden md:block" aria-hidden="true" />

            <motion.div
              className="text-center md:text-left max-w-2xl"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <h3 className="text-3xl font-bold mb-4 text-white flex items-center justify-center md:justify-start gap-3">
                NVIDIA Connect Partner
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              </h3>
              <p className="text-lg text-white/80 leading-relaxed">
                Als offizielles Mitglied des <span className="text-green-400 font-semibold glow-text">NVIDIA Connect Programms</span> haben wir exklusiven Zugang zu
                den neuesten KI-Technologien und Hardware-Beschleunigern. Dies ermöglicht uns,
                innovative Lösungen auf höchstem technologischen Niveau zu entwickeln.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}