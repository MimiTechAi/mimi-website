"use client";

/**
 * BrowserCheckModal — Proaktiver Browser-Kompatibilitäts-Check
 *
 * Erscheint beim ersten Besuch wenn WebGPU nicht unterstützt wird.
 * Zeigt klare Browser-Empfehlungen mit Download-Links.
 * Wird nur 1x pro Browser-Session angezeigt (localStorage).
 *
 * Adressiert Interview-Feedback: Sandra (Steuerberaterin) hat 20 Minuten
 * gebraucht um herauszufinden, dass sie Chrome braucht.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, ExternalLink, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "mimi_browser_check_dismissed";

interface Browser {
    name: string;
    description: string;
    url: string;
    emoji: string;
    color: string;
}

const RECOMMENDED_BROWSERS: Browser[] = [
    {
        name: "Google Chrome",
        description: "Beste WebGPU-Performance",
        url: "https://www.google.com/chrome/",
        emoji: "🌐",
        color: "rgba(66,133,244,0.15)",
    },
    {
        name: "Microsoft Edge",
        description: "Ideal für Windows-Nutzer",
        url: "https://www.microsoft.com/edge",
        emoji: "🔷",
        color: "rgba(0,120,212,0.15)",
    },
    {
        name: "Brave Browser",
        description: "Datenschutzfokussiert + WebGPU",
        url: "https://brave.com/",
        emoji: "🦁",
        color: "rgba(251,140,0,0.15)",
    },
];

function checkWebGPUSupport(): boolean {
    if (typeof window === "undefined") return true; // SSR: assume supported
    return "gpu" in navigator;
}

export function BrowserCheckModal() {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Only show if: WebGPU not supported AND not previously dismissed
        const alreadyDismissed = localStorage.getItem(STORAGE_KEY) === "true";
        if (alreadyDismissed) return;

        const supported = checkWebGPUSupport();
        if (!supported) {
            // Small delay so page renders first
            const timer = setTimeout(() => setIsVisible(true), 800);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem(STORAGE_KEY, "true");
        setTimeout(() => setIsVisible(false), 300);
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {!isDismissed && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.7)",
                            backdropFilter: "blur(4px)",
                            zIndex: 9998,
                        }}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        style={{
                            position: "fixed",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            zIndex: 9999,
                            width: "min(480px, 90vw)",
                            background: "linear-gradient(135deg, rgba(15,15,25,0.98) 0%, rgba(20,20,35,0.98) 100%)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "20px",
                            padding: "32px",
                            boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
                        }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="browser-check-title"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleDismiss}
                            style={{
                                position: "absolute",
                                top: "16px",
                                right: "16px",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "8px",
                                padding: "6px",
                                cursor: "pointer",
                                color: "rgba(255,255,255,0.5)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            aria-label="Schließen"
                        >
                            <X size={16} />
                        </button>

                        {/* Icon */}
                        <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                            <div style={{
                                width: "64px",
                                height: "64px",
                                borderRadius: "50%",
                                background: "rgba(251,191,36,0.1)",
                                border: "1px solid rgba(251,191,36,0.3)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}>
                                <AlertTriangle size={28} color="rgb(251,191,36)" />
                            </div>
                        </div>

                        {/* Title */}
                        <h2
                            id="browser-check-title"
                            style={{
                                textAlign: "center",
                                fontSize: "20px",
                                fontWeight: 700,
                                color: "white",
                                marginBottom: "8px",
                            }}
                        >
                            Browser-Update empfohlen
                        </h2>

                        {/* Description */}
                        <p style={{
                            textAlign: "center",
                            color: "rgba(255,255,255,0.55)",
                            fontSize: "14px",
                            lineHeight: 1.6,
                            marginBottom: "24px",
                        }}>
                            MIMI nutzt <strong style={{ color: "rgba(255,255,255,0.8)" }}>WebGPU</strong> um KI-Modelle
                            direkt auf deinem Gerät auszuführen — ohne Cloud, ohne Datenweitergabe.
                            Dein aktueller Browser unterstützt WebGPU noch nicht.
                        </p>

                        {/* Browser List */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                            <p style={{
                                fontSize: "11px",
                                color: "rgba(255,255,255,0.35)",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                marginBottom: "4px",
                            }}>
                                Empfohlene Browser — kostenlos &amp; in 2 Minuten installiert:
                            </p>
                            {RECOMMENDED_BROWSERS.map((browser) => (
                                <a
                                    key={browser.name}
                                    href={browser.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "14px",
                                        padding: "14px 16px",
                                        borderRadius: "12px",
                                        background: browser.color,
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        textDecoration: "none",
                                        transition: "all 0.15s ease",
                                        cursor: "pointer",
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)";
                                        (e.currentTarget as HTMLElement).style.transform = "translateX(3px)";
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                                        (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                                    }}
                                >
                                    <span style={{ fontSize: "24px" }}>{browser.emoji}</span>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ color: "white", fontWeight: 600, fontSize: "14px", margin: 0 }}>
                                            {browser.name}
                                        </p>
                                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: 0 }}>
                                            {browser.description}
                                        </p>
                                    </div>
                                    <ExternalLink size={14} color="rgba(255,255,255,0.3)" />
                                </a>
                            ))}
                        </div>

                        {/* Privacy note */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 16px",
                            borderRadius: "10px",
                            background: "rgba(34,197,94,0.06)",
                            border: "1px solid rgba(34,197,94,0.2)",
                            marginBottom: "16px",
                        }}>
                            <CheckCircle2 size={16} color="rgb(134,239,172)" />
                            <p style={{ color: "rgba(134,239,172,0.9)", fontSize: "12px", margin: 0 }}>
                                Nach dem Wechsel: Alle Daten bleiben 100% lokal auf deinem Gerät.
                            </p>
                        </div>

                        {/* Dismiss */}
                        <button
                            onClick={handleDismiss}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "10px",
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "rgba(255,255,255,0.4)",
                                fontSize: "13px",
                                cursor: "pointer",
                            }}
                        >
                            Trotzdem fortfahren (eingeschränkte Funktionalität)
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
