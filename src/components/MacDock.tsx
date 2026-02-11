"use client";

import React, { useEffect, useRef, useState, MouseEvent } from "react";
import Link from "next/link";

export type MacDockItem = {
  id: string;
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
};

export type MacDockProps = {
  items: MacDockItem[];
  className?: string;
};

const BASE_SCALE = 1;
const MAX_SCALE = 2.4;
const INFLUENCE_RADIUS = 140; // Pixelbereich, in dem die Nachbar-Icons mit vergrößert werden

export function MacDock({ items, className = "" }: MacDockProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [scales, setScales] = useState<number[]>(() => items.map(() => BASE_SCALE));
  const mouseXRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    mouseXRef.current = event.clientX;

    if (rafIdRef.current !== null) return;

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      const mouseX = mouseXRef.current;
      if (typeof mouseX !== "number") return;

      setScales((prev) =>
        prev.map((_, index) => {
          const el = itemRefs.current[index];
          if (!el) return BASE_SCALE;

          const rect = el.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const distance = Math.abs(mouseX - centerX);

          if (distance > INFLUENCE_RADIUS) return BASE_SCALE;

          const t = 1 - distance / INFLUENCE_RADIUS; // 1 direkt unter der Maus, 0 am Rand
          const eased = t * t; // leichte Kurve für weichere Welle

          return BASE_SCALE + eased * (MAX_SCALE - BASE_SCALE);
        })
      );
    });
  };

  const handleMouseLeave = () => {
    mouseXRef.current = null;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setScales(items.map(() => BASE_SCALE));
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto inline-flex items-end gap-3 rounded-2xl bg-black/40 border border-white/10 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.6)] backdrop-blur-2xl ${className}`}
      aria-label="Dock Navigation"
      role="navigation"
    >
      {items.map((item, index) => {
        const scale = scales[index] ?? BASE_SCALE;
        const content = (
          <button
            key={item.id}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            type="button"
            onClick={item.onClick}
            className="relative flex flex-col items-center gap-1 focus:outline-none group"
            style={{
              transform: `translateY(${(1 - scale) * 10}px) scale(${scale})`,
              transition: "transform 0.08s ease-out",
            }}
            aria-label={item.label}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white shadow-[0_12px_25px_rgba(0,0,0,0.6)] border border-white/15 group-hover:bg-white/15">
              {item.icon}
            </div>
            <span className="pointer-events-none select-none text-[10px] text-white/80 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
              {item.label}
            </span>
          </button>
        );

        if (item.href) {
          return (
            <Link key={item.id} href={item.href} className="[transform-origin:center_bottom]">
              {content}
            </Link>
          );
        }

        return content;
      })}
    </div>
  );
}

export default MacDock;
