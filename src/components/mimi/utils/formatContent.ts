/**
 * Convert markdown text to HTML for agent messages.
 *
 * Code blocks are wrapped in collapsible <details> elements (Manus/Antigravity style).
 * This keeps chat clean — users click to expand code.
 *
 * Used by ChatPanel and any component rendering agent responses.
 */
export function formatContent(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Code blocks → collapsible details/summary (Manus-style)
        .replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
            const langLabel = lang || 'code';
            const lineCount = code.trim().split('\n').length;
            return `<details class="code-collapse"><summary class="code-collapse-summary"><span class="code-collapse-lang">${langLabel}</span><span class="code-collapse-meta">${lineCount} Zeilen</span><span class="code-collapse-arrow">▸</span></summary><div class="code-block"><div class="code-header"><span class="mac-dot mac-red"></span><span class="mac-dot mac-yellow"></span><span class="mac-dot mac-green"></span><span class="code-lang">${langLabel}</span></div><pre class="code-body"><code>${code}</code></pre></div></details>`;
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
        .replace(/((<li>.*<\/li>\n?)+)/g, '<ul>$&</ul>')
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
