/**
 * MIMI Tech AI - Package Manager
 * 
 * Manage Python packages via Micropip.
 * 
 * © 2026 MIMI Tech AI. All rights reserved.
 */

import { installPackage } from '@/lib/mimi/code-executor';

export interface PackageInfo {
    name: string;
    version?: string;
    description?: string;
    installed: boolean;
}

const COMMON_PACKAGES: PackageInfo[] = [
    { name: 'numpy', description: 'Scientific computing', installed: true }, // Core
    { name: 'pandas', description: 'Data analysis', installed: true }, // Core
    { name: 'matplotlib', description: 'Plotting library', installed: false },
    { name: 'scipy', description: 'Science & Engineering', installed: false },
    { name: 'scikit-learn', description: 'Machine Learning', installed: false },
    { name: 'requests', description: 'HTTP library (Pyodide version)', installed: false },
    { name: 'beautifulsoup4', description: 'HTML parsing', installed: false },
];

export class PackageManager {
    private installedPackages: Set<string> = new Set(['numpy', 'pandas', 'micropip']);

    async install(name: string, onProgress?: (msg: string) => void): Promise<boolean> {
        const result = await installPackage(name, onProgress);
        if (result.success) {
            this.installedPackages.add(name);
        }
        return result.success;
    }

    isInstalled(name: string): boolean {
        return this.installedPackages.has(name);
    }

    getAllPackages(): PackageInfo[] {
        return COMMON_PACKAGES.map(pkg => ({
            ...pkg,
            installed: this.installedPackages.has(pkg.name)
        }));
    }
}

const instance = new PackageManager();
export function getPackageManager() {
    return instance;
}
