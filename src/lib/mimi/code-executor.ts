/**
 * MIMI Agent - Python Code Execution via Pyodide V2.0
 * 
 * Features:
 * - Python im Browser für Berechnungen
 * - Pre-Loading für schnelleren Start
 * - Mehr Packages: numpy, pandas, matplotlib, scipy
 * - Chart-Output als Base64
 */

declare global {
    interface Window {
        loadPyodide?: (options?: { indexURL?: string }) => Promise<PyodideInterface>;
    }
}

interface PyodideInterface {
    runPython: (code: string) => unknown;
    runPythonAsync: (code: string) => Promise<unknown>;
    loadPackage: (packages: string | string[]) => Promise<void>;
    globals: {
        get: (name: string) => unknown;
        set: (name: string, value: unknown) => void;
    };
}

// Micropip interface
interface Micropip {
    install: (packages: string | string[]) => Promise<void>;
}

// Singleton State
let pyodide: PyodideInterface | null = null;
let micropip: Micropip | null = null;
let isLoading = false;
let loadError: Error | null = null;
let preloadPromise: Promise<void> | null = null;

// Verfügbare Packages
const CORE_PACKAGES = ['numpy', 'pandas', 'micropip'];
const EXTRA_PACKAGES = ['matplotlib', 'scipy'];

export interface CodeExecutionResult {
    success: boolean;
    output: string;
    error?: string;
    executionTime: number;
    chartBase64?: string;  // NEU: Für Matplotlib Output
}

/**
 * AUTO-FIX: Korrigiert bekannte LLM-Typos in generiertem Code
 * Qwen-0.5B und andere kleine Modelle generieren oft:
 * - np0 statt np.pi
 * - plt0 statt plt.show()
 * - plt egy.ylabel statt plt.ylabel
 * - -2np.pi statt -2*np.pi
 * - %matplotlib inline (Jupyter-spezifisch)
 * - Code auf einer Zeile (fehlende Newlines)
 */
