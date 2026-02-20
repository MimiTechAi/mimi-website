/**
 * MIMI Agent - Tool Definitions V2.0
 * 
 * Structured tool definitions for function calling
 * Enables the LLM to use tools predictably
 * 
 * V2 Changes:
 * - Real web_search handler via DuckDuckGo HTML API
 * - Hardened JSON parsing for malformed LLM output
 * - Executable tool dispatch system
 */

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: ToolParameter[];
    handler: string; // Reference to handler function
}

export interface ToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
    enum?: string[];
}

export interface ToolCall {
    tool: string;
    parameters: Record<string, any>;
}

export interface ToolResult {
    success: boolean;
    output: string;
    data?: any;
}

/**
 * Available Tools for MIMI Agent
 */
export const TOOL_DEFINITIONS: ToolDefinition[] = [
    {
        name: 'execute_python',
        description: 'Führt Python-Code aus und gibt das Ergebnis zurück. Unterstützt numpy, pandas, matplotlib, scipy.',
        parameters: [
            {
                name: 'code',
                type: 'string',
                description: 'Der auszuführende Python-Code',
                required: true
            }
        ],
        handler: 'executePython'
    },
    {
        name: 'search_documents',
        description: 'Durchsucht alle hochgeladenen PDF-Dokumente nach relevanten Informationen.',
        parameters: [
            {
                name: 'query',
                type: 'string',
                description: 'Die Suchanfrage',
                required: true
            },
            {
                name: 'limit',
                type: 'number',
                description: 'Maximale Anzahl an Ergebnissen (default: 3)',
                required: false
            }
        ],
        handler: 'searchDocuments'
    },
    {
        name: 'analyze_image',
        description: 'Analysiert ein hochgeladenes Bild und beantwortet Fragen dazu. Nutze dieses Tool wenn der User nach Bildinhalten fragt.',
        parameters: [
            {
                name: 'question',
                type: 'string',
                description: 'Die Frage zum Bild, z.B. "Was siehst du im Bild?" oder "Welcher Text ist sichtbar?"',
                required: true
            }
        ],
        handler: 'analyzeImage'
    },
    {
        name: 'create_file',
        description: 'Erstellt eine downloadbare Datei (PDF, CSV, JSON, TXT, HTML, MD). Nutze dies um Dokumente, Reports, Tabellen oder Datenexporte zu generieren.',
        parameters: [
            { name: 'type', type: 'string', description: 'Dateityp: pdf, csv, json, txt, html, md', required: true },
            { name: 'content', type: 'string', description: 'Inhalt der Datei', required: true },
            { name: 'filename', type: 'string', description: 'Dateiname ohne Endung', required: false }
        ],
        handler: 'createFile'
    },
    {
        name: 'web_search',
        description: 'Durchsucht das Internet nach aktuellen Informationen via DuckDuckGo. Nutze dies für Fakten, aktuelle Ereignisse oder Recherchen.',
        parameters: [
            {
                name: 'query',
                type: 'string',
                description: 'Die Suchanfrage',
                required: true
            },
            {
                name: 'limit',
                type: 'number',
                description: 'Maximale Anzahl an Ergebnissen (default: 5)',
                required: false
            }
        ],
        handler: 'webSearch'
    },
    {
        name: 'calculate',
        description: 'Berechnet einen mathematischen Ausdruck sicher (ohne eval). Unterstützt +, -, *, /, ^, ().',
        parameters: [
            {
                name: 'expression',
                type: 'string',
                description: 'Der mathematische Ausdruck, z.B. "2^10 + 5 * 3"',
                required: true
            }
        ],
        handler: 'calculate'
    },
    // ─── NEW V3 TOOLS — Full Workspace Autonomy ──────────────
    {
        name: 'execute_javascript',
        description: 'Führt JavaScript-Code sicher im QuickJS-Sandbox aus. Unterstützt ES2020+ Syntax, Module, und console.log Output.',
        parameters: [
            {
                name: 'code',
                type: 'string',
                description: 'Der auszuführende JavaScript-Code',
                required: true
            }
        ],
        handler: 'executeJavaScript'
    },
    {
        name: 'execute_sql',
        description: 'Führt SQL-Queries gegen die lokale SQLite-Datenbank aus. Unterstützt CREATE, INSERT, SELECT, UPDATE, DELETE.',
        parameters: [
            {
                name: 'query',
                type: 'string',
                description: 'Die SQL-Query',
                required: true
            }
        ],
        handler: 'executeSql'
    },
    {
        name: 'read_file',
        description: 'Liest den Inhalt einer Datei aus dem Workspace-Dateisystem.',
        parameters: [
            {
                name: 'path',
                type: 'string',
                description: 'Pfad zur Datei im Workspace, z.B. "src/main.py" oder "data/output.csv"',
                required: true
            }
        ],
        handler: 'readFile'
    },
    {
        name: 'write_file',
        description: 'Erstellt oder überschreibt eine Datei im Workspace-Dateisystem.',
        parameters: [
            {
                name: 'path',
                type: 'string',
                description: 'Pfad der Datei, z.B. "src/analysis.py" oder "output/result.json"',
                required: true
            },
            {
                name: 'content',
                type: 'string',
                description: 'Inhalt der Datei',
                required: true
            }
        ],
        handler: 'writeFile'
    },
    {
        name: 'list_files',
        description: 'Listet alle Dateien und Ordner im Workspace auf.',
        parameters: [
            {
                name: 'path',
                type: 'string',
                description: 'Pfad des Verzeichnisses (default: "/" für Root)',
                required: false
            }
        ],
        handler: 'listFiles'
    },
    // ─── V4 TOOLS — Manus AI Parity ─────────────────────────────
    {
        name: 'browse_url',
        description: 'Besucht eine Webseite und extrahiert den Text-Inhalt. Nutze dies um Webseiten zu lesen, Artikel zu analysieren oder Daten von URLs zu sammeln.',
        parameters: [
            {
                name: 'url',
                type: 'string',
                description: 'Die URL der Webseite, z.B. "https://example.com/article"',
                required: true
            },
            {
                name: 'extract',
                type: 'string',
                description: 'Was extrahiert werden soll: "text" (nur Text), "links" (nur Links), "all" (beides)',
                required: false,
                enum: ['text', 'links', 'all']
            }
        ],
        handler: 'browseUrl'
    },
    {
        name: 'execute_shell',
        description: 'Führt Shell-Kommandos im virtuellen Computer aus. Unterstützt: ls, cat, mkdir, rm, cp, mv, echo, pwd, whoami, date, pip install, curl, wc, head, tail, grep, find.',
        parameters: [
            {
                name: 'command',
                type: 'string',
                description: 'Das Shell-Kommando, z.B. "ls -la /workspace" oder "pip install requests"',
                required: true
            }
        ],
        handler: 'executeShell'
    },
    {
        name: 'update_plan',
        description: 'Aktualisiert das Agent-Scratchpad (3 Dateien). Nutze target: "todo" für Aufgabenplan mit Checkboxen, "notes" für Beobachtungen und Zwischenergebnisse, "context" für Key-Entscheidungen und Constraints. Operation "replace" überschreibt die Datei, "append" hängt an.',
        parameters: [
            {
                name: 'tasks',
                type: 'array',
                description: 'Array von Aufgaben (nur bei target="todo"): [{"label": "Daten sammeln", "status": "done"}, {"label": "Analyse", "status": "in_progress"}]',
                required: false
            },
            {
                name: 'title',
                type: 'string',
                description: 'Optionaler Titel für den Plan (nur bei target="todo")',
                required: false
            },
            {
                name: 'target',
                type: 'string',
                description: 'Ziel-Datei: "todo" (Aufgaben/Checkboxen), "notes" (Beobachtungen/Findings), "context" (Entscheidungen/Constraints). Default: "todo"',
                required: false
            },
            {
                name: 'operation',
                type: 'string',
                description: 'Operation: "replace" (überschreiben) oder "append" (anhängen). Default: "replace"',
                required: false
            },
            {
                name: 'content',
                type: 'string',
                description: 'Markdown-Inhalt (bei target="notes" oder "context"). Wird geschrieben/angehängt.',
                required: false
            }
        ],
        handler: 'updatePlan'
    },
    {
        name: 'delete_file',
        description: 'Löscht eine Datei oder einen leeren Ordner aus dem Workspace.',
        parameters: [
            {
                name: 'path',
                type: 'string',
                description: 'Pfad der zu löschenden Datei, z.B. "temp/old_data.csv"',
                required: true
            }
        ],
        handler: 'deleteFile'
    },
    {
        name: 'move_file',
        description: 'Verschiebt oder benennt eine Datei im Workspace um.',
        parameters: [
            {
                name: 'source',
                type: 'string',
                description: 'Aktueller Pfad der Datei, z.B. "old_name.py"',
                required: true
            },
            {
                name: 'destination',
                type: 'string',
                description: 'Neuer Pfad der Datei, z.B. "src/new_name.py"',
                required: true
            }
        ],
        handler: 'moveFile'
    },
];

