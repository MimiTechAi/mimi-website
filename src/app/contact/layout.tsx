import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Kontakt – MiMi Tech AI",
  description:
    "Kontaktieren Sie MiMi Tech AI für KI-Beratung, Schulungen und Digitale Zwillinge. Wir melden uns innerhalb von 24 Stunden bei Ihnen.",
  alternates: {
    canonical: "https://www.mimitechai.com/contact",
  },
  openGraph: {
    type: "website",
    url: "https://www.mimitechai.com/contact",
    title: "Kontakt – MiMi Tech AI",
    description:
      "Kontaktieren Sie MiMi Tech AI für KI-Beratung, Schulungen und Digitale Zwillinge. Wir melden uns innerhalb von 24 Stunden bei Ihnen.",
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
    title: "Kontakt – MiMi Tech AI",
    description:
      "Kontaktieren Sie MiMi Tech AI für KI-Beratung, Schulungen und Digitale Zwillinge. Wir melden uns innerhalb von 24 Stunden bei Ihnen.",
    images: [
      "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/mimi_tech_ai_icon_192-Kopie-1760514890080.png",
    ],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
