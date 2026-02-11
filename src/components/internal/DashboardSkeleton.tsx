"use client";

/**
 * DashboardSkeleton — Animated skeleton loading state for the internal dashboard.
 * Matches the dashboard's grid layout: quick actions, stats, announcements, progress.
 */

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300" role="status" aria-label="Dashboard wird geladen">
            {/* Header skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-48 bg-white/5" />
                <Skeleton className="h-5 w-80 bg-white/5" />
            </div>

            {/* Quick Actions — 4 cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-28 bg-white/5" />
                            <Skeleton className="h-8 w-8 rounded-full bg-white/5" />
                        </div>
                        <Skeleton className="h-9 w-full rounded-md bg-white/5" />
                    </div>
                ))}
            </div>

            {/* Stats — 4 cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-white/5 bg-white/[0.02] p-6 space-y-3"
                    >
                        <Skeleton className="h-4 w-24 bg-white/5" />
                        <Skeleton className="h-8 w-16 bg-white/5" />
                        <Skeleton className="h-5 w-12 rounded-full bg-white/5" />
                    </div>
                ))}
            </div>

            {/* Bottom grid — Announcements + Progress */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Announcements */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="p-6 border-b border-white/5 space-y-2">
                        <Skeleton className="h-5 w-36 bg-white/5" />
                        <Skeleton className="h-4 w-44 bg-white/5" />
                    </div>
                    <div className="p-6 space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-start space-x-4">
                                <Skeleton className="w-2 h-2 mt-2 rounded-full bg-white/5" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-48 bg-white/5" />
                                    <Skeleton className="h-3 w-20 bg-white/5" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Progress */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="p-6 border-b border-white/5 space-y-2">
                        <Skeleton className="h-5 w-36 bg-white/5" />
                        <Skeleton className="h-4 w-32 bg-white/5" />
                    </div>
                    <div className="p-6 space-y-5">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-28 bg-white/5" />
                                    <Skeleton className="h-4 w-12 bg-white/5" />
                                </div>
                                <Skeleton className="h-2 w-full rounded-full bg-white/5" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <span className="sr-only">Dashboard wird geladen...</span>
        </div>
    );
}
