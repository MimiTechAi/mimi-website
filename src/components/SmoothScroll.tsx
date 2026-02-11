"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

export default function SmoothScroll() {
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        const isMobile = window.matchMedia("(max-width: 767px)").matches;
        const connection = (navigator as any).connection;
        const saveData = Boolean(connection?.saveData);
        const cores = typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency : 8;
        const isLowPower = saveData || cores <= 4;

        if (prefersReducedMotion || isMobile || isLowPower) {
            return;
        }

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });

        let animationFrameId: number;

        function raf(time: number) {
            lenis.raf(time);
            animationFrameId = requestAnimationFrame(raf);
        }

        animationFrameId = requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
            cancelAnimationFrame(animationFrameId);
        };
    }, [prefersReducedMotion]);

    return null;
}
