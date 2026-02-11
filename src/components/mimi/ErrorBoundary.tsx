"use client";

/**
 * MIMI Agent - Error Boundary
 * Catches render errors in the chat area and shows a friendly fallback UI.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallbackTitle?: string;
    fallbackMessage?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("[MIMI ErrorBoundary] Caught error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 px-6">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">
                        {this.props.fallbackTitle || "Etwas ist schiefgelaufen"}
                    </h3>

                    <p className="text-white/50 text-sm max-w-md mb-6">
                        {this.props.fallbackMessage ||
                            "MIMI hat einen unerwarteten Fehler erkannt. Ihre Daten sind sicher – versuchen Sie es erneut."}
                    </p>

                    {this.state.error && (
                        <pre className="text-xs text-red-400/70 bg-red-500/5 border border-red-500/10 rounded-lg px-4 py-2 mb-4 max-w-md overflow-x-auto">
                            {this.state.error.message}
                        </pre>
                    )}

                    <Button
                        onClick={this.handleReset}
                        variant="outline"
                        className="gap-2 border-white/20 text-white hover:bg-white/10"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Erneut versuchen
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
