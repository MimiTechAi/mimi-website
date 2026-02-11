/// <reference types="vite/client" />

// Extend import.meta for Vite-specific properties
interface ImportMeta {
    readonly glob: <T = any>(
        pattern: string,
        options?: { eager?: boolean; query?: string; as?: string }
    ) => Record<string, T>;
}
