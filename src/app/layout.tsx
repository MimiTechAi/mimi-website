import type { Metadata } from "next";
import "../styles/mobile-first.css";
import "../styles/caching.css";
import "../styles/core-web-vitals.css";
import "../styles/accessibility.css";
import "./globals.css";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import LayoutOverlays from "@/components/LayoutOverlays";
import { Analytics } from "@vercel/analytics/react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mimitechai.com'),
  title: {
    default: "MiMi Tech AI - Schwarzwald KI-Beratung & Digitale Zwillinge",
    template: "%s | MiMi Tech AI"
  },
  description: "Professionelle Schwarzwald KI-Beratung und Bad Liebenzell Digitalisierung. KI-Beratung und Schulung für Unternehmen im Schwarzwald. Digitale Zwillinge von industriellen Anlagen bis zu urbanen Smart Cities.",
  keywords: ["Schwarzwald KI-Beratung", "Bad Liebenzell Digitalisierung", "KI Beratung", "Digitale Zwillinge", "AI Consulting", "KI Schulung", "Digital Twin", "Smart City", "Künstliche Intelligenz", "Industrie 4.0"],
  authors: [{ name: "MiMi Tech AI" }],
  creator: "MiMi Tech AI",
  publisher: "MiMi Tech AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: 'https://www.mimitechai.com',
    siteName: 'MiMi Tech AI',
    title: 'MiMi Tech AI - Schwarzwald KI-Beratung & Digitale Zwillinge',
    description: 'Professionelle Schwarzwald KI-Beratung und Bad Liebenzell Digitalisierung. KI-Beratung und Schulung für Unternehmen im Schwarzwald. Digitale Zwillinge für Industrie und Smart Cities.',
    images: [
      {
        url: 'https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/mimi_tech_ai_icon_192-Kopie-1760514890080.png',
        width: 1200,
        height: 630,
        alt: 'MiMi Tech AI Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MiMi Tech AI - Schwarzwald KI-Beratung & Digitale Zwillinge',
    description: 'Professionelle Schwarzwald KI-Beratung und Bad Liebenzell Digitalisierung. KI-Beratung und Schulung für Unternehmen im Schwarzwald. Digitale Zwillinge für Industrie und Smart Cities.',
    images: ['https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/document-uploads/mimi_tech_ai_icon_192-Kopie-1760514890080.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'GPbtYmT0mZjvBvWWQDwbRddc2bnq61EzQm6r3WtnQCw',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/images/mimi_tech_ai_icon_192-Kopie-1760514890080.png" />
        <meta name="theme-color" content="#00d9ff" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MiMi Tech AI" />
        <meta name="application-name" content="MiMi Tech AI" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        {/* Preload critical hero images for faster LCP */}
        <link rel="preload" as="image" href="/images/digital-twin-factory.png" type="image/png" />
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="preconnect" href="//fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//slelguoygbfzlpylpxfs.supabase.co" />
        <link rel="preconnect" href="//slelguoygbfzlpylpxfs.supabase.co" crossOrigin="anonymous" />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-black text-white`}>
        {/* Skip to Main Content - Accessibility (WCAG AAA) */}
        <a href="#main-content" className="skip-to-content">
          Zum Hauptinhalt springen
        </a>

        <GoogleAnalytics />
        <Analytics />
        {/* Main Content Wrapper with ID for Skip Link */}
        <main id="main-content" className="relative">
          {children}
        </main>
        <LayoutOverlays />
      </body>
    </html>
  );
}