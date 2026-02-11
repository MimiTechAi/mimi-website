import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "MIMI — Ihr lokaler KI-Agent",
    description:
        "MIMI läuft 100 % auf Ihrem Gerät — ohne Cloud, ohne Datenübertragung. Nutzen Sie einen vollwertigen KI-Agenten mit Vision, Spracheingabe, PDF-Analyse und Python-Ausführung direkt im Browser.",
    openGraph: {
        title: "MIMI — Ihr lokaler KI-Agent | MiMi Tech AI",
        description:
            "On-Device KI-Agent mit WebGPU: Vision, Spracheingabe, PDF-Analyse und Code-Ausführung — 100 % lokal, 100 % privat.",
        url: "https://www.mimitechai.com/mimi",
        type: "website",
        images: [
            {
                url: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/mimi_tech_ai_icon_192-Kopie-1760514890080.png",
                width: 1200,
                height: 630,
                alt: "MIMI KI-Agent Interface",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "MIMI — Ihr lokaler KI-Agent",
        description:
            "On-Device KI mit WebGPU. Vision, Sprache, PDF-Analyse — ohne Cloud.",
    },
};

export default function MimiLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
