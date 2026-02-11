"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Mail, ArrowRight, ArrowLeft, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import SpotlightCard from "@/components/SpotlightCard";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const validateEmail = (email: string) => {
        const mimitechaiEmailRegex = /^[^\s@]+@mimitechai\.com$/;
        return mimitechaiEmailRegex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateEmail(email)) {
            toast.error("Bitte verwenden Sie Ihre Firmen-E-Mail-Adresse (@mimitechai.com)");
            return;
        }

        setIsLoading(true);

        try {
            // Simulierte API-Anfrage
            await new Promise(resolve => setTimeout(resolve, 1500));

            setIsSubmitted(true);
            toast.success("E-Mail zum Zurücksetzen des Passworts wurde gesendet.");
        } catch (error) {
            toast.error("Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.");
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
                                <KeyRound className="text-white h-8 w-8" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-white">
                                Passwort vergessen?
                            </h2>
                            <p className="text-gray-400 text-base">
                                Keine Sorge, wir helfen Ihnen dabei.
                            </p>
                        </div>
                        <div className="pt-6 px-6 pb-6">
                            {!isSubmitted ? (
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
                                        <p className="text-xs text-gray-500 mt-1">
                                            Geben Sie die E-Mail-Adresse ein, die mit Ihrem Konto verknüpft ist.
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full h-11 bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-brand-cyan-light hover:to-brand-blue-light text-black font-medium shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all duration-300 group"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent mr-2"></div>
                                                Senden...
                                            </>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                Link senden <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        )}
                                    </Button>
                                </form>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center space-y-4"
                                >
                                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-green-400 text-sm">
                                        <p>
                                            Wenn ein Konto mit der E-Mail <strong>{email}</strong> existiert, haben wir Ihnen Anweisungen zum Zurücksetzen Ihres Passworts gesendet.
                                        </p>
                                    </div>
                                    <p className="text-gray-400 text-sm">
                                        Bitte überprüfen Sie Ihren Posteingang und auch den Spam-Ordner.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="w-full border-white/10 text-white hover:bg-white/5 hover:text-brand-cyan transition-colors"
                                        onClick={() => setIsSubmitted(false)}
                                    >
                                        Erneut versuchen
                                    </Button>
                                </motion.div>
                            )}

                            <div className="mt-8 text-center">
                                <Link
                                    href="/internal/login"
                                    className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors group"
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                                    Zurück zur Anmeldung
                                </Link>
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
