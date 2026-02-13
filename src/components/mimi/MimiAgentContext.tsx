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
import { useMimiEngine } from "@/hooks/mimi/useMimiEngine";
import { useAgentEvents } from "@/hooks/mimi/useAgentEvents";
import { getChatHistory, type ConversationSummary } from "@/lib/mimi/chat-history";
import type { ChatMessage } from "@/lib/mimi/inference-engine";
import type { UseMimiEngineReturn } from "@/hooks/mimi/types";
import type { UITaskPlan, UIToolExecution, UIFileActivity } from "@/hooks/mimi/useAgentEvents";

// ═══════════════════════════════════════════════════════════
// SECURITY: HTML sanitization for browser preview panel
// ═══════════════════════════════════════════════════════════

/** Strip dangerous HTML tags/attributes to prevent XSS in browser preview panel */
function sanitizeHtml(html: string): string {
    let safe = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    safe = safe.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    safe = safe.replace(/href\s*=\s*["']?\s*javascript:/gi, 'href="');
    safe = safe.replace(/src\s*=\s*["']?\s*javascript:/gi, 'src="');
    safe = safe.replace(/src\s*=\s*["']?\s*data:text\/html/gi, 'src="');
    safe = safe.replace(/<\s*\/?\s*(iframe|object|embed|form|base|meta|link)\b[^>]*>/gi, '');
    safe = safe.replace(/style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, '');
    return safe;
}

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
}

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

    // Sandbox
    activeTab: "browser" | "terminal" | "editor" | "files";
    setActiveTab: (tab: "browser" | "terminal" | "editor" | "files") => void;
    codeArtifacts: CodeArtifact[];
    activeArtifactIdx: number;
    setActiveArtifactIdx: (idx: number) => void;
    generatedFiles: GeneratedFile[];
    terminalLines: PageTerminalLine[];
    browserContent: string | null;
    completedToolPills: ToolPill[];
    taskCompleted: boolean;
    agentElapsedTime: number;

    // UI
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (v: boolean | ((prev: boolean) => boolean)) => void;
    showSettings: boolean;
    setShowSettings: (v: boolean) => void;
    confirmDeleteId: string | null;
    setConfirmDeleteId: (id: string | null) => void;
    editingConvId: string | null;
    setEditingConvId: (id: string | null) => void;
    editingTitle: string;
    setEditingTitle: (t: string) => void;
    hoveredMsgIdx: number | null;
    setHoveredMsgIdx: (idx: number | null) => void;
    toasts: { id: number; msg: string }[];
    addToast: (msg: string) => void;

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

    // Chat state
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [currentResponse, setCurrentResponse] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Conversations
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Sandbox tabs
    const [activeTab, setActiveTab] = useState<"browser" | "terminal" | "editor" | "files">("browser");

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
    const [hoveredMsgIdx, setHoveredMsgIdx] = useState<number | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const toastIdRef = useRef(0);

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
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
                { id: pillId, toolName, status: 'running', timestamp: Date.now() }
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
        setIsGenerating(true);
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
                setCurrentResponse(fullResponse);
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
                    const allMsgs = [...messages, userMsg, assistantMsg].map((m, i) => ({
                        id: `msg-${i}`,
                        role: m.role as "user" | "assistant",
                        content: m.content,
                        timestamp: new Date().toISOString(),
                    }));
                    await service.saveConversation(newId, allMsgs);
                } else {
                    const allMsgs = [...messages, userMsg, assistantMsg].map((m, i) => ({
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
            terminalLinesRef.current = [
                ...terminalLinesRef.current,
                { prefix: "[ERROR]:", msg: String(err), type: "error" },
            ];
            setTerminalVersion(v => v + 1);
        } finally {
            setIsGenerating(false);
        }
    }, [input, isGenerating, engine, activeConversationId, messages]);

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
            addToast("Konversation geloescht");
        } catch {
            addToast("Fehler beim Loeschen");
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
            { label: "Aelter", items: [] },
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
        handleDeleteConversation, handleRenameConversation,
        handleCopyMessage, handleRetryMessage,
        conversations, activeConversationId, setActiveConversationId,
        searchQuery, setSearchQuery, groupedConversations,
        activeTab, setActiveTab,
        codeArtifacts, activeArtifactIdx, setActiveArtifactIdx,
        generatedFiles, terminalLines, browserContent,
        completedToolPills, taskCompleted, agentElapsedTime,
        sidebarCollapsed, setSidebarCollapsed,
        showSettings, setShowSettings,
        confirmDeleteId, setConfirmDeleteId,
        editingConvId, setEditingConvId,
        editingTitle, setEditingTitle,
        hoveredMsgIdx, setHoveredMsgIdx,
        toasts, addToast,
        statusText, isReady, isIdle, progressSteps,
        messagesEndRef, textareaRef,
    }), [
        engine, agentEvents,
        messages, input, currentResponse, isGenerating,
        handleSend, handleNewConversation,
        handleDeleteConversation, handleRenameConversation,
        handleCopyMessage, handleRetryMessage,
        conversations, activeConversationId,
        searchQuery, groupedConversations,
        activeTab,
        codeArtifacts, activeArtifactIdx,
        generatedFiles, terminalLines, browserContent,
        completedToolPills, taskCompleted, agentElapsedTime,
        sidebarCollapsed,
        showSettings,
        confirmDeleteId,
        editingConvId, editingTitle,
        hoveredMsgIdx,
        toasts, addToast,
        statusText, isReady, isIdle, progressSteps,
    ]);

    return (
        <MimiAgentCtx.Provider value={value}>
            {children}
        </MimiAgentCtx.Provider>
    );
}
