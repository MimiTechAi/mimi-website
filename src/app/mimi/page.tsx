"use client";

/**
 * MIMI Agent -- Manus AI 3-Panel Layout
 *
 * Architecture:
 * - MimiAgentProvider: Central context (engine, events, chat, sandbox state)
 * - TaskListPanel:     Left panel (conversation history)
 * - ChatPanel:         Center panel (chat interface)
 * - VirtualSandboxPanel: Right panel (agent computer)
 * - MimiModals:        Overlays (settings, confirm, toasts)
 *
 * The page component is now a thin composition shell.
 * All state management lives in MimiAgentContext.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { MimiAgentProvider } from "@/components/mimi/MimiAgentContext";
import { MimiPageLayout } from "@/components/mimi/MimiPageLayout";
import "@/styles/mimi-agent.css";

export default function MimiPage() {
    return (
        <MimiAgentProvider>
            <MimiPageLayout />
        </MimiAgentProvider>
    );
}
