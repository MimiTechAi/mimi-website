"use client";

/**
 * MemoryToast — "MIMI merkt sich..." notification
 *
 * Slide-in toast that appears briefly when MIMI stores a memory
 * from the current conversation. Auto-dismisses after 3 seconds.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useState, useEffect, useCallback, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface MemoryToastItem {
    id: string;
    text: string;
    timestamp: number;
}

interface MemoryToastProps {
    toasts: MemoryToastItem[];
    onDismiss: (id: string) => void;
}

export const MemoryToast = memo(function MemoryToast({ toasts, onDismiss }: MemoryToastProps) {
    return (
        <div className="memory-toast-container">
            <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div
                        key={toast.id}
                        className="memory-toast"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <span className="memory-toast-icon">🧠</span>
                        <div className="memory-toast-content">
                            <span className="memory-toast-title">MIMI merkt sich...</span>
                            <span className="memory-toast-text">{toast.text}</span>
                        </div>
                        <button
                            className="memory-toast-close"
                            onClick={() => onDismiss(toast.id)}
                            aria-label="Schließen"
                        >
                            ✕
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
});

/**
 * Hook to manage memory toasts.
 * Call `showMemoryToast(text)` to trigger a notification.
 */
export function useMemoryToasts() {
    const [toasts, setToasts] = useState<MemoryToastItem[]>([]);

    const showMemoryToast = useCallback((text: string) => {
        const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setToasts(prev => [...prev, { id, text, timestamp: Date.now() }]);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Auto-dismiss after 3.5s
    useEffect(() => {
        if (toasts.length === 0) return;
        const timer = setTimeout(() => {
            setToasts(prev => prev.slice(1));
        }, 3500);
        return () => clearTimeout(timer);
    }, [toasts]);

    return { toasts, showMemoryToast, dismissToast };
}

export default MemoryToast;
