"use client";

/**
 * MimiPageLayout -- Composition shell for the Manus 3-panel layout.
 *
 * Renders the ambient background, top labels, and the three panels
 * (TaskList, Chat, VirtualSandbox) plus modals.
 *
 * All state comes from MimiAgentContext -- this is pure layout.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useMimiAgentContext } from "./MimiAgentContext";
import { TaskListPanel } from "./panels/TaskListPanel";
import { ChatPanel } from "./panels/ChatPanel";
import { VirtualSandboxPanel } from "./panels/VirtualSandboxPanel";
import { MimiModals } from "./panels/MimiModals";
import "@/styles/agent-steps.css";

export function MimiPageLayout() {
    const ctx = useMimiAgentContext();

    return (
        <div className="mimi-outer-wrap">
            {/* Ambient glow blobs */}
            <div className="glow-1" />
            <div className="glow-2" />
            <div className="glow-3" />
            <div className="glow-4" />
            <div className="glow-5" />
            <div className="glow-6" />

            {/* Top section labels */}
            <div className="mimi-top-labels">
                <span>Task List &amp; History</span>
                <span>Intelligence Chat</span>
                <span>Agent Computer</span>
            </div>

            {/* 3-Panel Workspace */}
            <div className={`mimi-workspace${ctx.sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
                <TaskListPanel />
                <ChatPanel />
                <VirtualSandboxPanel />
            </div>

            {/* Overlay modals and toasts */}
            <MimiModals />
        </div>
    );
}
