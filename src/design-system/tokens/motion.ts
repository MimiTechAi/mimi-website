/**
 * 🎬 MiMi Tech AI – Design Tokens: Motion
 *
 * Framer Motion variants + CSS timing functions.
 * Extends existing src/lib/motion.ts with additional atoms.
 */

import type { Variants, Transition } from "framer-motion";

// ============================================
// TIMING & EASING — CSS + Framer Motion
// ============================================

export const easing = {
    outExpo: [0.22, 1, 0.36, 1] as const,
    spring: [0.4, 0, 0.2, 1] as const,
    inOut: [0.42, 0, 0.58, 1] as const,
};

export const duration = {
    fast: 0.15,
    normal: 0.3,
    slow: 0.6,
    xslow: 1.0,
};

// ============================================
// FRAMER MOTION VARIANTS — Scroll Animations
// ============================================

/** Fade up from below — for sections */
export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: duration.slow, ease: easing.outExpo },
    },
};

/** Fade up small — for items within sections */
export const fadeUpItem: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: duration.normal, ease: easing.spring },
    },
};

/** Stagger container — delays children in sequence */
export const stagger: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
};

/** Scale in — for trust badges, icons */
export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: duration.normal, ease: easing.outExpo },
    },
};

/** Slide in from left */
export const slideInLeft: Variants = {
    hidden: { opacity: 0, x: -24 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: duration.slow, ease: easing.outExpo },
    },
};

// ============================================
// INTERACTIVE — Button & Card Hover
// ============================================

export const buttonSpring: Transition = {
    type: "spring",
    stiffness: 260,
    damping: 18,
};

export const hoverLift = {
    whileHover: { y: -4, transition: { duration: duration.normal } },
};

export const hoverGlow = {
    whileHover: {
        boxShadow: "0 0 24px rgba(0,230,255,0.4)",
        transition: { duration: duration.normal },
    },
};

export const tapScale = {
    whileTap: { scale: 0.97 },
};
