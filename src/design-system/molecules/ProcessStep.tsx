"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface ProcessStepProps {
    number: string;
    title: string;
    description: string;
    showConnector?: boolean;
    className?: string;
}

/**
 * Molecule: ProcessStep
 *
 * Numbered step with title, description, and optional connector line.
 * Used in "So arbeiten wir" section (01 → 02 → 03 → 04).
 */
export function ProcessStep({
    number,
    title,
    description,
    showConnector = true,
    className,
}: ProcessStepProps) {
    return (
        <div
            className={cn(
                "group relative flex flex-1 flex-col items-center text-center",
                className,
            )}
        >
            {/* Step number circle */}
            <div
                className={cn(
                    "mb-3 flex h-12 w-12 items-center justify-center rounded-full",
                    "border-2 border-[rgba(0,230,255,0.3)] bg-[rgba(0,230,255,0.1)]",
                    "text-lg font-bold text-[rgb(0,230,255)]",
                    "transition-all duration-300",
                    "group-hover:border-[rgb(0,230,255)] group-hover:bg-[rgb(0,230,255)] group-hover:text-[hsl(220,20%,5%)]",
                    "group-hover:shadow-[0_0_20px_rgba(0,230,255,0.4)]",
                )}
            >
                {number}
            </div>

            <h3 className="mb-1 text-base font-semibold text-white">{title}</h3>
            <p className="text-sm text-[hsl(220,5%,50%)]">{description}</p>

            {/* Connector line to next step */}
            {showConnector && (
                <div
                    className="absolute left-[calc(50%+30px)] top-6 hidden h-[2px] w-[calc(100%-60px)] md:block"
                    style={{
                        background:
                            "linear-gradient(90deg, rgba(0,230,255,0.3), rgba(118,185,0,0.3))",
                    }}
                />
            )}
        </div>
    );
}