/**
 * Generate compact tool descriptions with routing guidance for system prompt
 * Optimized for small models — includes explicit WANN/NICHT rules
 */
export function getToolDescriptionsForPrompt(): string {
    let desc = '## TOOLS\n\n';
    desc += '⚠️ Die meisten Fragen brauchen KEIN Tool! Listen, Erklärungen, Meinungen → direkt als Text antworten.\n\n';
    desc += 'Nur bei echtem Bedarf eines dieser Tools als JSON in ```json Blöcken aufrufen:\n\n';

    for (const tool of TOOL_DEFINITIONS) {
        const params = tool.parameters
            .map(p => `${p.name}:${p.type}${p.required ? '*' : ''}`)
            .join(', ');
        desc += `- **${tool.name}**(${params}): ${tool.description}\n`;
    }

    desc += '\n### ROUTING-REGELN:\n';
    desc += '- Frage/Erklärung/Liste/Plan → **Kein Tool** (direkt Text schreiben)\n';
    desc += '- Mathe (2+2, 100*5) → **calculate**\n';
    desc += '- Internet/Recherche/News → **web_search**\n';
    desc += '- Website/URL lesen/analysieren → **browse_url**\n';
    desc += '- Shell/Terminal/Pip/Curl → **execute_shell**\n';
    desc += '- Chart/Diagramm/Plot → **execute_python**\n';
    desc += '- PDF durchsuchen → **search_documents**\n';
    desc += '- Bild analysieren → **analyze_image**\n';
    desc += '- Datei zum Download → **create_file**\n';
    desc += '- Datei löschen → **delete_file**\n';
    desc += '- Datei verschieben/umbenennen → **move_file**\n';
    desc += '- Komplexe Aufgabe planen / Notizen / Kontext speichern → **update_plan** (target: todo/notes/context)\\n';
    desc += '\n**Format:** ```json\n{"tool": "name", "parameters": {"key": "value"}}\n```\n';
    return desc;
}

