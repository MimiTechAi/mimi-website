"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { Sparkles, Lock, Mail, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import SpotlightCard from "@/components/SpotlightCard";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
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

    // E-Mail-Validierung
    if (!validateEmail(email)) {
      toast.error("Bitte verwenden Sie Ihre Firmen-E-Mail-Adresse (@mimitechai.com)");
      return;
    }

    // Passwort-Validierung
    if (password.length < 8) {
      toast.error("Das Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    if (passwordStrength < 3) {
      toast.error("Bitte verwenden Sie ein stärkeres Passwort");
      return;
    }

    setIsLoading(true);

    try {
      // Verwende NextAuth für die Authentifizierung
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Detaillierte Fehlerbehandlung basierend auf dem Antwortstatus
        switch (result.error) {
          case "CredentialsSignin":
            toast.error("Anmeldung fehlgeschlagen: Ungültige Anmeldedaten");
            break;
          default:
            toast.error("Anmeldung fehlgeschlagen: " + result.error);
        }
      } else {
        // Erfolgreiche Anmeldung
        toast.success("Anmeldung erfolgreich");
        router.push("/internal");
      }
    } catch (error: any) {
      // Detaillierte Netzwerkfehlerbehandlung
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        toast.error("Verbindungsfehler: Bitte überprüfen Sie Ihre Internetverbindung");
      } else if (error.name === "AbortError") {
        toast.error("Zeitüberschreitung: Die Anfrage hat zu lange gedauert");
      } else {
        toast.error("Ein unerwarteter Fehler ist aufgetreten - Bitte versuchen Sie es später erneut");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-background z-0" />
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-cyan/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-nvidia-green/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />

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
                <Sparkles className="text-white h-8 w-8" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white">
                Willkommen zurück
              </h2>
              <p className="text-gray-400 text-base">
                Melden Sie sich an, um fortzufahren
              </p>
            </div>
            <div className="pt-6 px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-5">
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
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-gray-300">Passwort</Label>
                    <Link
                      href="/internal/forgot-password"
                      className="text-xs text-brand-cyan hover:text-brand-cyan-light transition-colors"
                    >
                      Passwort vergessen?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-brand-cyan transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked: boolean | "indeterminate") => setRememberMe(checked === true)}
                    className="border-white/20 data-[state=checked]:bg-brand-cyan data-[state=checked]:border-brand-cyan"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none text-gray-400 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                  >
                    Angemeldet bleiben
                  </label>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-brand-cyan-light hover:to-brand-blue-light text-black font-medium shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all duration-300 group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent mr-2"></div>
                      Anmelden...
                    </>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Anmelden <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-400">
                  Noch keinen Zugang?{" "}
                  <Link
                    href="/internal/register"
                    className="text-brand-cyan hover:text-brand-cyan-light font-medium transition-colors hover:underline decoration-brand-cyan/30 underline-offset-4"
                  >
                    Jetzt registrieren
                  </Link>
                </p>
              </div>
            </div>
            <div className="p-4 bg-white/5 border-t border-white/10 text-center">
              <p className="text-xs text-gray-500">
                Geschützter Bereich • MiMi Tech AI
              </p>
            </div>
          </div>
        </SpotlightCard>
      </motion.div>
    </div>
  );
}