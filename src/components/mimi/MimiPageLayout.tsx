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

import dynamic from "next/dynamic";
import { useMimiAgentContext } from "./MimiAgentContext";
import { TaskListPanel } from "./panels/TaskListPanel";
import { ChatPanel } from "./panels/ChatPanel";
import { BrowserCheckModal } from "./BrowserCheckModal";
import "@/styles/agent-steps.css";

// ── Code-split heavy panels (loaded after initial paint) ────
const VirtualSandboxPanel = dynamic(
    () => import("./panels/VirtualSandboxPanel").then(m => m.VirtualSandboxPanel),
    {
        ssr: false,
        loading: () => (
            <div className="mimi-panel panel-right" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#64748b', fontSize: '12px', opacity: 0.6 }}>Sandbox wird geladen…</div>
            </div>
        ),
    }
);

const MimiModals = dynamic(
    () => import("./panels/MimiModals").then(m => m.MimiModals),
    { ssr: false }
);

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

            {/* 3-Panel Workspace */}
            <div className={`mimi-workspace${ctx.sidebarCollapsed ? ' sidebar-collapsed' : ''}${ctx.isVirtualComputerOpen ? ' sandbox-open' : ''}`}>
                <TaskListPanel />
                <ChatPanel />
                <VirtualSandboxPanel />
            </div>

            {/* Overlay modals and toasts */}
            <MimiModals />

            {/* Browser compatibility check — shown once if WebGPU not supported */}
            <BrowserCheckModal />
        </div>
    );
}
