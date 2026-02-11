"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DataHudProps {
    title: string;
    data: { label: string; value: string }[];
    className?: string;
}

export default function DataHud({ title, data, className }: DataHudProps) {
    return (
        <motion.div
            className={cn(
                "absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col justify-center p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                className
            )}
        >
            <div className="border border-brand-cyan/30 bg-brand-cyan/5 p-4 rounded-lg relative overflow-hidden">
                {/* HUD Corners */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-brand-cyan" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-brand-cyan" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-brand-cyan" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-brand-cyan" />

                <h4 className="text-brand-cyan font-mono text-sm mb-4 tracking-widest uppercase border-b border-brand-cyan/20 pb-2">
                    {title}
                </h4>

                <div className="space-y-2">
                    {data.map((item, index) => (
                        <div key={index} className="flex justify-between text-xs font-mono">
                            <span className="text-gray-400">{item.label}:</span>
                            <span className="text-white">{item.value}</span>
                        </div>
                    ))}
                </div>

                {/* Scanning Line Animation */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-cyan/5 to-transparent h-[200%] w-full animate-scan pointer-events-none" />
            </div>
        </motion.div>
    );
}
