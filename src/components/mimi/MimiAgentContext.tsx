"use client";

/**
 * MimiAgentContext -- Central State Provider for the MIMI 3-Panel Layout
 *
 * Eliminates prop drilling by providing engine, agent events, chat, and
 * sandbox state through React context. All MIMI page-level components
 * consume this context instead of receiving props.
 *
 * Architecture: Manus-style composition of independent state domains.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { flushSync } from "react-dom";
import { useMimiEngine } from "@/hooks/mimi/useMimiEngine";
import { useAgentEvents } from "@/hooks/mimi/useAgentEvents";
import { AgentEvents } from "@/lib/mimi/agent-events";
import { getChatHistory, type ConversationSummary } from "@/lib/mimi/chat-history";
import type { ChatMessage } from "@/lib/mimi/inference-engine";
import type { UseMimiEngineReturn } from "@/hooks/mimi/types";
import type { UITaskPlan, UIToolExecution, UIFileActivity } from "@/hooks/mimi/useAgentEvents";
import { detectArtifacts, type DetectedArtifact } from "@/hooks/mimi/useArtifactDetection";
import { useMemoryToasts, type MemoryToastItem } from "./components/MemoryToast";

// ═══════════════════════════════════════════════════════════
// SECURITY: HTML sanitization (shared utility)
// ═══════════════════════════════════════════════════════════
import { sanitizeHtml } from "./utils/sanitize";
import { initWebMCP, getWebMCPBridge } from "@/lib/mimi/webmcp-bridge";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface CodeArtifact {
    filename: string;
    language: string;
    content: string;
    timestamp: number;
}

interface GeneratedFile {
    name: string;
    type: string;
    size: string;
    timestamp: number;
}

interface PageTerminalLine {
    prefix: string;
    msg: string;
    type?: "info" | "success" | "error" | "tool";
}

interface ToolPill {
    id: string;
    toolName: string;
    status: 'running' | 'done' | 'failed';
    output?: string;
    duration?: number;
    timestamp: number;
    messageIndex: number; // M2: which assistant message (by index) triggered this tool
}

export type ComputerView = 'idle' | 'browsing' | 'coding' | 'terminal' | 'planning' | 'file-manager';

export interface MimiAgentContextValue {
    // Engine
    engine: UseMimiEngineReturn;

    // Agent Events
    agentEvents: {
        activePlan: UITaskPlan | null;
        agentStatus: string;
        activeAgent: string | null;
        isThinking: boolean;
        thinkingContent: string;
        activeTool: UIToolExecution | null;
        recentTools: UIToolExecution[];
        recentFiles: UIFileActivity[];
        shouldOpenWorkspace: boolean;
        elapsedTime: number;
        reset: () => void;
        markWorkspaceOpened: () => void;
    };

    // Chat State
    messages: ChatMessage[];
    input: string;
    setInput: (v: string) => void;
    currentResponse: string;
    isGenerating: boolean;
    handleSend: (directText?: string) => Promise<void>;
    handleNewConversation: () => Promise<void>;
    handleDeleteConversation: (id: string) => Promise<void>;
    handleRenameConversation: (id: string, newTitle: string) => Promise<void>;
    handleCopyMessage: (content: string) => void;
    handleRetryMessage: (msgIdx: number) => Promise<void>;

    // Conversations
    conversations: ConversationSummary[];
    activeConversationId: string | null;
    setActiveConversationId: (id: string | null) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    groupedConversations: { label: string; items: ConversationSummary[] }[];

    // Computer View (Manus-style unified)
    computerView: ComputerView;
    activeTab: "browser" | "terminal" | "editor" | "files" | "feed";
    setActiveTab: (tab: "browser" | "terminal" | "editor" | "files" | "feed") => void;
    codeArtifacts: CodeArtifact[];
    activeArtifactIdx: number;
    setActiveArtifactIdx: (idx: number) => void;
    generatedFiles: GeneratedFile[];
    terminalLines: PageTerminalLine[];
    browserContent: string | null;
    completedToolPills: ToolPill[];
    taskCompleted: boolean;
    agentElapsedTime: number;

    // Artifacts (Claude-style)
    detectedArtifacts: DetectedArtifact[];
    activeDetectedArtifact: DetectedArtifact | null;
    setActiveDetectedArtifact: (a: DetectedArtifact | null) => void;
    openArtifact: (a: DetectedArtifact) => void;
    closeArtifact: () => void;
    openFileInEditor: (filename: string, content: string, language: string) => void;

    // UI
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (v: boolean | ((prev: boolean) => boolean)) => void;
    isVirtualComputerOpen: boolean;
    setVirtualComputerOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
    showSettings: boolean;
    setShowSettings: (v: boolean) => void;
    confirmDeleteId: string | null;
    setConfirmDeleteId: (id: string | null) => void;
    editingConvId: string | null;
    setEditingConvId: (id: string | null) => void;
    editingTitle: string;
    setEditingTitle: (t: string) => void;

    toasts: { id: number; msg: string }[];
    addToast: (msg: string) => void;

    // Memory Toasts
    memoryToasts: MemoryToastItem[];
    showMemoryToast: (text: string) => void;
    dismissMemoryToast: (id: string) => void;

    // Agent Swarm
    activeSwarmAgents: string[];

    // Computed
    statusText: string;
    isReady: boolean;
    isIdle: boolean;
    progressSteps: { label: string; status: "done" | "running" | "pending" }[] | null;

    // Refs
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

const MimiAgentCtx = createContext<MimiAgentContextValue | null>(null);

export function useMimiAgentContext(): MimiAgentContextValue {
    const ctx = useContext(MimiAgentCtx);
    if (!ctx) throw new Error("useMimiAgentContext must be used within MimiAgentProvider");
    return ctx;
}

// ═══════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════

export function MimiAgentProvider({ children }: { children: React.ReactNode }) {
    const engine = useMimiEngine();
    const agentEvents = useAgentEvents();
    const { toasts: memoryToasts, showMemoryToast, dismissToast: dismissMemoryToast } = useMemoryToasts();

    // Chat state
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [currentResponse, setCurrentResponse] = useState("");
    // H4 FIX: isGenerating comes exclusively from engine hook (single source of truth)
    const isGenerating = engine.isGenerating;
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    // H1 FIX: Ref always holds latest messages — no stale closure in handleSend
    const messagesRef = useRef<ChatMessage[]>(messages);
    useEffect(() => { messagesRef.current = messages; }, [messages]);

    // Conversations
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Sandbox tabs (backward compat — derived from computerView)
    const [activeTab, setActiveTab] = useState<"browser" | "terminal" | "editor" | "files" | "feed">("browser");

    // Agent elapsed time
    const [agentElapsedTime, setAgentElapsedTime] = useState(0);

    // Code artifacts for Editor tab
    const [codeArtifacts, setCodeArtifacts] = useState<CodeArtifact[]>([]);
    const [activeArtifactIdx, setActiveArtifactIdx] = useState(0);

    // Generated files for Files tab
    const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);

    // Terminal lines (persists across re-renders)
    const terminalLinesRef = useRef<PageTerminalLine[]>([
        { prefix: "[MIMI-AI]:", msg: "System initialized.", type: "success" },
    ]);
    const [terminalVersion, setTerminalVersion] = useState(0);

    // Browser preview content
    const [browserContent, setBrowserContent] = useState<string | null>(null);

    // Tool pills
    const [completedToolPills, setCompletedToolPills] = useState<ToolPill[]>([]);
    const [taskCompleted, setTaskCompleted] = useState(false);

    // UI state
    const [editingConvId, setEditingConvId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isVirtualComputerOpen, setVirtualComputerOpen] = useState(false);
    const toastIdRef = useRef(0);

    // Auto-open Virtual Computer when agent takes action
    useEffect(() => {
        if (agentEvents.activeTool || agentEvents.recentFiles.length > 0 || codeArtifacts.length > 0) {
            setVirtualComputerOpen(true);
        }
    }, [agentEvents.activeTool, agentEvents.recentFiles.length, codeArtifacts.length]);

    // Artifact Panel state
    const [activeDetectedArtifact, setActiveDetectedArtifact] = useState<DetectedArtifact | null>(null);

    const openArtifact = useCallback((artifact: DetectedArtifact) => {
        setActiveDetectedArtifact(artifact);
        setActiveTab('browser'); // Switch to browser tab to show artifact panel
    }, []);

    const closeArtifact = useCallback(() => {
        setActiveDetectedArtifact(null);
    }, []);

    // Manual override for computerView (Phase 2: code routing from chat)
    const [computerViewOverride, setComputerViewOverride] = useState<ComputerView | null>(null);

    const openFileInEditor = useCallback((filename: string, content: string, language: string) => {
        // Create a code artifact
        const newArtifact: CodeArtifact = {
            content: content,
            language,
            filename,
            timestamp: Date.now(),
        };
        setCodeArtifacts(prev => {
            const updated = [...prev, newArtifact];
            setActiveArtifactIdx(updated.length - 1);
            return updated;
        });
        // Switch to coding view and open computer
        setComputerViewOverride('coding');
        setVirtualComputerOpen(true);
        // Auto-clear override after 10s so auto-detection resumes
        setTimeout(() => setComputerViewOverride(null), 10000);
    }, []);

    // ── Load conversations ──────────────────────────────────────
    useEffect(() => {
        async function loadConversations() {
            try {
                const service = getChatHistory();
                const history = await service.listConversations();
                if (history && history.length > 0) {
                    setConversations(history);
                    setActiveConversationId(history[0].id);
                }
            } catch {
                // Silently handle
            }
        }
        loadConversations();
    }, []);

    // ── Agent elapsed time tracker ──────────────────────────────
    useEffect(() => {
        if (engine.agentStatus && engine.agentStatus !== "idle") {
            const start = Date.now();
            const interval = setInterval(() => {
                setAgentElapsedTime((Date.now() - start) / 1000);
            }, 100);
            return () => clearInterval(interval);
        } else {
            setAgentElapsedTime(0);
        }
    }, [engine.agentStatus]);

    // ── Auto-scroll messages ────────────────────────────────────
    // Use manual scrollTo instead of scrollIntoView to prevent scroll
    // propagation to mimi-outer-wrap (which has overflow from glow elements)
    useEffect(() => {
        const el = messagesEndRef.current;
        if (!el) return;
        const container = el.closest('.chat-messages');
        if (container) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, currentResponse]);

    // ── Load conversation when switching ────────────────────────
    useEffect(() => {
        if (!activeConversationId) return;
        async function loadConv() {
            try {
                const service = getChatHistory();
                const conv = await service.loadConversation(activeConversationId!);
                if (conv && conv.messages) {
                    const loaded: ChatMessage[] = conv.messages.map(m => ({
                        role: m.role,
                        content: m.content,
                    }));
                    setMessages(loaded);
                    setCurrentResponse("");
                }
            } catch {
                // If conversation doesn't exist yet, keep empty
            }
        }
        loadConv();
    }, [activeConversationId]);

    // ── Parse code artifacts from messages ───────────────────────
    const detectedArtifacts = useMemo(() => {
        const all: DetectedArtifact[] = [];
        messages.forEach(msg => {
            if (msg.role !== "assistant") return;
            all.push(...detectArtifacts(msg.content));
        });
        // Also check currentResponse for streaming
        if (currentResponse) {
            all.push(...detectArtifacts(currentResponse));
        }
        return all;
    }, [messages, currentResponse]);

    // Legacy code artifacts for Editor tab
    useEffect(() => {
        const artifacts: CodeArtifact[] = [];
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        messages.forEach(msg => {
            if (msg.role !== "assistant") return;
            let match;
            while ((match = codeBlockRegex.exec(msg.content)) !== null) {
                const lang = match[1] || "text";
                const code = match[2].trim();
                if (code.length > 10) {
                    const extMap: Record<string, string> = {
                        python: "py", javascript: "js", typescript: "ts",
                        html: "html", css: "css", json: "json", sql: "sql",
                        bash: "sh", shell: "sh", jsx: "jsx", tsx: "tsx",
                    };
                    const ext = extMap[lang] || lang;
                    artifacts.push({
                        filename: `mimi_output_${artifacts.length + 1}.${ext}`,
                        language: lang,
                        content: code,
                        timestamp: Date.now(),
                    });
                }
            }
        });
        if (artifacts.length > 0) {
            setCodeArtifacts(artifacts);
            setActiveArtifactIdx(artifacts.length - 1);
        }
    }, [messages]);

    // ── Accumulate terminal lines from agent events + action pills ──
    useEffect(() => {
        if (agentEvents.activeTool) {
            const toolName = typeof agentEvents.activeTool === 'object'
                ? agentEvents.activeTool.toolName
                : String(agentEvents.activeTool);

            terminalLinesRef.current = [
                ...terminalLinesRef.current,
                { prefix: "[TOOL]:", msg: `Executing ${toolName}...`, type: "tool" },
            ];
            setTerminalVersion(v => v + 1);

            const pillId = `pill-${Date.now()}-${toolName}`;
            setCompletedToolPills(prev => [
                ...prev,
                {
                    id: pillId,
                    toolName,
                    status: 'running',
                    timestamp: Date.now(),
                    // M2: associate with current assistant message count
                    messageIndex: messagesRef.current.filter(m => m.role === 'assistant').length,
                }
            ]);

            if (toolName === 'web_search') {
                setActiveTab('browser');
            } else if (toolName === 'execute_python' || toolName === 'execute_javascript' || toolName === 'execute_sql') {
                setActiveTab('terminal');
            } else if (toolName === 'create_file' || toolName === 'write_file') {
                setActiveTab('editor');
            }
        }
    }, [agentEvents.activeTool]);

    // ── Track completed tools ───────────────────────────────────
    useEffect(() => {
        if (agentEvents.recentTools && agentEvents.recentTools.length > 0) {
            const latestTool = agentEvents.recentTools[0];

            setCompletedToolPills(prev => {
                const updated = [...prev];
                const runningIdx = updated.findIndex(
                    p => p.toolName === latestTool.toolName && p.status === 'running'
                );
                if (runningIdx >= 0) {
                    updated[runningIdx] = {
                        ...updated[runningIdx],
                        status: latestTool.status === 'done' ? 'done' : 'failed',
                        output: latestTool.output,
                        duration: latestTool.duration,
                    };
                } else {
                    updated.push({
                        id: `pill-${Date.now()}-${latestTool.toolName}`,
                        toolName: latestTool.toolName,
                        status: latestTool.status === 'done' ? 'done' : 'failed',
                        output: latestTool.output,
                        duration: latestTool.duration,
                        timestamp: Date.now(),
                        messageIndex: messagesRef.current.filter(m => m.role === 'assistant').length,
                    });
                }
                return updated;
            });

            terminalLinesRef.current = [
                ...terminalLinesRef.current,
                {
                    prefix: latestTool.status === 'done' ? "[done]:" : "[fail]:",
                    msg: `${latestTool.toolName} ${latestTool.status === 'done' ? 'completed' : 'failed'}${latestTool.duration ? ` (${(latestTool.duration / 1000).toFixed(1)}s)` : ''}`,
                    type: latestTool.status === 'done' ? 'success' : 'error'
                },
            ];
            setTerminalVersion(v => v + 1);

            if (latestTool.toolName === 'web_search' && latestTool.status === 'done' && latestTool.output) {
                const searchHtml = latestTool.output
                    .replace(/^## (.+)$/gm, '<h2 style="color:#00d4ff;margin:0 0 12px;font-size:14px;">$1</h2>')
                    .replace(/^### (\d+)\. (.+)$/gm, '<div style="margin:8px 0 4px;font-weight:600;color:#e2e8f0;font-size:12px;">$1. $2</div>')
                    .replace(/^🔗 (.+)$/gm, '<a href="$1" target="_blank" style="color:#60a5fa;font-size:10px;word-break:break-all;display:block;margin-bottom:4px;">$1</a>')
                    .replace(/\n/g, '<br/>');
                setBrowserContent(sanitizeHtml(`<div style="font-family:Inter,system-ui,sans-serif;color:#94a3b8;">${searchHtml}</div>`));
                setActiveTab('browser');
            }
        }
    }, [agentEvents.recentTools]);

    useEffect(() => {
        if (agentEvents.agentStatus && agentEvents.agentStatus !== "idle") {
            terminalLinesRef.current = [
                ...terminalLinesRef.current,
                { prefix: "[MIMI-AI]:", msg: `Status: ${agentEvents.agentStatus}`, type: "info" },
            ];
            setTerminalVersion(v => v + 1);

            if (agentEvents.agentStatus === 'complete') {
                setTaskCompleted(true);
                setTimeout(() => setTaskCompleted(false), 8000);
            }
        }
    }, [agentEvents.agentStatus]);

    // ── Track generated files ───────────────────────────────────
    useEffect(() => {
        if (agentEvents.recentFiles && agentEvents.recentFiles.length > 0) {
            const newFiles: GeneratedFile[] = agentEvents.recentFiles.map(f => ({
                name: f.path.split("/").pop() || f.path,
                type: f.action,
                size: "---",
                timestamp: f.timestamp,
            }));
            setGeneratedFiles(prev => {
                const existing = new Set(prev.map(f => f.name));
                const unique = newFiles.filter(f => !existing.has(f.name));
                return [...prev, ...unique];
            });
        }
    }, [agentEvents.recentFiles]);

    // ── Send message handler ────────────────────────────────────
    const handleSend = useCallback(async (directText?: string) => {
        const text = (directText || input).trim();
        if (!text || isGenerating || engine.state !== "ready") return;

        setInput("");
        // H4: engine.handleSendMessage sets isGenerating=true internally
        setCurrentResponse("");

        terminalLinesRef.current = [
            ...terminalLinesRef.current,
            { prefix: "[USER]:", msg: text.slice(0, 60) + (text.length > 60 ? "..." : ""), type: "info" },
        ];
        setTerminalVersion(v => v + 1);

        const userMsg: ChatMessage = { role: "user", content: text };
        setMessages(prev => [...prev, userMsg]);

        try {
            let fullResponse = "";
            const generator = engine.handleSendMessage(text);
            for await (const chunk of generator) {
                fullResponse += chunk;
                // FIX: flushSync forces a synchronous DOM commit per token.
                // Without this, React 18 automatic batching defers updates from
                // the async generator's microtask queue until the next frame,
                // causing the "text only visible after resize" bug.
                flushSync(() => setCurrentResponse(fullResponse));
            }

            const assistantMsg: ChatMessage = { role: "assistant", content: fullResponse };
            setMessages(prev => [...prev, assistantMsg]);
            setCurrentResponse("");

            terminalLinesRef.current = [
                ...terminalLinesRef.current,
                { prefix: "[MIMI-AI]:", msg: `Response complete (${fullResponse.length} chars)`, type: "success" },
            ];
            setTerminalVersion(v => v + 1);

            // Auto-save conversation
            try {
                const service = getChatHistory();
                if (!activeConversationId || activeConversationId.startsWith("conv-")) {
                    const newId = await service.createConversation(text);
                    setActiveConversationId(newId);
                    // H1 FIX: Use messagesRef.current for latest state (not stale closure)
                    const allMsgs = [...messagesRef.current, userMsg, assistantMsg].map((m, i) => ({
                        id: `msg-${i}`,
                        role: m.role as "user" | "assistant",
                        content: m.content,
                        timestamp: new Date().toISOString(),
                    }));
                    await service.saveConversation(newId, allMsgs);
                } else {
                    const allMsgs = [...messagesRef.current, userMsg, assistantMsg].map((m, i) => ({
                        id: `msg-${i}`,
                        role: m.role as "user" | "assistant",
                        content: m.content,
                        timestamp: new Date().toISOString(),
                    }));
                    await service.saveConversation(activeConversationId, allMsgs);
                }
                const updated = await service.listConversations();
                if (updated) setConversations(updated);
            } catch {
                // Non-critical
            }

            if (fullResponse.includes("```html")) {
                const htmlMatch = fullResponse.match(/```html\n([\s\S]*?)```/);
                if (htmlMatch) setBrowserContent(sanitizeHtml(htmlMatch[1]));
            }
        } catch (err) {
            console.error("Send error:", err);
            // H3 FIX: Show user-visible error message in chat
            const errorMsg: ChatMessage = {
                role: "assistant",
                content: "⚠️ Es tut mir leid, bei der Generierung ist ein Fehler aufgetreten. Bitte versuche es erneut."
            };
            setMessages(prev => [...prev, errorMsg]);
            setCurrentResponse("");
            terminalLinesRef.current = [
                ...terminalLinesRef.current,
                { prefix: "[ERROR]:", msg: String(err), type: "error" },
            ];
            setTerminalVersion(v => v + 1);
        } finally {
            // H4: engine.handleSendMessage sets isGenerating=false in its own finally
            // BUG-4 FIX: Guarantee event bus resets even on error
            AgentEvents.thinkingEnd();
            AgentEvents.statusChange('idle');
        }
    }, [input, isGenerating, engine, activeConversationId]);

    // ── New conversation ────────────────────────────────────────
    const handleNewConversation = useCallback(async () => {
        if (messages.length > 0 && activeConversationId) {
            try {
                const service = getChatHistory();
                const serialized = messages.map((m, i) => ({
                    id: `msg-${i}`,
                    role: m.role as "user" | "assistant",
                    content: m.content,
                    timestamp: new Date().toISOString(),
                }));
                if (activeConversationId.startsWith("conv-")) {
                    const firstUserMsg = messages.find(m => m.role === "user");
                    const newId = await service.createConversation(firstUserMsg?.content || "New Chat");
                    await service.saveConversation(newId, serialized);
                } else {
                    await service.saveConversation(activeConversationId, serialized);
                }
                const updated = await service.listConversations();
                if (updated) setConversations(updated);
            } catch {
                // Non-critical
            }
        }
        setMessages([]);
        setCurrentResponse("");
        setInput("");
        setCodeArtifacts([]);
        setGeneratedFiles([]);
        setCompletedToolPills([]);
        setTaskCompleted(false);
        setBrowserContent(null);
        terminalLinesRef.current = [
            { prefix: "[MIMI-AI]:", msg: "New conversation started.", type: "success" },
        ];
        setTerminalVersion(v => v + 1);
        const newId = `conv-${Date.now()}`;
        setActiveConversationId(newId);
    }, [messages, activeConversationId]);

    // ── Toast notifications ─────────────────────────────────────
    const addToast = useCallback((msg: string) => {
        const id = ++toastIdRef.current;
        setToasts(prev => [...prev, { id, msg }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    // ── Delete conversation ─────────────────────────────────────
    const handleDeleteConversation = useCallback(async (id: string) => {
        try {
            const service = getChatHistory();
            await service.deleteConversation(id);
            const updated = await service.listConversations();
            setConversations(updated || []);
            if (activeConversationId === id) {
                if (updated && updated.length > 0) {
                    setActiveConversationId(updated[0].id);
                } else {
                    setMessages([]);
                    setActiveConversationId(null);
                }
            }
            addToast("Konversation gelöscht");
        } catch {
            addToast("Fehler beim Löschen");
        }
        setConfirmDeleteId(null);
    }, [activeConversationId, addToast]);

    // ── Rename conversation ─────────────────────────────────────
    const handleRenameConversation = useCallback(async (id: string, newTitle: string) => {
        if (!newTitle.trim()) { setEditingConvId(null); return; }
        try {
            const service = getChatHistory();
            await service.renameConversation(id, newTitle);
            const updated = await service.listConversations();
            if (updated) setConversations(updated);
            addToast("Umbenannt");
        } catch {
            addToast("Fehler beim Umbenennen");
        }
        setEditingConvId(null);
    }, [addToast]);

    // ── Copy message ────────────────────────────────────────────
    const handleCopyMessage = useCallback((content: string) => {
        navigator.clipboard.writeText(content)
            .then(() => addToast("In Zwischenablage kopiert"))
            .catch(() => addToast("Kopieren fehlgeschlagen"));
    }, [addToast]);

    // ── Retry message ───────────────────────────────────────────
    const handleRetryMessage = useCallback(async (msgIdx: number) => {
        const userMsg = messages.slice(0, msgIdx).reverse().find(m => m.role === "user");
        if (!userMsg) return;
        setMessages(prev => prev.slice(0, msgIdx));
        handleSend(userMsg.content);
    }, [messages, handleSend]);

    // ── Keyboard shortcuts ──────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey) {
                if (e.key === 'n') { e.preventDefault(); handleNewConversation(); }
                if (e.key === 'k') { e.preventDefault(); document.querySelector<HTMLInputElement>('.search-box input')?.focus(); }
            }
            if (e.key === 'Escape') {
                setShowSettings(false);
                setConfirmDeleteId(null);
                setEditingConvId(null);
                if (searchQuery) setSearchQuery("");
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleNewConversation, searchQuery]);

    // ── Computed values ─────────────────────────────────────────

    const statusText = useMemo(() => {
        if (engine.state === "checking") return "Initializing...";
        if (engine.state === "loading") return `Loading... ${Math.round(engine.loadingProgress)}%`;
        if (engine.state === "error") return "Error";
        if (!engine.agentStatus || engine.agentStatus === "idle") return "Ready";
        const labels: Record<string, string> = {
            thinking: "Thinking...",
            analyzing: "Analyzing...",
            researching: "Researching...",
            coding: "Coding...",
            executing: "Executing...",
            planning: "Planning...",
        };
        return labels[engine.agentStatus] || engine.agentStatus;
    }, [engine.state, engine.agentStatus, engine.loadingProgress]);

    const isReady = engine.state === "ready";
    const isIdle = !engine.agentStatus || engine.agentStatus === "idle";

    // ── WebMCP: Register MIMI tools when engine is ready ────────
    useEffect(() => {
        if (!isReady) return;
        const result = initWebMCP();
        if (result.registered > 0) {
            console.log(
                `[MimiAgent] WebMCP: ${result.registered} tools registered for external AI agents`
            );
        }
        return () => {
            getWebMCPBridge().unregisterAll();
        };
    }, [isReady]);

    const terminalLines = useMemo(() => {
        void terminalVersion;
        return terminalLinesRef.current.slice(-30);
    }, [terminalVersion]);

    const progressSteps = useMemo(() => {
        if (agentEvents.activePlan?.steps) {
            return agentEvents.activePlan.steps.map((step, i) => ({
                label: step.title || step.description || `Step ${i + 1}`,
                status: step.status === "done" ? "done" as const :
                    step.status === "running" ? "running" as const : "pending" as const,
            }));
        }
        return null;
    }, [agentEvents.activePlan]);

    // ── Manus-style Computer View — auto-derive from agent events ──
    const computerView = useMemo<ComputerView>(() => {
        // Manual override takes priority (e.g. user clicked "Im Editor öffnen")
        if (computerViewOverride) return computerViewOverride;
        // Active tool determines view
        if (agentEvents.activeTool) {
            const toolName = typeof agentEvents.activeTool === 'object'
                ? agentEvents.activeTool.toolName
                : String(agentEvents.activeTool);
            if (toolName === 'web_search' || toolName.includes('read_url') || toolName.includes('browse')) return 'browsing';
            if (toolName === 'execute_python' || toolName === 'execute_javascript' || toolName === 'execute_sql' || toolName === 'run_command') return 'terminal';
            if (toolName === 'create_file' || toolName === 'write_file' || toolName.includes('replace')) return 'coding';
        }
        // Browser content available → show browsing
        if (browserContent && isGenerating) return 'browsing';
        // Active plan in planning phase
        if (agentEvents.activePlan && agentEvents.activePlan.status === 'planning') return 'planning';
        // Currently thinking/generating → planning view with task tree
        if (agentEvents.isThinking || isGenerating) return 'planning';
        return 'idle';
    }, [computerViewOverride, agentEvents.activeTool, agentEvents.activePlan, agentEvents.isThinking, browserContent, isGenerating]);

    // Derive swarm agents from agentEvents for the AgentSwarmPanel
    const activeSwarmAgents = useMemo<string[]>(() => {
        const agents: string[] = [];
        if (agentEvents.activeAgent) {
            agents.push(agentEvents.activeAgent);
        }
        // Map recent tools to specialist agents
        if (agentEvents.recentTools && agentEvents.recentTools.length > 0) {
            const toolAgentMap: Record<string, string> = {
                'execute_python': 'code-expert',
                'execute_javascript': 'code-expert',
                'web_search': 'web-researcher',
                'search_documents': 'research-agent',
                'analyze_image': 'data-analyst',
                'create_file': 'document-expert',
                'write_file': 'document-expert',
                'calculate': 'math-specialist',
            };
            agentEvents.recentTools.forEach(tool => {
                const mapped = toolAgentMap[tool.toolName];
                if (mapped && !agents.includes(mapped)) {
                    agents.push(mapped);
                }
            });
        }
        return agents;
    }, [agentEvents.activeAgent, agentEvents.recentTools]);

    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        return conversations.filter(c =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [conversations, searchQuery]);

    const groupedConversations = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 86400000);
        const weekAgo = new Date(today.getTime() - 7 * 86400000);
        const groups: { label: string; items: ConversationSummary[] }[] = [
            { label: "Heute", items: [] },
            { label: "Gestern", items: [] },
            { label: "Diese Woche", items: [] },
            { label: "Älter", items: [] },
        ];
        filteredConversations.forEach(conv => {
            const d = new Date(conv.updatedAt);
            if (d >= today) groups[0].items.push(conv);
            else if (d >= yesterday) groups[1].items.push(conv);
            else if (d >= weekAgo) groups[2].items.push(conv);
            else groups[3].items.push(conv);
        });
        return groups.filter(g => g.items.length > 0);
    }, [filteredConversations]);

    // ── Context Value ───────────────────────────────────────────

    const value = useMemo<MimiAgentContextValue>(() => ({
        engine,
        agentEvents,
        messages, input, setInput, currentResponse, isGenerating,
        handleSend, handleNewConversation,
        computerView,
        handleDeleteConversation, handleRenameConversation,
        handleCopyMessage, handleRetryMessage,
        conversations, activeConversationId, setActiveConversationId,
        searchQuery, setSearchQuery, groupedConversations,
        activeTab, setActiveTab,
        codeArtifacts, activeArtifactIdx, setActiveArtifactIdx,
        generatedFiles, terminalLines, browserContent,
        completedToolPills, taskCompleted, agentElapsedTime,
        detectedArtifacts, activeDetectedArtifact, setActiveDetectedArtifact,
        openArtifact, closeArtifact, openFileInEditor,
        sidebarCollapsed, setSidebarCollapsed,
        showSettings, setShowSettings,
        confirmDeleteId, setConfirmDeleteId,
        editingConvId, setEditingConvId,
        editingTitle, setEditingTitle,
        toasts, addToast,
        memoryToasts, showMemoryToast, dismissMemoryToast,
        activeSwarmAgents,
        statusText, isReady, isIdle, progressSteps,
        messagesEndRef, textareaRef,
        // Agent Swarm
        // activeSwarmAgents, // This was a duplicate, removed.



        // Refs
        // messagesEndRef, // This was a duplicate, removed.
        // textareaRef, // This was a duplicate, removed.
        isVirtualComputerOpen, setVirtualComputerOpen,
    }), [
        engine,
        agentEvents,
        messages,
        input,
        currentResponse,
        isGenerating,
        handleSend, handleNewConversation,
        handleDeleteConversation, handleRenameConversation,
        handleCopyMessage, handleRetryMessage,
        conversations,
        activeConversationId, setActiveConversationId,
        searchQuery, setSearchQuery,
        groupedConversations,
        computerView,
        activeTab, setActiveTab,
        agentElapsedTime,
        codeArtifacts,
        activeArtifactIdx, setActiveArtifactIdx,
        generatedFiles,
        terminalLines,
        browserContent,
        completedToolPills,
        taskCompleted,
        editingConvId, setEditingConvId,
        editingTitle, setEditingTitle,
        confirmDeleteId, setConfirmDeleteId,
        showSettings, setShowSettings,
        toasts, addToast,
        sidebarCollapsed, setSidebarCollapsed,
        isVirtualComputerOpen, setVirtualComputerOpen,
        memoryToasts, showMemoryToast, dismissMemoryToast,
        activeSwarmAgents,
        statusText,
        isIdle,
        progressSteps,
        activeDetectedArtifact, setActiveDetectedArtifact,
        openArtifact, closeArtifact, openFileInEditor,
        messagesEndRef,
        textareaRef,
    ]);

    return (
        <MimiAgentCtx.Provider value={value}>
            {children}
        </MimiAgentCtx.Provider>
    );
}
