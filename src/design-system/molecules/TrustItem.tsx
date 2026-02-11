"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface TrustItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    variant?: "nvidia" | "shield" | "cert" | "region";
    className?: string;
}

/**
 * Molecule: TrustItem
 *
 * Icon + label combination for the Trust Bar.
 * Each variant has a specific background tint.
 */
export function TrustItem({
    icon,
    title,
    subtitle,
    variant = "shield",
    className,
}: TrustItemProps) {
    const iconStyles: Record<string, string> = {
        nvidia: "bg-[rgba(118,185,0,0.1)] text-[#76B900] group-hover:shadow-[0_0_16px_rgba(118,185,0,0.3)]",
        shield: "bg-[rgba(0,230,255,0.1)] text-[rgb(0,230,255)] group-hover:shadow-[0_0_16px_rgba(0,230,255,0.3)]",
        cert: "bg-[rgba(0,230,255,0.1)] text-[rgb(0,230,255)]",
        region: "bg-[rgba(118,185,0,0.08)] text-[#76B900]",
    };

    return (
        <div
            className={cn(
                "group flex items-center gap-3 text-[hsl(220,5%,70%)] transition-colors duration-300 hover:text-white",
                className,
            )}
        >
            <div
                className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-shadow duration-300",
                    iconStyles[variant],
                )}
            >
                {icon}
            </div>
            <div>
                <div className="text-sm font-semibold text-white">{title}</div>
                <div className="text-xs">{subtitle}</div>
            </div>
        </div>
    );
}
