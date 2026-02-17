/**
 * Convert markdown text to HTML for agent messages.
 *
 * Shared utility extracted from page.tsx to avoid duplication.
 * Used by ChatPanel and any component rendering agent responses.
 */
export function formatContent(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Code blocks with traffic light header
        .replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
            const langLabel = lang ? `<span class="code-lang">${lang}</span>` : '';
            return `<div class="code-block"><div class="code-header"><span class="mac-dot mac-red"></span><span class="mac-dot mac-yellow"></span><span class="mac-dot mac-green"></span>${langLabel}</div><pre class="code-body"><code>${code}</code></pre></div>`;
        })
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
        // Links — F1 XSS defense: strip dangerous URI schemes
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => {
            const trimmed = url.trim().toLowerCase();
            if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
                return `<span>${text}</span>`;
            }
            return `<a href="${url}" target="_blank" rel="noopener">${text}</a>`;
        })
        // Line breaks
        .replace(/\n/g, '<br />');
}
