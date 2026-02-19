/**
 * MIMI Agent - Chat Header Component
 * 
 * Self-contained header with status display, memory indicator,
 * PDF/image upload, language selector, export menu, and clear chat.
 * 
 * Extracted from MimiChat.tsx for better modularity.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

'use client';

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot,
    Sparkles,
    Brain,
    Code,
    Upload,
    Download,
    Trash2,
    Globe,
    X,
    Loader2,
    Cpu,
    FileDown,
    FileText,
    Check,
    Copy,
    History,
    Plus,
    MessageSquare,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/lib/mimi/inference-engine";
import type { PDFDocument } from "@/lib/mimi/pdf-processor";
import type { ConversationSummary } from "@/lib/mimi/chat-history";

export interface ChatHeaderProps {
    isReady: boolean;
    agentStatus: AgentStatus;
    memoryUsageMB?: number;
    isMemoryWarning?: boolean;
    isVisionReady?: boolean;
    onUnloadVision?: () => void;
    onPDFUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    uploadedDocuments?: PDFDocument[];
    isUploadingPDF?: boolean;
    onDeleteDocument?: (docId: string) => void;
    onImageUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    uploadedImage?: string | null;
    currentLanguage?: string;
    onLanguageChange?: (lang: string) => void;
    onClearChat?: () => void;
    messagesCount?: number;
    onExport?: (format: 'json' | 'markdown' | 'clipboard') => void;
    copiedId?: string | null;
    className?: string;
    // Chat History
    conversations?: ConversationSummary[];
    activeConversationId?: string | null;
    onLoadConversation?: (id: string) => void;
    onNewConversation?: () => void;
    onDeleteConversation?: (id: string) => void;
    onRefreshConversations?: () => void;
    // WebMCP (W3C Draft Feb 2026 — opt-in)
    webMCPSupported?: boolean;
    webMCPEnabled?: boolean;
    onWebMCPToggle?: () => void;
}

const STATUS_LABELS: Record<AgentStatus, string> = {
    idle: "Bereit",
    thinking: "MIMI denkt...",
    analyzing: "Analysiert Anfrage...",
    planning: "Erstellt Plan...",
    coding: "Schreibt Code...",
    calculating: "Berechnet...",
    generating: "Generiert Antwort..."
};

const STATUS_ICONS: Record<AgentStatus, React.ReactNode> = {
    idle: <Sparkles className="w-4 h-4" />,
    thinking: <Brain className="w-4 h-4 animate-pulse" />,
    analyzing: <Brain className="w-4 h-4 animate-spin" />,
    planning: <Brain className="w-4 h-4 animate-bounce" />,
    coding: <Code className="w-4 h-4 animate-pulse" />,
    calculating: <Brain className="w-4 h-4 animate-spin" />,
    generating: <Sparkles className="w-4 h-4 animate-pulse" />
};

const LANGUAGES = [
    { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
    { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
];

export function ChatHeader({
    isReady,
    agentStatus,
    memoryUsageMB = 0,
    isMemoryWarning = false,
    isVisionReady = false,
    onUnloadVision,
    onPDFUpload,
    uploadedDocuments = [],
    isUploadingPDF = false,
    onDeleteDocument,
    onImageUpload,
    uploadedImage = null,
    currentLanguage = "de-DE",
    onLanguageChange,
    onClearChat,
    messagesCount = 0,
    onExport,
    copiedId,
    className,
    // Chat History
    conversations = [],
    activeConversationId,
    onLoadConversation,
    onNewConversation,
    onDeleteConversation,
    onRefreshConversations,
    webMCPSupported = false,
    webMCPEnabled = false,
    onWebMCPToggle,
}: ChatHeaderProps) {
    // Self-contained toggle states
    const [showLanguages, setShowLanguages] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showDocuments, setShowDocuments] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Refs for file inputs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className={cn("flex items-center justify-between p-4 border-b border-white/10 bg-black/20", className)}>
            {/* Left Side - Status */}
            <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    {isReady && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                    )}
                </div>
                <div>
                    <h2 className="font-semibold text-white">MIMI Agent</h2>
                    <div className="flex items-center gap-2 text-xs">
                        {agentStatus !== 'idle' ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-1.5 text-brand-cyan"
                            >
                                {STATUS_ICONS[agentStatus]}
                                <span>{STATUS_LABELS[agentStatus]}</span>
                            </motion.div>
                        ) : (
                            <span className="text-white/50">Souveräne Intelligenz • 100% Lokal</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Side - Controls */}
            <div className="flex items-center gap-2">
                {/* Memory Status Indicator */}
                {memoryUsageMB > 0 && (
                    <div className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs",
                        isMemoryWarning
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                            : "bg-white/5 text-white/50 border border-white/10"
                    )}>
                        <Cpu className="w-3 h-3" />
                        <span>{Math.round(memoryUsageMB)}MB</span>
                        {isVisionReady && onUnloadVision && (
                            <button
                                onClick={onUnloadVision}
                                className="ml-1 p-0.5 hover:bg-white/10 rounded"
                                title="Vision-Modell entladen (spart ~400MB)"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                )}

                {/* WebMCP Badge — nur wenn Chrome 146+ Canary */}
                {webMCPSupported && onWebMCPToggle && (
                    <button
                        onClick={onWebMCPToggle}
                        title={webMCPEnabled
                            ? "WebMCP aktiv — MIMI Tools sind für AI-Agenten sichtbar. Klicken zum Deaktivieren."
                            : "WebMCP verfügbar — Aktiviere MIMI als MCP-Server für AI-Agenten (opt-in)"
                        }
                        className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs border transition-all",
                            webMCPEnabled
                                ? "bg-brand-cyan/20 text-brand-cyan border-brand-cyan/40 hover:bg-brand-cyan/30"
                                : "bg-white/5 text-white/30 border-white/10 hover:bg-white/10 hover:text-white/50"
                        )}
                    >
                        <Zap className="w-3 h-3" />
                        <span>MCP</span>
                        {webMCPEnabled && <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />}
                    </button>
                )}

                {/* PDF Upload & Document Manager */}
                {onPDFUpload && (
                    <div className="relative">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={onPDFUpload}
                            className="hidden"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => uploadedDocuments.length > 0 ? setShowDocuments(!showDocuments) : fileInputRef.current?.click()}
                            disabled={isUploadingPDF}
                            className="text-white/50 hover:text-white hover:bg-white/10"
                            title={uploadedDocuments.length > 0 ? "Dokumente verwalten" : "PDF hochladen"}
                        >
                            {isUploadingPDF ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4 mr-2" />
                            )}
                            PDF {uploadedDocuments.length > 0 && `(${uploadedDocuments.length})`}
                        </Button>

                        {/* Document List Dropdown */}
                        {showDocuments && uploadedDocuments.length > 0 && (
                            <div className="absolute right-0 top-full mt-1 bg-black/90 border border-white/10 rounded-lg overflow-hidden z-50 min-w-[250px] max-h-[300px] overflow-y-auto">
                                <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                                    <span className="text-xs text-white/50">Dokumente ({uploadedDocuments.length})</span>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs text-brand-cyan hover:text-brand-cyan/80"
                                    >
                                        + Hinzufügen
                                    </button>
                                </div>
                                {uploadedDocuments.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="px-3 py-2 hover:bg-white/5 flex items-center justify-between gap-2"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-white/70 truncate">{doc.name}</div>
                                            <div className="text-xs text-white/40">{doc.chunks.length} Chunks • {doc.pageCount} Seiten</div>
                                        </div>
                                        {onDeleteDocument && (
                                            <button
                                                onClick={() => {
                                                    onDeleteDocument(doc.id);
                                                    if (uploadedDocuments.length === 1) {
                                                        setShowDocuments(false);
                                                    }
                                                }}
                                                className="p-1 hover:bg-red-500/20 rounded text-white/50 hover:text-red-400"
                                                title="Löschen"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Image Upload für Vision */}
                {onImageUpload && (
                    <>
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={onImageUpload}
                            className="hidden"
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => imageInputRef.current?.click()}
                            className="text-white/50 hover:text-white hover:bg-white/10"
                            title={uploadedImage ? "Bild geladen" : "Bild hochladen (Vision lädt bei Bedarf)"}
                        >
                            {uploadedImage ? (
                                <Check className="w-4 h-4 mr-2 text-green-400" />
                            ) : (
                                <FileText className="w-4 h-4 mr-2" />
                            )}
                            Bild
                        </Button>
                    </>
                )}

                {/* Language Selector */}
                {onLanguageChange && (
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowLanguages(!showLanguages)}
                            className="text-white/50 hover:text-white hover:bg-white/10 gap-1"
                        >
                            <Globe className="w-4 h-4" />
                            {LANGUAGES.find(l => l.code === currentLanguage)?.flag || '🌍'}
                        </Button>

                        {showLanguages && (
                            <div className="absolute right-0 top-full mt-1 bg-black/90 border border-white/10 rounded-lg overflow-hidden z-50">
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => {
                                            onLanguageChange(lang.code);
                                            setShowLanguages(false);
                                        }}
                                        className={cn(
                                            "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/10",
                                            currentLanguage === lang.code ? "text-brand-cyan" : "text-white/70"
                                        )}
                                    >
                                        <span>{lang.flag}</span>
                                        <span>{lang.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Chat History */}
                {onLoadConversation && (
                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setShowHistory(!showHistory);
                                if (!showHistory) onRefreshConversations?.();
                            }}
                            className={cn(
                                "text-white/50 hover:text-white hover:bg-white/10",
                                showHistory && "bg-white/10 text-white"
                            )}
                            title="Chat-Verlauf"
                        >
                            <History className="w-4 h-4 mr-2" />
                            Verlauf
                            {conversations.length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 bg-brand-cyan/20 text-brand-cyan text-[10px] rounded-full">
                                    {conversations.length}
                                </span>
                            )}
                        </Button>

                        <AnimatePresence>
                            {showHistory && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-1 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-50 min-w-[300px] max-h-[400px] shadow-2xl shadow-black/50"
                                >
                                    {/* Header */}
                                    <div className="px-3 py-2.5 border-b border-white/10 flex items-center justify-between">
                                        <span className="text-xs font-medium text-white/60">Chat-Verlauf</span>
                                        <button
                                            onClick={() => {
                                                onNewConversation?.();
                                                setShowHistory(false);
                                            }}
                                            className="flex items-center gap-1 text-xs text-brand-cyan hover:text-brand-cyan/80 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Neuer Chat
                                        </button>
                                    </div>

                                    {/* Conversation List */}
                                    <div className="overflow-y-auto max-h-[340px]">
                                        {conversations.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-white/30 text-sm">
                                                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                Noch keine Chats gespeichert
                                            </div>
                                        ) : (
                                            conversations.map((conv) => (
                                                <div
                                                    key={conv.id}
                                                    onClick={() => {
                                                        onLoadConversation(conv.id);
                                                        setShowHistory(false);
                                                    }}
                                                    className={cn(
                                                        "px-3 py-2.5 hover:bg-white/5 cursor-pointer flex items-start justify-between gap-2 border-b border-white/5 transition-colors",
                                                        conv.id === activeConversationId && "bg-brand-cyan/5 border-l-2 border-l-brand-cyan"
                                                    )}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className={cn(
                                                            "text-sm truncate",
                                                            conv.id === activeConversationId ? "text-white font-medium" : "text-white/70"
                                                        )}>
                                                            {conv.title}
                                                        </div>
                                                        <div className="text-[10px] text-white/30 mt-0.5 flex items-center gap-2">
                                                            <span>{conv.messageCount} Nachrichten</span>
                                                            <span>•</span>
                                                            <span>{formatRelativeDate(conv.updatedAt)}</span>
                                                        </div>
                                                    </div>
                                                    {onDeleteConversation && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteConversation(conv.id);
                                                            }}
                                                            className="p-1 hover:bg-red-500/20 rounded text-white/30 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                                                            title="Löschen"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Export & Clear */}
                {messagesCount > 0 && (
                    <>
                        {/* Export Dropdown */}
                        {onExport && (
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    className="text-white/50 hover:text-white hover:bg-white/10"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export
                                </Button>
                                {showExportMenu && (
                                    <div className="absolute right-0 top-full mt-1 bg-black/90 border border-white/10 rounded-lg overflow-hidden z-50 min-w-[140px]">
                                        <button
                                            onClick={() => {
                                                onExport('markdown');
                                                setShowExportMenu(false);
                                            }}
                                            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/10 text-white/70"
                                        >
                                            <FileDown className="w-4 h-4" />
                                            Markdown
                                        </button>
                                        <button
                                            onClick={() => {
                                                onExport('json');
                                                setShowExportMenu(false);
                                            }}
                                            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/10 text-white/70"
                                        >
                                            <Code className="w-4 h-4" />
                                            JSON
                                        </button>
                                        <button
                                            onClick={() => {
                                                onExport('clipboard');
                                                setShowExportMenu(false);
                                            }}
                                            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-white/10 text-white/70"
                                        >
                                            {copiedId === 'export' ? (
                                                <Check className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                            Kopieren
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Clear Chat */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearChat}
                            className="text-white/50 hover:text-white hover:bg-white/10"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Leeren
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Helper ──────────────────────────────────────────────────────

function formatRelativeDate(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Gerade eben';
    if (diffMin < 60) return `vor ${diffMin}m`;
    if (diffH < 24) return `vor ${diffH}h`;
    if (diffD < 7) return `vor ${diffD}d`;
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}