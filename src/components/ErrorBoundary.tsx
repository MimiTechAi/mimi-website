/**
 * MIMI Agent - Error Boundary Component
 * Catches React errors and displays user-friendly fallback
 */

'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center p-8">
                    <div className="max-w-md w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-orange-400" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-4">
                            Ein Fehler ist aufgetreten
                        </h2>

                        <p className="text-white/60 mb-6">
                            MIMI ist auf einen unerwarteten Fehler gestoßen.
                            Bitte lade die Seite neu.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="text-white/40 text-sm cursor-pointer mb-2">
                                    Technische Details (nur im Dev-Mode)
                                </summary>
                                <pre className="text-xs text-red-400 bg-black/50 p-4 rounded overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                    {'\n'}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Seite neu laden
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
