"use client";

import React, { useRef, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MagneticInput() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleMouseEnter = () => {
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative w-full max-w-xl mx-auto group"
        >
            {/* Glow Effect */}
            <div
                className="absolute -inset-px rounded-full opacity-0 transition-opacity duration-300 blur-md group-hover:opacity-100"
                style={{
                    background: `radial-gradient(300px circle at ${position.x}px ${position.y}px, rgba(0, 240, 255, 0.4), transparent 40%)`,
                }}
            />

            {/* Input Container */}
            <div className="relative flex items-center bg-black/40 backdrop-blur-xl border border-white/10 rounded-full p-2 transition-all duration-300 group-hover:border-brand-cyan/30 group-hover:shadow-[0_0_30px_rgba(0,240,255,0.1)]">
                <div className="pl-4 text-brand-cyan">
                    <Sparkles size={20} />
                </div>
                <input
                    type="text"
                    placeholder="Ask MiMi about Digital Sovereignty..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 px-4 py-3 text-lg font-light"
                />
                <button className="bg-white/10 hover:bg-brand-cyan hover:text-black text-white p-3 rounded-full transition-all duration-300 flex items-center justify-center">
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
}
