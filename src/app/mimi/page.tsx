"use client";

/**
 * MIMI Agent — Pixel-Perfect Manus AI 3-Panel Layout
 * 
 * Architecture matches the reference image exactly:
 * - Left (220px):  Task List & History  
 * - Center (flex):  Premium Chat Interface
 * - Right (320px):  Agent's Computer / Virtual Sandbox
 *
 * All components are wired to real engine state — NO demo content.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useMimiEngine } from "@/hooks/useMimiEngine";
import { getChatHistory, type ConversationSummary } from "@/lib/mimi/chat-history";
import { useAgentEvents } from "@/hooks/mimi/useAgentEvents";
import type { ChatMessage } from "@/lib/mimi/inference-engine";
import AgentThinkingBar from "@/components/mimi/components/AgentThinkingBar";
import dynamic from "next/dynamic";
import "@/styles/mimi-agent.css";

// Monaco Editor — SSR-safe dynamic import
const MonacoEditor = dynamic(() => import("@monaco-editor/react").then(mod => mod.default), {
    ssr: false,
    loading: () => <div style={{ padding: '16px', color: '#64748b', fontSize: '11px' }}>Editor wird geladen...</div>
});

// ═══════════════════════════════════════════════════════════
// TYPES for sandbox wiring
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

interface TerminalLine {
    prefix: string;
    msg: string;
    type?: "info" | "success" | "error" | "tool";
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

/** Convert markdown text to HTML for agent messages */
function formatContent(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Code blocks
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="code-block"><code>$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Headers
        .replace(/^### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^## (.+)$/gm, '<h3>$1</h3>')
        .replace(/^# (.+)$/gm, '<h2>$1</h2>')
        // Bold / Italic
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Unordered lists
        .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
        // Ordered lists
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        // Line breaks
        .replace(/\n/g, '<br />');
}

// ═══════════════════════════════════════════════════════════
// Page Component
// ═══════════════════════════════════════════════════════════

export default function MimiPage() {
    const engine = useMimiEngine();
    const agentEvents = useAgentEvents();

    // Chat state
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [currentResponse, setCurrentResponse] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Conversations (real data from history)
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Sandbox tabs
    const [activeTab, setActiveTab] = useState<"browser" | "terminal" | "editor" | "files">("browser");

    // Agent elapsed time
    const [agentElapsedTime, setAgentElapsedTime] = useState(0);

    // Fix 3: Code artifacts for Editor tab
    const [codeArtifacts, setCodeArtifacts] = useState<CodeArtifact[]>([]);
    const [activeArtifactIdx, setActiveArtifactIdx] = useState(0);

    // Fix 4: Generated files for Files tab
    const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);

    // Fix 5: Accumulated terminal lines (persists across re-renders)
    const terminalLinesRef = useRef<TerminalLine[]>([
        { prefix: "[MIMI-AI]:", msg: "System initialized.", type: "success" },
    ]);
    const [terminalVersion, setTerminalVersion] = useState(0);

    // Fix 8: Browser preview content
    const [browserContent, setBrowserContent] = useState<string | null>(null);

    // Functional Engine: Track completed tools for action pills & auto-tab switching
    const [completedToolPills, setCompletedToolPills] = useState<Array<{
        id: string;
        toolName: string;
        status: 'running' | 'done' | 'failed';
        output?: string;
        duration?: number;
        timestamp: number;
    }>>([]);
    const [taskCompleted, setTaskCompleted] = useState(false);

    // Phase 9: Full functionality state
    const [editingConvId, setEditingConvId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
    const [hoveredMsgIdx, setHoveredMsgIdx] = useState<number | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const toastIdRef = useRef(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Load conversations
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
                // Silently handle — conversations will be empty
            }
        }
        loadConversations();
    }, []);

    // Agent elapsed time tracker
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

    // Auto-scroll messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, currentResponse]);

    // Fix 2: Load conversation when switching
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

    // Fix 3: Parse code artifacts from messages
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
                    // Guess filename from language
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

    // Fix 5: Accumulate terminal lines from agent events + ACTION PILLS
    useEffect(() => {
        if (agentEvents.activeTool) {
            const toolName = typeof agentEvents.activeTool === 'object'
                ? agentEvents.activeTool.toolName
                : String(agentEvents.activeTool);
            const toolParams = typeof agentEvents.activeTool === 'object'
                ? agentEvents.activeTool.parameters
                : {};

            // Terminal log
            terminalLinesRef.current = [
                ...terminalLinesRef.current,
                { prefix: "[TOOL]:", msg: `Executing ${toolName}...`, type: "tool" },
            ];
            setTerminalVersion(v => v + 1);

            // Action pill — add as running
            const pillId = `pill-${Date.now()}-${toolName}`;
            setCompletedToolPills(prev => [
                ...prev,
                { id: pillId, toolName, status: 'running', timestamp: Date.now() }
            ]);

            // Auto-switch tab based on tool type
            if (toolName === 'web_search') {
                setActiveTab('browser');
            } else if (toolName === 'execute_python' || toolName === 'execute_javascript' || toolName === 'execute_sql') {
                setActiveTab('terminal');
            } else if (toolName === 'create_file' || toolName === 'write_file') {
                setActiveTab('editor');
            }
        }
    }, [agentEvents.activeTool]);

    // Track completed tools → update action pills + browser content
    useEffect(() => {
        if (agentEvents.recentTools && agentEvents.recentTools.length > 0) {
            const latestTool = agentEvents.recentTools[0];

            // Update running pill to done/failed
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
                    // Tool completed without a pill — add it
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

            // Terminal log for completion
            terminalLinesRef.current = [
                ...terminalLinesRef.current,
                {
                    prefix: latestTool.status === 'done' ? "[✓]:" : "[✗]:",
                    msg: `${latestTool.toolName} ${latestTool.status === 'done' ? 'completed' : 'failed'}${latestTool.duration ? ` (${(latestTool.duration / 1000).toFixed(1)}s)` : ''}`,
                    type: latestTool.status === 'done' ? 'success' : 'error'
                },
            ];
            setTerminalVersion(v => v + 1);

            // Web search results → browser tab
            if (latestTool.toolName === 'web_search' && latestTool.status === 'done' && latestTool.output) {
                // Convert markdown results to styled HTML for browser tab
                const searchHtml = latestTool.output
                    .replace(/^## (.+)$/gm, '<h2 style="color:#00d4ff;margin:0 0 12px;font-size:14px;">$1</h2>')
                    .replace(/^### (\d+)\. (.+)$/gm, '<div style="margin:8px 0 4px;font-weight:600;color:#e2e8f0;font-size:12px;">$1. $2</div>')
                    .replace(/^🔗 (.+)$/gm, '<a href="$1" target="_blank" style="color:#60a5fa;font-size:10px;word-break:break-all;display:block;margin-bottom:4px;">$1</a>')
                    .replace(/\n/g, '<br/>');
                setBrowserContent(`<div style="font-family:Inter,system-ui,sans-serif;color:#94a3b8;">${searchHtml}</div>`);
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

            // Task completed detection
            if (agentEvents.agentStatus === 'complete') {
                setTaskCompleted(true);
                setTimeout(() => setTaskCompleted(false), 8000);
            }
        }
    }, [agentEvents.agentStatus]);

    // Fix 4 + 8: Track generated files & browser content from recent tools
    useEffect(() => {
        if (agentEvents.recentFiles && agentEvents.recentFiles.length > 0) {
            const newFiles: GeneratedFile[] = agentEvents.recentFiles.map(f => ({
                name: f.path.split("/").pop() || f.path,
                type: f.action,
                size: "—",
                timestamp: f.timestamp,
            }));
            setGeneratedFiles(prev => {
                const existing = new Set(prev.map(f => f.name));
                const unique = newFiles.filter(f => !existing.has(f.name));
                return [...prev, ...unique];
            });
        }
    }, [agentEvents.recentFiles]);

    // Fix 6: Send message handler — accepts optional text for auto-send
    const handleSend = useCallback(async (directText?: string) => {
        const text = (directText || input).trim();
        if (!text || isGenerating || engine.state !== "ready") return;

        setInput("");
        setIsGenerating(true);
        setCurrentResponse("");

        // Fix 5: Log to terminal
        terminalLinesRef.current = [
            ...terminalLinesRef.current,
            { prefix: "[USER]:", msg: text.slice(0, 60) + (text.length > 60 ? "…" : ""), type: "info" },
        ];
        setTerminalVersion(v => v + 1);

        // Add user message
        const userMsg: ChatMessage = {
            role: "user",
            content: text,
        };
        setMessages(prev => [...prev, userMsg]);

        try {
            let fullResponse = "";
            const generator = engine.handleSendMessage(text);
            for await (const chunk of generator) {
                fullResponse += chunk;
                setCurrentResponse(fullResponse);
            }

            // Add assistant message
            const assistantMsg: ChatMessage = {
                role: "assistant",
                content: fullResponse,
            };
            setMessages(prev => [...prev, assistantMsg]);
            setCurrentResponse("");

            // Fix 5: Log completion to terminal
            terminalLinesRef.current = [
                ...terminalLinesRef.current,
                { prefix: "[MIMI-AI]:", msg: `Response complete (${fullResponse.length} chars)`, type: "success" },
            ];
            setTerminalVersion(v => v + 1);

            // Fix 7: Auto-save conversation
            try {
                const service = getChatHistory();
                if (!activeConversationId || activeConversationId.startsWith("conv-")) {
                    // Create new conversation
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
                    // Save to existing conversation
                    const allMsgs = [...messages, userMsg, assistantMsg].map((m, i) => ({
                        id: `msg-${i}`,
                        role: m.role as "user" | "assistant",
                        content: m.content,
                        timestamp: new Date().toISOString(),
                    }));
                    await service.saveConversation(activeConversationId, allMsgs);
                }
                // Refresh conversation list
                const updated = await service.listConversations();
                if (updated) setConversations(updated);
            } catch {
                // Non-critical — don't break chat flow
            }

            // Fix 8: Check for HTML/chart artifacts in response
            if (fullResponse.includes("```html")) {
                const htmlMatch = fullResponse.match(/```html\n([\s\S]*?)```/);
                if (htmlMatch) setBrowserContent(htmlMatch[1]);
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


    // Fix 7: New conversation — saves current one first
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

    // ═══ Phase 9: Toast notifications ═══
    const addToast = useCallback((msg: string) => {
        const id = ++toastIdRef.current;
        setToasts(prev => [...prev, { id, msg }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    // ═══ Phase 9: Delete conversation ═══
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

    // ═══ Phase 9: Rename conversation ═══
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

    // ═══ Phase 9: Copy message ═══
    const handleCopyMessage = useCallback((content: string) => {
        navigator.clipboard.writeText(content)
            .then(() => addToast("In Zwischenablage kopiert"))
            .catch(() => addToast("Kopieren fehlgeschlagen"));
    }, [addToast]);

    // ═══ Phase 9: Retry message ═══
    const handleRetryMessage = useCallback(async (msgIdx: number) => {
        const userMsg = messages.slice(0, msgIdx).reverse().find(m => m.role === "user");
        if (!userMsg) return;
        setMessages(prev => prev.slice(0, msgIdx));
        handleSend(userMsg.content);
    }, [messages, handleSend]);

    // ═══ Phase 9: Keyboard shortcuts ═══
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

    // Status display
    const statusText = useMemo(() => {
        if (engine.state === "checking") return "Initializing…";
        if (engine.state === "loading") return `Loading… ${Math.round(engine.loadingProgress)}%`;
        if (engine.state === "error") return "Error";
        if (!engine.agentStatus || engine.agentStatus === "idle") return "Ready";
        const labels: Record<string, string> = {
            thinking: "Thinking…",
            analyzing: "Analyzing…",
            researching: "Researching…",
            coding: "Coding…",
            executing: "Executing…",
            planning: "Planning…",
        };
        return labels[engine.agentStatus] || engine.agentStatus;
    }, [engine.state, engine.agentStatus, engine.loadingProgress]);

    const isReady = engine.state === "ready";
    const isIdle = !engine.agentStatus || engine.agentStatus === "idle";

    // Fix 5: Terminal lines from accumulated ref (refreshed via terminalVersion)
    const terminalLines = useMemo(() => {
        void terminalVersion; // dependency trigger
        return terminalLinesRef.current.slice(-30); // Keep last 30 lines
    }, [terminalVersion]);

    // Progress steps from agent plan (real data only)
    const progressSteps = useMemo(() => {
        if (agentEvents.activePlan?.steps) {
            return agentEvents.activePlan.steps.map((step, i) => ({
                label: step.title || step.description || `Step ${i + 1}`,
                status: step.status === "done" ? "done" as const :
                    step.status === "running" ? "running" as const : "pending" as const,
            }));
        }
        return null; // No fake steps — null means show empty state
    }, [agentEvents.activePlan]);

    // Filtered conversations for search
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        return conversations.filter(c =>
            c.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [conversations, searchQuery]);

    // ═══ Phase 9: Date-grouped conversations ═══
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

    // Welcome prompts for empty chat
    const welcomePrompts = [
        "Analysiere meine Daten",
        "Schreibe Python-Code",
        "Erstelle einen Bericht",
        "Erkläre Machine Learning",
    ];

    // ═══ RENDER ═══════════════════════════════════════════════
    return (
        <div className="mimi-outer-wrap">
            {/* Ambient glow blobs */}
            <div className="glow-1" />
            <div className="glow-2" />
            <div className="glow-3" />
            <div className="glow-4" />
            <div className="glow-5" />

            {/* Top section labels */}
            <div className="mimi-top-labels">
                <span>Task List &amp; History</span>
                <span>Intelligence Chat</span>
                <span>Agent Computer</span>
            </div>

            {/* ═══ WORKSPACE ═══ */}
            <div className={`mimi-workspace${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>

                {/* ══════════ LEFT PANEL ══════════ */}
                <div className="mimi-panel panel-left">
                    <div className="logo-row">
                        <div className="logo-avatar">M</div>
                        <div className="search-box">
                            <span className="icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button className="search-clear" onClick={() => setSearchQuery("")} title="Clear search">✕</button>
                            )}
                        </div>
                    </div>

                    <div className="tasks-list">
                        {groupedConversations.length > 0 ? (
                            groupedConversations.map(group => (
                                <div key={group.label}>
                                    <div className="group-label">{group.label}</div>
                                    {group.items.map((conv, i) => (
                                        <div
                                            key={conv.id}
                                            className={`task-item ${conv.id === activeConversationId ? "active" : ""}`}
                                            onClick={() => { if (editingConvId !== conv.id) setActiveConversationId(conv.id); }}
                                            onDoubleClick={(e) => { e.stopPropagation(); setEditingConvId(conv.id); setEditingTitle(conv.title); }}
                                        >
                                            <div className={`task-dot ${i % 4 === 0 ? "dot-cyan" : i % 4 === 1 ? "dot-purple" : i % 4 === 2 ? "dot-blue" : "dot-amber"}`} />
                                            <div className="task-info">
                                                {editingConvId === conv.id ? (
                                                    <input
                                                        className="rename-input"
                                                        value={editingTitle}
                                                        onChange={e => setEditingTitle(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') handleRenameConversation(conv.id, editingTitle);
                                                            if (e.key === 'Escape') setEditingConvId(null);
                                                        }}
                                                        onBlur={() => handleRenameConversation(conv.id, editingTitle)}
                                                        autoFocus
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                ) : (
                                                    <h4>{conv.title}</h4>
                                                )}
                                                <p>{new Date(conv.updatedAt).toLocaleDateString("de-DE", { month: "short", day: "numeric" })}</p>
                                            </div>
                                            <button
                                                className="task-delete-btn"
                                                title="Löschen"
                                                onClick={e => { e.stopPropagation(); setConfirmDeleteId(conv.id); }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ))
                        ) : (
                            <div className="tasks-empty">
                                <div className="tasks-empty-icon">💬</div>
                                <p>{searchQuery ? "Keine Ergebnisse" : "Starten Sie Ihre erste Konversation"}</p>
                            </div>
                        )}
                    </div>

                    <div className="sidebar-bottom">
                        <button className="new-thread-btn" onClick={handleNewConversation}>+ New Thread</button>
                        <div className="user-row" style={{ justifyContent: 'center' }}>
                            <span title="Einstellungen" style={{ cursor: 'pointer', fontSize: '16px', opacity: 0.5 }} onClick={() => setShowSettings(true)}>⚙</span>
                        </div>
                    </div>
                </div>

                {/* ══════════ CENTER PANEL ══════════ */}
                <div className="mimi-panel panel-center">
                    {/* Aurora bar */}
                    <div className="aurora-bar" />

                    {/* K3/K5: Status Pill with spinner + gradient shimmer */}
                    <div className="status-pill-wrap">
                        <div className="status-pill">
                            <span className="pill-label">AGENT STATUS:</span>
                            <span className="pill-value">
                                {statusText}
                                {!isIdle && agentElapsedTime > 0 && ` · ${agentElapsedTime.toFixed(1)}s`}
                            </span>
                            <div className={`pill-spinner ${isIdle && isReady ? "idle" : ""}`} />
                        </div>
                    </div>
                    {/* Sidebar collapse toggle */}
                    <button
                        className="sidebar-toggle-btn"
                        onClick={() => setSidebarCollapsed(prev => !prev)}
                        title={sidebarCollapsed ? 'Sidebar einblenden' : 'Sidebar ausblenden'}
                    >
                        {sidebarCollapsed ? '☰' : '◁'}
                    </button>

                    {/* Agent Thinking Bar */}
                    {agentEvents.isThinking && (
                        <AgentThinkingBar
                            status={agentEvents.agentStatus}
                            agent={agentEvents.activeAgent}
                            activeTool={agentEvents.activeTool}
                            elapsedTime={agentEvents.elapsedTime}
                            thinkingContent={agentEvents.thinkingContent}
                            isThinking={agentEvents.isThinking}
                        />
                    )}

                    {/* Chat Content */}
                    {!isReady ? (
                        <div className="center-loading">
                            <div className="loading-spinner" />
                            <p>{engine.state === "loading" ? `Loading model… ${Math.round(engine.loadingProgress)}%` : "Initializing…"}</p>
                            {engine.loadingStatus && <p>{engine.loadingStatus}</p>}
                        </div>
                    ) : messages.length === 0 && !currentResponse ? (
                        /* ═══ Welcome Screen — dynamic empty state ═══ */
                        <div className="chat-welcome">
                            <div className="welcome-orb">✦</div>
                            <h2>MIMI – Ihre Souveräne Intelligenz</h2>
                            <p>Keine Cloud. Keine API-Calls. MIMI denkt, plant und handelt — komplett lokal auf Ihrem Gerät.</p>
                            <div className="welcome-prompts">
                                {welcomePrompts.map((prompt, i) => (
                                    <button
                                        key={i}
                                        className="welcome-prompt-btn"
                                        onClick={() => handleSend(prompt)}
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="chat-messages">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className="msg-wrap"
                                    onMouseEnter={() => setHoveredMsgIdx(idx)}
                                    onMouseLeave={() => setHoveredMsgIdx(null)}
                                >
                                    {msg.role === "user" ? (
                                        <div className="msg-user-wrap">
                                            <div className="msg-user">
                                                {msg.content}
                                                {hoveredMsgIdx === idx && (
                                                    <div className="msg-actions">
                                                        <button onClick={() => handleCopyMessage(msg.content)} title="Kopieren">📋</button>
                                                        <button onClick={() => { setInput(msg.content); textareaRef.current?.focus(); }} title="Bearbeiten">✏️</button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="user-msg-avatar">U</div>
                                        </div>
                                    ) : (
                                        <div className="msg-agent">
                                            <div className="agent-dot">M</div>
                                            <div className="agent-body">
                                                {/* ═══ Action Pills — tool executions before this response ═══ */}
                                                {idx > 0 && completedToolPills.length > 0 && (
                                                    <div className="action-pills-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                                        {completedToolPills
                                                            .filter(pill => {
                                                                // Show pills relevant to this message's context
                                                                const msgIndex = messages.filter(m => m.role === 'assistant').indexOf(msg);
                                                                const pillIndex = completedToolPills.indexOf(pill);
                                                                const pillsPerMsg = Math.ceil(completedToolPills.length / Math.max(1, messages.filter(m => m.role === 'assistant').length));
                                                                return pillIndex >= msgIndex * pillsPerMsg && pillIndex < (msgIndex + 1) * pillsPerMsg;
                                                            })
                                                            .map(pill => (
                                                                <div
                                                                    key={pill.id}
                                                                    className={`action-pill action-pill--${pill.status}`}
                                                                    title={pill.output?.slice(0, 200) || pill.toolName}
                                                                >
                                                                    <span className="action-pill-icon">
                                                                        {pill.status === 'running' ? '⟳' :
                                                                            pill.status === 'done' ? '✓' : '✗'}
                                                                    </span>
                                                                    <span className="action-pill-label">
                                                                        {pill.toolName === 'web_search' ? '🔍 Web Search' :
                                                                            pill.toolName === 'execute_python' ? '🐍 Python' :
                                                                                pill.toolName === 'execute_javascript' ? '⚡ JavaScript' :
                                                                                    pill.toolName === 'calculate' ? '🧮 Calculate' :
                                                                                        pill.toolName === 'create_file' ? '📄 Create File' :
                                                                                            pill.toolName === 'write_file' ? '📝 Write File' :
                                                                                                pill.toolName === 'read_file' ? '📖 Read File' :
                                                                                                    pill.toolName === 'search_documents' ? '📚 Doc Search' :
                                                                                                        pill.toolName === 'analyze_image' ? '👁 Vision' :
                                                                                                            pill.toolName}
                                                                    </span>
                                                                    {pill.duration && (
                                                                        <span className="action-pill-duration">
                                                                            {(pill.duration / 1000).toFixed(1)}s
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                    </div>
                                                )}
                                                <div className="agent-bubble">
                                                    <div className="agent-text" dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
                                                </div>
                                                {hoveredMsgIdx === idx && (
                                                    <div className="msg-actions">
                                                        <button onClick={() => handleCopyMessage(msg.content)} title="Kopieren">📋</button>
                                                        <button onClick={() => handleRetryMessage(idx)} title="Nochmal generieren">🔄</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Active Action Pills — currently running tools */}
                            {completedToolPills.some(p => p.status === 'running') && (
                                <div className="msg-agent" style={{ marginBottom: '4px' }}>
                                    <div className="agent-dot" />
                                    <div className="agent-body">
                                        <div className="action-pills-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {completedToolPills.filter(p => p.status === 'running').map(pill => (
                                                <div key={pill.id} className="action-pill action-pill--active">
                                                    <span className="action-pill-icon">⟳</span>
                                                    <span className="action-pill-label">
                                                        {pill.toolName === 'web_search' ? '🔍 Searching...' :
                                                            pill.toolName === 'execute_python' ? '🐍 Running Python...' :
                                                                pill.toolName === 'execute_javascript' ? '⚡ Running JS...' :
                                                                    `Running ${pill.toolName}...`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Streaming response */}
                            {currentResponse && (
                                <div className="msg-agent">
                                    <div className="agent-dot">M</div>
                                    <div className="agent-body">
                                        <div className="agent-bubble">
                                            <div className="agent-text" dangerouslySetInnerHTML={{ __html: formatContent(currentResponse) }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Task Completed Banner */}
                            {taskCompleted && (
                                <div className="task-completed-banner">
                                    <span className="task-completed-icon">✓</span>
                                    <span>Task completed successfully</span>
                                    {agentEvents.elapsedTime > 0 && (
                                        <span className="task-completed-time">
                                            {(agentEvents.elapsedTime / 1000).toFixed(1)}s
                                        </span>
                                    )}
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}

                    {/* Input Bar */}
                    <div className="chat-input-bar">
                        <div className="input-row">
                            <textarea
                                ref={textareaRef}
                                placeholder={isReady ? "Type a message..." : "Initializing..."}
                                value={input}
                                onChange={e => {
                                    setInput(e.target.value);
                                    // Auto-resize
                                    const ta = e.target;
                                    ta.style.height = 'auto';
                                    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                        // Reset height
                                        if (textareaRef.current) textareaRef.current.style.height = 'auto';
                                    }
                                }}
                                disabled={!isReady}
                                rows={1}
                                style={{ resize: 'none', overflow: 'hidden' }}
                            />
                            <button
                                className="input-icon"
                                onClick={() => {
                                    const fileInput = document.createElement("input");
                                    fileInput.type = "file";
                                    fileInput.accept = ".pdf,.txt,.csv,.json,.md";
                                    fileInput.onchange = (e) => engine.handlePDFUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
                                    fileInput.click();
                                }}
                                title="Datei anhängen"
                            >
                                📎
                            </button>
                            <button
                                className="send-btn"
                                onClick={isGenerating ? () => engine.handleStopGeneration() : () => handleSend()}
                                disabled={!isReady || (!input.trim() && !isGenerating)}
                                title={isGenerating ? "Stop" : "Send"}
                            >
                                {isGenerating ? "■" : "➤"}
                            </button>
                        </div>
                    </div>
                    {/* Disclaimer hidden per reference */}
                </div>

                {/* ══════════ RIGHT PANEL — Virtual Sandbox ══════════ */}
                <div className={`mimi-panel panel-right${isGenerating ? ' agent-active' : ''}`}>
                    <div className="sandbox-head">
                        <div className="sandbox-head-left">
                            <span className="sandbox-head-title">Virtual Sandbox</span>
                            {isGenerating && (
                                <span className="live-badge">
                                    <span className="live-dot" />
                                    Live
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="sandbox-tabs">
                        {([
                            { id: "browser", icon: "🌐", label: "Browser" },
                            { id: "terminal", icon: "⌨️", label: "Terminal" },
                            { id: "editor", icon: "📝", label: "Editor" },
                            { id: "files", icon: "📁", label: "Files" },
                        ] as const).map(tab => (
                            <button
                                key={tab.id}
                                data-tab={tab.id}
                                className={activeTab === tab.id ? "active" : ""}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className="tab-icon">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="sandbox-scroll">
                        {activeTab === "browser" && (
                            <div className="sec-browser" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div className="browser-frame" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                    <div className="browser-chrome">
                                        <div className="browser-nav-dots">
                                            <div className="browser-nav-dot" />
                                            <div className="browser-nav-dot" />
                                            <div className="browser-nav-dot" />
                                        </div>
                                        <div className="browser-url">
                                            <span className="lock">🔒</span>
                                            {agentEvents.activeTool && typeof agentEvents.activeTool === 'object' && agentEvents.activeTool.toolName === 'web_search'
                                                ? `duckduckgo.com/?q=${encodeURIComponent(String(agentEvents.activeTool.parameters?.query || ''))}`
                                                : agentEvents.activeTool
                                                    ? `mimi-agent.local/${typeof agentEvents.activeTool === 'object' ? agentEvents.activeTool.toolName : agentEvents.activeTool}`
                                                    : browserContent
                                                        ? "duckduckgo.com/results"
                                                        : "mimi-agent.local"}
                                        </div>
                                    </div>
                                    {agentEvents.isThinking && (
                                        <div className="agent-browsing-overlay">
                                            <div className="browsing-spinner" />
                                            <span className="browsing-text">Agent is browsing...</span>
                                        </div>
                                    )}
                                    <div className="browser-page" style={{ flex: 1 }}>
                                        {browserContent ? (
                                            <div
                                                className="browser-preview"
                                                style={{ padding: '12px', fontSize: '12px', lineHeight: 1.5, overflow: 'auto', maxHeight: '100%' }}
                                                dangerouslySetInnerHTML={{ __html: browserContent }}
                                            />
                                        ) : (
                                            <div className="sandbox-empty" style={{ padding: '24px 16px' }}>
                                                <div className="sandbox-empty-icon">🌐</div>
                                                <h4>Browser bereit</h4>
                                                <p>Web-Ergebnisse und Vorschauen erscheinen hier, wenn MIMI eine Aufgabe ausführt.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Fix 5: Terminal Tab — accumulated real output */}
                        {activeTab === "terminal" && (
                            <div className="sec-terminal">
                                <div className="sec-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    Terminal
                                    <button
                                        onClick={() => {
                                            terminalLinesRef.current = [{ prefix: "[MIMI-AI]:", msg: "Terminal cleared.", type: "info" }];
                                            setTerminalVersion(v => v + 1);
                                        }}
                                        style={{ fontSize: '10px', opacity: 0.5, cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }}
                                    >
                                        Clear
                                    </button>
                                </div>
                                <div className="terminal-box">
                                    {terminalLines.map((line, i) => (
                                        <div className="tline" key={i} style={{ opacity: line.type === 'error' ? 1 : 0.9 }}>
                                            <span className="prefix" style={{
                                                color: line.type === 'error' ? '#ef4444'
                                                    : line.type === 'success' ? '#22c55e'
                                                        : line.type === 'tool' ? '#a855f7'
                                                            : '#00d4ff'
                                            }}>{line.prefix}</span>{" "}
                                            <span className="msg">{line.msg}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Fix 3: Editor Tab — shows real code artifacts */}
                        {activeTab === "editor" && (
                            <div className="sec-editor">
                                <div className="editor-tabs" style={{ display: 'flex', gap: '2px', overflowX: 'auto' }}>
                                    {codeArtifacts.length > 0 ? (
                                        codeArtifacts.map((art, i) => (
                                            <span
                                                key={i}
                                                className={`etab ${i === activeArtifactIdx ? 'active' : ''}`}
                                                onClick={() => setActiveArtifactIdx(i)}
                                                style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                                            >
                                                {art.filename}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="etab active">untitled</span>
                                    )}
                                    {codeArtifacts.length > 0 && codeArtifacts[activeArtifactIdx] && (
                                        <button
                                            className="editor-copy-btn"
                                            title="Code kopieren"
                                            onClick={() => handleCopyMessage(codeArtifacts[activeArtifactIdx].content)}
                                        >
                                            📋 Copy
                                        </button>
                                    )}
                                </div>
                                <div className="editor-code" style={{ flex: 1, minHeight: '200px' }}>
                                    {codeArtifacts.length > 0 && codeArtifacts[activeArtifactIdx] ? (
                                        <MonacoEditor
                                            height="100%"
                                            language={
                                                (() => {
                                                    const lang = codeArtifacts[activeArtifactIdx].language?.toLowerCase() || 'text';
                                                    const langMap: Record<string, string> = {
                                                        'python': 'python', 'py': 'python',
                                                        'javascript': 'javascript', 'js': 'javascript',
                                                        'typescript': 'typescript', 'ts': 'typescript',
                                                        'html': 'html', 'css': 'css', 'json': 'json',
                                                        'sql': 'sql', 'markdown': 'markdown', 'md': 'markdown',
                                                        'shell': 'shell', 'bash': 'shell', 'sh': 'shell',
                                                        'yaml': 'yaml', 'xml': 'xml', 'csv': 'plaintext',
                                                    };
                                                    return langMap[lang] || 'plaintext';
                                                })()
                                            }
                                            value={codeArtifacts[activeArtifactIdx].content}
                                            theme="vs-dark"
                                            options={{
                                                readOnly: true,
                                                minimap: { enabled: false },
                                                fontSize: 12,
                                                lineNumbers: 'on',
                                                scrollBeyondLastLine: false,
                                                wordWrap: 'on',
                                                padding: { top: 8 },
                                                renderLineHighlight: 'none',
                                                overviewRulerBorder: false,
                                                scrollbar: {
                                                    verticalScrollbarSize: 6,
                                                    horizontalScrollbarSize: 6,
                                                },
                                            }}
                                        />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px' }}>
                                            <div className="editor-empty" style={{ textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                                                Dateien werden hier angezeigt, wenn MIMI Code generiert.
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Fix 4: Files Tab — shows real generated files + code artifacts */}
                        {activeTab === "files" && (
                            <div className="sec-files">
                                <div className="sec-label">Files ({generatedFiles.length + codeArtifacts.length})</div>
                                {(generatedFiles.length + codeArtifacts.length) > 0 ? (
                                    <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {codeArtifacts.map((art, i) => (
                                            <div
                                                key={`code-${i}`}
                                                onClick={() => { setActiveArtifactIdx(i); setActiveTab("editor"); }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    padding: '6px 8px', borderRadius: '6px', cursor: 'pointer',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    fontSize: '11px', color: '#94a3b8',
                                                    transition: 'background 0.2s',
                                                }}
                                            >
                                                <span>📄</span>
                                                <span style={{ flex: 1, color: '#e2e8f0' }}>{art.filename}</span>
                                                <span style={{ fontSize: '10px' }}>{art.language}</span>
                                                <button
                                                    className="file-download-btn"
                                                    title="Herunterladen"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const blob = new Blob([art.content], { type: 'text/plain' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = art.filename;
                                                        a.click();
                                                        URL.revokeObjectURL(url);
                                                        addToast(`${art.filename} heruntergeladen`);
                                                    }}
                                                >
                                                    ⬇️
                                                </button>
                                            </div>
                                        ))}
                                        {generatedFiles.map((file, i) => (
                                            <div
                                                key={`file-${i}`}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    padding: '6px 8px', borderRadius: '6px',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    fontSize: '11px', color: '#94a3b8',
                                                }}
                                            >
                                                <span>{file.type === 'create' ? '📄' : file.type === 'update' ? '📝' : '🗑️'}</span>
                                                <span style={{ flex: 1, color: '#e2e8f0' }}>{file.name}</span>
                                                <span style={{ fontSize: '10px' }}>{file.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="files-empty">
                                        <div className="files-empty-icon">📁</div>
                                        <p>Noch keine Dateien erstellt.<br />MIMI erstellt Dateien automatisch während der Arbeit.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Progress Steps — only when real plan exists */}
                        {progressSteps && progressSteps.length > 0 && (
                            <div className="progress-card">
                                <h5>Progress Steps</h5>
                                {progressSteps.map((step, i) => (
                                    <div key={i} className={`step step-${step.status}`}>
                                        {step.status === "done" && <span className="ico">✓</span>}
                                        {step.status === "running" && <div className="spinner" />}
                                        {step.status === "pending" && <div className="circle" />}
                                        {i + 1}. {step.label}
                                        <span className="step-right">
                                            ({step.status === "done" ? "Done" : step.status === "running" ? "Active" : "Pending"})
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Idle state — show when no agent activity */}
                        {!progressSteps && !agentEvents.isThinking && (
                            <div className="progress-card">
                                <h5>Progress Steps</h5>
                                <div className="step step-done">
                                    <span className="ico">✓</span>
                                    1. System Initialization
                                    <span className="step-right">
                                        ({isReady ? "Done" : "Pending"})
                                    </span>
                                </div>
                                <div className={`step step-${isReady ? "done" : "pending"}`}>
                                    {isReady ? <span className="ico">✓</span> : <div className="circle" />}
                                    2. Ready for Tasks
                                    <span className="step-right">
                                        ({isReady ? "Done" : "Pending"})
                                    </span>
                                </div>
                                <div className={`step ${isReady ? 'step-awaiting' : 'step-pending'}`}>
                                    {isReady ? <div className="await-ring" /> : <div className="circle" />}
                                    3. Await User Input
                                    <span className="step-right">
                                        ({isReady ? "Awaiting" : "Pending"})
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ Phase 9: Confirm Delete Dialog ═══ */}
            {confirmDeleteId && (
                <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <h3>Konversation löschen?</h3>
                        <p>Diese Aktion kann nicht rückgängig gemacht werden.</p>
                        <div className="modal-actions">
                            <button className="modal-btn cancel" onClick={() => setConfirmDeleteId(null)}>Abbrechen</button>
                            <button className="modal-btn danger" onClick={() => handleDeleteConversation(confirmDeleteId)}>Löschen</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Phase 9: Settings Modal ═══ */}
            {showSettings && (
                <div className="modal-overlay" onClick={() => setShowSettings(false)}>
                    <div className="modal-card settings-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Einstellungen</h3>
                            <button className="modal-close" onClick={() => setShowSettings(false)}>✕</button>
                        </div>
                        <div className="settings-section">
                            <h4>Modell</h4>
                            <div className="settings-row">
                                <span>Aktuelles Modell</span>
                                <span className="settings-value">Phi-3.5 Mini (lokal)</span>
                            </div>
                            <div className="settings-row">
                                <span>Status</span>
                                <span className="settings-value" style={{ color: isReady ? '#22c55e' : '#f59e0b' }}>{isReady ? 'Bereit' : 'Laden...'}</span>
                            </div>
                        </div>
                        <div className="settings-section">
                            <h4>Speicher</h4>
                            <div className="settings-row">
                                <span>Konversationen</span>
                                <span className="settings-value">{conversations.length}</span>
                            </div>
                            <button
                                className="settings-btn"
                                onClick={async () => {
                                    try {
                                        const service = getChatHistory();
                                        for (const conv of conversations) {
                                            await service.deleteConversation(conv.id);
                                        }
                                        setConversations([]);
                                        setMessages([]);
                                        setActiveConversationId(null);
                                        addToast("Alle Konversationen gelöscht");
                                    } catch {
                                        addToast("Fehler beim Löschen");
                                    }
                                }}
                            >
                                🗑️ Alle Konversationen löschen
                            </button>
                        </div>
                        <div className="settings-section">
                            <h4>Tastenkürzel</h4>
                            <div className="settings-row"><span>Neuer Thread</span><kbd>⌘N</kbd></div>
                            <div className="settings-row"><span>Suche fokussieren</span><kbd>⌘K</kbd></div>
                            <div className="settings-row"><span>Schließen / Abbrechen</span><kbd>Esc</kbd></div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Phase 9: Toast notifications ═══ */}
            {toasts.length > 0 && (
                <div className="toast-container">
                    {toasts.map(t => (
                        <div key={t.id} className="toast-item">{t.msg}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
