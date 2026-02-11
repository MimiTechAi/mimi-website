"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Cookie } from "lucide-react";

type CookieConsentPreferences = {
  necessary: boolean;
  analytics: boolean;
  timestamp: string;
  version: number;
};

const COOKIE_CONSENT_KEY = "cookie-consent";

function getStoredConsent(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(COOKIE_CONSENT_KEY);
}

function setStoredConsent(preferences: CookieConsentPreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = getStoredConsent();
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    const preferences: CookieConsentPreferences = {
      necessary: true,
      analytics: true,
      timestamp: new Date().toISOString(),
      version: 1,
    };

    setStoredConsent(preferences);
    setShowBanner(false);

    if (typeof window !== "undefined") {
      const event = new CustomEvent("cookie-consent-change", {
        detail: {
          accepted: true,
          analytics: true,
          preferences,
        },
      });
      window.dispatchEvent(event);

      if ((window as any).gtag) {
        (window as any).gtag("consent", "update", {
          analytics_storage: "granted",
        });
      }
    }
  };

  const handleDecline = () => {
    const preferences: CookieConsentPreferences = {
      necessary: true,
      analytics: false,
      timestamp: new Date().toISOString(),
      version: 1,
    };

    setStoredConsent(preferences);
    setShowBanner(false);

    if (typeof window !== "undefined") {
      const event = new CustomEvent("cookie-consent-change", {
        detail: {
          accepted: false,
          analytics: false,
          preferences,
        },
      });
      window.dispatchEvent(event);

      if ((window as any).gtag) {
        (window as any).gtag("consent", "update", {
          analytics_storage: "denied",
        });
      }
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom duration-500 overflow-x-clip">
      <Card className="w-full max-w-[calc(100vw-2rem)] sm:max-w-4xl mx-auto border-primary/20 bg-card/95 backdrop-blur-lg shadow-2xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Cookie className="text-primary" size={32} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2 text-white">
                Cookie-Einstellungen
              </h3>
              <p className="text-white/90 text-sm sm:text-base mb-4">
                Wir verwenden Cookies, um Ihre Erfahrung auf unserer Website zu verbessern. 
                Einige sind notwendig für den Betrieb der Website, während andere uns helfen, 
                die Nutzung zu analysieren und zu verbessern. Weitere Informationen finden Sie in unserer{" "}
                <Link href="/datenschutz" className="text-primary hover:underline font-medium">
                  Datenschutzerklärung
                </Link>
                .
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleAccept}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground neon-glow"
                >
                  Alle akzeptieren
                </Button>
                <Button
                  onClick={handleDecline}
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-background"
                >
                  Nur notwendige
                </Button>
                <Link href="/datenschutz" className="sm:ml-auto">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full sm:w-auto text-white hover:bg-white/10"
                  >
                    Mehr erfahren
                  </Button>
                </Link>
              </div>
            </div>
            <button
              onClick={handleDecline}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cookie-Banner schließen"
            >
              <X size={20} />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
