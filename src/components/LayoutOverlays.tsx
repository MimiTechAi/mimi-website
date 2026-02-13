"use client";

import { usePathname } from "next/navigation";
import CookieConsent from "@/components/CookieConsent";
import ScrollToTop from "@/components/ScrollToTop";
import FloatingCTA from "@/components/FloatingCTA";

/**
 * Renders overlay components (CookieConsent, ScrollToTop, FloatingCTA)
 * only when NOT on the /mimi agent workspace page.
 */
export default function LayoutOverlays() {
    const pathname = usePathname();

    // Hide overlays on the MIMI agent page — they cover the full-viewport workspace
    if (pathname === "/mimi") return null;

    return (
        <>
            <CookieConsent />
            <ScrollToTop />
            <FloatingCTA />
        </>
    );
}
