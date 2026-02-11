"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface SectionLabelProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Atom: SectionLabel
 *
 * Uppercase label with a leading accent line.
 * Used above every section heading (e.g. "UNSERE LEISTUNGEN").
 */
export function SectionLabel({ children, className }: SectionLabelProps) {
    return (
        <p
            className={cn(
                "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[rgb(0,230,255)]",
                className,
            )}
        >
            <span className="h-[2px] w-6 rounded-full bg-[rgb(0,230,255)]" />
            {children}
        </p>
    );
}
