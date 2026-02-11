"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

interface FadeInProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
    duration?: number;
    fullWidth?: boolean;
}

export default function FadeIn({
    children,
    className = "",
    delay = 0,
    direction = "up",
    duration = 0.5,
    fullWidth = false,
}: FadeInProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const prefersReducedMotion = useReducedMotion();

    const getInitialProps = () => {
        switch (direction) {
            case "up":
                return { opacity: 0, y: 40 };
            case "down":
                return { opacity: 0, y: -40 };
            case "left":
                return { opacity: 0, x: 40 };
            case "right":
                return { opacity: 0, x: -40 };
            case "none":
                return { opacity: 0 };
            default:
                return { opacity: 0, y: 40 };
        }
    };

    const getAnimateProps = () => {
        switch (direction) {
            case "up":
            case "down":
                return { opacity: 1, y: 0 };
            case "left":
            case "right":
                return { opacity: 1, x: 0 };
            case "none":
                return { opacity: 1 };
            default:
                return { opacity: 1, y: 0 };
        }
    };

    return (
        <motion.div
            ref={ref}
            className={className}
            initial={prefersReducedMotion ? { opacity: 1 } : getInitialProps()}
            animate={prefersReducedMotion ? { opacity: 1 } : (isInView ? getAnimateProps() : getInitialProps())}
            transition={prefersReducedMotion
                ? { duration: 0 }
                : {
                    duration: duration,
                    delay: delay,
                    ease: [0.21, 0.47, 0.32, 0.98], // Custom smooth easing
                }}
            style={{ width: fullWidth ? "100%" : "auto" }}
        >
            {children}
        </motion.div>
    );
}
