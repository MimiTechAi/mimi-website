"use client";

/**
 * Contact Page — Multi-Step Form with FormStepper
 * 3-step flow: Persönliche Daten → Anliegen → Nachricht
 * Enhanced success animation with confetti effect.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormStepper, type FormStep } from "@/components/ui/FormStepper";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Mail, Phone, MapPin, CheckCircle, Clock, MessageSquare, AlertCircle, Sparkles, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { RelatedServices } from "@/components/RelatedServices";

type ContactFormData = {
  name: string;
  email: string;
  company: string;
  phone: string;
  service: string;
  message: string;
};

type ContactFormErrors = Partial<Record<keyof ContactFormData, string>>;

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    company: "",
    phone: "",
    service: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ContactFormErrors>({});
  const prefersReducedMotion = useReducedMotion();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value } as ContactFormData));
    setFieldErrors(prev => ({ ...prev, [name]: undefined } as ContactFormErrors));
  }, []);

  const copyMessageToClipboard = async () => {
    try {
      const text = [
        `Name: ${formData.name}`,
        `E-Mail: ${formData.email}`,
        `Unternehmen: ${formData.company || "-"}`,
        `Telefon: ${formData.phone || "-"}`,
        `Interessiert an: ${formData.service || "-"}`,
        "",
        formData.message,
      ].join("\n");

      await navigator.clipboard.writeText(text);
      setError("Nachricht kopiert. Sie können sie jetzt per E-Mail senden oder uns anrufen.");
    } catch {
      setError("Kopieren nicht möglich. Bitte markieren und kopieren Sie den Text manuell.");
    }
  };

  // Step 1 validation: Name + Email
  const validateStep1 = useCallback((): boolean => {
    const errors: ContactFormErrors = {};

    if (!formData.name.trim()) {
      errors.name = "Bitte geben Sie Ihren Namen ein.";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Der Name muss mindestens 2 Zeichen lang sein.";
    }

    const emailValue = formData.email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
      errors.email = "Bitte geben Sie Ihre E-Mail-Adresse ein.";
    } else if (!emailPattern.test(emailValue)) {
      errors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
    }

    const phoneValue = formData.phone.trim();
    if (phoneValue) {
      const phonePattern = /^[0-9+\s()\/-]{6,}$/;
      if (!phonePattern.test(phoneValue)) {
        errors.phone = "Bitte geben Sie eine gültige Telefonnummer ein.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.name, formData.email, formData.phone]);

  // Step 2 validation: Service selection
  const validateStep2 = useCallback((): boolean => {
    const errors: ContactFormErrors = {};
    if (!formData.service) {
      errors.service = "Bitte wählen Sie eine Option aus.";
    }
    setFieldErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  }, [formData.service]);

  // Step 3 validation: Message
  const validateStep3 = useCallback((): boolean => {
    const errors: ContactFormErrors = {};
    const messageValue = formData.message.trim();
    if (!messageValue) {
      errors.message = "Bitte beschreiben Sie kurz Ihr Anliegen.";
    } else if (messageValue.length < 10) {
      errors.message = "Die Nachricht sollte mindestens 10 Zeichen lang sein.";
    }
    setFieldErrors(prev => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  }, [formData.message]);

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ein Fehler ist aufgetreten");
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Form Steps ---
  const formSteps: FormStep[] = [
    {
      title: "Persönlich",
      description: "Wie können wir Sie erreichen?",
      validate: validateStep1,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Max Mustermann"
              aria-invalid={!!fieldErrors.name}
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
            />
            {fieldErrors.name && (
              <p id="name-error" className="text-sm text-destructive mt-1">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-Mail *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="max@beispiel.de"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email && (
              <p id="email-error" className="text-sm text-destructive mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Unternehmen</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Ihre Firma GmbH"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+49 123 456 7890"
                aria-invalid={!!fieldErrors.phone}
                aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
              />
              {fieldErrors.phone && (
                <p id="phone-error" className="text-sm text-destructive mt-1">{fieldErrors.phone}</p>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Anliegen",
      description: "Was interessiert Sie?",
      validate: validateStep2,
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="service">Interessiert an *</Label>
            <Select
              value={formData.service}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, service: value }));
                setFieldErrors(prev => ({ ...prev, service: undefined }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Bitte wählen Sie eine Option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ai-consulting">KI Beratung</SelectItem>
                <SelectItem value="ai-training">KI Schulung</SelectItem>
                <SelectItem value="digital-twins">Digitale Zwillinge</SelectItem>
                <SelectItem value="both">Beides</SelectItem>
                <SelectItem value="other">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.service && (
              <p className="text-sm text-destructive mt-1">{fieldErrors.service}</p>
            )}
          </div>

          {/* Service Descriptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { value: "ai-consulting", icon: "🤖", label: "KI Beratung", desc: "Strategische KI-Integration" },
              { value: "ai-training", icon: "📚", label: "KI Schulung", desc: "Workshops & Training" },
              { value: "digital-twins", icon: "🌐", label: "Digitale Zwillinge", desc: "Virtuelle Abbilder" },
              { value: "other", icon: "💡", label: "Sonstiges", desc: "Individuelle Anfrage" },
            ].map((svc) => (
              <button
                key={svc.value}
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, service: svc.value }));
                  setFieldErrors(prev => ({ ...prev, service: undefined }));
                }}
                className={`
                  p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer
                  ${formData.service === svc.value
                    ? "border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/30"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{svc.icon}</span>
                  <span className="font-medium text-sm text-white/90">{svc.label}</span>
                </div>
                <p className="text-xs text-white/50">{svc.desc}</p>
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Nachricht",
      description: "Erzählen Sie uns mehr über Ihr Projekt",
      validate: validateStep3,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Ihre Nachricht *</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Beschreiben Sie kurz Ihr Anliegen, Ihre Herausforderungen und Ihre Ziele..."
              rows={6}
              aria-invalid={!!fieldErrors.message}
              aria-describedby={fieldErrors.message ? "message-error" : undefined}
            />
            {fieldErrors.message && (
              <p id="message-error" className="text-sm text-destructive mt-1">{fieldErrors.message}</p>
            )}
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
            <Sparkles className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <p className="text-xs text-white/50">
              Je detaillierter Ihre Beschreibung, desto besser können wir uns auf unser Gespräch vorbereiten.
              Nennen Sie gerne konkrete Herausforderungen oder Ziele.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const contactInfo = [
    {
      icon: Mail,
      title: "E-Mail",
      content: "info@mimitechai.com",
      link: "mailto:info@mimitechai.com",
    },
    {
      icon: Phone,
      title: "Telefon",
      content: "+49 1575 8805737",
      link: "tel:+4915758805737",
    },
    {
      icon: MapPin,
      title: "Standort",
      content: "Bad Liebenzell, Deutschland",
      link: null,
    },
  ];

  const reasons = [
    {
      icon: MessageSquare,
      title: "Persönliche Beratung",
      description: "Individuelle Lösungen für Ihre spezifischen Anforderungen",
    },
    {
      icon: Clock,
      title: "Schnelle Reaktion",
      description: "Wir melden uns innerhalb von 24 Stunden bei Ihnen",
    },
    {
      icon: CheckCircle,
      title: "Kostenlose Erstberatung",
      description: "Unverbindliches Gespräch zur Analyse Ihrer Möglichkeiten",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <Breadcrumb items={[{ label: "Kontakt" }]} />

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-[1.1] tracking-tight">
              Kontaktieren Sie <span className="neon-text">uns</span>
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground mb-8 font-light leading-relaxed">
              Bereit für den nächsten Schritt? Lassen Sie uns gemeinsam herausfinden,
              wie KI und Digitale Zwillinge Ihr Unternehmen voranbringen können.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-10 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1, delayChildren: 0.3 }
              }
            }}
          >
            {contactInfo.map((info) => (
              <motion.div
                key={info.title}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
                }}
              >
                <Card className="text-center hover:border-primary transition-all duration-300 h-full">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <info.icon className="text-primary" size={24} />
                    </div>
                    <CardTitle className="text-xl md:text-2xl font-bold">{info.title}</CardTitle>
                    <CardDescription>
                      {info.link ? (
                        <a href={info.link} className="text-foreground hover:text-primary transition-colors break-all">
                          {info.content}
                        </a>
                      ) : (
                        <span className="text-foreground">{info.content}</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Main Content — FormStepper */}
      <section className="py-10 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-3xl md:text-4xl font-bold">Beratung anfragen</CardTitle>
                  <CardDescription className="text-lg md:text-xl leading-relaxed">
                    In 3 einfachen Schritten zu Ihrer Anfrage.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {isSubmitted ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: "spring" as const, stiffness: 200, damping: 20 }}
                        className="flex flex-col items-center justify-center py-12 space-y-4"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1, type: "spring" as const, stiffness: 200 }}
                          className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center"
                        >
                          <PartyPopper className="w-10 h-10 text-green-400" />
                        </motion.div>
                        <motion.h3
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-2xl font-bold text-white"
                        >
                          Vielen Dank, {formData.name.split(" ")[0]}!
                        </motion.h3>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-white/60 text-center max-w-sm"
                        >
                          Ihre Nachricht wurde erfolgreich versendet.
                          Wir melden uns innerhalb von 24 Stunden bei Ihnen.
                        </motion.p>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setIsSubmitted(false);
                              setFormData({ name: "", email: "", company: "", phone: "", service: "", message: "" });
                              setFieldErrors({});
                            }}
                            className="text-cyan-400 hover:text-cyan-300"
                          >
                            Neue Anfrage senden
                          </Button>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="form"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {error && (
                          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                            <AlertCircle className="text-destructive flex-shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                              <p className="text-destructive text-sm">{error}</p>
                              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                                <a
                                  href="mailto:info@mimitechai.com"
                                  className="inline-flex items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                  Per E-Mail senden
                                </a>
                                <a
                                  href="tel:+4915758805737"
                                  className="inline-flex items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                  Jetzt anrufen
                                </a>
                                <button
                                  type="button"
                                  onClick={copyMessageToClipboard}
                                  className="inline-flex items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                  Nachricht kopieren
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        <FormStepper
                          steps={formSteps}
                          onComplete={handleSubmit}
                          isSubmitting={isSubmitting}
                          submitLabel="Nachricht senden"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* Why Contact Us */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Warum uns kontaktieren?</h2>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed font-light">
                  Wir nehmen uns Zeit für Sie und Ihre Herausforderungen.
                  In einem ersten unverbindlichen Gespräch analysieren wir gemeinsam
                  Ihre Möglichkeiten und zeigen konkrete Ansätze auf.
                </p>
              </div>

              <motion.div
                className="space-y-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1, delayChildren: 0.7 }
                  }
                }}
              >
                {reasons.map((reason) => (
                  <motion.div
                    key={reason.title}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
                    }}
                    whileHover={prefersReducedMotion ? {} : { y: -4, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:border-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <motion.div
                            className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-primary/20"
                            whileHover={prefersReducedMotion ? {} : { scale: 1.1, rotate: 5 }}
                          >
                            <reason.icon className="text-primary" size={24} />
                          </motion.div>
                          <div>
                            <CardTitle className="text-xl md:text-2xl font-bold mb-2">{reason.title}</CardTitle>
                            <CardDescription className="text-base md:text-lg leading-relaxed">{reason.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>

              <Card className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-card/60 border-primary/30 grainy-gradient">
                <div className="absolute inset-0 mesh-gradient opacity-10 blur-2xl" />
                <CardHeader className="relative z-10">
                  <CardTitle className="text-2xl md:text-3xl font-bold">Unsere Erreichbarkeit</CardTitle>
                  <CardDescription>
                    <div className="space-y-2 mt-4">
                      <p className="text-foreground">
                        <strong>Montag - Freitag:</strong> 9:00 - 18:00 Uhr
                      </p>
                      <p className="text-muted-foreground">
                        Außerhalb dieser Zeiten beantworten wir Ihre Anfrage
                        am nächsten Werktag.
                      </p>
                    </div>
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <RelatedServices currentSlug="contact" />
      <Footer />
    </div>
  );
}