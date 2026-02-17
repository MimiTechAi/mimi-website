"use client";

/**
 * MIMI Agent — Settings Page
 * 
 * Fully functional settings with localStorage persistence.
 * Controls tool permissions, system prompt, and agent behavior.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import React, { useState } from 'react';
import { GlassCard } from '@/components/mimi/ui/GlassCard';
import { useMimiSettings, DEFAULT_SETTINGS } from '@/lib/mimi/settings-context';
import {
    Globe, Code2, FolderOpen, Brain, Save, RotateCcw,
    Check, Sparkles, Languages, MessageSquare, Thermometer,
    Zap, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════
// TOGGLE COMPONENT
// ═══════════════════════════════════════════════════════════

function Toggle({ enabled, onChange, label, description, icon: Icon }: {
    enabled: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description: string;
    icon: React.ElementType;
}) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/8 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${enabled ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-white/30'
                    }`}>
                    <Icon size={16} />
                </div>
                <div>
                    <h4 className="text-sm font-medium text-cyan-50">{label}</h4>
                    <p className="text-[11px] text-cyan-200/40">{description}</p>
                </div>
            </div>
            <button
                onClick={() => onChange(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${enabled ? 'bg-cyan-600' : 'bg-white/10'
                    }`}
                role="switch"
                aria-checked={enabled}
                aria-label={label}
            >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// SLIDER COMPONENT
// ═══════════════════════════════════════════════════════════

function Slider({ value, onChange, min, max, step, label, description, icon: Icon, formatValue }: {
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step: number;
    label: string;
    description: string;
    icon: React.ElementType;
    formatValue?: (v: number) => string;
}) {
    return (
        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center text-cyan-300">
                    <Icon size={16} />
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-medium text-cyan-50">{label}</h4>
                    <p className="text-[11px] text-cyan-200/40">{description}</p>
                </div>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded">
                    {formatValue ? formatValue(value) : value}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 
                    [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(34,211,238,0.5)]"
            />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
// SETTINGS PAGE
// ═══════════════════════════════════════════════════════════

export default function SettingsPage() {
    const { settings, updateSetting, resetToDefaults } = useMimiSettings();
    const [saved, setSaved] = useState(false);
    const [promptDraft, setPromptDraft] = useState(settings.systemPrompt);

    const handleSavePrompt = () => {
        updateSetting('systemPrompt', promptDraft);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        resetToDefaults();
        setPromptDraft(DEFAULT_SETTINGS.systemPrompt);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto text-cyan-50">
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400">
                    Agent Configuration
                </h1>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-cyan-200/60 hover:text-cyan-200 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
                >
                    <RotateCcw size={12} />
                    Reset
                </button>
            </div>
            <p className="text-sm text-cyan-200/50 mb-8">
                Steuere wie MIMI arbeitet — alle Einstellungen werden lokal gespeichert.
            </p>

            {/* Saved Toast */}
            <AnimatePresence>
                {saved && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-lg text-emerald-300 text-sm backdrop-blur-xl"
                    >
                        <Check size={14} />
                        Gespeichert!
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid gap-6">
                {/* Tools & Permissions */}
                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold text-cyan-100 mb-4 flex items-center gap-2">
                        <span className="text-xl">🛡️</span> Tools & Berechtigungen
                    </h2>
                    <div className="space-y-3">
                        <Toggle
                            enabled={settings.webBrowsing}
                            onChange={(v) => updateSetting('webBrowsing', v)}
                            label="Web-Recherche"
                            description="MIMI darf das Internet durchsuchen (DuckDuckGo)"
                            icon={Globe}
                        />
                        <Toggle
                            enabled={settings.codeExecution}
                            onChange={(v) => updateSetting('codeExecution', v)}
                            label="Code-Ausführung"
                            description="Python & JavaScript im Sandbox ausführen"
                            icon={Code2}
                        />
                        <Toggle
                            enabled={settings.fileSystemAccess}
                            onChange={(v) => updateSetting('fileSystemAccess', v)}
                            label="Dateisystem-Zugriff"
                            description="Lese-/Schreibzugriff auf den Workspace"
                            icon={FolderOpen}
                        />
                    </div>
                </GlassCard>

                {/* Agent Behavior */}
                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold text-cyan-100 mb-4 flex items-center gap-2">
                        <span className="text-xl">🧠</span> Verhalten
                    </h2>
                    <div className="space-y-3">
                        <Toggle
                            enabled={settings.verboseThinking}
                            onChange={(v) => updateSetting('verboseThinking', v)}
                            label="Denkprozess anzeigen"
                            description="Zeigt MIMIs Gedanken in der ThinkingBar"
                            icon={Eye}
                        />
                        <Toggle
                            enabled={settings.streamingEnabled}
                            onChange={(v) => updateSetting('streamingEnabled', v)}
                            label="Streaming-Antworten"
                            description="Token-für-Token Antwort statt komplett auf einmal"
                            icon={Zap}
                        />

                        {/* Language Selection */}
                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center text-cyan-300">
                                    <Languages size={16} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-cyan-50">Sprache</h4>
                                    <p className="text-[11px] text-cyan-200/40">System- und Antwortsprache</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {(['de', 'en'] as const).map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => updateSetting('language', lang)}
                                        className={`p-2 rounded-lg text-xs font-medium transition-all ${settings.language === lang
                                            ? 'bg-cyan-500/20 border border-cyan-400/30 text-cyan-200'
                                            : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
                                            }`}
                                    >
                                        {lang === 'de' ? '🇩🇪 Deutsch' : '🇬🇧 English'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Performance */}
                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold text-cyan-100 mb-4 flex items-center gap-2">
                        <span className="text-xl">⚡</span> Performance
                    </h2>
                    <div className="space-y-3">
                        <Slider
                            value={settings.maxTokens}
                            onChange={(v) => updateSetting('maxTokens', v)}
                            min={256}
                            max={4096}
                            step={256}
                            label="Max Tokens"
                            description="Maximale Antwortlänge in Tokens"
                            icon={MessageSquare}
                        />
                        <Slider
                            value={settings.temperature}
                            onChange={(v) => updateSetting('temperature', v)}
                            min={0}
                            max={1.5}
                            step={0.1}
                            label="Temperatur"
                            description="Kreativität der Antworten (niedrig = präzise, hoch = kreativ)"
                            icon={Thermometer}
                            formatValue={(v) => v.toFixed(1)}
                        />
                    </div>
                </GlassCard>

                {/* System Prompt */}
                <GlassCard className="p-6">
                    <h2 className="text-lg font-semibold text-cyan-100 mb-4 flex items-center gap-2">
                        <span className="text-xl">📝</span> System-Persona
                    </h2>
                    <textarea
                        className="w-full h-36 bg-black/20 border border-cyan-500/20 rounded-lg p-3 text-xs text-cyan-50 font-mono focus:outline-none focus:border-cyan-400 transition-colors resize-none"
                        value={promptDraft}
                        onChange={(e) => setPromptDraft(e.target.value)}
                        placeholder="System Prompt für MIMI..."
                    />
                    <div className="flex items-center justify-between mt-3">
                        <p className="text-[10px] text-cyan-200/30">
                            {promptDraft.length} Zeichen · wird beim nächsten Chat aktiv
                        </p>
                        <button
                            onClick={handleSavePrompt}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all"
                        >
                            <Save size={12} />
                            Speichern
                        </button>
                    </div>
                </GlassCard>

                {/* Info Card */}
                <GlassCard className="p-4 border-cyan-500/10">
                    <div className="flex items-start gap-3">
                        <Sparkles size={16} className="text-cyan-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs text-cyan-200/60 leading-relaxed">
                                Alle Einstellungen werden <strong className="text-cyan-300">lokal in Ihrem Browser</strong> gespeichert.
                                Keine Daten verlassen Ihr Gerät. MIMI nutzt Phi-3.5 Mini via WebGPU —
                                komplett ohne Cloud-APIs oder externe Dienste.
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
