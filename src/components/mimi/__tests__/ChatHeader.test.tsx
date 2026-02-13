/**
 * MIMI Tech AI - ChatHeader Component Tests
 * 
 * Unit tests for the extracted ChatHeader component.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatHeader } from '@/components/mimi/components/ChatHeader';

// framer-motion ist global in jest.setup.ts gemockt

describe('ChatHeader', () => {
    const defaultProps = {
        isReady: true,
        agentStatus: 'idle' as const,
    };

    it('renders the MIMI Agent title', () => {
        render(<ChatHeader {...defaultProps} />);
        expect(screen.getByText('MIMI Agent')).toBeInTheDocument();
    });

    it('shows idle status text when idle', () => {
        render(<ChatHeader {...defaultProps} />);
        expect(screen.getByText('Souveräne Intelligenz • 100% Lokal')).toBeInTheDocument();
    });

    it('shows thinking status when agentStatus is thinking', () => {
        render(<ChatHeader {...defaultProps} agentStatus="thinking" />);
        expect(screen.getByText('MIMI denkt...')).toBeInTheDocument();
    });

    it('shows analyzing status when agentStatus is analyzing', () => {
        render(<ChatHeader {...defaultProps} agentStatus="analyzing" />);
        expect(screen.getByText('Analysiert Anfrage...')).toBeInTheDocument();
    });

    it('shows planning status when agentStatus is planning', () => {
        render(<ChatHeader {...defaultProps} agentStatus="planning" />);
        expect(screen.getByText('Erstellt Plan...')).toBeInTheDocument();
    });

    it('shows coding status when agentStatus is coding', () => {
        render(<ChatHeader {...defaultProps} agentStatus="coding" />);
        expect(screen.getByText('Schreibt Code...')).toBeInTheDocument();
    });

    it('shows generating status when agentStatus is generating', () => {
        render(<ChatHeader {...defaultProps} agentStatus="generating" />);
        expect(screen.getByText('Generiert Antwort...')).toBeInTheDocument();
    });

    it('shows online indicator when isReady is true', () => {
        const { container } = render(<ChatHeader {...defaultProps} isReady={true} />);
        // The green dot indicator
        const greenDot = container.querySelector('.bg-green-500');
        expect(greenDot).toBeInTheDocument();
    });

    it('hides online indicator when isReady is false', () => {
        const { container } = render(<ChatHeader {...defaultProps} isReady={false} />);
        const greenDot = container.querySelector('.bg-green-500');
        expect(greenDot).not.toBeInTheDocument();
    });

    describe('Memory Indicator', () => {
        it('shows memory usage when memoryUsageMB > 0', () => {
            render(<ChatHeader {...defaultProps} memoryUsageMB={512} />);
            expect(screen.getByText('512MB')).toBeInTheDocument();
        });

        it('hides memory indicator when memoryUsageMB is 0', () => {
            render(<ChatHeader {...defaultProps} memoryUsageMB={0} />);
            expect(screen.queryByText('MB')).not.toBeInTheDocument();
        });

        it('applies warning styling when isMemoryWarning is true', () => {
            const { container } = render(
                <ChatHeader {...defaultProps} memoryUsageMB={800} isMemoryWarning={true} />
            );
            const memoryIndicator = container.querySelector('.bg-orange-500\\/20');
            expect(memoryIndicator).toBeInTheDocument();
        });
    });

    describe('PDF Upload', () => {
        it('shows PDF button when onPDFUpload is provided', () => {
            const mockUpload = jest.fn();
            render(<ChatHeader {...defaultProps} onPDFUpload={mockUpload} />);
            expect(screen.getByText('PDF')).toBeInTheDocument();
        });

        it('hides PDF button when onPDFUpload is not provided', () => {
            render(<ChatHeader {...defaultProps} />);
            expect(screen.queryByText('PDF')).not.toBeInTheDocument();
        });

        it('shows document count in PDF button', () => {
            const mockUpload = jest.fn();
            render(
                <ChatHeader
                    {...defaultProps}
                    onPDFUpload={mockUpload}
                    uploadedDocuments={[
                        { id: '1', name: 'test.pdf', chunks: [{ text: 'test', pageNumber: 1, chunkIndex: 0 }], pageCount: 1, extractedAt: new Date() },
                    ]}
                />
            );
            expect(screen.getByText(/\(1\)/)).toBeInTheDocument();
        });
    });

    describe('Language Selector', () => {
        it('shows globe button when onLanguageChange is provided', () => {
            const mockLangChange = jest.fn();
            render(<ChatHeader {...defaultProps} onLanguageChange={mockLangChange} />);
            // The Globe icon should be present
            expect(screen.getByText('🇩🇪')).toBeInTheDocument();
        });

        it('shows language dropdown when clicked', () => {
            const mockLangChange = jest.fn();
            render(
                <ChatHeader {...defaultProps} onLanguageChange={mockLangChange} currentLanguage="de-DE" />
            );

            // Click the globe button
            const langButton = screen.getByText('🇩🇪');
            fireEvent.click(langButton.closest('button')!);

            // Language options should appear
            expect(screen.getByText('Deutsch')).toBeInTheDocument();
            expect(screen.getByText('English')).toBeInTheDocument();
            expect(screen.getByText('Français')).toBeInTheDocument();
            expect(screen.getByText('Español')).toBeInTheDocument();
        });

        it('calls onLanguageChange when a language is selected', () => {
            const mockLangChange = jest.fn();
            render(
                <ChatHeader {...defaultProps} onLanguageChange={mockLangChange} currentLanguage="de-DE" />
            );

            // Open dropdown
            const langButton = screen.getByText('🇩🇪');
            fireEvent.click(langButton.closest('button')!);

            // Select English
            fireEvent.click(screen.getByText('English'));
            expect(mockLangChange).toHaveBeenCalledWith('en-US');
        });
    });

    describe('Export & Clear', () => {
        it('shows export and clear buttons when messages exist', () => {
            const mockExport = jest.fn();
            const mockClear = jest.fn();
            render(
                <ChatHeader
                    {...defaultProps}
                    messagesCount={5}
                    onExport={mockExport}
                    onClearChat={mockClear}
                />
            );

            expect(screen.getByText('Export')).toBeInTheDocument();
            expect(screen.getByText('Leeren')).toBeInTheDocument();
        });

        it('hides export/clear buttons when no messages', () => {
            render(
                <ChatHeader
                    {...defaultProps}
                    messagesCount={0}
                    onExport={jest.fn()}
                    onClearChat={jest.fn()}
                />
            );

            expect(screen.queryByText('Export')).not.toBeInTheDocument();
            expect(screen.queryByText('Leeren')).not.toBeInTheDocument();
        });

        it('shows export dropdown with options when Export is clicked', () => {
            const mockExport = jest.fn();
            render(
                <ChatHeader {...defaultProps} messagesCount={3} onExport={mockExport} />
            );

            fireEvent.click(screen.getByText('Export'));

            expect(screen.getByText('Markdown')).toBeInTheDocument();
            expect(screen.getByText('JSON')).toBeInTheDocument();
            expect(screen.getByText('Kopieren')).toBeInTheDocument();
        });

        it('calls onExport with correct format', () => {
            const mockExport = jest.fn();
            render(
                <ChatHeader {...defaultProps} messagesCount={3} onExport={mockExport} />
            );

            fireEvent.click(screen.getByText('Export'));
            fireEvent.click(screen.getByText('JSON'));

            expect(mockExport).toHaveBeenCalledWith('json');
        });

        it('calls onClearChat when clear button is clicked', () => {
            const mockClear = jest.fn();
            render(
                <ChatHeader {...defaultProps} messagesCount={3} onClearChat={mockClear} />
            );

            fireEvent.click(screen.getByText('Leeren'));
            expect(mockClear).toHaveBeenCalled();
        });
    });

    describe('Image Upload', () => {
        it('shows image upload button when onImageUpload is provided', () => {
            const mockImgUpload = jest.fn();
            render(<ChatHeader {...defaultProps} onImageUpload={mockImgUpload} />);
            expect(screen.getByText('Bild')).toBeInTheDocument();
        });

        it('hides image button when onImageUpload is not provided', () => {
            render(<ChatHeader {...defaultProps} />);
            expect(screen.queryByText('Bild')).not.toBeInTheDocument();
        });
    });

    describe('Custom className', () => {
        it('applies custom className', () => {
            const { container } = render(
                <ChatHeader {...defaultProps} className="custom-test-class" />
            );
            expect(container.firstElementChild).toHaveClass('custom-test-class');
        });
    });
});
