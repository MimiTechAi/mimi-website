"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, User, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import SpotlightCard from "@/components/SpotlightCard";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();

  // Passwortstärke überprüfen
  useEffect(() => {
    if (password.length === 0) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    setPasswordStrength(strength);
  }, [password]);

  const validateEmail = (email: string) => {
    const mimitechaiEmailRegex = /^[^\s@]+@mimitechai\.com$/;
    return mimitechaiEmailRegex.test(email);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return "bg-white/10";
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength <= 2) return "bg-orange-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return "";
    if (passwordStrength <= 1) return "Sehr schwach";
    if (passwordStrength <= 2) return "Schwach";
    if (passwordStrength <= 3) return "Mittel";
    return "Stark";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error("Bitte verwenden Sie Ihre Firmen-E-Mail-Adresse (@mimitechai.com)");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwörter stimmen nicht überein");
      return;
    }

    // Strenge Passwortanforderungen wie auf der Login-Seite
    if (password.length < 8) {
      toast.error("Das Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    if (passwordStrength < 3) {
      toast.error("Bitte verwenden Sie ein stärkeres Passwort mit Großbuchstaben, Zahlen und Sonderzeichen");
      return;
    }

    setIsLoading(true);

    try {
      // API-Aufruf für die Registrierung
      const response = await fetch('/api/internal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Registrierung erfolgreich! Bitte melden Sie sich an.");
        router.push("/internal/login");
      } else {
        toast.error(data.message || "Registrierung fehlgeschlagen");
      }
    } catch (error) {
      toast.error("Netzwerkfehler - Bitte versuchen Sie es später erneut");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-background z-0" />
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-brand-cyan/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-nvidia-green/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <SpotlightCard className="glass-premium border-none shadow-2xl overflow-hidden group">
          <div className="card-gradient-overlay" />
          <div className="relative z-10">
            <div className="space-y-1 text-center pb-2 pt-6 px-6">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto bg-gradient-to-br from-brand-cyan to-nvidia-green w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,240,255,0.3)]"
              >
                <ShieldCheck className="text-white h-8 w-8" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white">
                Konto erstellen
              </h2>
              <p className="text-gray-400 text-base">
                Werden Sie Teil des MiMi Tech AI Teams
              </p>
            </div>
            <div className="pt-6 px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Name</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-brand-cyan transition-colors" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Vorname Nachname"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-brand-cyan/50 focus:ring-brand-cyan/20 transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">E-Mail</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-brand-cyan transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@mimitechai.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-brand-cyan/50 focus:ring-brand-cyan/20 transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">Passwort</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-brand-cyan transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mindestens 8 Zeichen"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-brand-cyan/50 focus:ring-brand-cyan/20 transition-all duration-300"
                    />
                  </div>
                  {password.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        {[...Array(4)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ width: 0 }}
                            animate={{ width: "25%" }}
                            className={`h-full transition-colors duration-300 ${i < passwordStrength ? getPasswordStrengthColor() : "bg-transparent"
                              }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs ${passwordStrength < 3 ? 'text-red-400' : 'text-green-400'}`}>
                        Passwortstärke: {getPasswordStrengthText()}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300">Passwort bestätigen</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-brand-cyan transition-colors" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Passwort wiederholen"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-brand-cyan/50 focus:ring-brand-cyan/20 transition-all duration-300"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-brand-cyan-light hover:to-brand-blue-light text-black font-medium shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all duration-300 group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent mr-2"></div>
                      Wird erstellt...
                    </>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Konto erstellen <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-400">
                  Bereits ein Konto?{" "}
                  <Link
                    href="/internal/login"
                    className="text-brand-cyan hover:text-brand-cyan-light font-medium transition-colors hover:underline decoration-brand-cyan/30 underline-offset-4"
                  >
                    Jetzt anmelden
                  </Link>
                </p>
              </div>
            </div>
            <div className="p-4 bg-white/5 border-t border-white/10 text-center">
              <p className="text-xs text-gray-500">
                Nur für MiMi Tech AI Mitarbeiter mit @mimitechai.com E-Mail
              </p>
            </div>
          </div>
        </SpotlightCard>
      </motion.div>
    </div>
  );
}