"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, Linkedin, Instagram, Send } from "lucide-react";
import { useState } from "react";
import OptimizedImage from "@/components/OptimizedImage";
import { toast } from "sonner";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(true);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!validateEmail(email)) {
      setIsValid(false);
      toast.error("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
      return;
    }

    setIsValid(true);
    setIsSubmitting(true);

    try {
      // Implement newsletter API endpoint
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ein Fehler ist aufgetreten');
      }

      toast.success("Vielen Dank! Sie wurden erfolgreich angemeldet.");
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ein Fehler ist aufgetreten.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="relative bg-black/20 backdrop-blur-xl border-t border-white/10 overflow-hidden" id="footer">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-nvidia-green/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-cyan/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12" style={{ viewTransitionName: 'footer-logo' }}>
                <OptimizedImage
                  src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/mimi_tech_ai_icon_192-Kopie-1760514890080.png"
                  alt="MiMi Tech AI Logo"
                  fill
                  sizes="48px"
                  className="object-contain drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                  quality={90}
                />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                MiMi <span className="text-brand-cyan drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]">Tech AI</span>
              </span>
            </div>
            <p className="text-gray-300 max-w-md leading-relaxed">
              Ihr Partner für KI-Beratung, Schulungen und innovative Digitale Zwillinge.
              Von der Anlage bis zur urbanen Infrastruktur – wir digitalisieren Ihre Zukunft.
            </p>

            {/* Newsletter Signup */}
            <div className="pt-4 max-w-md">
              <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Mail size={18} className="text-brand-cyan" />
                Newsletter abonnieren
              </h4>
              <p className="text-sm text-gray-300 mb-4">
                Bleiben Sie auf dem Laufenden über KI-Trends und unsere neuesten Projekte.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <label htmlFor="newsletter-email" className="sr-only">E-Mail-Adresse für Newsletter</label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (!isValid) setIsValid(validateEmail(e.target.value));
                  }}
                  placeholder="Ihre E-Mail-Adresse"
                  required
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2.5 bg-white/5 border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/50 focus-visible:border-brand-cyan/50 text-white placeholder:text-gray-500 text-sm transition-all ${isValid ? "border-white/10" : "border-red-500/50"
                    }`}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan rounded-lg hover:bg-brand-cyan/20 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  aria-label="Newsletter abonnieren"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            </div>

            {/* Social Media Links */}
            <div className="flex gap-4 pt-2">
              <a
                href="https://linkedin.com/company/mimitechai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-brand-cyan/50 hover:bg-brand-cyan/10 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all duration-300"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="https://www.instagram.com/mimi_tech_ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-brand-cyan/50 hover:bg-brand-cyan/10 hover:shadow-[0_0_15px_rgba(0,255,255,0.3)] transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { href: "/ki-beratung", label: "KI Beratung" },
                { href: "/digitale-zwillinge", label: "Digitale Zwillinge" },
                { href: "/about", label: "Über uns" },
                { href: "/contact", label: "Kontakt" },
                { href: "/impressum", label: "Impressum" },
                { href: "/datenschutz", label: "Datenschutz" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-brand-cyan hover:translate-x-1 inline-block transition-all duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-white mb-6">Kontakt</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-300 group">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-brand-cyan/30 transition-colors">
                  <Mail size={16} className="text-brand-cyan" />
                </div>
                <a href="mailto:info@mimitechai.com" className="mt-1 hover:text-white transition-colors duration-200 break-all">
                  info@mimitechai.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-300 group">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-brand-cyan/30 transition-colors">
                  <Phone size={16} className="text-brand-cyan" />
                </div>
                <a href="tel:+4915758805737" className="mt-1 hover:text-white transition-colors duration-200 break-all">
                  +49 1575 8805737
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-300 group">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-brand-cyan/30 transition-colors">
                  <MapPin size={16} className="text-brand-cyan" />
                </div>
                <span className="mt-1">Bad Liebenzell, Deutschland</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} MiMi Tech AI. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}