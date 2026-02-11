/**
 * MIMI Analytics — Custom Event Tracking
 * 
 * Tracks MIMI-specific user interactions via Vercel Analytics.
 * No PII collected — all events are anonymous.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { track } from "@vercel/analytics";

/**
 * Track when user visits the MIMI page
 */
export function trackMimiPageVisit() {
    track("mimi_page_visited");
}

/**
 * Track when the AI model is successfully loaded
 */
export function trackModelLoaded(modelName: string, loadTimeSeconds: number) {
    track("mimi_model_loaded", {
        model: modelName,
        load_time_seconds: Math.round(loadTimeSeconds),
    });
}

/**
 * Track when user sends their first message in a session
 */
export function trackFirstMessage() {
    track("mimi_first_message");
}

/**
 * Track when user uploads a PDF
 */
export function trackPDFUpload() {
    track("mimi_pdf_uploaded");
}

/**
 * Track when user uploads an image for vision analysis
 */
export function trackImageUpload() {
    track("mimi_image_uploaded");
}

/**
 * Track when user uses voice input
 */
export function trackVoiceUsed() {
    track("mimi_voice_used");
}

/**
 * Track when code is executed in the sandbox
 */
export function trackCodeExecuted() {
    track("mimi_code_executed");
}

/**
 * Track WebGPU support check result
 */
export function trackWebGPUCheck(supported: boolean) {
    track("mimi_webgpu_check", { supported });
}
