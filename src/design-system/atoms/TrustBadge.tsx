"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface TrustBadgeProps {
    icon: React.ReactNode;
    label: string;
    className?: string;
}

/**
 * Atom: TrustBadge
 *
 * Pill-shaped badge for trust signals in the Hero section.
 * Shows icon + text (e.g. "🔒 DSGVO-konform").
 */
export function TrustBadge({ icon, label, className }: TrustBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-[hsl(220,5%,70%)]",
                "transition-all duration-300",
                "hover:border-[rgba(0,230,255,0.3)] hover:bg-[rgba(0,230,255,0.08)] hover:text-white",
                className,
            )}
        >
            <span className="text-base">{icon}</span>
            {label}
        </span>
    );
}
