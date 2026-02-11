import type { Metadata } from "next";
import HomeContent from "@/components/home/HomeLanding";
import { getStructuredData } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "MiMi Tech AI - KI-Beratung & Digitale Zwillinge",
  description: "KI-Beratung und Digitale Zwillinge für Unternehmen, Solo-Selbständige und Städte. Von urbanen digitalen Zwillingen bis Enterprise-Lösungen.",
  keywords: ["KI-Beratung", "Digitale Zwillinge", "AI Consulting", "Urban Digital Twins", "Bauvorhaben", "Enterprise KI", "Digital Twin Technology", "Smart Cities"],
  alternates: {
    canonical: "https://www.mimitechai.com",
  },
};

export default function Home() {
  const structuredData = getStructuredData();

  return <HomeContent structuredData={structuredData} />;
}