"use client";

import { cn } from "@/lib/utils";
import React from "react";
import Link from "next/link";

interface ServiceCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    features: string[];
    href: string;
    accentColor?: "cyan" | "green";
    className?: string;
}

/**
 * Molecule: ServiceCard
 *
 * SpotlightCard with icon, title, feature list, and link.
 * Used in the Services section (Dreiklang: Beratung · Schulung · Zwillinge).
 */
export function ServiceCard({
    icon,
    title,
    description,
    features,
    href,
    accentColor = "cyan",
    className,
}: ServiceCardProps) {
    const iconBg =
        accentColor === "green"
            ? "bg-[rgba(118,185,0,0.1)]"
            : "bg-[rgba(0,230,255,0.1)]";
    const iconGlow =
        accentColor === "green"
            ? "group-hover:shadow-[0_0_20px_rgba(118,185,0,0.3)]"
            : "group-hover:shadow-[0_0_20px_rgba(0,230,255,0.3)]";

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
            {/* Gradient border on hover */}
            <div className="pointer-events-none absolute inset-[-1px] rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    padding: "1px",
                    background: "linear-gradient(135deg, rgba(0,230,255,0.15), rgba(118,185,0,0.15))",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                }}
            />

            {/* Icon */}
            <div
                className={cn(
                    "mb-4 flex h-12 w-12 items-center justify-content-center rounded-lg text-2xl transition-shadow duration-300",
                    iconBg,
                    iconGlow,
                )}
            >
                <div className="flex h-full w-full items-center justify-center">
                    {icon}
                </div>
            </div>

            {/* Content */}
            <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
            <p className="mb-4 text-[0.95rem] leading-relaxed text-[hsl(220,5%,70%)]">
                {description}
            </p>

            {/* Feature list */}
            <ul className="mb-4 space-y-1">
                {features.map((feature) => (
                    <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-[hsl(220,5%,70%)]"
                    >
                        <span className="font-bold text-[rgb(0,230,255)]">›</span>
                        {feature}
                    </li>
                ))}
            </ul>

            {/* Link */}
            <Link
                href={href}
                className="inline-flex items-center gap-1 text-sm font-medium text-[rgb(0,230,255)] transition-[gap] duration-150 hover:gap-2"
            >
                Mehr erfahren →
            </Link>
        </div>
    );
}
