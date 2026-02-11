/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)",
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "var(--primary)",
                    foreground: "var(--primary-foreground)",
                },
                secondary: {
                    DEFAULT: "var(--secondary)",
                    foreground: "var(--secondary-foreground)",
                },
                destructive: {
                    DEFAULT: "var(--destructive)",
                    foreground: "var(--destructive-foreground)",
                },
                muted: {
                    DEFAULT: "var(--muted)",
                    foreground: "var(--muted-foreground)",
                },
                accent: {
                    DEFAULT: "var(--accent)",
                    foreground: "var(--accent-foreground)",
                },
                popover: {
                    DEFAULT: "var(--popover)",
                    foreground: "var(--popover-foreground)",
                },
                card: {
                    DEFAULT: "var(--card)",
                    foreground: "var(--card-foreground)",
                },
                brand: {
                    // MiMi Cyan - Primary brand color (exact from logo)
                    'cyan': 'var(--mimi-cyan-primary)',      // rgb(0, 230, 255)
                    'cyan-primary': 'var(--mimi-cyan-primary)',
                    'cyan-dark': 'var(--mimi-cyan-dark)',
                    'cyan-hover': 'var(--mimi-cyan-hover)',
                    'cyan-light': 'var(--mimi-cyan-light)',
                    'cyan-glow': 'var(--mimi-cyan-glow)',

                    // NVIDIA Green - Secondary brand color
                    'nvidia-green': 'var(--nvidia-green)',
                    'nvidia-green-hover': 'var(--nvidia-green-hover)',
                    'nvidia-green-light': 'var(--nvidia-green-light)',
                    'nvidia-green-dark': 'var(--nvidia-green-dark)',

                    // Brand Blue - Gradient accent
                    'blue': 'var(--brand-blue)',
                    'blue-light': 'var(--brand-blue-light)',

                    // DEPRECATED — Remove in v3.0
                    'deep-void': 'var(--brand-deep-void)',
                },
                // Full cyan color scale (derived from logo color)
                cyan: {
                    50: 'hsl(187, 100%, 95%)',
                    100: 'hsl(187, 100%, 85%)',
                    200: 'hsl(187, 100%, 75%)',
                    300: 'hsl(187, 100%, 65%)',
                    400: 'hsl(187, 100%, 55%)',
                    500: 'var(--mimi-cyan-primary)', // Main brand color
                    600: 'hsl(187, 100%, 45%)',
                    700: 'hsl(187, 100%, 35%)',
                    800: 'hsl(187, 100%, 25%)',
                    900: 'hsl(187, 100%, 15%)',
                }
            },
            spacing: {
                'section': 'var(--space-20)',
                'section-sm': 'var(--space-12)',
                'card-gap': 'var(--space-6)',
                'component-gap': 'var(--space-4)',
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: 0 },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: 0 },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
