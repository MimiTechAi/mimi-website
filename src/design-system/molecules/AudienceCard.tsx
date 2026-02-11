"use client";

import { cn } from "@/lib/utils";
import React from "react";
import Link from "next/link";

interface AudienceCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    href: string;
    ctaLabel: string;
    accentColor?: "cyan" | "green";
    className?: string;
}

/**
 * Molecule: AudienceCard
 *
 * Zielgruppen card with icon, description, and full-width CTA.
 * Used in the "Für wen wir arbeiten" section.
 */
export function AudienceCard({
    icon,
    title,
    description,
    href,
    ctaLabel,
    accentColor = "cyan",
    className,
}: AudienceCardProps) {
    const iconBg =
        accentColor === "green"
            ? "bg-[rgba(118,185,0,0.1)]"
            : "bg-[rgba(0,230,255,0.1)]";

    return (
        <div
            className={cn(
                "group relative rounded-xl border border-white/5 bg-white/[0.03] p-8",
                "transition-all duration-300",
                "hover:-translate-y-1 hover:border-white/10 hover:bg-white/[0.05]",
                "hover:shadow-[0_20px_40px_rgba(0,230,255,0.08)]",
                className,
            )}
        >
            <div
                className={cn(
                    "mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-2xl",
                    iconBg,
                )}
            >
                {icon}
            </div>

            <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
            <p className="mb-6 text-[0.95rem] leading-relaxed text-[hsl(220,5%,70%)]">
                {description}
            </p>

            <Link
                href={href}
                className={cn(
                    "flex w-full items-center justify-center rounded-lg border border-white/10 bg-transparent px-6 py-3",
                    "text-sm font-medium text-white transition-all duration-300",
                    "hover:border-[rgb(0,230,255)] hover:bg-[rgba(0,230,255,0.05)] hover:text-[rgb(0,230,255)]",
                )}
            >
                {ctaLabel} →
            </Link>
        </div>
    );
}
