"use client";

import { cn } from "@/lib/utils";
import React from "react";
import Link from "next/link";

interface CTAGroupProps {
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel?: string;
    secondaryHref?: string;
    className?: string;
}

/**
 * Molecule: CTAGroup
 *
 * Primary + optional Ghost button combination.
 * Responsive: side by side on desktop, stacked on mobile.
 */
export function CTAGroup({
    primaryLabel,
    primaryHref,
    secondaryLabel,
    secondaryHref,
    className,
}: CTAGroupProps) {
    return (
        <div className={cn("flex flex-wrap gap-4", className)}>
            <Link
                href={primaryHref}
                className={cn(
                    "btn-shimmer inline-flex items-center gap-2 rounded-lg px-8 py-3",
                    "bg-[rgb(0,230,255)] font-semibold text-[hsl(220,20%,5%)]",
                    "transition-all duration-300",
                    "hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(0,230,255,0.4)]",
                    "active:scale-[0.98]",
                )}
            >
                {primaryLabel}
            </Link>

            {secondaryLabel && secondaryHref && (
                <Link
                    href={secondaryHref}
                    className={cn(
                        "inline-flex items-center gap-2 rounded-lg border border-white/10 bg-transparent px-8 py-3",
                        "font-medium text-white transition-all duration-300",
                        "hover:border-[rgb(0,230,255)] hover:bg-[rgba(0,230,255,0.05)] hover:text-[rgb(0,230,255)]",
                    )}
                >
                    {secondaryLabel}
                </Link>
            )}
        </div>
    );
}
