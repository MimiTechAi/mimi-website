import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Über uns — Team & Vision",
    description:
        "Das MiMi Tech AI Team aus dem Schwarzwald: 10 Jahre Erfahrung in KI, Data Science und digitalen Zwillingen. Lernen Sie unser Gründerteam und unsere Mission kennen.",
    openGraph: {
        title: "Über MiMi Tech AI — Team & Vision",
        description:
            "KI-Experten aus dem Schwarzwald. Unser Team verbindet Deep-Tech-Kompetenz mit regionalem Engagement für nachhaltige Digitalisierung.",
        url: "https://www.mimitechai.com/about",
        type: "website",
        images: [
            {
                url: "https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/mimi_tech_ai_icon_192-Kopie-1760514890080.png",
                width: 1200,
                height: 630,
                alt: "MiMi Tech AI Team",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Über MiMi Tech AI — Team & Vision",
        description:
            "KI-Experten aus dem Schwarzwald für nachhaltige Digitalisierung.",
    },
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
