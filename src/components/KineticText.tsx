"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface KineticTextProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    style?: React.CSSProperties;
}

export default function KineticText({
    children,
    className,
    delay = 0,
    style,
}: KineticTextProps) {
    return (
        <motion.h1
            className={cn("tracking-tighter", className)}
            style={style}
            initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{
                duration: 0.8,
                delay: delay,
                ease: [0.22, 1, 0.36, 1],
            }}
        >
            {children}
        </motion.h1>
    );
}
