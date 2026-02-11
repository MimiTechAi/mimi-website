/**
 * MIMI Tech AI - Virtual Filesystem Manager
 * 
 * Part of MIMI Workspace - Browser-Based Development Environment
 * Powered by Origin Private File System (OPFS) for persistent storage.
 * 
 * Features:
 * - Persistent file storage (survives browser reload)
 * - Node.js-like API (readFile, writeFile, etc.)
 * - Directory management
 * - File watching for real-time updates
 * - Automatic workspace initialization
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 * https://mimitechai.com
 */

// Extend FileSystemDirectoryHandle with async iterator support (OPFS)
declare global {
    interface FileSystemDirectoryHandle {
        entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
        keys(): AsyncIterableIterator<string>;
        values(): AsyncIterableIterator<FileSystemHandle>;
        [Symbol.asyncIterator](): AsyncIterableIterator<[string, FileSystemHandle]>;
    }
}

// Type definitions for OPFS
interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    size?: number;
    lastModified?: Date;
}

interface FileSystemConfig {
    rootName: string;
    autoInit: boolean;
    defaultStructure: string[];
}

const DEFAULT_CONFIG: FileSystemConfig = {
    rootName: 'mimi-workspace',
    autoInit: true,
    defaultStructure: [
        '/workspace',
        '/workspace/projects',
        '/workspace/.mimi',
        '/workspace/.mimi/config',
    ]
};

const DEFAULT_MIMI_CONFIG = {
    version: '1.0.0',
    created: new Date().toISOString(),
    brand: 'MIMI Tech AI',
    settings: {
        autoSave: true,
        autoSaveInterval: 2000,
        theme: 'dark'
    }
};

/**
 * MIMI Tech AI - Virtual Filesystem
 * Provides persistent file storage using OPFS
 */
export class MimiFilesystem {
    private root: FileSystemDirectoryHandle | null = null;
    private config: FileSystemConfig;
    private initialized: boolean = false;
    private watchers: Map<string, ((event: FileChangeEvent) => void)[]> = new Map();

