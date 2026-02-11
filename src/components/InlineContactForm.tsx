"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle2, AlertCircle, Check } from "lucide-react";
import { FormValidator, validationRules } from "@/lib/formValidation";

interface InlineContactFormProps {
  service?: string;
  title?: string;
  description?: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  company?: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  message?: string;
  phone?: string;
  company?: string;
}

export default function InlineContactForm({ 
  service = "",
  title = "Interesse geweckt?",
  description = "Kontaktieren Sie uns für eine unverbindliche Erstberatung."
}: InlineContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    message: "",
    company: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation function using FormValidator
  const validateField = (name: string, value: string): string | undefined => {
    const rules = validationRules[name as keyof typeof validationRules];
    if (rules) {
      return FormValidator.validateField(value, name, rules);
    }
    return undefined;
  };

  // Validate all fields using FormValidator
  const validateForm = (): boolean => {
    const validationData = {
      name: formData.name,
      email: formData.email,
      message: formData.message,
      phone: formData.phone,
      company: formData.company || "",
    };
    
    const validationErrors = FormValidator.validateForm(validationData, validationRules);
    const newErrors: ValidationErrors = {};
    
    validationErrors.forEach(error => {
      newErrors[error.field as keyof ValidationErrors] = error.message;
    });
    
    setErrors(newErrors);
    return validationErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ name: true, email: true, message: true });
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          service,
        }),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", phone: "", message: "" });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Validate on change if field was touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate on blur
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  if (submitStatus === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card/50 backdrop-blur-sm border border-primary/30 rounded-xl p-8 text-center"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Nachricht gesendet!</h3>
        <p className="text-muted-foreground mb-6">
          Vielen Dank für Ihre Anfrage. Wir melden uns schnellstmöglich bei Ihnen.
        </p>
        <button
          onClick={() => setSubmitStatus("idle")}
          className="text-primary hover:underline"
        >
          Weitere Nachricht senden
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 md:p-8"
    >
      <div className="mb-6">
        <h3 className="text-2xl md:text-3xl font-bold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4 border-none p-0 m-0">
          <legend className="sr-only">Persönliche Informationen</legend>
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Name *
            </label>
            <div className="relative">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                disabled={isSubmitting}
                aria-describedby={errors.name && touched.name ? "name-error" : undefined}
                aria-invalid={errors.name && touched.name ? "true" : "false"}
                className={`w-full px-4 py-2 pr-10 bg-background border rounded-lg focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  errors.name && touched.name
                    ? "border-destructive focus-visible:ring-destructive"
                    : formData.name && !errors.name && touched.name
                    ? "border-green-500 focus-visible:ring-green-500"
                    : "border-border focus-visible:ring-primary focus-visible:border-transparent"
                }`}
                placeholder="Ihr vollständiger Name"
              />
              {touched.name && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {errors.name ? (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  ) : formData.name ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : null}
                </div>
              )}
            </div>
            {errors.name && touched.name && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive mt-1 flex items-center gap-1"
                id="name-error"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.name}
              </motion.p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              E-Mail *
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                disabled={isSubmitting}
                aria-describedby={errors.email && touched.email ? "email-error" : undefined}
                aria-invalid={errors.email && touched.email ? "true" : "false"}
                className={`w-full px-4 py-2 pr-10 bg-background border rounded-lg focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  errors.email && touched.email
                    ? "border-destructive focus-visible:ring-destructive"
                    : formData.email && !errors.email && touched.email
                    ? "border-green-500 focus-visible:ring-green-500"
                    : "border-border focus-visible:ring-primary focus-visible:border-transparent"
                }`}
                placeholder="ihre@email.de"
              />
              {touched.email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {errors.email ? (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  ) : formData.email ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : null}
                </div>
              )}
            </div>
            {errors.email && touched.email && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive mt-1 flex items-center gap-1"
                id="email-error"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.email}
              </motion.p>
            )}
          </div>
        </fieldset>

        <div>
          <label htmlFor="company" className="block text-sm font-medium mb-2">
            Unternehmen
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            disabled={isSubmitting}
            aria-describedby={errors.company && touched.company ? "company-error" : undefined}
            aria-invalid={errors.company && touched.company ? "true" : "false"}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Name Ihres Unternehmens"
          />
          {errors.company && touched.company && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive mt-1 flex items-center gap-1"
              id="company-error"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.company}
            </motion.p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-2">
            Telefon (optional)
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={isSubmitting}
            aria-describedby={errors.phone && touched.phone ? "phone-error" : undefined}
            aria-invalid={errors.phone && touched.phone ? "true" : "false"}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="+49 123 456789"
          />
          {errors.phone && touched.phone && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive mt-1 flex items-center gap-1"
              id="phone-error"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.phone}
            </motion.p>
          )}
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2">
            Nachricht *
          </label>
          <div className="relative">
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              disabled={isSubmitting}
              rows={4}
              aria-describedby={errors.message && touched.message ? "message-error" : undefined}
              aria-invalid={errors.message && touched.message ? "true" : "false"}
              className={`w-full px-4 py-2 pr-10 bg-background border rounded-lg focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-colors ${
                errors.message && touched.message
                  ? "border-destructive focus-visible:ring-destructive"
                  : formData.message && !errors.message && touched.message
                  ? "border-green-500 focus-visible:ring-green-500"
                  : "border-border focus-visible:ring-primary focus-visible:border-transparent"
              }`}
              placeholder="Erzählen Sie uns von Ihrem Projekt..."
            />
            {touched.message && (
              <div className="absolute right-3 top-3">
                {errors.message ? (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                ) : formData.message ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : null}
              </div>
            )}
          </div>
          {errors.message && touched.message && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive mt-1 flex items-center gap-1"
              id="message-error"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.message}
            </motion.p>
          )}
        </div>

        {submitStatus === "error" && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
            Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt.
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Wird gesendet...
            </>
          ) : (
            <>
              <Send size={18} />
              Nachricht senden
            </>
          )}
        </button>

        <p className="text-xs text-muted-foreground">
          * Pflichtfelder. Ihre Daten werden vertraulich behandelt und nicht an Dritte weitergegeben.
        </p>
      </form>
    </motion.div>
  );
}