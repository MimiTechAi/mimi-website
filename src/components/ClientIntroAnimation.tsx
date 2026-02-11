"use client";

import dynamic from "next/dynamic";

// Dynamic import with ssr:false to prevent hydration mismatch
// This component is client-only to avoid server/client HTML differences
const IntroAnimation = dynamic(() => import("@/components/IntroAnimation"), {
    ssr: false,
});

export default function ClientIntroAnimation() {
    return <IntroAnimation />;
}
