/**
 * ✨ MiMi Tech AI – Design Tokens: Shadows & Glows
 *
 * Maps to CSS custom properties in globals.css.
 * Glow effects use the brand cyan and NVIDIA green.
 */

export const shadows = {
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)",
    xl: "var(--shadow-xl)",
} as const;

export const glows = {
    cyan: "var(--glow-cyan)", // 0 0 24px rgba(0,230,255,0.4)
    cyanIntense: "var(--glow-cyan-intense)", // 0 0 48px rgba(0,230,255,0.6)
    cyanShadow: "var(--shadow-cyan)", // 0 0 32px rgba(0,230,255,0.3)
    green: "var(--glow-green)", // 0 0 20px rgba(118,185,0,0.3)
} as const;

export const gradients = {
    hero: "var(--gradient-hero)", // cyan → nvidia green
    card: "var(--gradient-card)", // subtle cyan → green overlay
    cardHover: "var(--gradient-hover)", // stronger on hover
    cyan: "var(--gradient-cyan)", // cyan → light cyan
    /** Glassmorphism background for premium surfaces */
    glass: {
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
    },
} as const;