// ─────────────────────────────────────────────────────────
// HARDENED TOOL CALL PARSER
// Handles malformed JSON from small LLMs (Phi-3.5, Qwen)
// ─────────────────────────────────────────────────────────

/**
 * Keys that must be stripped from parsed JSON to prevent prototype pollution.
 * An attacker could craft JSON like {"__proto__": {"isAdmin": true}} to
 * modify Object.prototype and escalate privileges.
 */
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Recursively strip dangerous keys from a parsed JSON value.
 * Prevents prototype pollution attacks via crafted tool parameters.
 * Exported for testing (B-03 TDD).
 */
export function stripDangerousKeys<T>(value: T): T {
    if (value === null || value === undefined || typeof value !== 'object') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(item => stripDangerousKeys(item)) as T;
    }

    const cleaned: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
        if (!DANGEROUS_KEYS.has(key)) {
            cleaned[key] = stripDangerousKeys((value as Record<string, unknown>)[key]);
        }
    }
    return cleaned as T;
}

/**
 * Sanitize malformed JSON from LLM output.
 * Common issues:
 * - Unquoted keys
 * - Single quotes instead of double quotes
 * - Missing closing braces
 */
function sanitizeJSON(raw: string): string {
    let fixed = raw;

    // Replace single quotes with double quotes (but not inside strings)
    // Simple heuristic: replace ' with " when it's likely a JSON delimiter
    fixed = fixed.replace(/'/g, '"');

    // Remove trailing commas before } or ]
    fixed = fixed.replace(/,\s*([\]}])/g, '$1');

    // Try to fix unquoted keys: word: -> "word":
    fixed = fixed.replace(/(\{|,)\s*(\w+)\s*:/g, '$1"$2":');

    // Attempt to close unclosed braces
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
        fixed += '}'.repeat(openBraces - closeBraces);
    }

    return fixed;
}

/**
 * Parse tool calls from LLM output — HARDENED version
 * Handles:
 * 1. Standard ```json { "tool": "..." } ``` blocks
 * 2. Inline JSON objects with "tool" key
 * 3. Malformed JSON with common LLM errors
 * 4. Multiple tool calls in a single response
 */
