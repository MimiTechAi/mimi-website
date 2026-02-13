"use client";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

/**
 * Performance: Use lightweight CSS transitions instead of framer-motion.
 * framer-motion's AnimatePresence/motion.div on every route change
 * forces a full JS-driven layout + paint on navigation, blocking LCP.
 * CSS animations are GPU-composited and don't block the main thread.
 */
export default function Template({ children }: { children: React.ReactNode }) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <div
            className={prefersReducedMotion ? undefined : "page-enter"}
            style={{ willChange: "opacity, transform" }}
        >
            {children}
        </div>
    );
}
