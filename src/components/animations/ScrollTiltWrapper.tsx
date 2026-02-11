"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

interface ScrollTiltWrapperProps {
    children: React.ReactNode;
    className?: string;
}

export default function ScrollTiltWrapper({ children, className = "" }: ScrollTiltWrapperProps) {
    const ref = useRef<HTMLDivElement | null>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start 80%", "end 30%"],
    });

    // Subtiler, aber spürbarer 3D-Effekt
    const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [8, 0, 0]);
    const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [-3, 0, 1]);
    const translateY = useTransform(scrollYProgress, [0, 0.5, 1], [40, 0, -4]);
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.96, 1.02, 1]);
    const prefersReducedMotion = useReducedMotion();

    const animatedStyle = prefersReducedMotion
        ? {
            transformOrigin: "center center",
        }
        : {
            rotateX,
            rotateY,
            y: translateY,
            scale,
            transformOrigin: "center center",
        };

    return (
        <div
            ref={ref}
            className={className}
            style={{
                perspective: 1400,
            }}
        >
            <motion.div
                style={animatedStyle}
                className="will-change-transform"
            >
                {children}
            </motion.div>
        </div>
    );
}