export function parseToolCalls(text: string): ToolCall[] {
    const toolCalls: ToolCall[] = [];
    const seenTools = new Set<string>();

    // === Strategy 1: Match JSON blocks (fenced code blocks) ===
    const jsonBlockPattern = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;
    let match;

    while ((match = jsonBlockPattern.exec(text)) !== null) {
        const parsed = tryParseToolCall(match[1]);
        if (parsed && !seenTools.has(toolCallKey(parsed))) {
            seenTools.add(toolCallKey(parsed));
            toolCalls.push(parsed);
        }
    }

    // === Strategy 2: Match standalone JSON objects with "tool" key ===
    // This regex is more permissive — it finds { ... "tool" ... } blocks outside code fences
    const inlinePattern = /\{\s*"tool"\s*:\s*"(\w+)"[\s\S]*?\}/g;
    while ((match = inlinePattern.exec(text)) !== null) {
        // Skip if this match is inside a code fence (already captured above)
        const beforeMatch = text.slice(0, match.index);
        const openFences = (beforeMatch.match(/```/g) || []).length;
        if (openFences % 2 === 1) continue; // Inside a fenced block

        const parsed = tryParseToolCall(match[0]);
        if (parsed && !seenTools.has(toolCallKey(parsed))) {
            seenTools.add(toolCallKey(parsed));
            toolCalls.push(parsed);
        }
    }

    // === Strategy 3: Fuzzy match — LLM wrote tool name but malformed JSON ===
    if (toolCalls.length === 0) {
        const toolNames = TOOL_DEFINITIONS.map(t => t.name);
        for (const toolName of toolNames) {
            // Check if the LLM mentioned a tool name in a JSON-like context
            const fuzzyPattern = new RegExp(
                `["']?tool["']?\\s*[:=]\\s*["']?${toolName}["']?`,
                'i'
            );
            if (fuzzyPattern.test(text)) {
                // Try to extract the surrounding JSON object
                const surrounding = extractSurroundingJSON(text, toolName);
                if (surrounding) {
                    const parsed = tryParseToolCall(surrounding);
                    if (parsed && !seenTools.has(toolCallKey(parsed))) {
                        seenTools.add(toolCallKey(parsed));
                        toolCalls.push(parsed);
                    }
                }
            }
        }
    }

    return toolCalls;
}

/**
 * Try to parse a raw string as a tool call,
 * applying sanitization if initial parse fails.
 * Handles multiple formats:
 * - Direct: {"tool": "name", "parameters": {...}}
 * - Array wrapper: {"tools": [{"tool": "name", ...}]}
 * - Root array: [{"tool": "name", ...}]
 */
function tryParseToolCall(raw: string): ToolCall | null {
    // Attempt 1: Direct parse
    try {
        const parsed = stripDangerousKeys(JSON.parse(raw));

        // Unwrap {"tools": [{...}]} or {"tool_calls": [{...}]} wrapper
        const arr = parsed.tools || parsed.tool_calls;
        if (Array.isArray(arr) && arr.length > 0) {
            const first = arr[0];
            if (isValidToolCall(first)) {
                return { tool: first.tool, parameters: first.parameters || {} };
            }
        }

        // Unwrap root-level array: [{"tool": "name", ...}]
        if (Array.isArray(parsed) && parsed.length > 0) {
            const first = parsed[0];
            if (isValidToolCall(first)) {
                return { tool: first.tool, parameters: first.parameters || {} };
            }
        }

        // Direct format: {"tool": "name", "parameters": {...}}
        if (isValidToolCall(parsed)) {
            return { tool: parsed.tool, parameters: parsed.parameters || {} };
        }
    } catch {
        // Fall through to sanitized parse
    }

    // Attempt 2: Sanitized parse
    try {
        const sanitized = sanitizeJSON(raw);
        const parsed = stripDangerousKeys(JSON.parse(sanitized));

        // Same unwrapping logic
        const arr = parsed.tools || parsed.tool_calls;
        if (Array.isArray(arr) && arr.length > 0) {
            const first = arr[0];
            if (isValidToolCall(first)) {
                return { tool: first.tool, parameters: first.parameters || {} };
            }
        }

        if (isValidToolCall(parsed)) {
            return { tool: parsed.tool, parameters: parsed.parameters || {} };
        }
    } catch {
        // Could not parse
    }

    return null;
}

/**
 * Check if a parsed object looks like a valid tool call
 */
function isValidToolCall(obj: any): boolean {
    return (
        obj &&
        typeof obj === 'object' &&
        typeof obj.tool === 'string' &&
        obj.tool.length > 0 &&
        TOOL_DEFINITIONS.some(t => t.name === obj.tool)
    );
}

/**
 * Generate a unique key for deduplication
 */
function toolCallKey(call: ToolCall): string {
    return `${call.tool}:${JSON.stringify(call.parameters)}`;
}

/**
 * Try to extract a JSON-like object surrounding a tool name mention
 */
function extractSurroundingJSON(text: string, toolName: string): string | null {
    const idx = text.indexOf(toolName);
    if (idx === -1) return null;

    // Walk backwards to find opening brace
    let start = idx;
    while (start > 0 && text[start] !== '{') start--;

    // Walk forwards to find closing brace (with brace counting)
    let end = idx;
    let depth = 0;
    for (let i = start; i < text.length; i++) {
        if (text[i] === '{') depth++;
        if (text[i] === '}') depth--;
        if (depth === 0) {
            end = i + 1;
            break;
        }
    }

    if (start < end) {
        return text.slice(start, end);
    }
    return null;
}

/**
 * Auto-map LLM parameter aliases and fix common structural issues.
 * Small LLMs often put params at the root level or use synonyms.
 */
export function normalizeToolCallParameters(call: ToolCall): void {
    const definition = TOOL_DEFINITIONS.find(t => t.name === call.tool);
    if (!definition) return;

    // Common aliases → canonical param names
    const ALIASES: Record<string, string> = {
        input: 'code',
        source: 'code',
        python_code: 'code',
        js_code: 'code',
        javascript_code: 'code',
        sql_query: 'query',
        search_query: 'query',
        search: 'query',
        file_path: 'path',
        filepath: 'path',
        filename: 'path',
        text: 'content',
        body: 'content',
        math: 'expression',
        expr: 'expression',
        formula: 'expression',
    };

    // Step 1: Map aliases to canonical names
    for (const [alias, canonical] of Object.entries(ALIASES)) {
        if (alias in call.parameters && !(canonical in call.parameters)) {
            call.parameters[canonical] = call.parameters[alias];
            delete call.parameters[alias];
        }
    }

    // Step 2: If a required param is still missing, try to find it at root level
    // (LLM wrote {"tool":"execute_python","code":"print(1)"} without "parameters" wrapper)
    for (const param of definition.parameters) {
        if (param.required && !(param.name in call.parameters)) {
            // Check if there's a string value in parameters that could be the missing param
            const paramValues = Object.values(call.parameters);
            if (definition.parameters.filter(p => p.required).length === 1 && paramValues.length === 1) {
                // Single required param + single provided value → auto-map
                const [key] = Object.keys(call.parameters);
                if (key !== param.name && typeof call.parameters[key] === (param.type === 'number' ? 'number' : 'string')) {
                    call.parameters[param.name] = call.parameters[key];
                    delete call.parameters[key];
                }
            }
        }
    }
}

/**
 * Validate tool call parameters
 */
export function validateToolCall(call: ToolCall): { valid: boolean; error?: string } {
    // Auto-normalize parameters before validation
    normalizeToolCallParameters(call);

    const definition = TOOL_DEFINITIONS.find(t => t.name === call.tool);

    if (!definition) {
        return { valid: false, error: `Unknown tool: ${call.tool}` };
    }

    for (const param of definition.parameters) {
        if (param.required && !(param.name in call.parameters)) {
            return { valid: false, error: `Missing required parameter: ${param.name}` };
        }

        if (param.name in call.parameters) {
            const value = call.parameters[param.name];

            // Type validation
            if (param.type === 'string' && typeof value !== 'string') {
                return { valid: false, error: `Parameter ${param.name} must be a string` };
            }
            if (param.type === 'number' && typeof value !== 'number') {
                return { valid: false, error: `Parameter ${param.name} must be a number` };
            }

            // Enum validation
            if (param.enum && !param.enum.includes(value)) {
                return { valid: false, error: `Parameter ${param.name} must be one of: ${param.enum.join(', ')}` };
            }
        }
    }

    return { valid: true };
}

// ─────────────────────────────────────────────────────────
// WEB SEARCH HANDLER
// Uses DuckDuckGo HTML API via CORS proxy
// ─────────────────────────────────────────────────────────

interface WebSearchResult {
    title: string;
    url: string;
    snippet: string;
}

/**
 * Execute a web search via DuckDuckGo.
 * Strategy 1: Next.js API route (server-side proxy — no CORS)
 * Strategy 2: Direct browser fetch with CORS proxies (fallback)
 */
export async function executeWebSearch(
    query: string,
    limit: number = 5
): Promise<ToolResult> {
    console.log(`[WebSearch] 🔍 Searching: "${query}" (limit: ${limit})`);

    try {
        // Strategy 1: Server-side proxy via Next.js API route (no CORS)
        let results: WebSearchResult[] = [];
        try {
            const apiResponse = await fetch('/api/mimi/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, limit }),
            });
            if (apiResponse.ok) {
                const data = await apiResponse.json();
                results = data.results || [];
                console.log(`[WebSearch] ✅ Proxy returned ${results.length} results`);
            }
        } catch {
            console.log('[WebSearch] API proxy unavailable, trying CORS fallbacks...');
        }

        // Strategy 2: Browser-side with CORS proxies (fallback)
        if (results.length === 0) {
            results = await searchDuckDuckGo(query, limit);
        }

        if (results.length === 0) {
            return {
                success: true,
                output: `Keine Ergebnisse für "${query}" gefunden. Die Suche könnte durch Netzwerk-Einschränkungen blockiert sein.`,
                data: []
            };
        }

        // Format results for LLM consumption
        let output = `## Suchergebnisse für "${query}"\n\n`;
        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            output += `### ${i + 1}. ${r.title}\n`;
            output += `🔗 ${r.url}\n`;
            output += `${r.snippet}\n\n`;
        }

        console.log(`[WebSearch] ✅ Found ${results.length} results`);

        return {
            success: true,
            output,
            data: results
        };
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('[WebSearch] ❌ Search failed:', errorMsg);

        return {
            success: false,
            output: `Web-Suche fehlgeschlagen: ${errorMsg}`
        };
    }
}

