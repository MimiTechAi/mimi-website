"use client";

/**
 * MIMI Agent Chat V2.0
 * 
 * Features:
 * - Voice Input (Speech-to-Text)
 * - Voice Output (Text-to-Speech)
 * - Code Execution
 * - File Download
 * - Status Indicators
 * - Multi-Language Support
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send,
    Brain,
    Mic,
    MicOff,
    Sparkles,
    Code,
    Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AgentStatus, Artifact } from "@/lib/mimi/inference-engine";
import type { PDFDocument } from "@/lib/mimi/pdf-processor";
import { SandboxPanel } from "./SandboxPanel";
import { ChatHeader } from "./components/ChatHeader";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { MessageBubble, type Message } from "./components/MessageBubble";
import { useSandbox } from "@/hooks/useSandbox";

// Message interface imported from ./components/MessageBubble

interface MimiAgentChatProps {
    onSendMessage: (message: string) => AsyncGenerator<string, void, unknown>;
    isReady: boolean;
    isGenerating: boolean;
    agentStatus: AgentStatus;
    onClearChat?: () => void;
    onVoiceInput?: () => void;
    isRecording?: boolean;
    onExecuteCode?: (code: string, language: string) => Promise<{ output: string; chartBase64?: string }>;
    onDownloadArtifact?: (artifact: Artifact) => void;
    onSpeak?: (text: string) => Promise<void>;
    isSpeaking?: boolean;
    interimText?: string;
    currentLanguage?: string;
    onLanguageChange?: (lang: string) => void;
    voiceTranscript?: string;  // NEU: Fertiger Voice-Text zum Senden
    onVoiceTranscriptHandled?: () => void;  // NEU: Callback wenn gesendet
    onPDFUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    uploadedDocuments?: PDFDocument[];
    isUploadingPDF?: boolean;
    onDeleteDocument?: (docId: string) => void;
    onImageUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    uploadedImage?: string | null;
    isVisionReady?: boolean;
    // Memory Management
    memoryUsageMB?: number;
    isMemoryWarning?: boolean;
    onUnloadVision?: () => void;
    // NEW: Stop Generation
    onStopGeneration?: () => Promise<void>;
}

const STATUS_ICONS: Record<AgentStatus, React.ReactNode> = {
    idle: <Sparkles className="w-4 h-4" />,
    thinking: <Brain className="w-4 h-4 animate-pulse" />,
    analyzing: <Brain className="w-4 h-4 animate-spin" />,
    planning: <Brain className="w-4 h-4 animate-bounce" />,
    coding: <Code className="w-4 h-4 animate-pulse" />,
    calculating: <Brain className="w-4 h-4 animate-spin" />,
    generating: <Sparkles className="w-4 h-4 animate-pulse" />
};

export default function MimiAgentChat({
    onSendMessage,
    isReady,
    isGenerating,
    agentStatus,
    onClearChat,
    onVoiceInput,
    isRecording = false,
    onExecuteCode,
    onDownloadArtifact,
    onSpeak,
    isSpeaking = false,
    interimText = "",
    currentLanguage = "de-DE",
    onLanguageChange,
    voiceTranscript,
    onVoiceTranscriptHandled,
    onPDFUpload,
    uploadedDocuments = [],
    isUploadingPDF = false,
    onDeleteDocument,
    onImageUpload,
    uploadedImage = null,
    isVisionReady = false,
    memoryUsageMB = 0,
    isMemoryWarning = false,
    onUnloadVision,
    onStopGeneration  // NEW
}: MimiAgentChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [currentResponse, setCurrentResponse] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [executingCode, setExecutingCode] = useState<string | null>(null);
    const [codeOutput, setCodeOutput] = useState<Record<string, string>>({});
    const [chartOutput, setChartOutput] = useState<Record<string, string>>({});  // NEU: Chart-Daten

    // Sandbox state for agent operations
    const [sandboxState, sandboxActions] = useSandbox();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isSendingVoiceRef = useRef(false);
    const processedArtifactsRef = useRef<Set<string>>(new Set()); // Track processed artifacts to prevent loops

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, currentResponse, interimText]);

    // NEU: Voice-Transkript automatisch senden
    useEffect(() => {
        if (voiceTranscript && voiceTranscript.trim() && !isSendingVoiceRef.current && isReady && !isGenerating) {
            isSendingVoiceRef.current = true;
            sendMessage(voiceTranscript).finally(() => {
                isSendingVoiceRef.current = false;
                onVoiceTranscriptHandled?.();
            });
        }
    }, [voiceTranscript, isReady, isGenerating]);

    // Generische Nachricht senden (für Text und Voice)
    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || !isReady || isGenerating) return;

        const userMessage: Message = {
            id: `user_${Date.now()}`,
            role: "user",
            content: content.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setCurrentResponse("");

        try {
            const generator = onSendMessage(content.trim());
            let fullResponse = "";

            for await (const token of generator) {
                fullResponse += token;
                setCurrentResponse(fullResponse);
            }

            // Artefakte extrahieren
            const artifacts = extractArtifacts(fullResponse);

            const assistantMessage: Message = {
                id: `assistant_${Date.now()}`,
                role: "assistant",
                content: fullResponse,
                timestamp: new Date(),
                artifacts
            };

            setMessages(prev => [...prev, assistantMessage]);
            setCurrentResponse("");
        } catch (error) {
            console.error("Fehler:", error);
            const errorMessage: Message = {
                id: `error_${Date.now()}`,
                role: "assistant",
                content: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            setCurrentResponse("");
        }
    }, [isReady, isGenerating, onSendMessage]);

    // Nachricht senden (UI-driven)
    const handleSend = useCallback(async () => {
        if (!input.trim() || !isReady || isGenerating) return;
        const text = input.trim();
        setInput("");
        await sendMessage(text);
    }, [input, isReady, isGenerating, sendMessage]);

    // Enter zum Senden
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!isGenerating) {
                handleSend();
            }
        }
    };

    // NEW: Stop generation handler
    const handleStop = async () => {
        if (!onStopGeneration || !isGenerating) return;
        await onStopGeneration();
    };

    // Artefakte aus Response extrahieren
    const extractArtifacts = (content: string): Artifact[] => {
        const artifacts: Artifact[] = [];
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let match;

        while ((match = codeBlockRegex.exec(content)) !== null) {
            const language = match[1] || 'text';
            artifacts.push({
                type: 'code',
                language,
                title: `Code (${language})`,
                content: match[2].trim()
            });
        }

        return artifacts;
    };

    // Code ausführen
    const handleExecuteCode = async (artifact: Artifact) => {
        if (!onExecuteCode || !artifact.language) return;

        const codeId = `${artifact.title}_${Date.now()}`;
        setExecutingCode(codeId);

        try {
            let output = '';
            let chartData: string | undefined;

            if (artifact.language === 'python') {
                const result = await onExecuteCode(artifact.content, artifact.language);
                output = result.output;
                chartData = result.chartBase64;

                // Show in Sandbox Terminal
                sandboxActions.addTerminalLine(`> Python Executed:`, 'info');
                if (output) output.split('\n').forEach(line => sandboxActions.addTerminalLine(line, 'output'));

                if (chartData) {
                    console.log('[MimiChat] 🖼️ Setting preview URL with chart data...');
                    const dataUrl = `data:image/png;base64,${chartData}`;
                    sandboxActions.setPreviewUrl(dataUrl);
                    sandboxActions.addTerminalLine('> Chart generated in Preview tab', 'info');
                } else {
                    console.log('[MimiChat] No chart data returned from execution.');
                }
            }
            else if (artifact.language === 'sql') {
                // SQL Execution via direct import to avoid passing props down for now
                // Ideally this should be a prop, but for integration speed:
                const { getMimiSQLite } = await import('@/lib/mimi/workspace/services/database');
                const db = getMimiSQLite();
                await db.createDatabase(); // Ensure ready
                const res = db.execute(artifact.content);

                if (res.error) {
                    output = `SQL Error: ${res.error}`;
                    sandboxActions.addTerminalLine(`SQL Error: ${res.error}`, 'error');
                } else {
                    const rowCount = res.values.length;
                    output = `✅ Query executed successfully. ${rowCount} rows returned.\n[Columns: ${res.columns.join(', ')}]`;
                    sandboxActions.addTerminalLine(`SQL Success: ${rowCount} rows`, 'info');

                    // Format table for output
                    if (rowCount > 0) {
                        output += '\n\n' + res.values.map(row => row.join(' | ')).join('\n');
                    }
                }
            } else {
                // Other languages
                const result = await onExecuteCode(artifact.content, artifact.language);
                output = result.output;
            }

            setCodeOutput(prev => ({ ...prev, [artifact.content]: output }));
            if (chartData) {
                setChartOutput(prev => ({ ...prev, [artifact.content]: chartData! }));
            }
        } catch (error) {
            setCodeOutput(prev => ({
                ...prev,
                [artifact.content]: `Fehler: ${error}`
            }));
        } finally {
            setExecutingCode(null);
        }
    };

    // Text vorlesen
    const handleSpeak = async (text: string) => {
        if (!onSpeak) return;
        // Clean text of code blocks
        const cleanText = text.replace(/```[\s\S]*?```/g, '').trim();
        await onSpeak(cleanText);
    };

    // Kopieren
    const copyMessage = async (content: string, id: string) => {
        await navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Chat leeren
    const clearChat = () => {
        setMessages([]);
        setCurrentResponse("");
        setCodeOutput({});
        setChartOutput({});
        processedArtifactsRef.current.clear();

        // Cleanup image state to prevent stale references (Audit Fix #3)
        if (typeof window !== 'undefined') {
            delete (window as any).__mimiUploadedImage;
        }
        try {
            const { getOrchestrator } = require('@/lib/mimi/agent-orchestrator');
            getOrchestrator().updateContext({ imageContext: undefined });
        } catch (e) {
            // Orchestrator may not be initialized yet
        }

        onClearChat?.();
    };

    // NEU: Message löschen
    const deleteMessage = useCallback((messageId: string) => {
        setMessages(prev => prev.filter(m => m.id !== messageId));
    }, []);

    // NEU: Message editieren (User-Nachricht)
    const editMessage = useCallback((messageId: string, newContent: string) => {
        setMessages(prev => {
            const idx = prev.findIndex(m => m.id === messageId);
            if (idx === -1) return prev;

            // Alle Nachrichten nach dieser löschen und neu generieren
            const newMessages = prev.slice(0, idx);
            newMessages.push({
                ...prev[idx],
                content: newContent,
                timestamp: new Date()
            });
            return newMessages;
        });
        // Trigger re-generation
        sendMessage(newContent);
    }, [sendMessage]);

    // NEU: Letzte Antwort regenerieren
    const regenerateLastResponse = useCallback(async () => {
        if (messages.length < 2 || isGenerating) return;

        // Finde letzte User-Nachricht
        const lastUserIdx = messages.findLastIndex(m => m.role === 'user');
        if (lastUserIdx === -1) return;

        const userMessage = messages[lastUserIdx];

        // Entferne alle Nachrichten nach der User-Nachricht
        setMessages(prev => prev.slice(0, lastUserIdx + 1));

        // Generiere neue Antwort
        setCurrentResponse("");
        try {
            const generator = onSendMessage(userMessage.content);
            let fullResponse = "";

            for await (const token of generator) {
                fullResponse += token;
                setCurrentResponse(fullResponse);
            }

            const artifacts = extractArtifacts(fullResponse);
            const assistantMessage: Message = {
                id: `assistant_${Date.now()}`,
                role: "assistant",
                content: fullResponse,
                timestamp: new Date(),
                artifacts
            };

            setMessages(prev => [...prev, assistantMessage]);
            setCurrentResponse("");
        } catch (error) {
            console.error("Regeneration error:", error);
            setCurrentResponse("");
        }
    }, [messages, isGenerating, onSendMessage]);

    // NEU: Conversation exportieren (JSON + Markdown)
    const exportConversation = useCallback((format: 'json' | 'markdown' | 'clipboard') => {
        if (messages.length === 0) return;

        const title = `MIMI Konversation - ${new Date().toLocaleDateString('de-DE')}`;

        if (format === 'json') {
            const data = {
                title,
                exportedAt: new Date().toISOString(),
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content,
                    timestamp: m.timestamp.toISOString(),
                    artifacts: m.artifacts
                }))
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mimi-chat-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } else if (format === 'markdown') {
            let md = `# ${title}\n\n`;
            messages.forEach(m => {
                const role = m.role === 'user' ? '👤 Du' : '🤖 MIMI';
                md += `## ${role}\n\n${m.content}\n\n---\n\n`;
            });
            const blob = new Blob([md], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mimi-chat-${Date.now()}.md`;
            a.click();
            URL.revokeObjectURL(url);
        } else {
            // Clipboard
            let text = '';
            messages.forEach(m => {
                const role = m.role === 'user' ? 'Du' : 'MIMI';
                text += `[${role}]: ${m.content}\n\n`;
            });
            navigator.clipboard.writeText(text);
            setCopiedId('export');
            setTimeout(() => setCopiedId(null), 2000);
        }
    }, [messages]);

    // Open sandbox when agent is coding
    // Update sandbox activity based on agent status
    // Note: sandboxActions is stable via useMemo, but we exclude it from deps
    // to be extra safe and only react to agentStatus changes
    useEffect(() => {
        if (agentStatus === 'coding') {
            sandboxActions.setAgentActivity('Writing code...');
        } else if (agentStatus === 'calculating') {
            sandboxActions.setAgentActivity('Calculating...');
        } else if (agentStatus === 'generating') {
            sandboxActions.setAgentActivity('Generating...');
        } else {
            sandboxActions.setAgentActivity(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agentStatus]);

    // AUTO-EXECUTION: Monitor artifacts and execute if needed
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'assistant' && lastMessage.artifacts) {
            lastMessage.artifacts.forEach((artifact, idx) => {
                const artifactKey = `${lastMessage.id}_${idx}`;

                // Skip if already processed in this session
                if (processedArtifactsRef.current.has(artifactKey)) return;

                // 1. Add to Sandbox Filesystem
                if (artifact.type === 'code' && artifact.content) {
                    processedArtifactsRef.current.add(artifactKey); // Mark as processed immediately

                    const ext = artifact.language === 'python' ? '.py'
                        : artifact.language === 'javascript' ? '.js'
                            : artifact.language === 'html' ? '.html'
                                : artifact.language === 'css' ? '.css'
                                    : artifact.language === 'sql' ? '.sql'
                                        : '.txt';

                    const fileName = `code_${idx}${ext}`;
                    sandboxActions.addFile({
                        path: `/workspace/${fileName}`,
                        name: fileName,
                        content: artifact.content,
                        language: artifact.language || 'plaintext',
                    });

                    // 2. AUTO-EXECUTE Python & SQL
                    // Only execute if agent status indicates active work or if it's a code block that just finished generating
                    // We use a looser check here because status might have flipped back to idle quickly
                    if (['coding', 'calculating', 'generating', 'idle'].includes(agentStatus)) {
                        // Execute Python
                        if (artifact.language === 'python') {
                            console.log('[MimiChat] 🚀 Auto-executing Python artifact...');
                            handleExecuteCode(artifact);
                        }
                        // Execute SQL
                        else if (artifact.language === 'sql') {
                            console.log('[MimiChat] 🗄️ Auto-executing SQL artifact...');
                            handleExecuteCode(artifact);
                        }
                    }
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages, agentStatus]); // sandboxActions is stable via useMemo

    return (
        <div className="flex h-full">
            {/* Main Chat Area */}
            <div className={cn(
                "flex flex-col h-full transition-all duration-300",
                sandboxState.isOpen ? "w-1/2" : "w-full"
            )}>
                {/* Header - Extracted Component */}
                <ChatHeader
                    isReady={isReady}
                    agentStatus={agentStatus}
                    memoryUsageMB={memoryUsageMB}
                    isMemoryWarning={isMemoryWarning}
                    isVisionReady={isVisionReady}
                    onUnloadVision={onUnloadVision}
                    onPDFUpload={onPDFUpload}
                    uploadedDocuments={uploadedDocuments}
                    isUploadingPDF={isUploadingPDF}
                    onDeleteDocument={onDeleteDocument}
                    onImageUpload={onImageUpload}
                    uploadedImage={uploadedImage}
                    currentLanguage={currentLanguage}
                    onLanguageChange={onLanguageChange}
                    onClearChat={clearChat}
                    messagesCount={messages.length}
                    onExport={exportConversation}
                    copiedId={copiedId}
                />

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && !currentResponse && !interimText && (
                        <WelcomeScreen onPromptSelect={(prompt) => setInput(prompt)} />
                    )}

                    <AnimatePresence mode="popLayout">
                        {messages.map((message, idx) => {
                            // Check if this is the last assistant message
                            const isLastAssistant = message.role === 'assistant' &&
                                idx === messages.findLastIndex(m => m.role === 'assistant');

                            return (
                                <MessageBubble
                                    key={message.id}
                                    message={message}
                                    copiedId={copiedId}
                                    onCopy={copyMessage}
                                    onExecuteCode={handleExecuteCode}
                                    onDownload={onDownloadArtifact}
                                    onSpeak={onSpeak ? handleSpeak : undefined}
                                    isSpeaking={isSpeaking}
                                    executingCode={executingCode}
                                    codeOutput={codeOutput}
                                    chartOutput={chartOutput}
                                    onDelete={deleteMessage}
                                    onEdit={editMessage}
                                    onRegenerate={regenerateLastResponse}
                                    isLastAssistantMessage={isLastAssistant}
                                />
                            );
                        })}
                    </AnimatePresence>

                    {/* Streaming Response */}
                    {currentResponse && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3 justify-start"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center flex-shrink-0">
                                {STATUS_ICONS[agentStatus]}
                            </div>
                            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white/5 text-white/90 border border-white/10">
                                <p className="whitespace-pre-wrap">{currentResponse}</p>
                                <span className="inline-block w-2 h-4 bg-brand-cyan ml-1 animate-pulse" />
                            </div>
                        </motion.div>
                    )}

                    {/* Interim Voice Text */}
                    {interimText && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3 justify-end"
                        >
                            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-red-500/10 text-white/70 border border-red-500/20">
                                <div className="flex items-center gap-2">
                                    <Mic className="w-4 h-4 text-red-400 animate-pulse" />
                                    <p className="italic">{interimText}...</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input mit Voice */}
                <div className="p-4 border-t border-white/10 bg-black/20">
                    <div className="flex gap-2">
                        {/* Voice Button */}
                        {onVoiceInput && (
                            <Button
                                onClick={onVoiceInput}
                                disabled={!isReady || isGenerating}
                                variant="ghost"
                                className={cn(
                                    "h-11 w-11 p-0 flex-shrink-0",
                                    isRecording
                                        ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 animate-pulse"
                                        : "text-white/50 hover:text-white hover:bg-white/10"
                                )}
                                title={isRecording ? "Aufnahme beenden" : "Spracheingabe starten"}
                            >
                                {isRecording ? (
                                    <MicOff className="w-5 h-5" />
                                ) : (
                                    <Mic className="w-5 h-5" />
                                )}
                            </Button>
                        )}

                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                isRecording
                                    ? "🎤 Sprich jetzt..."
                                    : isReady
                                        ? "Frag MIMI etwas..."
                                        : "MIMI wird geladen..."
                            }
                            disabled={!isReady || isGenerating || isRecording}
                            className="flex-1 min-h-[44px] max-h-32 resize-none bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-brand-cyan/50 focus:ring-brand-cyan/20"
                            rows={1}
                        />

                        <Button
                            type={isGenerating ? "button" : "submit"}
                            onClick={isGenerating ? handleStop : handleSend}
                            disabled={(!input.trim() && !isGenerating) || !isReady}
                            className={cn(
                                "h-11 w-11 p-0 flex-shrink-0 font-medium transition-all",
                                isGenerating
                                    ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                                    : "bg-gradient-to-r from-brand-cyan to-brand-blue hover:from-brand-cyan/80 hover:to-brand-blue/80 text-black"
                            )}
                            title={isGenerating ? "⏸️ Generation stoppen" : "📤 Nachricht senden"}
                        >
                            {isGenerating ? (
                                <Square className="w-5 h-5" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </Button>
                    </div>

                    <p className="text-xs text-white/30 mt-2 text-center">
                        🔒 Souveräne Intelligenz • 100% Lokal • Keine Daten werden übertragen
                    </p>
                </div>
            </div>
            {/* End of Main Chat Area */}

            {/* Sandbox Panel - appears when agent creates code */}
            {sandboxState.isOpen && (
                <div className="w-1/2 h-full border-l border-white/10">
                    <SandboxPanel state={sandboxState} actions={sandboxActions} />
                </div>
            )}
        </div>
    );
}
