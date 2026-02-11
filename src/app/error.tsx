"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error("Global error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <AlertCircle className="h-20 w-20 text-destructive" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Oops! Etwas ist schiefgelaufen
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Ein unerwarteter Fehler ist aufgetreten. Keine Sorge, unser Team wurde automatisch benachrichtigt.
          </p>
          
          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 p-4 bg-muted rounded-lg text-left">
              <summary className="cursor-pointer font-semibold text-sm mb-2">
                Technische Details (nur in Entwicklung sichtbar)
              </summary>
              <pre className="text-xs overflow-auto text-muted-foreground">
                {error.message}
              </pre>
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={reset}
            size="lg"
            className="group"
          >
            Erneut versuchen
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
          >
            <Link href="/">
              Zur Startseite
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}