/**
 * Search DuckDuckGo HTML version (lightweight, no JS required)
 * Tries multiple approaches: direct, then CORS proxies
 */
async function searchDuckDuckGo(
    query: string,
    limit: number
): Promise<WebSearchResult[]> {
    const encoded = encodeURIComponent(query);

    // Strategy 1: DuckDuckGo Lite (simplest HTML, most parseable)
    const ddgLiteUrl = `https://lite.duckduckgo.com/lite/?q=${encoded}`;

    // Strategy 2: DuckDuckGo HTML (regular HTML version)
    const ddgHtmlUrl = `https://html.duckduckgo.com/html/?q=${encoded}`;

    // CORS Proxies to try (free, no API key needed)
    const corsProxies = [
        (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    ];

    // Try direct request first (works in some browser configs)
    for (const ddgUrl of [ddgLiteUrl, ddgHtmlUrl]) {
        try {
            const response = await fetchWithTimeout(ddgUrl, 5000);
            if (response.ok) {
                const html = await response.text();
                const results = parseDDGResults(html, limit);
                if (results.length > 0) return results;
            }
        } catch {
            // Expected: CORS will block. Try proxies.
        }
    }

    // Try CORS proxies
    for (const proxyFn of corsProxies) {
        for (const ddgUrl of [ddgHtmlUrl, ddgLiteUrl]) {
            try {
                const proxiedUrl = proxyFn(ddgUrl);
                const response = await fetchWithTimeout(proxiedUrl, 8000);
                if (response.ok) {
                    const html = await response.text();
                    const results = parseDDGResults(html, limit);
                    if (results.length > 0) {
                        console.log(`[WebSearch] Success via proxy`);
                        return results;
                    }
                }
            } catch {
                continue;
            }
        }
    }

    // All strategies failed
    throw new Error(
        'Web-Suche nicht verfügbar. Alle Proxy-Strategien fehlgeschlagen. ' +
        'Versuche es später erneut oder nutze eine direkte Internetverbindung.'
    );
}

/**
 * Parse DuckDuckGo HTML results
 * Works with both lite and regular HTML versions
 */
function parseDDGResults(html: string, limit: number): WebSearchResult[] {
    const results: WebSearchResult[] = [];

    // DuckDuckGo HTML version: result links are in <a class="result__a"> tags
    // DuckDuckGo Lite version: result links are in <a class="result-link"> or <td> links

    // Strategy A: Parse DDG HTML version results
    const htmlResultPattern = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    while ((match = htmlResultPattern.exec(html)) !== null && results.length < limit) {
        const url = cleanUrl(match[1]);
        const title = stripHtml(match[2]);
        const snippet = stripHtml(match[3]);
        if (title && url) {
            results.push({ title, url, snippet });
        }
    }

    // Strategy B: Parse DDG Lite version (simpler table format)
    if (results.length === 0) {
        const litePattern = /<a[^>]*href="([^"]*)"[^>]*class="[^"]*result-link[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
        while ((match = litePattern.exec(html)) !== null && results.length < limit) {
            const url = cleanUrl(match[1]);
            const title = stripHtml(match[2]);
            if (title && url) {
                results.push({ title, url, snippet: '' });
            }
        }
    }

    // Strategy C: Generic link extraction as last resort
    if (results.length === 0) {
        const genericPattern = /<a[^>]*href="(https?:\/\/(?!duckduckgo)[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
        const seen = new Set<string>();
        while ((match = genericPattern.exec(html)) !== null && results.length < limit) {
            const url = cleanUrl(match[1]);
            const title = stripHtml(match[2]);
            if (title && url && title.length > 5 && !seen.has(url)) {
                seen.add(url);
                results.push({ title, url, snippet: '' });
            }
        }
    }

    return results;
}