    constructor(config: Partial<FileSystemConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Initialize the filesystem
     * Creates default structure if not exists
     */
    async initialize(): Promise<{ success: boolean; message: string }> {
        if (this.initialized && this.root) {
            return { success: true, message: 'Already initialized' };
        }

        try {
            // Check OPFS support
            if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
                throw new Error('OPFS not supported in this browser. Please use Chrome 86+, Edge 86+, or Firefox 111+.');
            }

            // Get OPFS root
            this.root = await navigator.storage.getDirectory();
            console.log('[MIMI Filesystem] OPFS root obtained');

            // Create workspace directory
            const workspaceHandle = await this.root.getDirectoryHandle(
                this.config.rootName,
                { create: true }
            );
            this.root = workspaceHandle;

            // Mark as initialized BEFORE creating default structure
            // (createDefaultStructure uses writeFile which checks initialization)
            this.initialized = true;

            // Create default structure if autoInit enabled
            if (this.config.autoInit) {
                await this.createDefaultStructure();
            }

            console.log('[MIMI Filesystem] ✅ Initialized successfully');

            return {
                success: true,
                message: `MIMI Workspace initialized at /${this.config.rootName}`
            };

        } catch (error) {
            console.error('[MIMI Filesystem] ❌ Initialization failed:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Create default workspace structure
     */
    private async createDefaultStructure(): Promise<void> {
        for (const path of this.config.defaultStructure) {
            try {
                await this.createDirectory(path);
            } catch {
                // Directory may already exist, ignore
            }
        }

        // Create default config file
        const configPath = '/workspace/.mimi/config.json';
        if (!await this.exists(configPath)) {
            await this.writeFile(
                configPath,
                JSON.stringify(DEFAULT_MIMI_CONFIG, null, 2)
            );
        }

        // Create welcome file
        const welcomePath = '/workspace/README.md';
        if (!await this.exists(welcomePath)) {
            await this.writeFile(welcomePath, WELCOME_CONTENT);
        }

        console.log('[MIMI Filesystem] Default structure created');
    }

    /**
     * Read file contents
     * @param path - File path (e.g., '/workspace/myfile.txt')
     * @returns File contents as string
     */
    async readFile(path: string): Promise<string> {
        this.ensureInitialized();

        const { dirHandle, fileName } = await this.resolvePath(path);

        try {
            const fileHandle = await dirHandle.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            return await file.text();
        } catch (error) {
            throw new Error(`Cannot read file '${path}': ${error instanceof Error ? error.message : 'Not found'}`);
        }
    }

    /**
     * Read file as binary (ArrayBuffer)
     * @param path - File path
     * @returns ArrayBuffer of file contents
     */
    async readFileBuffer(path: string): Promise<ArrayBuffer> {
        this.ensureInitialized();

        const { dirHandle, fileName } = await this.resolvePath(path);
        const fileHandle = await dirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        return await file.arrayBuffer();
    }

    /**
     * Write file contents
     * @param path - File path
     * @param content - File content (string or ArrayBuffer)
     */
    async writeFile(path: string, content: string | ArrayBuffer): Promise<void> {
        this.ensureInitialized();

        const { dirHandle, fileName } = await this.resolvePath(path, true);

        const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();

        try {
            await writable.write(content);
            await writable.close();

            // Notify watchers
            this.notifyWatchers(path, 'modified');

            console.log(`[MIMI Filesystem] Written: ${path}`);
        } catch (error) {
            await writable.abort();
            throw error;
        }
    }

    /**
     * Append to file
     * @param path - File path
     * @param content - Content to append
     */
    async appendFile(path: string, content: string): Promise<void> {
        let existing = '';
        try {
            existing = await this.readFile(path);
        } catch {
            // File doesn't exist, will be created
        }
        await this.writeFile(path, existing + content);
    }

    /**
     * Create directory (recursive)
     * @param path - Directory path
     */
    async createDirectory(path: string): Promise<void> {
        this.ensureInitialized();

        const parts = this.normalizePath(path).split('/').filter(Boolean);
        let currentHandle = this.root!;

        for (const part of parts) {
            currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
        }

        console.log(`[MIMI Filesystem] Created directory: ${path}`);
    }

    /**
     * List directory contents
     * @param path - Directory path
     * @returns Array of file entries
     */
    async listDirectory(path: string): Promise<FileEntry[]> {
        this.ensureInitialized();

        const dirHandle = await this.getDirectoryHandle(path);
        const entries: FileEntry[] = [];

        for await (const [name, handle] of dirHandle.entries()) {
            const entry: FileEntry = {
                name,
                path: `${path}/${name}`.replace(/\/+/g, '/'),
                isDirectory: handle.kind === 'directory'
            };

            if (!entry.isDirectory) {
                try {
                    const file = await (handle as FileSystemFileHandle).getFile();
                    entry.size = file.size;
                    entry.lastModified = new Date(file.lastModified);
                } catch {
                    // Ignore metadata errors
                }
            }

            entries.push(entry);
        }

        // Sort: directories first, then alphabetically
        return entries.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Delete file
     * @param path - File path
     */
    async deleteFile(path: string): Promise<void> {
        this.ensureInitialized();

        const { dirHandle, fileName } = await this.resolvePath(path);

        await dirHandle.removeEntry(fileName);
        this.notifyWatchers(path, 'deleted');

        console.log(`[MIMI Filesystem] Deleted: ${path}`);
    }

    /**
     * Delete directory (recursive)
     * @param path - Directory path
     */
    async deleteDirectory(path: string): Promise<void> {
        this.ensureInitialized();

        const { dirHandle, fileName } = await this.resolvePath(path);

        await dirHandle.removeEntry(fileName, { recursive: true });

        console.log(`[MIMI Filesystem] Deleted directory: ${path}`);
    }

    /**
     * Rename/move file or directory
     * @param oldPath - Current path
     * @param newPath - New path
     */
    async rename(oldPath: string, newPath: string): Promise<void> {
        const content = await this.readFile(oldPath);
        await this.writeFile(newPath, content);
        await this.deleteFile(oldPath);

        console.log(`[MIMI Filesystem] Renamed: ${oldPath} → ${newPath}`);
    }

    /**
     * Copy file
     * @param srcPath - Source path
     * @param destPath - Destination path
     */
    async copyFile(srcPath: string, destPath: string): Promise<void> {
        const content = await this.readFile(srcPath);
        await this.writeFile(destPath, content);

        console.log(`[MIMI Filesystem] Copied: ${srcPath} → ${destPath}`);
    }

    /**
     * Check if file/directory exists
     * @param path - Path to check
     * @returns true if exists
     */
    async exists(path: string): Promise<boolean> {
        try {
            const { dirHandle, fileName } = await this.resolvePath(path);

            // Try as file first
            try {
                await dirHandle.getFileHandle(fileName);
                return true;
            } catch {
                // Not a file, try as directory
            }

            try {
                await dirHandle.getDirectoryHandle(fileName);
                return true;
            } catch {
                return false;
            }
        } catch {
            return false;
        }
    }

    /**
     * Get file info
     * @param path - File path
     * @returns File entry info
     */
    async getInfo(path: string): Promise<FileEntry | null> {
        try {
            const { dirHandle, fileName } = await this.resolvePath(path);

            // Try as file
            try {
                const fileHandle = await dirHandle.getFileHandle(fileName);
                const file = await fileHandle.getFile();
                return {
                    name: fileName,
                    path: path,
                    isDirectory: false,
                    size: file.size,
                    lastModified: new Date(file.lastModified)
                };
            } catch {
                // Try as directory
            }

            try {
                await dirHandle.getDirectoryHandle(fileName);
                return {
                    name: fileName,
                    path: path,
                    isDirectory: true
                };
            } catch {
                return null;
            }
        } catch {
            return null;
        }
    }

    /**
     * Watch for file changes
     * @param path - Path to watch
     * @param callback - Callback on change
     * @returns Unsubscribe function
     */
    watch(path: string, callback: (event: FileChangeEvent) => void): () => void {
        const normalizedPath = this.normalizePath(path);

        if (!this.watchers.has(normalizedPath)) {
            this.watchers.set(normalizedPath, []);
        }

        this.watchers.get(normalizedPath)!.push(callback);

        // Return unsubscribe function
        return () => {
            const callbacks = this.watchers.get(normalizedPath);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    /**
     * Get total storage usage
     */
    async getStorageUsage(): Promise<{ used: number; quota: number; percent: number }> {
        if ('estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            const used = estimate.usage || 0;
            const quota = estimate.quota || 0;
            return {
                used,
                quota,
                percent: quota > 0 ? (used / quota) * 100 : 0
            };
        }
        return { used: 0, quota: 0, percent: 0 };
    }

    /**
     * Export workspace as ZIP
     * (Requires JSZip library)
     */
    async exportAsZip(basePath: string = '/workspace'): Promise<Blob> {
        // Dynamic import to avoid bundling if not used
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        await this.addToZip(zip, basePath, '');

        return await zip.generateAsync({ type: 'blob' });
    }

    /**
     * Import from ZIP
     */
    async importFromZip(zipBlob: Blob, targetPath: string = '/workspace'): Promise<number> {
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(zipBlob);

        let count = 0;

        for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
            if (zipEntry.dir) {
                await this.createDirectory(`${targetPath}/${relativePath}`);
            } else {
                const content = await zipEntry.async('string');
                await this.writeFile(`${targetPath}/${relativePath}`, content);
                count++;
            }
        }

        console.log(`[MIMI Filesystem] Imported ${count} files from ZIP`);
        return count;
    }

    // ─────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────

    private ensureInitialized(): void {
        if (!this.initialized || !this.root) {
            throw new Error('Filesystem not initialized. Call initialize() first.');
        }
    }

    private normalizePath(path: string): string {
        return path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    }

    private async resolvePath(
        path: string,
        createParents: boolean = false
    ): Promise<{ dirHandle: FileSystemDirectoryHandle; fileName: string }> {
        const normalized = this.normalizePath(path);
        const parts = normalized.split('/').filter(Boolean);
        const fileName = parts.pop();

        if (!fileName) {
            throw new Error('Invalid path: no filename');
        }

        let currentHandle = this.root!;

        for (const part of parts) {
            try {
                currentHandle = await currentHandle.getDirectoryHandle(part, {
                    create: createParents
                });
            } catch (error) {
                throw new Error(`Directory not found: ${part}`);
            }
        }

        return { dirHandle: currentHandle, fileName };
    }

    private async getDirectoryHandle(path: string): Promise<FileSystemDirectoryHandle> {
        const normalized = this.normalizePath(path);
        const parts = normalized.split('/').filter(Boolean);

        let currentHandle = this.root!;

        for (const part of parts) {
            currentHandle = await currentHandle.getDirectoryHandle(part);
        }

        return currentHandle;
    }

    private notifyWatchers(path: string, type: 'created' | 'modified' | 'deleted'): void {
        const normalized = this.normalizePath(path);

        for (const [watchPath, callbacks] of this.watchers) {
            if (normalized.startsWith(watchPath) || normalized === watchPath) {
                const event: FileChangeEvent = { path: normalized, type };
                callbacks.forEach(cb => cb(event));
            }
        }
    }

    private async addToZip(
        zip: import('jszip'),
        basePath: string,
        zipPath: string
    ): Promise<void> {
        const entries = await this.listDirectory(basePath);

        for (const entry of entries) {
            const fullPath = entry.path;
            const zipEntryPath = zipPath ? `${zipPath}/${entry.name}` : entry.name;

            if (entry.isDirectory) {
                await this.addToZip(zip, fullPath, zipEntryPath);
            } else {
                const content = await this.readFile(fullPath);
                zip.file(zipEntryPath, content);
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface FileChangeEvent {
    path: string;
    type: 'created' | 'modified' | 'deleted';
}

// ─────────────────────────────────────────────────────────────
// Welcome content
// ─────────────────────────────────────────────────────────────

const WELCOME_CONTENT = `# Welcome to MIMI Workspace! 🚀

**MIMI Tech AI** - Your Browser-Based Development Environment

## Getting Started

This workspace is powered by MIMI Tech AI's virtual filesystem.
All your files are stored locally in your browser using OPFS.

### Features:
- ✅ **Persistent Storage** - Files survive browser reload
- ✅ **100% Offline** - Works without internet
- ✅ **Privacy First** - Your code never leaves your device
- ✅ **Fast** - Local storage, zero latency

### Quick Start:
1. Create a new file in the file tree
2. Write your code
3. Press "Run" to execute

### Need Help?
Ask MIMI in the chat panel! 💬

---
© 2026 MIMI Tech AI. All rights reserved.
https://mimitechai.com
`;

// ─────────────────────────────────────────────────────────────
// Singleton instance
// ─────────────────────────────────────────────────────────────

let filesystemInstance: MimiFilesystem | null = null;

/**
 * Get the singleton filesystem instance
 */
export function getMimiFilesystem(): MimiFilesystem {
    if (!filesystemInstance) {
        filesystemInstance = new MimiFilesystem();
    }
    return filesystemInstance;
}

/**
 * Reset filesystem instance (for testing)
 */
export function resetFilesystem(): void {
    filesystemInstance = null;
}

export type { FileEntry, FileChangeEvent, FileSystemConfig };
