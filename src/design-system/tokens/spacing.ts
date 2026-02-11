/**
 * 📏 MiMi Tech AI – Design Tokens: Spacing
 *
 * 8px-based spacing scale.
 * Maps to CSS custom properties --space-{n} in globals.css.
 */

export const spacing = {
    1: "0.25rem", // 4px
    2: "0.5rem", // 8px
    3: "0.75rem", // 12px
    4: "1rem", // 16px
    5: "1.25rem", // 20px
    6: "1.5rem", // 24px
    8: "2rem", // 32px
    10: "2.5rem", // 40px
    12: "3rem", // 48px
    16: "4rem", // 64px
    20: "5rem", // 80px
    24: "6rem", // 96px
} as const;

/** Section padding for consistent vertical rhythm */
export const sectionSpacing = {
    sm: "var(--space-12)", // 48px – compact sections
    md: "var(--space-16)", // 64px – default sections
    lg: "var(--space-20)", // 80px – hero / CTA sections
    xl: "var(--space-24)", // 96px – major breaks
} as const;

/** Container max-width */
export const container = {
    maxWidth: "1200px",
    padding: "var(--space-6)", // 24px horizontal padding
} as const;
