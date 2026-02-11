"use client";

/**
 * Unsupported Browser Component
 * Fallback für Browser ohne WebGPU-Unterstützung
 */

import { motion } from "framer-motion";
import { AlertTriangle, Chrome, Globe, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface UnsupportedBrowserProps {
    error: string;
}

export default function UnsupportedBrowser({ error }: UnsupportedBrowserProps) {
    // Browser-spezifische Download-Links
    const browsers = [
        {
            name: "Google Chrome",
            icon: Chrome,
            url: "https://www.google.com/chrome/",
            color: "from-blue-500 to-green-500"
        },
        {
            name: "Microsoft Edge",
            icon: Globe,
            url: "https://www.microsoft.com/edge",
            color: "from-blue-600 to-cyan-500"
        },
        {
            name: "Brave Browser",
            icon: Laptop,
            url: "https://brave.com/",
            color: "from-orange-500 to-red-500"
        }
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
            {/* Warning Icon */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-6"
            >
                <AlertTriangle className="w-12 h-12 text-yellow-500" />
            </motion.div>

            {/* Titel */}
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white mb-4"
            >
                Browser nicht kompatibel
            </motion.h2>

            {/* Fehlermeldung */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white/60 max-w-md mb-8"
            >
                {error}
            </motion.p>

            {/* Erklärung */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-lg mb-8"
            >
                <h3 className="font-semibold text-white mb-3">
                    Was ist WebGPU?
                </h3>
                <p className="text-white/60 text-sm">
                    WebGPU ist eine moderne Browser-Technologie, die es ermöglicht,
                    KI-Modelle direkt auf Ihrer Grafikkarte auszuführen. Das bedeutet:
                    schnelle Antworten, kein Internet erforderlich, und 100% Privatsphäre.
                </p>
            </motion.div>

            {/* Browser-Empfehlungen */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4 w-full max-w-md"
            >
                <p className="text-white/40 text-sm mb-4">
                    Empfohlene Browser mit WebGPU-Unterstützung:
                </p>

                <div className="grid gap-3">
                    {browsers.map((browser, index) => (
                        <motion.a
                            key={browser.name}
                            href={browser.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${browser.color} flex items-center justify-center`}>
                                <browser.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-medium text-white group-hover:text-brand-cyan transition-colors">
                                    {browser.name}
                                </p>
                                <p className="text-sm text-white/40">
                                    WebGPU unterstützt
                                </p>
                            </div>
                            <span className="text-white/40 group-hover:text-white transition-colors">
                                →
                            </span>
                        </motion.a>
                    ))}
                </div>
            </motion.div>

            {/* Zurück-Link */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="mt-8"
            >
                <Button asChild variant="ghost" className="text-white/50 hover:text-white">
                    <Link href="/">
                        ← Zurück zur Startseite
                    </Link>
                </Button>
            </motion.div>
        </div>
    );
}
