"use client";

/**
 * TypingCursor — Blinking cursor that appears during streaming
 *
 * A premium animated cursor (|) appended to the end of streaming text.
 * Uses CSS animation for smooth, GPU-accelerated blinking.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { memo } from "react";

export const TypingCursor = memo(function TypingCursor() {
    return (
        <span
            className="typing-cursor"
            aria-hidden="true"
        >
            ▍
        </span>
    );
});

export default TypingCursor;
