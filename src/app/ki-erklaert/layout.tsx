import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "KI erklärt – Künstliche Intelligenz einfach erklärt | MiMi Tech AI",
  description:
    "Verstehen Sie die Grundlagen von Künstlicher Intelligenz, Machine Learning und praktischen Anwendungsfällen – einfach erklärt von MiMi Tech AI.",
  alternates: {
    canonical: "https://www.mimitechai.com/ki-erklaert",
  },
  openGraph: {
    type: "website",
    url: "https://www.mimitechai.com/ki-erklaert",
    title: "KI erklärt – Künstliche Intelligenz einfach erklärt | MiMi Tech AI",
    description:
      "Verstehen Sie die Grundlagen von Künstlicher Intelligenz, Machine Learning und praktischen Anwendungsfällen – einfach erklärt von MiMi Tech AI.",
    images: [
      {
        url: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/mimi_tech_ai_icon_192-Kopie-1760514890080.png",
        width: 1200,
        height: 630,
        alt: "MiMi Tech AI Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KI erklärt – Künstliche Intelligenz einfach erklärt | MiMi Tech AI",
    description:
      "Verstehen Sie die Grundlagen von Künstlicher Intelligenz, Machine Learning und praktischen Anwendungsfällen – einfach erklärt von MiMi Tech AI.",
    images: [
      "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/mimi_tech_ai_icon_192-Kopie-1760514890080.png",
    ],
  },
};

export default function KiErklaertLayout({ children }: { children: React.ReactNode }) {
  return children;
}
