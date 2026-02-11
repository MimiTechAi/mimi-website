"use client"

import { Button } from "@/components/ui/button"
import { Home, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navigation from "@/components/Navigation"
import Footer from "@/components/Footer"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion"

export default function NotFound() {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-background z-0" />
      <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-brand-cyan/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] bg-brand-purple/8 rounded-full blur-[100px] pointer-events-none" />

      <Navigation />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Glowing 404 */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative inline-block">
              <span className="text-[10rem] md:text-[14rem] font-extrabold leading-none tracking-tighter bg-gradient-to-b from-brand-cyan via-brand-cyan/60 to-transparent bg-clip-text text-transparent select-none">
                404
              </span>
              <div className="absolute inset-0 bg-brand-cyan/10 blur-3xl rounded-full pointer-events-none" />
            </div>
          </motion.div>

          {/* Title & Description */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Seite nicht gefunden
            </h1>
            <p className="text-lg text-gray-300 max-w-lg mx-auto leading-relaxed">
              Die von Ihnen gesuchte Seite existiert nicht oder wurde verschoben.
              Bitte überprüfen Sie die URL oder kehren Sie zur Startseite zurück.
            </p>
          </motion.div>

          {/* Popular Pages */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel rounded-2xl p-6 max-w-md mx-auto border border-white/10"
          >
            <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Beliebte Seiten
            </h2>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/ki-beratung", label: "KI Beratung & Schulung" },
                { href: "/digitale-zwillinge", label: "Digitale Zwillinge" },
                { href: "/about", label: "Über uns" },
                { href: "/contact", label: "Kontakt" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 text-gray-300 hover:text-brand-cyan transition-colors duration-300 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan/50 group-hover:bg-brand-cyan transition-colors" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-2"
          >
            <Button
              size="lg"
              className="bg-brand-cyan hover:bg-brand-cyan/90 text-black font-semibold px-8 group"
              onClick={() => router.push("/")}
            >
              <Home className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Zur Startseite
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:bg-white/5 hover:border-brand-cyan/50 px-8"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Zurück
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}