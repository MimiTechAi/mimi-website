"use client";

/**
 * useOnboarding — Onboarding Tour State Hook
 * Manages first-visit tour state via localStorage.
 * SSR-safe with typeof window guard.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "mimi-onboarding-seen";

export interface UseOnboardingReturn {
    hasSeenTour: boolean;
    isLoading: boolean;
    markTourSeen: () => void;
    resetTour: () => void;
}

export function useOnboarding(): UseOnboardingReturn {
    const [hasSeenTour, setHasSeenTour] = useState(true); // default true to avoid flash
    const [isLoading, setIsLoading] = useState(true);

    // SSR-safe: read localStorage only on client
    useEffect(() => {
        if (typeof window !== "undefined") {
            const seen = localStorage.getItem(STORAGE_KEY);
            setHasSeenTour(seen === "true");
            setIsLoading(false);
        }
    }, []);

    const markTourSeen = useCallback(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, "true");
        }
        setHasSeenTour(true);
    }, []);

    const resetTour = useCallback(() => {
        if (typeof window !== "undefined") {
            localStorage.removeItem(STORAGE_KEY);
        }
        setHasSeenTour(false);
    }, []);

    return { hasSeenTour, isLoading, markTourSeen, resetTour };
}
