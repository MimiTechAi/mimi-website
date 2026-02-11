"use client";

/**
 * DashboardErrorBoundary — Premium error state for the internal dashboard.
 * Shows a branded error card with retry action.
 */

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardErrorProps {
    error: string;
    onRetry?: () => void;
}

export function DashboardError({ error, onRetry }: DashboardErrorProps) {
    return (
        <div
            className="flex min-h-[60vh] items-center justify-center"
            role="alert"
            aria-live="assertive"
        >
            <div className="text-center p-8 rounded-2xl glass-premium border border-white/10 max-w-md w-full space-y-5">
                {/* Icon */}
                <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>

                {/* Text */}
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white">Fehler beim Laden</h2>
                    <p className="text-sm text-gray-400 leading-relaxed">{error}</p>
                </div>

                {/* Action */}
                <Button
                    onClick={onRetry ?? (() => window.location.reload())}
                    className="bg-brand-cyan/20 hover:bg-brand-cyan/30 text-brand-cyan border border-brand-cyan/20 transition-all duration-300"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Erneut versuchen
                </Button>
            </div>
        </div>
    );
}
