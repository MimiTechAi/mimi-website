/**
 * 🔤 MiMi Tech AI – Design Tokens: Typography
 *
 * Heading scale matching globals.css heading- classes.
 * Font families loaded via next/font (Geist Sans + Geist Mono).
 */

export const fontFamily = {
    sans: "var(--font-geist-sans)",
    mono: "var(--font-geist-mono)",
} as const;

export const fontWeight = {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
} as const;

/**
 * Typography scale — maps to Tailwind classes.
 * Use these as reference; actual implementation via Tailwind.
 */
export const headingScale = {
    display: {
        size: "clamp(3.5rem, 8vw, 6rem)",
        weight: fontWeight.extrabold,
        lineHeight: 1.05,
        letterSpacing: "-0.02em",
        className: "heading-display",
    },
    hero: {
        size: "clamp(2.5rem, 6vw, 4.5rem)",
        weight: fontWeight.extrabold,
        lineHeight: 1.1,
        letterSpacing: "-0.02em",
        className: "heading-hero",
    },
    h1: {
        size: "clamp(2rem, 4vw, 3rem)",
        weight: fontWeight.extrabold,
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        className: "heading-h1",
    },
    h2: {
        size: "clamp(1.5rem, 3vw, 2.25rem)",
        weight: fontWeight.bold,
        lineHeight: 1.2,
        letterSpacing: "-0.01em",
        className: "heading-h2",
    },
    h3: {
        size: "1.25rem",
        weight: fontWeight.semibold,
        lineHeight: 1.3,
        className: "heading-h3",
    },
    sectionLabel: {
        size: "0.75rem",
        weight: fontWeight.semibold,
        lineHeight: 1,
        letterSpacing: "0.15em",
        textTransform: "uppercase" as const,
    },
} as const;

export const bodyScale = {
    lg: { size: "1.125rem", lineHeight: 1.7 },
    base: { size: "1rem", lineHeight: 1.6 },
    sm: { size: "0.875rem", lineHeight: 1.5 },
    xs: { size: "0.75rem", lineHeight: 1.4 },
} as const;