export function autoFixCode(code: string): string {
    let fixed = code;

    // ========== STEP 1: NEWLINES WIEDERHERSTELLEN ==========
    // Wenn alles auf einer Zeile ist, Statements trennen
    // Typisches Muster: "import numpy as np import matplotlib.pyplot as plt"

    // Import-Statements separieren (WICHTIG: echte Newlines, nicht escaped!)
    fixed = fixed.replace(/\bimport\s+(\w+)\s+as\s+(\w+)\s+import\b/g, 'import $1 as $2\nimport');
    fixed = fixed.replace(/\bimport\s+(\w+\.\w+)\s+as\s+(\w+)\s+import\b/g, 'import $1 as $2\nimport');
    fixed = fixed.replace(/\bfrom\s+(\w+)\s+import\s+([\w,\s]+)\s+import\b/g, 'from $1 import $2\nimport');
    fixed = fixed.replace(/\bfrom\s+(\w+)\s+import\s+([\w,\s]+)\s+from\b/g, 'from $1 import $2\nfrom');

    // Statements nach plt.show(), plt.figure(), etc. separieren
    fixed = fixed.replace(/plt\.(show|figure|savefig|close)\(\)\s*([a-zA-Z])/g, 'plt.$1()\n$2');

    // Variable-Assignments separieren: "x = ...  y = ..." → separate lines
    fixed = fixed.replace(/([a-zA-Z_]\w*)\s*=\s*([^=\n]+?)\s+([a-zA-Z_]\w*)\s*=/g, '$1 = $2\n$3 =');

    // ========== STEP 2: JUPYTER MAGIC ENTFERNEN ==========
    fixed = fixed.replace(/%matplotlib\s+inline\s*/g, '');
    fixed = fixed.replace(/%matplotlib\s*/g, '');

    // ========== STEP 2.5: COMMON LLM TYPOS ==========
    // Guard: empty or whitespace-only input
    if (fixed.trim().length === 0) return '';

    // Common LLM-generated typos
    fixed = fixed.replace(/\bpritn\b/g, 'print');
    fixed = fixed.replace(/\bprnt\b/g, 'print');
    fixed = fixed.replace(/\bpirnt\b/g, 'print');
    fixed = fixed.replace(/\blenght\b/g, 'length');
    fixed = fixed.replace(/\blegnth\b/g, 'length');
    fixed = fixed.replace(/\bretrun\b/g, 'return');
    fixed = fixed.replace(/\bretrn\b/g, 'return');
    fixed = fixed.replace(/\bimprot\b/g, 'import');
    fixed = fixed.replace(/\bimoprt\b/g, 'import');
    fixed = fixed.replace(/\bfunciton\b/g, 'function');
    fixed = fixed.replace(/\bfuncion\b/g, 'function');
    fixed = fixed.replace(/\bture\b/g, 'true');
    fixed = fixed.replace(/\bflase\b/g, 'false');
    fixed = fixed.replace(/\bfalse\b/g, 'false');  // already correct, no-op guard

    // ========== STEP 3: np.pi TYPOS ==========
    // WICHTIG: Diese Pattern ZUERST, bevor andere
    fixed = fixed.replace(/\bnp0\.pi\b/g, 'np.pi');  // np0.pi → np.pi (Tippfehler)
    fixed = fixed.replace(/\bnp0\.sin\b/g, 'np.sin');
    fixed = fixed.replace(/\bnp0\.cos\b/g, 'np.cos');
    fixed = fixed.replace(/\bnp0\.linspace\b/g, 'np.linspace');
    fixed = fixed.replace(/\bnp0\b/g, 'np.pi');  // np0 alleine = np.pi
    fixed = fixed.replace(/\bnumpy0\b/g, 'np.pi');
    fixed = fixed.replace(/\bnp\.0\b/g, 'np.pi');

    // 0.pi → np.pi (Tippfehler wo das 'n' und 'p' fehlen)
    fixed = fixed.replace(/([^a-zA-Z\d])0\.pi\b/g, '$1np.pi');
    fixed = fixed.replace(/^0\.pi\b/g, 'np.pi');

    // 2*0.pi → 2*np.pi
    fixed = fixed.replace(/(\d+)\s*\*\s*0\.pi/g, '$1*np.pi');

    // -2np.pi → -2*np.pi (fehlender Operator)
    fixed = fixed.replace(/(-?\d+)np\.pi/g, '$1*np.pi');
    fixed = fixed.replace(/(-?\d+)np0/g, '$1*np.pi');

    // ========== STEP 4: plt GARBAGE/TYPOS ==========
    // plt egy.ylabel → plt.ylabel (Garbage zwischen plt und .method)
    fixed = fixed.replace(/plt\s+[a-zA-Z]+\.(xlabel|ylabel|title|legend|grid|plot|show|figure|savefig|axhline|axvline|fill_between|tight_layout)/g, 'plt.$1');

    // plt0, pltumi, etc.
    fixed = fixed.replace(/\bplt0\b(?!\s*=)/g, 'plt.show()');
    fixed = fixed.replace(/\bplt\.0\b/g, 'plt.show()');
    fixed = fixed.replace(/\bplten\b/g, 'plt.show()');
    fixed = fixed.replace(/\bpltumi\b/g, '');
    fixed = fixed.replace(/\bpltum\b/g, '');
    fixed = fixed.replace(/\bpltu\b/g, '');

    // ========== STEP 5: DOPPELTE KLAMMERN/LEERZEICHEN ==========
    fixed = fixed.replace(/plt\.show\(\)\(\)/g, 'plt.show()');
    fixed = fixed.replace(/np\.linspace\s*\(\s*-\s*2\s*\*\s*np0/g, 'np.linspace(-2*np.pi');
    fixed = fixed.replace(/2\s*\*\s*np0/g, '2*np.pi');

    // ========== STEP 6: GARBAGE-ZEILEN ENTFERNEN ==========
    fixed = fixed.split('\n')
        .filter(line => {
            const trimmed = line.trim();
            // Entferne Zeilen die nur aus Garbage bestehen
            if (/^(pltumi|pltum|pltu|plt0|np0|egy|Weniger|Mehr\.{3})$/i.test(trimmed)) return false;
            // Zeilen die nur "Output:..." enthalten (UI-Artefakte)
            if (/^Output:.*$/i.test(trimmed)) return false;
            // Leere Zeilen am Anfang/Ende (aber nicht in der Mitte)
            return true;
        })
        .join('\n');

    // ========== STEP 7: FINAL CLEANUP ==========
    // Mehrfache Leerzeilen auf eine reduzieren
    fixed = fixed.replace(/\n{3,}/g, '\n\n');
    // Leading/Trailing Whitespace
    fixed = fixed.trim();

    // Log wenn Fixes gemacht wurden
    if (fixed !== code) {
        console.log('[MIMI Code-Fixer] Applied auto-corrections:', {
            original: code.substring(0, 200),
            fixed: fixed.substring(0, 200)
        });
    }

    return fixed;
}

/**
 * Pre-Loader: Startet Pyodide im Hintergrund beim App-Start
 */
export function preloadPyodide(): void {
    if (pyodide || isLoading || preloadPromise) return;

    preloadPromise = initPyodide().catch(err => {
        console.warn('Pyodide preload failed:', err);
    });
}

/**
 * Returns the preload promise so callers can await Pyodide readiness
 */
export function getPyodidePromise(): Promise<void> | null {
    return preloadPromise;
}

/**
 * Lädt Pyodide mit Progress-Callback
 */
export async function initPyodide(
    onProgress?: (message: string) => void
): Promise<void> {
    if (pyodide) return;
    if (loadError) throw loadError;
    if (isLoading) {
        while (isLoading) {
            await new Promise(r => setTimeout(r, 100));
        }
        if (loadError) throw loadError;
        return;
    }

    isLoading = true;
    onProgress?.('Lade Python-Runtime...');

    try {
        // Pyodide Script dynamisch laden
        if (!window.loadPyodide) {
            await loadScript('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');
        }

        onProgress?.('Initialisiere Python...');

        pyodide = await window.loadPyodide!({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
        });

        // Core-Packages laden
        onProgress?.('Lade NumPy, Pandas & Micropip...');
        await pyodide.loadPackage(CORE_PACKAGES);

        // Initialize micropip
        micropip = pyodide.globals.get('micropip') as Micropip;

        onProgress?.('Python bereit!');
    } catch (error) {
        loadError = error instanceof Error ? error : new Error(String(error));
        throw loadError;
    } finally {
        isLoading = false;
    }
}

/**
 * Lädt zusätzliche Packages bei Bedarf
 */
export async function loadExtraPackages(
    packages: string[],
    onProgress?: (message: string) => void
): Promise<void> {
    if (!pyodide) {
        await initPyodide(onProgress);
    }

    if (!pyodide) return;

    onProgress?.(`Lade ${packages.join(', ')}...`);
    await pyodide.loadPackage(packages);
    onProgress?.('Packages geladen!');
}

/**
 * Installiert ein Python-Package via Micropip
 */
export async function installPackage(
    packageName: string,
    onProgress?: (message: string) => void
): Promise<{ success: boolean; message: string }> {
    if (!pyodide || !micropip) {
        await initPyodide(onProgress);
    }

    if (!micropip) {
        return { success: false, message: 'Micropip konnte nicht geladen werden' };
    }

    try {
        onProgress?.(`Installiere ${packageName}...`);
        await micropip.install(packageName);
        onProgress?.(`${packageName} erfolgreich installiert!`);
        return { success: true, message: `Package ${packageName} installiert` };
    } catch (error) {
        console.error(`Fehler bei Installation von ${packageName}:`, error);
        return {
            success: false,
            message: error instanceof Error ? error.message : `Fehler bei Installation von ${packageName}`
        };
    }
}

/**
 * Führt Python-Code aus
 */
export async function executePython(code: string): Promise<CodeExecutionResult> {
    if (!pyodide) {
        await initPyodide();
    }

    if (!pyodide) {
        return {
            success: false,
            output: '',
            error: 'Pyodide nicht initialisiert',
            executionTime: 0
        };
    }

    // AUTO-FIX: Korrigiere bekannte LLM-Typos
    const fixedCode = autoFixCode(code);
    const codeToRun = fixedCode;

    const startTime = Date.now();

    try {
        // Detect matplotlib usage and load if needed
        const usesMpl = codeToRun.includes('matplotlib') || codeToRun.includes('plt.');
        if (usesMpl) {
            try {
                await pyodide.loadPackage(['matplotlib']);
            } catch {
                // Package may already be loaded
            }
        }

        // Pass user code via base64 to avoid string interpolation injection
        const codeBase64 = btoa(unescape(encodeURIComponent(codeToRun)));
        const usesMplFlag = usesMpl ? 'True' : 'False';

        // Capture stdout and handle matplotlib
        const wrappedCode = `
import sys
import base64
from io import StringIO

_stdout_capture = StringIO()
_old_stdout = sys.stdout
sys.stdout = _stdout_capture

_chart_data = None
_user_code = base64.b64decode("${codeBase64}").decode("utf-8")

try:
    if ${usesMplFlag}:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        from io import BytesIO

        exec(_user_code)

        fig = plt.gcf()
        if fig.get_axes():
            buf = BytesIO()
            fig.savefig(buf, format='png', dpi=100, bbox_inches='tight', facecolor='#1a1a2e')
            buf.seek(0)
            _chart_data = base64.b64encode(buf.read()).decode('utf-8')
            plt.close(fig)
    else:
        exec(_user_code)
except Exception as e:
    print(f"Error: {e}")
finally:
    sys.stdout = _old_stdout

_output = _stdout_capture.getvalue()
(_output, _chart_data)
`;

        const result = await pyodide.runPythonAsync(wrappedCode);

        // Result is a Python tuple converted to JS Array
        // [output_string, chart_base64_string_or_null]
        let output = '';
        let chartData: string | null = null;

        if (Array.isArray(result)) {
            output = result[0] || '';
            chartData = result[1] || null;
            if (chartData) {
                console.log('[Pyodide] 📊 Chart generated!', chartData.substring(0, 50) + '...');
            }
        } else {
            // Fallback for unexpected return types
            output = String(result);
        }

        return {
            success: true,
            output: output,
            executionTime: Date.now() - startTime,
            chartBase64: chartData || undefined
        };
    } catch (error) {
        return {
            success: false,
            output: '',
            error: error instanceof Error ? error.message : String(error),
            executionTime: Date.now() - startTime
        };
    }
}

/**
 * Dangerous keywords that must NEVER appear in a calculate() expression.
 * These could escape the math sandbox and execute arbitrary Python.
 */
const DANGEROUS_KEYWORDS = [
    '__import__', '__class__', '__mro__', '__subclasses__', '__builtins__',
    '__globals__', '__getattribute__', '__dict__',
    'import', 'exec', 'eval', 'open', 'system', 'compile',
    'getattr', 'setattr', 'delattr', 'globals', 'locals',
    'breakpoint', 'input', 'print', // print is handled by wrapper, not user expression
];

/**
 * Allowed function/constant names in expressions.
 * Everything else with alpha chars is rejected.
 */
const ALLOWED_IDENTIFIERS = new Set([
    // Python math module
    'math', 'sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
    'log', 'log2', 'log10', 'exp', 'pow', 'pi', 'e', 'tau', 'inf',
    'ceil', 'floor', 'factorial', 'gcd', 'degrees', 'radians',
    'sinh', 'cosh', 'tanh',
    // Numpy
    'np',
    // Python builtins (safe)
    'abs', 'round', 'min', 'max', 'sum', 'int', 'float',
    'True', 'False',
]);

/** Maximum expression length to prevent abuse */
const MAX_EXPRESSION_LENGTH = 200;

/**
 * Validates whether a math expression is safe for execution.
 * Exported for testing (B-01 TDD).
 */
export function isExpressionSafe(expression: string): boolean {
    const trimmed = expression.trim();

    // Reject empty
    if (trimmed.length === 0) return false;

    // Reject too long
    if (trimmed.length > MAX_EXPRESSION_LENGTH) return false;

    // Reject dunder access (__ anywhere)
    if (trimmed.includes('__')) return false;

    // Reject dangerous keywords (case-sensitive, word-boundary)
    const lowerExpr = trimmed.toLowerCase();
    for (const keyword of DANGEROUS_KEYWORDS) {
        // Use word boundary check to avoid false positives
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(lowerExpr)) return false;
    }

    // Extract all identifiers (alpha sequences) and validate each
    const identifiers = trimmed.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    for (const id of identifiers) {
        if (!ALLOWED_IDENTIFIERS.has(id)) return false;
    }

    return true;
}

/**
 * Berechnet mathematische Ausdrücke sicher
 */
export async function calculate(expression: string): Promise<CodeExecutionResult> {
    if (!isExpressionSafe(expression)) {
        return { success: false, output: '', error: 'Ungültiger Ausdruck', executionTime: 0 };
    }

    const sanitized = expression.trim();
    const code = `
import math
import numpy as np

result = ${sanitized}
print(result)
`;
    return executePython(code);
}

/**
 * Prüft ob Pyodide verfügbar ist
 */
export function isPyodideReady(): boolean {
    return pyodide !== null;
}

/**
 * Prüft ob Pyodide noch lädt
 */
export function isPyodideLoading(): boolean {
    return isLoading;
}

/**
 * Lädt externes Script
 */
function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    });
}
