/**
 * MIMI Agent - Chat State Management Hook
 * 
 * Zentralisiert den komplexen State Management für den Chat
 * Extrahiert aus MimiChat.tsx für bessere Wartbarkeit
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

'use client';

import { useState, useRef, useCallback, useEffect } from "react";
import type { Artifact } from "@/lib/mimi/inference-engine";
import { useSandbox } from "@/hooks/useSandbox";

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
}

export function useChatState(): UseChatStateReturn {
    // Core State
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
    
    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isSendingVoiceRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const processedArtifactsRef = useRef<Set<string>>(new Set());
    
    // Sandbox Integration
    const [sandboxState, sandboxActions] = useSandbox();
    
    // Utility Functions
    const addMessage = useCallback((message: Message) => {
        setMessages(prev => [...prev, message]);
    }, []);
    
    const clearChat = useCallback(() => {
        setMessages([]);
        setCurrentResponse("");
        setCodeOutput({});
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
    
    return {
        // State
        messages,
        input,
        currentResponse,
        copiedId,
        executingCode,
        codeOutput,
        chartOutput,
        showLanguages,
        showExportMenu,
        showDocuments,
        
        // Refs
        messagesEndRef,
        textareaRef,
        isSendingVoiceRef,
        fileInputRef,
        imageInputRef,
        processedArtifactsRef,
        
        // Sandbox
        sandboxState,
        sandboxActions,
        
        // Setters
        setMessages,
        setInput,
        setCurrentResponse,
        setCopiedId,
        setExecutingCode,
        setCodeOutput,
        setChartOutput,
        setShowLanguages,
        setShowExportMenu,
        setShowDocuments,
        
        // Utilities
        addMessage,
        clearChat,
        deleteMessage,
        editMessage
    };
}