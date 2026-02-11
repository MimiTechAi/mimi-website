/**
 * 🔘 MiMi Tech AI – Design Tokens: Border Radius
 *
 * Maps to CSS custom properties in globals.css.
 */

export const radius = {
    sm: "var(--radius-sm)", // calc(0.75rem - 4px) = ~0.5rem
    md: "var(--radius-md)", // calc(0.75rem - 2px) = ~0.56rem
    lg: "var(--radius-lg)", // 0.75rem
    xl: "var(--radius-xl)", // calc(0.75rem + 4px) = ~1.0rem
    full: "9999px", // Pills, avatars
} as const;
