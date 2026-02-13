/**
 * MIMI Tech AI - SQLite Manager
 * 
 * In-browser SQLite database using sql.js (WASM).
 * Supports executing queries and persisting DB to OPFS.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 * https://mimitechai.com
 */

import { getMimiFilesystem } from '../filesystem';

// Define types locally or rely on @types/sql.js if available globally
// Since we load from CDN, we might not get types from import
// We'll trust the types are similar enough or use any for specific loaded instance
// But we can keep importing types from @types/sql.js if we keep it installed
import type { Database, QueryExecResult, SqlJsStatic } from 'sql.js';

export interface QueryResult {
    columns: string[];
    values: any[][];
    error?: string;
    executionTime: number;
}

declare global {
    interface Window {
        initSqlJs?: (config: any) => Promise<SqlJsStatic>;
    }
}

/**
 * Loads external script (reused from code-executor pattern)
 */
function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    });
}

export class MimiSQLite {
    private db: Database | null = null;
    private SQL: SqlJsStatic | null = null;
    private initialized = false;
    private currentDbPath: string | null = null;

    /**
     * Initialize SQLite engine
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Load SQL.js from CDN
            if (!window.initSqlJs) {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js');
            }

            if (!window.initSqlJs) {
                throw new Error('SQL.js failed to load');
            }

            this.SQL = await window.initSqlJs({
                locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
            });

            this.initialized = true;
            console.log('[MIMI SQLite] ✅ Runtime initialized via CDN');
        } catch (error) {
            console.error('[MIMI SQLite] ❌ Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Create a new empty database
     */
    async createDatabase(): Promise<void> {
        if (!this.initialized) await this.initialize();

        if (this.db) {
            this.db.close();
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.db = new (this.SQL as any).Database();
        this.currentDbPath = null;
        console.log('[MIMI SQLite] New database created');
    }

    /**
     * Open a database file from workspace
     */
    async openDatabase(path: string): Promise<void> {
        if (!this.initialized) await this.initialize();

        const fs = getMimiFilesystem();
        try {
            // Read binary database file via OPFS readFileBuffer
            const buffer = await fs.readFileBuffer(path);
            const data = new Uint8Array(buffer);

            if (this.db) {
                this.db.close();
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.db = new (this.SQL as any).Database(data);
            this.currentDbPath = path;
            console.log(`[MIMI SQLite] ✅ Opened database from ${path} (${data.length} bytes)`);

        } catch (error) {
            // If file doesn't exist, create a new empty database
            console.warn(`[MIMI SQLite] Could not open ${path}, creating new DB:`, error);
            await this.createDatabase();
            this.currentDbPath = path;
        }
    }

    /**
     * Execute SQL query
     */
    execute(sql: string): QueryResult {
        if (!this.db) {
            throw new Error('Database not open');
        }

        const startTime = performance.now();

        try {
            const results: QueryExecResult[] = this.db.exec(sql);
            const endTime = performance.now();

            if (results.length === 0) {
                return {
                    columns: [],
                    values: [],
                    executionTime: endTime - startTime
                };
            }

            // Return first result set (most relevant for SELECT)
            // For multiple statements, this simple wrapper returns the first output
            const result = results[0];
            return {
                columns: result.columns,
                values: result.values,
                executionTime: endTime - startTime
            };

        } catch (error) {
            const endTime = performance.now();
            return {
                columns: [],
                values: [],
                error: error instanceof Error ? error.message : String(error),
                executionTime: endTime - startTime
            };
        }
    }

    /**
     * Save database to workspace (binary persistence via OPFS)
     */
    async saveDatabase(path: string = 'database.sqlite'): Promise<void> {
        if (!this.db) return;

        const fs = getMimiFilesystem();
        const data = this.db.export(); // Returns Uint8Array

        // Write binary ArrayBuffer directly — MimiFilesystem.writeFile supports ArrayBuffer
        await fs.writeFile(path, data.buffer as ArrayBuffer);
        this.currentDbPath = path;
        console.log(`[MIMI SQLite] ✅ Saved database to ${path} (${data.length} bytes)`);
    }

    /**
     * Close the database
     */
    close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

// Singleton
let instance: MimiSQLite | null = null;

export function getMimiSQLite(): MimiSQLite {
    if (!instance) {
        instance = new MimiSQLite();
    }
    return instance;
}
