/**
 * MIMI Agent — Typed Image Store (B-02)
 *
 * Replaces the untyped `window.__mimiUploadedImage` global mutation
 * with a typed singleton with getter/setter/clear.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

/** Uploaded image data (Base64 Data-URI or null) */
let uploadedImage: string | null = null;

/**
 * Type-safe Image Store — singleton for uploaded images.
 * Used by the inference engine to pass user-uploaded images
 * to the vision tool without polluting the global scope.
 */
export const ImageStore = {
    /**
     * Store an uploaded image (Base64 Data-URI).
     * @param base64 - The image as a data: URI string
     */
    set(base64: string): void {
        uploadedImage = base64;
    },

    /**
     * Get the currently stored image, or null if none.
     */
    get(): string | null {
        return uploadedImage;
    },

    /**
     * Clear the stored image (e.g. after it's been consumed).
     */
    clear(): void {
        uploadedImage = null;
    },

    /**
     * Check if an image is currently stored.
     */
    hasImage(): boolean {
        return uploadedImage !== null;
    },
} as const;
