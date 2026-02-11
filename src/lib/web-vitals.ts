import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Web Vitals Monitoring - 2025 Standards
 * Tracks Core Web Vitals and sends to analytics
 * 
 * Metrics tracked:
 * - CLS: Cumulative Layout Shift
 * - FID: First Input Delay  
 * - FCP: First Contentful Paint
 * - LCP: Largest Contentful Paint
 * - TTFB: Time to First Byte
 */

type AnalyticsEvent = {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
};

/**
 * Send metric to analytics endpoint
 */
function sendToAnalytics(metric: Metric) {
    const body: AnalyticsEvent = {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
    };

    // Send to your analytics service
    // Example: Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', metric.name, {
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            metric_id: metric.id,
            metric_value: metric.value,
            metric_delta: metric.delta,
            metric_rating: metric.rating,
        });
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
        const body = JSON.stringify(metric);
        console.log('[Web Vitals]', body);
    }

    // Optional: Send to custom analytics endpoint
    // fetch('/api/analytics/vitals', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(body),
    // });
}

/**
 * Initialize Web Vitals tracking
 * Call this once in your root layout or _app
 */
export function reportWebVitals(onPerfEntry?: (metric: Metric) => void) {
    // The web-vitals library functions (onCLS, etc.) handle environment checks internally.
    // No need for `if (typeof window === 'undefined') return;` here.

    // If a custom callback is provided, use it.
    // Otherwise, use the default sendToAnalytics.
    const callback = onPerfEntry || sendToAnalytics;

    try {
        onCLS(callback);
        onINP(callback);
        onFCP(callback);
        onLCP(callback);
        onTTFB(callback);
    } catch (error) {
        console.error('Failed to initialize Web Vitals:', error);
    }
}

/**
 * Performance thresholds (Google recommendations 2025)
 */
export const PERFORMANCE_THRESHOLDS = {
    // Largest Contentful Paint
    LCP: {
        good: 2500,
        needsImprovement: 4000,
    },
    // First Input Delay
    FID: {
        good: 100,
        needsImprovement: 300,
    },
    // Cumulative Layout Shift
    CLS: {
        good: 0.1,
        needsImprovement: 0.25,
    },
    // First Contentful Paint
    FCP: {
        good: 1800,
        needsImprovement: 3000,
    },
    // Time to First Byte
    TTFB: {
        good: 800,
        needsImprovement: 1800,
    },
} as const;

/**
 * Check if metrics meet performance budget
 */
export function checkPerformanceBudget(metric: Metric): {
    passes: boolean;
    threshold: 'good' | 'needs-improvement' | 'poor';
} {
    const thresholds = PERFORMANCE_THRESHOLDS[metric.name as keyof typeof PERFORMANCE_THRESHOLDS];

    if (!thresholds) {
        return { passes: true, threshold: 'good' };
    }

    if (metric.value <= thresholds.good) {
        return { passes: true, threshold: 'good' };
    } else if (metric.value <= thresholds.needsImprovement) {
        return { passes: true, threshold: 'needs-improvement' };
    } else {
        return { passes: false, threshold: 'poor' };
    }
}
