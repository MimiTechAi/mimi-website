"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface GradientTextProps {
    children: React.ReactNode;
    className?: string;
    as?: "span" | "strong" | "em";
}

/**
 * Atom: GradientText
 *
 * Renders text with the brand cyan → NVIDIA green gradient.
 * Uses the existing .text-gradient class from globals.css.
 */
export function GradientText({
    children,
    className,
    as: Tag = "span",
}: GradientTextProps) {
    return (
        <Tag
            className={cn(
                "bg-gradient-to-r from-[rgb(0,230,255)] to-[#76B900] bg-clip-text text-transparent",
                className,
            )}
        >
            {children}
        </Tag>
    );
}
