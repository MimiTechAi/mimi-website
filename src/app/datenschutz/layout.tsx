import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Datenschutzerklärung",
    description:
        "Datenschutzerklärung der MiMi Tech AI — Informationen zum Umgang mit personenbezogenen Daten gemäß DSGVO.",
    openGraph: {
        title: "Datenschutzerklärung | MiMi Tech AI",
        description:
            "DSGVO-konforme Datenschutzerklärung der MiMi Tech AI.",
        url: "https://www.mimitechai.com/datenschutz",
        type: "website",
    },
    robots: {
        index: true,
        follow: false,
    },
};

export default function DatenschutzLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