/**
 * Clean DuckDuckGo redirect URLs to get the actual destination
 */
function cleanUrl(url: string): string {
    // DDG wraps URLs in redirects: //duckduckgo.com/l/?uddg=REAL_URL
    if (url.includes('uddg=')) {
        try {
            const decoded = decodeURIComponent(url.split('uddg=')[1].split('&')[0]);
            return decoded;
        } catch {
            return url;
        }
    }
    // Remove protocol-relative URLs
    if (url.startsWith('//')) {
        return 'https:' + url;
    }
    return url;
}

/**
 * Strip HTML tags and decode entities
 */
function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Fetch with a timeout to avoid hanging requests
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'text/html',
                'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
            }
        });
    } finally {
        clearTimeout(timeout);
    }
}

// ─────────────────────────────────────────────────────────
// TOOL DISPATCHER
// Routes parsed tool calls to their handlers
// ─────────────────────────────────────────────────────────

/** B-05: Typed return types for tool context functions */
export interface DocumentSearchResult {
    chunk: { text: string; page?: number; index?: number };
    documentName: string;
    score: number;
    source?: string;
}

export interface ImageAnalysisResult {
    description: string;
    text?: string;
    answer?: string;
}

export interface FileCreationResult {
    filename: string;
    url?: string;
    blob?: Blob;
}

