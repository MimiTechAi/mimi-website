"use client";

import { MessageSquare, Phone, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/lib/hooks/use-mobile"; // Import mobile detection hook
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

export default function FloatingCTA() {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  return (
    <>
      {/* Main FAB Button - Now visible on all devices with improved touch targets */}
      <motion.div
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-6 z-50"
        initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.5, duration: 0.3 }}
      >
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2"
            >
              {/* Contact Option - Increased touch target */}
              <Link
                href="/contact"
                aria-label="Nachricht senden - Kontaktformular öffnen"
                className="flex items-center gap-3 bg-card border border-border rounded-full px-4 py-4 shadow-lg hover:shadow-xl transition-shadow min-h-[44px] min-w-[44px]"
                onClick={() => setIsExpanded(false)}
              >
                <MessageSquare className="w-5 h-5 text-primary" aria-hidden="true" />
                <span className="text-sm font-medium whitespace-nowrap">
                  Nachricht senden
                </span>
              </Link>

              {/* Phone Option */}
              <a
                href="tel:+4915758805737"
                aria-label="Jetzt anrufen: +49 1575 8805737"
                className="flex items-center gap-3 bg-card border border-border rounded-full px-4 py-4 shadow-lg hover:shadow-xl transition-shadow min-h-[44px] min-w-[44px]"
                onClick={() => setIsExpanded(false)}
              >
                <Phone className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium whitespace-nowrap">
                  Jetzt anrufen
                </span>
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button - Increased touch target for mobile */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 ${
            isMobile ? "w-16 h-16" : "w-14 h-14" // Larger button on mobile
          }`}
          whileTap={{ scale: 0.95 }}
          animate={prefersReducedMotion ? undefined : { rotate: isExpanded ? 45 : 0 }}
          aria-label={isExpanded ? "Menü schließen" : "Kontaktmenü öffnen"} // Added aria-label for accessibility
        >
          {isExpanded ? (
            <X className={`text-white ${isMobile ? "w-8 h-8" : "w-6 h-6"}`} /> // Larger icon on mobile
          ) : (
            <MessageSquare className={`text-white ${isMobile ? "w-8 h-8" : "w-6 h-6"}`} /> // Larger icon on mobile
          )}
        </motion.button>
      </motion.div>
    </>
  );
}