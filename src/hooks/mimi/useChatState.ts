/**
 * MIMI Agent - Chat State Management Hook
 *
 * Centralized state management for the chat interface.
 * Consolidated into /hooks/mimi/ namespace for architectural consistency.
 *
 * Now with persistent OPFS storage via ChatHistoryService.
 *
 * © 2026 MIMI Tech AI. All rights reserved.
 */

'use client';

import { useState, useRef, useCallback, useEffect } from "react";
import type { Artifact } from "@/lib/mimi/inference-engine";
import { useSandbox } from "./useSandbox";
import { getChatHistory, type SerializedMessage, type ConversationSummary } from "@/lib/mimi/chat-history";

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    artifacts?: Artifact[];
    isThinking?: boolean;
}

interface UseChatStateReturn {
    // State
    messages: Message[];
    input: string;
    currentResponse: string;
    copiedId: string | null;
    executingCode: string | null;
    codeOutput: Record<string, string>;
    chartOutput: Record<string, string>;
    showLanguages: boolean;
    showExportMenu: boolean;
    showDocuments: boolean;

    // Chat History
    activeConversationId: string | null;
    conversations: ConversationSummary[];
    isLoadingHistory: boolean;

    // Refs
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    isSendingVoiceRef: React.MutableRefObject<boolean>;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    imageInputRef: React.RefObject<HTMLInputElement | null>;
    processedArtifactsRef: React.MutableRefObject<Set<string>>;

    // Sandbox Integration
    sandboxState: any;
    sandboxActions: any;

    // Actions
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    setCurrentResponse: React.Dispatch<React.SetStateAction<string>>;
    setCopiedId: React.Dispatch<React.SetStateAction<string | null>>;
    setExecutingCode: React.Dispatch<React.SetStateAction<string | null>>;
    setCodeOutput: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setChartOutput: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setShowLanguages: React.Dispatch<React.SetStateAction<boolean>>;
    setShowExportMenu: React.Dispatch<React.SetStateAction<boolean>>;
    setShowDocuments: React.Dispatch<React.SetStateAction<boolean>>;

    // Utility Functions
    addMessage: (message: Message) => void;
    clearChat: () => void;
    deleteMessage: (messageId: string) => void;
    editMessage: (messageId: string, newContent: string) => void;

    // Chat History Actions
    loadConversation: (id: string) => Promise<void>;
    newConversation: () => void;
    deleteConversation: (id: string) => Promise<void>;
    refreshConversations: () => Promise<void>;
}

function serializeMessages(messages: Message[]): SerializedMessage[] {
    return messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
        artifacts: m.artifacts?.map((a, idx) => ({
            id: `${m.id}_artifact_${idx}`,
            type: a.type,
            language: a.language,
            title: a.title,
            content: a.content,
        })),
    }));
}

function deserializeMessages(serialized: SerializedMessage[]): Message[] {
    return serialized.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
        artifacts: m.artifacts as any,
    }));
}