/**
 * Extended tool context — includes V3 workspace tools (B-05: fully typed)
 */
export interface ToolExecutionContext {
    executePython?: (code: string) => Promise<string>;
    executeJavaScript?: (code: string) => Promise<string>;
    executeSql?: (query: string) => Promise<string>;
    searchDocuments?: (query: string, limit?: number) => Promise<DocumentSearchResult[]>;
    analyzeImage?: (question: string) => Promise<ImageAnalysisResult | string>;
    createFile?: (type: string, content: string, filename?: string) => Promise<FileCreationResult | string>;
    readFile?: (path: string) => Promise<string>;
    writeFile?: (path: string, content: string) => Promise<void>;
    listFiles?: (path?: string) => Promise<string[]>;
}

/**
 * Execute a parsed tool call and return the result.
 * For tools that require external dependencies (e.g., Python runtime),
 * pass them via the `context` parameter.
 */
export async function executeToolCall(
    call: ToolCall,
    context?: ToolExecutionContext
): Promise<ToolResult> {
    // Validate first (includes auto-normalization of parameters)
    const validation = validateToolCall(call);
    if (!validation.valid) {
        return { success: false, output: `Ungültiger Tool-Aufruf: ${validation.error}` };
    }

    const { tool, parameters } = call;

    switch (tool) {
        case 'web_search':
            return executeWebSearch(
                parameters.query,
                parameters.limit || 5
            );

        case 'calculate':
            return executeCalculate(parameters.expression);

        case 'execute_python':
            if (context?.executePython) {
                try {
                    const result = await context.executePython(parameters.code);
                    return { success: true, output: result };
                } catch (e: unknown) {
                    return { success: false, output: `Python-Fehler: ${e}` };
                }
            }
            return { success: false, output: 'Python-Runtime nicht verfügbar' };

        case 'execute_javascript':
            if (context?.executeJavaScript) {
                try {
                    const result = await context.executeJavaScript(parameters.code);
                    return { success: true, output: result };
                } catch (e: unknown) {
                    return { success: false, output: `JavaScript-Fehler: ${e}` };
                }
            }
            return { success: false, output: 'JavaScript-Runtime nicht verfügbar' };

        case 'execute_sql':
            if (context?.executeSql) {
                try {
                    const result = await context.executeSql(parameters.query);
                    return { success: true, output: result };
                } catch (e: unknown) {
                    return { success: false, output: `SQL-Fehler: ${e}` };
                }
            }
            return { success: false, output: 'SQL-Datenbank nicht verfügbar' };

        case 'search_documents':
            if (context?.searchDocuments) {
                try {
                    const results = await context.searchDocuments(
                        parameters.query,
                        parameters.limit || 3
                    );
                    return {
                        success: true,
                        output: results.length > 0
                            ? results.map((r: any) =>
                                `📄 ${r.documentName || 'Dokument'} (S. ${r.chunk?.pageNumber || '?'}): ${r.chunk?.text?.slice(0, 300)}...`
                            ).join('\n\n')
                            : 'Keine Ergebnisse gefunden.',
                        data: results
                    };
                } catch (e: unknown) {
                    return { success: false, output: `Suche fehlgeschlagen: ${e}` };
                }
            }
            return { success: false, output: 'Dokumentensuche nicht verfügbar' };

        case 'analyze_image':
            if (context?.analyzeImage) {
                try {
                    const result = await context.analyzeImage(parameters.question);
                    return {
                        success: true,
                        output: typeof result === 'string' ? result : JSON.stringify(result),
                        data: result
                    };
                } catch (e: unknown) {
                    return { success: false, output: `Bildanalyse fehlgeschlagen: ${e}` };
                }
            }
            return { success: false, output: 'Vision-Engine nicht verfügbar' };

        case 'create_file':
            if (context?.createFile) {
                try {
                    await context.createFile(
                        parameters.type,
                        parameters.content,
                        parameters.filename
                    );
                    return {
                        success: true,
                        output: `Datei "${parameters.filename || 'download'}.${parameters.type}" erstellt!`
                    };
                } catch (e: unknown) {
                    return { success: false, output: `Dateierstellung fehlgeschlagen: ${e}` };
                }
            }
            return { success: false, output: 'Dateigenerierung nicht verfügbar' };

        case 'read_file':
            if (context?.readFile) {
                try {
                    const content = await context.readFile(parameters.path);
                    return { success: true, output: content };
                } catch (e: unknown) {
                    return { success: false, output: `Datei lesen fehlgeschlagen: ${e}` };
                }
            }
            return { success: false, output: 'Dateisystem nicht verfügbar' };

        case 'write_file':
            if (context?.writeFile) {
                try {
                    await context.writeFile(parameters.path, parameters.content);
                    return {
                        success: true,
                        output: `Datei "${parameters.path}" erfolgreich geschrieben.`
                    };
                } catch (e: unknown) {
                    return { success: false, output: `Datei schreiben fehlgeschlagen: ${e}` };
                }
            }
            return { success: false, output: 'Dateisystem nicht verfügbar' };

        case 'list_files':
            if (context?.listFiles) {
                try {
                    const files = await context.listFiles(parameters.path || '/');
                    return {
                        success: true,
                        output: files.length > 0
                            ? `📁 Dateien:\n${files.map(f => `  - ${f}`).join('\n')}`
                            : 'Verzeichnis ist leer.'
                    };
                } catch (e: unknown) {
                    return { success: false, output: `Verzeichnis auflisten fehlgeschlagen: ${e}` };
                }
            }
            return { success: false, output: 'Dateisystem nicht verfügbar' };

        default:
            return { success: false, output: `Unbekanntes Tool: ${tool}` };
    }
}

/**
 * Simple math expression evaluator (safe, no eval)
 */
function executeCalculate(expression: string): ToolResult {
    try {
        // Sanitize: only allow math characters
        const sanitized = expression.replace(/[^0-9+\-*/().,%^ ]/g, '');
        if (sanitized.length === 0) {
            return { success: false, output: 'Ungültiger Ausdruck' };
        }

        // Replace ^ with ** for exponentiation
        const jsExpr = sanitized.replace(/\^/g, '**');

        // Use Function constructor for safe evaluation (no access to scope)
        // eslint-disable-next-line no-new-func
        const result = new Function(`"use strict"; return (${jsExpr})`)();

        if (typeof result !== 'number' || !isFinite(result)) {
            return { success: false, output: `Ergebnis ist nicht berechenbar: ${result}` };
        }

        return {
            success: true,
            output: `${expression} = ${result}`,
            data: result
        };
    } catch (e: unknown) {
        return {
            success: false,
            output: `Berechnungsfehler: ${e instanceof Error ? e.message : String(e)}`
        };
    }
}
