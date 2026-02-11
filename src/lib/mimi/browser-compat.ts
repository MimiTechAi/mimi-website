/**
 * Browser Compatibility Checker
 * Detects critical features and provides fallback guidance
 */

export interface BrowserCapabilities {
    webgpu: boolean;
    webworker: boolean;
    indexeddb: boolean;
    webspeech: boolean;
    serviceworker: boolean;
    filereader: boolean;
}

export interface CompatibilityReport {
    compatible: boolean;
    capabilities: BrowserCapabilities;
    warnings: string[];
    blockers: string[];
}

export function checkBrowserCompatibility(): CompatibilityReport {
    const capabilities: BrowserCapabilities = {
        webgpu: 'gpu' in navigator,
        webworker: typeof Worker !== 'undefined',
        indexeddb: 'indexedDB' in window,
        webspeech: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
        serviceworker: 'serviceWorker' in navigator,
        filereader: 'FileReader' in window
    };

    const warnings: string[] = [];
    const blockers: string[] = [];

    // Critical features (MUST HAVE)
    if (!capabilities.webgpu) {
        blockers.push('WebGPU nicht verfügbar - LLM-Inferenz nicht möglich');
        blockers.push('Bitte nutze Chrome/Edge 113+ oder aktiviere WebGPU in den Flags');
    }

    if (!capabilities.webworker) {
        blockers.push('Web Workers nicht verfügbar - Performance stark eingeschränkt');
    }

    if (!capabilities.indexeddb) {
        blockers.push('IndexedDB nicht verfügbar - Dokumente können nicht gespeichert werden');
    }

    // Important features (SHOULD HAVE)
    if (!capabilities.serviceworker) {
        warnings.push('Service Worker nicht verfügbar - PWA Offline-Modus funktioniert nicht');
    }

    if (!capabilities.webspeech) {
        warnings.push('Web Speech API nicht verfügbar - Spracheingabe deaktiviert');
    }

    if (!capabilities.filereader) {
        warnings.push('FileReader API nicht verfügbar - Datei-Upload eingeschränkt');
    }

    const compatible = blockers.length === 0;

    return {
        compatible,
        capabilities,
        warnings,
        blockers
    };
}

/**
 * Get user-friendly browser name
 */
export function getBrowserInfo(): { name: string; version: string } {
    const ua = navigator.userAgent;
    let name = 'Unknown';
    let version = 'Unknown';

    if (ua.indexOf('Edg/') > -1) {
        name = 'Microsoft Edge';
        version = ua.match(/Edg\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Chrome/') > -1) {
        name = 'Google Chrome';
        version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Safari/') > -1 && ua.indexOf('Chrome') === -1) {
        name = 'Safari';
        version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Firefox/') > -1) {
        name = 'Firefox';
        version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Opera/') > -1 || ua.indexOf('OPR/') > -1) {
        name = 'Opera';
        version = ua.match(/(?:Opera|OPR)\/(\d+)/)?.[1] || 'Unknown';
    }

    return { name, version };
}

/**
 * Check if browser is mobile
 */
export function isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get recommended browser message
 */
export function getRecommendedBrowserMessage(): string {
    const browserInfo = getBrowserInfo();

    if (browserInfo.name === 'Google Chrome' || browserInfo.name === 'Microsoft Edge') {
        const version = parseInt(browserInfo.version);
        if (version < 113) {
            return `${browserInfo.name} ${browserInfo.version} ist zu alt. Bitte aktualisiere auf Version 113+`;
        }
    }

    if (browserInfo.name === 'Firefox') {
        return 'Firefox unterstützt WebGPU nur experimentell. Bitte aktiviere in about:config: dom.webgpu.enabled';
    }

    if (browserInfo.name === 'Safari') {
        return 'Safari unterstützt WebGPU nur mit Flags. Empfohlen: Chrome oder Edge 113+';
    }

    return 'Empfohlene Browser: Chrome/Edge 113+';
}

/**
 * Log compatibility report to console
 */
export function logCompatibilityReport(): void {
    const report = checkBrowserCompatibility();
    const browserInfo = getBrowserInfo();

    console.group('🌐 Browser Compatibility Check');
    console.log('Browser:', `${browserInfo.name} ${browserInfo.version}`);
    console.log('Mobile:', isMobile());
    console.log('Compatible:', report.compatible ? '✅' : '❌');

    console.group('Capabilities');
    Object.entries(report.capabilities).forEach(([key, value]) => {
        console.log(`${value ? '✅' : '❌'} ${key}`);
    });
    console.groupEnd();

    if (report.blockers.length > 0) {
        console.group('❌ Blockers');
        report.blockers.forEach(b => console.error(b));
        console.groupEnd();
    }

    if (report.warnings.length > 0) {
        console.group('⚠️ Warnings');
        report.warnings.forEach(w => console.warn(w));
        console.groupEnd();
    }

    console.groupEnd();
}
