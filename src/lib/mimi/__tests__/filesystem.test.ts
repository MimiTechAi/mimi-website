/**
 * MIMI Tech AI - Filesystem Tests
 * 
 * Unit tests for OPFS virtual filesystem.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { MimiFilesystem, resetFilesystem } from '../workspace/filesystem';

// Mock OPFS API for Node.js testing environment
const mockFileSystem = new Map<string, string | 'DIR'>();

const mockDirectoryHandle = (path: string): FileSystemDirectoryHandle => ({
    kind: 'directory',
    name: path.split('/').pop() || 'root',

    async getFileHandle(name: string, options?: { create?: boolean }) {
        const filePath = `${path}/${name}`;

        if (mockFileSystem.has(filePath) && mockFileSystem.get(filePath) !== 'DIR') {
            return mockFileHandle(filePath);
        }

        if (options?.create) {
            mockFileSystem.set(filePath, '');
            return mockFileHandle(filePath);
        }

        throw new Error('File not found');
    },

    async getDirectoryHandle(name: string, options?: { create?: boolean }) {
        const dirPath = `${path}/${name}`;

        if (mockFileSystem.get(dirPath) === 'DIR') {
            return mockDirectoryHandle(dirPath);
        }

        if (options?.create) {
            mockFileSystem.set(dirPath, 'DIR');
            return mockDirectoryHandle(dirPath);
        }

        throw new Error('Directory not found');
    },

    async removeEntry(name: string) {
        const entryPath = `${path}/${name}`;
        mockFileSystem.delete(entryPath);
    },

    async *entries() {
        const prefix = path === '' ? '' : `${path}/`;

        for (const [key, value] of mockFileSystem.entries()) {
            if (key.startsWith(prefix)) {
                const relativePath = key.slice(prefix.length);
                const parts = relativePath.split('/');

                if (parts.length === 1) {
                    const name = parts[0];
                    const isDir = value === 'DIR';

                    yield [name, isDir ? mockDirectoryHandle(key) : mockFileHandle(key)] as [
                        string,
                        FileSystemDirectoryHandle | FileSystemFileHandle
                    ];
                }
            }
        }
    }
} as unknown as FileSystemDirectoryHandle);

const mockFileHandle = (path: string): FileSystemFileHandle => ({
    kind: 'file',
    name: path.split('/').pop() || 'file',

    async getFile() {
        const content = mockFileSystem.get(path) || '';
        return {
            text: async () => content,
            arrayBuffer: async () => new TextEncoder().encode(content as string).buffer,
            size: (content as string).length,
            lastModified: Date.now()
        } as unknown as File;
    },

    async createWritable() {
        return {
            async write(data: string | ArrayBuffer) {
                mockFileSystem.set(path, typeof data === 'string' ? data : 'binary');
            },
            async close() { },
            async abort() { }
        } as unknown as FileSystemWritableFileStream;
    }
} as unknown as FileSystemFileHandle);

// Mock navigator.storage (jsdom has navigator but not navigator.storage)
Object.defineProperty(navigator, 'storage', {
    writable: true,
    configurable: true,
    value: {
        getDirectory: async () => {
            mockFileSystem.clear();
            return mockDirectoryHandle('');
        },
        estimate: async () => ({
            usage: 1024,
            quota: 10 * 1024 * 1024 * 1024
        })
    }
});

describe('MimiFilesystem', () => {
    let fs: MimiFilesystem;

    beforeEach(() => {
        resetFilesystem();
        mockFileSystem.clear();
        fs = new MimiFilesystem({ autoInit: false });
    });

    describe('initialize', () => {
        it('should initialize successfully', async () => {
            const result = await fs.initialize();
            expect(result.success).toBe(true);
        });

        it('should create default structure when autoInit is true', async () => {
            fs = new MimiFilesystem({ autoInit: true });
            await fs.initialize();

            expect(await fs.exists('/workspace')).toBe(true);
            expect(await fs.exists('/workspace/README.md')).toBe(true);
        });
    });

    describe('writeFile / readFile', () => {
        beforeEach(async () => {
            await fs.initialize();
        });

        it('should write and read a file', async () => {
            await fs.writeFile('/test.txt', 'Hello MIMI!');
            const content = await fs.readFile('/test.txt');
            expect(content).toBe('Hello MIMI!');
        });

        it('should create parent directories', async () => {
            await fs.writeFile('/a/b/c/file.txt', 'Nested!');
            const content = await fs.readFile('/a/b/c/file.txt');
            expect(content).toBe('Nested!');
        });

        it('should throw on non-existent file', async () => {
            await expect(fs.readFile('/nonexistent.txt')).rejects.toThrow();
        });
    });

    describe('createDirectory', () => {
        beforeEach(async () => {
            await fs.initialize();
        });

        it('should create a directory', async () => {
            await fs.createDirectory('/mydir');
            expect(await fs.exists('/mydir')).toBe(true);
        });

        it('should create nested directories', async () => {
            await fs.createDirectory('/a/b/c');
            expect(await fs.exists('/a/b/c')).toBe(true);
        });
    });

    describe('listDirectory', () => {
        beforeEach(async () => {
            fs = new MimiFilesystem({ autoInit: true });
            await fs.initialize();
        });

        it('should list directory contents', async () => {
            const entries = await fs.listDirectory('/workspace');
            expect(entries.length).toBeGreaterThan(0);
        });

        it('should sort directories before files', async () => {
            await fs.createDirectory('/workspace/testdir');
            await fs.writeFile('/workspace/afile.txt', 'a');

            const entries = await fs.listDirectory('/workspace');
            const dirIndex = entries.findIndex(e => e.name === 'testdir');
            const fileIndex = entries.findIndex(e => e.name === 'afile.txt');

            expect(dirIndex).toBeLessThan(fileIndex);
        });
    });

    describe('deleteFile', () => {
        beforeEach(async () => {
            await fs.initialize();
        });

        it('should delete a file', async () => {
            await fs.writeFile('/todelete.txt', 'bye');
            expect(await fs.exists('/todelete.txt')).toBe(true);

            await fs.deleteFile('/todelete.txt');
            expect(await fs.exists('/todelete.txt')).toBe(false);
        });
    });

    describe('rename', () => {
        beforeEach(async () => {
            await fs.initialize();
        });

        it('should rename a file', async () => {
            await fs.writeFile('/old.txt', 'content');
            await fs.rename('/old.txt', '/new.txt');

            expect(await fs.exists('/old.txt')).toBe(false);
            expect(await fs.readFile('/new.txt')).toBe('content');
        });
    });

    describe('watch', () => {
        beforeEach(async () => {
            await fs.initialize();
        });

        it('should notify on file change', async () => {
            const changes: string[] = [];
            const unsubscribe = fs.watch('/test.txt', (event) => {
                changes.push(`${event.type}:${event.path}`);
            });

            await fs.writeFile('/test.txt', 'first');
            await fs.writeFile('/test.txt', 'second');

            expect(changes).toContain('modified:/test.txt');

            unsubscribe();
        });
    });

    describe('getStorageUsage', () => {
        beforeEach(async () => {
            await fs.initialize();
        });

        it('should return storage info', async () => {
            const usage = await fs.getStorageUsage();
            expect(usage.quota).toBeGreaterThan(0);
            expect(typeof usage.percent).toBe('number');
        });
    });
});
