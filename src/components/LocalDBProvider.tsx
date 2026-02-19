"use client";

/**
 * MiMi Tech AI — Local Database Initialization Provider
 *
 * Wraps the internal portal pages to ensure the IndexedDB
 * is seeded with demo data on first visit before rendering.
 *
 * Usage: Wrap internal/layout.tsx children with <LocalDBProvider>
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import React, { useEffect, useState, createContext, useContext } from 'react';
import { seedIfEmpty } from '@/lib/seed-data';

interface LocalDBContextType {
    isReady: boolean;
}

const LocalDBContext = createContext<LocalDBContextType>({ isReady: false });

export function useLocalDB() {
    return useContext(LocalDBContext);
}

export function LocalDBProvider({ children }: { children: React.ReactNode }) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        seedIfEmpty()
            .then(() => setIsReady(true))
            .catch((err) => {
                console.error('[LocalDBProvider] Initialization failed:', err);
                // Still render children even on error — graceful degradation
                setIsReady(true);
            });
    }, []);

    if (!isReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-950">
                <div className="text-center">
                    <div className="relative w-12 h-12 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping" />
                        <div className="absolute inset-0 rounded-full border-2 border-t-cyan-400 animate-spin" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Datenbank wird initialisiert...</p>
                </div>
            </div>
        );
    }

    return (
        <LocalDBContext.Provider value={{ isReady }}>
            {children}
        </LocalDBContext.Provider>
    );
}
