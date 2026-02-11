"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { buttonMotion } from "@/lib/motion";

interface PrimaryButtonLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

const MotionDiv = motion.div;

export function PrimaryButtonLink({ href, children, className }: PrimaryButtonLinkProps) {
  const baseClassName =
    "btn-primary px-8 py-4 rounded-lg text-lg font-semibold inline-flex items-center gap-2 group";
  const combinedClassName = className ? `${baseClassName} ${className}` : baseClassName;

  return (
    <MotionDiv
      whileHover={buttonMotion.whileHover}
      whileTap={buttonMotion.whileTap}
      transition={buttonMotion.transition}
      className="inline-block"
    >
      <Link href={href} className={combinedClassName}>
        {children}
      </Link>
    </MotionDiv>
  );
}
