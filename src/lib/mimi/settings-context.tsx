"use client";

/**
 * MIMI Agent — Settings Context
 * 
 * Provides app-wide agent settings with localStorage persistence.
 * Controls: tool permissions, system prompt, and UI preferences.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface MimiSettings {
    // Tool Permissions
    webBrowsing: boolean;
    codeExecution: boolean;
    fileSystemAccess: boolean;

    // Agent Behavior
    systemPrompt: string;
    language: 'de' | 'en';
    verboseThinking: boolean;

    // Performance
    maxTokens: number;
    temperature: number;
    streamingEnabled: boolean;
}

interface SettingsContextType {
    settings: MimiSettings;
    updateSetting: <K extends keyof MimiSettings>(key: K, value: MimiSettings[K]) => void;
    updateSettings: (partial: Partial<MimiSettings>) => void;
    resetToDefaults: () => void;
    isToolAllowed: (toolName: string) => boolean;
}

// ═══════════════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════════════

const STORAGE_KEY = 'mimi-agent-settings';

const DEFAULT_SETTINGS: MimiSettings = {
    webBrowsing: true,
    codeExecution: true,
    fileSystemAccess: false,
    systemPrompt: 'Du bist MIMI, ein fortschrittlicher KI-Agent für autonomes Coding und komplexe Problemlösung. Du bevorzugst effizienten, sauberen Code und moderne Ästhetik. Du arbeitest komplett lokal — keine Cloud, keine API-Calls. Die Daten des Users bleiben auf seinem Gerät.',
    language: 'de',
    verboseThinking: true,
    maxTokens: 2048,
    temperature: 0.7,
    streamingEnabled: true,
};

// Tool permission mapping: which tools need which permission
const TOOL_PERMISSION_MAP: Record<string, keyof MimiSettings> = {
    'web_search': 'webBrowsing',
    'execute_python': 'codeExecution',
    'execute_javascript': 'codeExecution',
    'read_file': 'fileSystemAccess',
    'write_file': 'fileSystemAccess',
    'list_files': 'fileSystemAccess',
};

// ═══════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════

const SettingsContext = createContext<SettingsContextType | null>(null);

// ═══════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════

export function MimiSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<MimiSettings>(DEFAULT_SETTINGS);
    const [loaded, setLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to handle new settings added after user saved
                setSettings(prev => ({ ...prev, ...parsed }));
            }
        } catch (e) {
            console.warn('[Settings] Failed to load from localStorage:', e);
        }
        setLoaded(true);
    }, []);

    // Persist to localStorage on change (skip initial load)
    useEffect(() => {
        if (!loaded) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn('[Settings] Failed to save to localStorage:', e);
        }
    }, [settings, loaded]);

    const updateSetting = useCallback(<K extends keyof MimiSettings>(key: K, value: MimiSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const updateSettings = useCallback((partial: Partial<MimiSettings>) => {
        setSettings(prev => ({ ...prev, ...partial }));
    }, []);

    const resetToDefaults = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
    }, []);

    const isToolAllowed = useCallback((toolName: string): boolean => {
        const permissionKey = TOOL_PERMISSION_MAP[toolName];
        if (!permissionKey) return true; // Tools without explicit mapping are always allowed
        return !!settings[permissionKey];
    }, [settings]);

    return (
        <SettingsContext.Provider value={{ settings, updateSetting, updateSettings, resetToDefaults, isToolAllowed }}>
            {children}
        </SettingsContext.Provider>
    );
}

// ═══════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════

export function useMimiSettings(): SettingsContextType {
    const ctx = useContext(SettingsContext);
    if (!ctx) {
        // Fallback for components outside provider — return defaults
        return {
            settings: DEFAULT_SETTINGS,
            updateSetting: () => { },
            updateSettings: () => { },
            resetToDefaults: () => { },
            isToolAllowed: () => true,
        };
    }
    return ctx;
}

export { DEFAULT_SETTINGS };
