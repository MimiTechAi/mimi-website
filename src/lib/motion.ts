import type { Variants } from "framer-motion";

export const sectionFadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const itemFadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const buttonMotion = {
  whileHover: {
    scale: 1.03,
    boxShadow: "0 0 24px rgba(0,230,255,0.45)",
  },
  whileTap: {
    scale: 0.97,
    boxShadow: "0 0 18px rgba(0,230,255,0.3)",
  },
  transition: {
    type: "spring" as const,
    stiffness: 260,
    damping: 18,
  },
};
