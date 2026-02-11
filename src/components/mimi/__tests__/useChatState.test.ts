/**
 * MIMI Tech AI - useChatState Hook Tests
 * 
 * Unit tests for the centralized chat state management hook.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { renderHook, act } from '@testing-library/react';
import { useChatState } from '@/components/mimi/hooks/useChatState';

// Mock useSandbox hook
jest.mock('@/hooks/useSandbox', () => ({
    useSandbox: () => [
        { isOpen: false, files: [], activeFile: null, output: '' },
        {
            openSandbox: jest.fn(),
            closeSandbox: jest.fn(),
            addFile: jest.fn(),
            setActiveFile: jest.fn(),
            runCode: jest.fn(),
            clearOutput: jest.fn(),
        },
    ],
}));

describe('useChatState', () => {
    it('initializes with default state values', () => {
        const { result } = renderHook(() => useChatState());

        expect(result.current.messages).toEqual([]);
        expect(result.current.input).toBe('');
        expect(result.current.currentResponse).toBe('');
        expect(result.current.copiedId).toBeNull();
        expect(result.current.executingCode).toBeNull();
        expect(result.current.codeOutput).toEqual({});
        expect(result.current.chartOutput).toEqual({});
        expect(result.current.showLanguages).toBe(false);
        expect(result.current.showExportMenu).toBe(false);
        expect(result.current.showDocuments).toBe(false);
    });

    it('provides refs for DOM elements', () => {
        const { result } = renderHook(() => useChatState());

        expect(result.current.messagesEndRef).toBeDefined();
        expect(result.current.textareaRef).toBeDefined();
        expect(result.current.isSendingVoiceRef).toBeDefined();
        expect(result.current.fileInputRef).toBeDefined();
        expect(result.current.imageInputRef).toBeDefined();
        expect(result.current.processedArtifactsRef).toBeDefined();
    });

    it('provides sandbox state and actions', () => {
        const { result } = renderHook(() => useChatState());

        expect(result.current.sandboxState).toBeDefined();
        expect(result.current.sandboxState.isOpen).toBe(false);
        expect(result.current.sandboxActions).toBeDefined();
        expect(result.current.sandboxActions.openSandbox).toBeDefined();
    });

    describe('addMessage', () => {
        it('adds a message to the messages array', () => {
            const { result } = renderHook(() => useChatState());

            const testMessage = {
                id: 'test_1',
                role: 'user' as const,
                content: 'Hello MIMI!',
                timestamp: new Date(),
            };

            act(() => {
                result.current.addMessage(testMessage);
            });

            expect(result.current.messages).toHaveLength(1);
            expect(result.current.messages[0]).toEqual(testMessage);
        });

        it('appends multiple messages in order', () => {
            const { result } = renderHook(() => useChatState());

            const msg1 = {
                id: 'user_1',
                role: 'user' as const,
                content: 'Test 1',
                timestamp: new Date(),
            };
            const msg2 = {
                id: 'assistant_1',
                role: 'assistant' as const,
                content: 'Response 1',
                timestamp: new Date(),
            };

            act(() => {
                result.current.addMessage(msg1);
            });
            act(() => {
                result.current.addMessage(msg2);
            });

            expect(result.current.messages).toHaveLength(2);
            expect(result.current.messages[0].id).toBe('user_1');
            expect(result.current.messages[1].id).toBe('assistant_1');
        });
    });

    describe('clearChat', () => {
        it('removes all messages', () => {
            const { result } = renderHook(() => useChatState());

            // Add some messages first
            act(() => {
                result.current.addMessage({
                    id: 'test_1',
                    role: 'user',
                    content: 'Hello',
                    timestamp: new Date(),
                });
            });
            expect(result.current.messages).toHaveLength(1);

            act(() => {
                result.current.clearChat();
            });

            expect(result.current.messages).toEqual([]);
        });
    });

    describe('deleteMessage', () => {
        it('removes a specific message by ID', () => {
            const { result } = renderHook(() => useChatState());

            act(() => {
                result.current.addMessage({ id: 'msg_1', role: 'user', content: 'First', timestamp: new Date() });
            });
            act(() => {
                result.current.addMessage({ id: 'msg_2', role: 'assistant', content: 'Second', timestamp: new Date() });
            });
            act(() => {
                result.current.addMessage({ id: 'msg_3', role: 'user', content: 'Third', timestamp: new Date() });
            });

            act(() => {
                result.current.deleteMessage('msg_2');
            });

            expect(result.current.messages).toHaveLength(2);
            expect(result.current.messages.find(m => m.id === 'msg_2')).toBeUndefined();
        });

        it('does nothing if message ID does not exist', () => {
            const { result } = renderHook(() => useChatState());

            act(() => {
                result.current.addMessage({ id: 'msg_1', role: 'user', content: 'Hello', timestamp: new Date() });
            });

            act(() => {
                result.current.deleteMessage('nonexistent');
            });

            expect(result.current.messages).toHaveLength(1);
        });
    });

    describe('editMessage', () => {
        it('updates a message content by ID', () => {
            const { result } = renderHook(() => useChatState());

            act(() => {
                result.current.addMessage({ id: 'msg_1', role: 'user', content: 'Original', timestamp: new Date() });
            });

            act(() => {
                result.current.editMessage('msg_1', 'Edited version');
            });

            expect(result.current.messages[0].content).toBe('Edited version');
        });

        it('preserves other message properties', () => {
            const { result } = renderHook(() => useChatState());
            const timestamp = new Date();

            act(() => {
                result.current.addMessage({ id: 'msg_1', role: 'user', content: 'Original', timestamp });
            });

            act(() => {
                result.current.editMessage('msg_1', 'New content');
            });

            expect(result.current.messages[0].id).toBe('msg_1');
            expect(result.current.messages[0].role).toBe('user');
            expect(result.current.messages[0].timestamp.getTime()).toBe(timestamp.getTime());
        });
    });

    describe('state setters', () => {
        it('updates input state', () => {
            const { result } = renderHook(() => useChatState());

            act(() => {
                result.current.setInput('New input text');
            });

            expect(result.current.input).toBe('New input text');
        });

        it('updates currentResponse state', () => {
            const { result } = renderHook(() => useChatState());

            act(() => {
                result.current.setCurrentResponse('Streaming...');
            });

            expect(result.current.currentResponse).toBe('Streaming...');
        });

        it('updates copiedId state', () => {
            const { result } = renderHook(() => useChatState());

            act(() => {
                result.current.setCopiedId('msg_123');
            });

            expect(result.current.copiedId).toBe('msg_123');
        });

        it('updates boolean toggle states', () => {
            const { result } = renderHook(() => useChatState());

            act(() => {
                result.current.setShowLanguages(true);
            });
            expect(result.current.showLanguages).toBe(true);

            act(() => {
                result.current.setShowExportMenu(true);
            });
            expect(result.current.showExportMenu).toBe(true);

            act(() => {
                result.current.setShowDocuments(true);
            });
            expect(result.current.showDocuments).toBe(true);
        });
    });
});
