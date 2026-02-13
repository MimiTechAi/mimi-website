"use client"

import Script from "next/script"
import { useEffect, useState } from "react"

type CookieConsentPreferences = {
  necessary: boolean
  analytics: boolean
}

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false

  const dntEnabled =
    (typeof navigator !== "undefined" && (navigator as any).doNotTrack === "1") ||
    (window as any).doNotTrack === "1"

  if (dntEnabled) return false

  const stored = localStorage.getItem("cookie-consent")
  if (!stored) return false

  if (stored === "accepted") return true
  if (stored === "declined") return false

  try {
    const parsed = JSON.parse(stored) as Partial<CookieConsentPreferences>
    return !!parsed.analytics
  } catch {
    return false
  }
}

// Get GA ID at build time (replaced by Next.js)
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export function GoogleAnalytics() {
  const [hasConsent, setHasConsent] = useState(false)

  useEffect(() => {
    setHasConsent(hasAnalyticsConsent())

    const handleConsentChange = (e: CustomEvent) => {
      const detail: any = e.detail

      if (detail && typeof detail.analytics === "boolean") {
        setHasConsent(detail.analytics)
        return
      }

      if (detail && typeof detail.accepted === "boolean") {
        setHasConsent(detail.accepted)
        return
      }

      setHasConsent(hasAnalyticsConsent())
    }

    window.addEventListener("cookie-consent-change" as any, handleConsentChange)

    return () => {
      window.removeEventListener("cookie-consent-change" as any, handleConsentChange)
    }
  }, [])

  if (!GA_MEASUREMENT_ID || !hasConsent) {
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure'
            });
          `,
        }}
      />
    </>
  )
}

// Event tracking helper
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// CTA tracking helper
export function trackCTA(ctaName: string, ctaLocation: string) {
  trackEvent("cta_click", "engagement", `${ctaName} - ${ctaLocation}`)
}