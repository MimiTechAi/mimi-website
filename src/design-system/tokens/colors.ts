/**
 * 🎨 MiMi Tech AI – Design Tokens: Colors
 *
 * Single Source of Truth for all brand colors.
 * These map directly to CSS custom properties in globals.css.
 *
 * ⚠️ Do NOT change these values without updating globals.css.
 *
 * Hierarchy:
 *   Primitive → Semantic → Component
 */

// ============================================
// PRIMITIVE TOKENS — Raw color values
// ============================================

export const primitive = {
    cyan: {
        primary: "rgb(0, 230, 255)", // #00E6FF – Exact logo color
        primaryHsl: "hsl(187, 100%, 50%)",
        glow: "rgb(0, 255, 255)", // Brighter for glow effects
        dark: "rgb(0, 180, 200)", // Darker variant
        hover: "rgb(0, 205, 235)", // Hover state
        light: "rgb(102, 243, 255)", // Light variant
    },
    nvidia: {
        green: "#76B900", // NVIDIA brand green – accent only
    },
    blue: {
        brand: "hsl(200, 95%, 55%)",
        light: "hsl(200, 95%, 65%)",
    },
    void: {
        950: "hsl(220, 20%, 3%)", // Deepest
        900: "hsl(220, 20%, 5%)", // Main background
        800: "hsl(220, 18%, 8%)", // Surfaces
        700: "hsl(220, 16%, 12%)", // Cards, modals
        600: "hsl(220, 14%, 15%)", // Hover states
    },
    white: {
        98: "hsl(0, 0%, 98%)", // Primary text
        70: "hsl(220, 5%, 70%)", // Secondary text
        50: "hsl(220, 5%, 50%)", // Tertiary text
    },
    destructive: "hsl(358, 75%, 60%)",
} as const;

// ============================================
// SEMANTIC TOKENS — Purpose-driven aliases
// ============================================

export const semantic = {
    brand: {
        primary: "var(--mimi-cyan-primary)",
        secondary: "var(--nvidia-green)",
    },
    bg: {
        base: "var(--bg-void)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        hover: "var(--bg-hover)",
    },
    text: {
        primary: "var(--text-primary)",
        secondary: "var(--text-secondary)",
        tertiary: "var(--text-tertiary)",
        accent: "var(--text-cyan)",
    },
    border: {
        subtle: "var(--border-subtle)",
        accent: "var(--border-cyan)",
    },
} as const;

// ============================================
// ALPHA VALUES — For overlays and glassmorphism
// ============================================

export const alpha = {
    white: {
        3: "rgba(255, 255, 255, 0.03)",
        5: "rgba(255, 255, 255, 0.05)",
        8: "rgba(255, 255, 255, 0.08)",
        10: "rgba(255, 255, 255, 0.10)",
        15: "rgba(255, 255, 255, 0.15)",
        20: "rgba(255, 255, 255, 0.20)",
    },
    cyan: {
        5: "rgba(0, 230, 255, 0.05)",
        10: "rgba(0, 230, 255, 0.10)",
        20: "rgba(0, 230, 255, 0.20)",
        30: "rgba(0, 230, 255, 0.30)",
        40: "rgba(0, 230, 255, 0.40)",
    },
    nvidia: {
        5: "rgba(118, 185, 0, 0.05)",
        10: "rgba(118, 185, 0, 0.10)",
        30: "rgba(118, 185, 0, 0.30)",
    },
} as const;

// ============================================
// CSS VARIABLE NAMES — for Tailwind/className usage
// ============================================

export const cssVars = {
    primary: "--mimi-cyan-primary",
    nvidiaGreen: "--nvidia-green",
    bgVoid: "--bg-void",
    bgSurface: "--bg-surface",
    bgElevated: "--bg-elevated",
    bgHover: "--bg-hover",
    textPrimary: "--text-primary",
    textSecondary: "--text-secondary",
    textTertiary: "--text-tertiary",
    borderSubtle: "--border-subtle",
} as const;
