import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Impressum",
    description:
        "Impressum der MiMi Tech AI — Angaben gemäß § 5 TMG. Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV.",
    openGraph: {
        title: "Impressum | MiMi Tech AI",
        description: "Rechtliche Angaben und Kontaktdaten der MiMi Tech AI.",
        url: "https://www.mimitechai.com/impressum",
        type: "website",
    },
    robots: {
        index: true,
        follow: false,
    },
};

export default function ImpressumLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
