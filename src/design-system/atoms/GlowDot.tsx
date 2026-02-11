"use client";

import { cn } from "@/lib/utils";

interface GlowDotProps {
    color?: "cyan" | "green";
    className?: string;
}

/**
 * Atom: GlowDot
 *
 * Pulsing status indicator dot with glow.
 * Used for "live" or "active" indicators (e.g. NVIDIA Connect).
 */
export function GlowDot({ color = "green", className }: GlowDotProps) {
    return (
        <span
            className={cn(
                "inline-block h-2 w-2 rounded-full animate-pulse",
                color === "green"
                    ? "bg-[#76B900] shadow-[0_0_12px_rgba(118,185,0,0.5)]"
                    : "bg-[rgb(0,230,255)] shadow-[0_0_12px_rgba(0,230,255,0.5)]",
                className,
            )}
            aria-hidden="true"
        />
    );
}