export function useChatState(): UseChatStateReturn {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [currentResponse, setCurrentResponse] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [executingCode, setExecutingCode] = useState<string | null>(null);
    const [codeOutput, setCodeOutput] = useState<Record<string, string>>({});
    const [chartOutput, setChartOutput] = useState<Record<string, string>>({});
    const [showLanguages, setShowLanguages] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showDocuments, setShowDocuments] = useState(false);

    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<ConversationSummary[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isSendingVoiceRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const processedArtifactsRef = useRef<Set<string>>(new Set());
    const isRestoringRef = useRef(false);

    const [sandboxState, sandboxActions] = useSandbox();

    useEffect(() => {
        const loadLastConversation = async () => {
            try {
                const history = getChatHistory();
                await history.init();
                const convos = await history.listConversations();
                setConversations(convos);

                const lastId = history.getActiveConversationId();
                if (lastId) {
                    const conv = await history.loadConversation(lastId);
                    if (conv && conv.messages.length > 0) {
                        isRestoringRef.current = true;
                        setActiveConversationId(lastId);
                        setMessages(deserializeMessages(conv.messages));
                        setTimeout(() => { isRestoringRef.current = false; }, 500);
                        return;
                    }
                }
            } catch (err) {
                console.error('[ChatHistory] Load failed:', err);
            }
        };
        loadLastConversation();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isRestoringRef.current) return;
        if (messages.length === 0) return;

        const save = async () => {
            const history = getChatHistory();
            let convId = activeConversationId;

            if (!convId) {
                const firstUserMsg = messages.find(m => m.role === 'user');
                convId = await history.createConversation(
                    firstUserMsg?.content ?? 'Neuer Chat'
                );
                setActiveConversationId(convId);
            }

            history.saveConversationDebounced(convId, serializeMessages(messages));
        };

        save();
    }, [messages, activeConversationId]);

    const addMessage = useCallback((message: Message) => {
        setMessages(prev => [...prev, message]);
    }, []);

    const clearChat = useCallback(() => {
        setMessages([]);
        setCurrentResponse("");
        setCodeOutput({});
        setActiveConversationId(null);
        getChatHistory().clearActiveConversationId();
        processedArtifactsRef.current.clear();
    }, []);

    const deleteMessage = useCallback((messageId: string) => {
        setMessages(prev => prev.filter(m => m.id !== messageId));
    }, []);

    const editMessage = useCallback((messageId: string, newContent: string) => {
        setMessages(prev => {
            const idx = prev.findIndex(m => m.id === messageId);
            if (idx === -1) return prev;
            const newMessages = prev.slice(0, idx);
            newMessages.push({
                ...prev[idx],
                content: newContent,
                timestamp: new Date()
            });
            return newMessages;
        });
    }, []);

    const loadConversation = useCallback(async (id: string) => {
        setIsLoadingHistory(true);
        try {
            const history = getChatHistory();
            const conv = await history.loadConversation(id);
            if (conv) {
                isRestoringRef.current = true;
                setMessages(deserializeMessages(conv.messages));
                setActiveConversationId(id);
                history.setActiveConversationId(id);
                setCurrentResponse("");
                setCodeOutput({});
                setChartOutput({});
                processedArtifactsRef.current.clear();
                setTimeout(() => { isRestoringRef.current = false; }, 500);
            }
        } catch (err) {
            console.error('[ChatHistory] Load conversation failed:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    }, []);

    const newConversation = useCallback(() => {
        isRestoringRef.current = true;
        setMessages([]);
        setCurrentResponse("");
        setCodeOutput({});
        setChartOutput({});
        setActiveConversationId(null);
        getChatHistory().clearActiveConversationId();
        processedArtifactsRef.current.clear();
        setTimeout(() => { isRestoringRef.current = false; }, 100);
    }, []);

    const deleteConversation = useCallback(async (id: string) => {
        const history = getChatHistory();
        await history.deleteConversation(id);
        if (id === activeConversationId) {
            newConversation();
        }
        const convos = await history.listConversations();
        setConversations(convos);
    }, [activeConversationId, newConversation]);

    const refreshConversations = useCallback(async () => {
        const history = getChatHistory();
        const convos = await history.listConversations();
        setConversations(convos);
    }, []);

    return {
        messages, input, currentResponse, copiedId, executingCode,
        codeOutput, chartOutput, showLanguages, showExportMenu, showDocuments,
        activeConversationId, conversations, isLoadingHistory,
        messagesEndRef, textareaRef, isSendingVoiceRef,
        fileInputRef, imageInputRef, processedArtifactsRef,
        sandboxState, sandboxActions,
        setMessages, setInput, setCurrentResponse, setCopiedId,
        setExecutingCode, setCodeOutput, setChartOutput,
        setShowLanguages, setShowExportMenu, setShowDocuments,
        addMessage, clearChat, deleteMessage, editMessage,
        loadConversation, newConversation, deleteConversation, refreshConversations,
    };
}
