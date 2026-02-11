/**
 * Service Worker Registration
 * Registriert den Service Worker für PWA-Funktionalität
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        console.log('[SW] Service Worker nicht unterstützt');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
        });

        console.log('[SW] Service Worker registriert:', registration.scope);

        // Update Handler
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('[SW] Neue Version verfügbar');
                        // Optional: User benachrichtigen
                    }
                });
            }
        });

        return registration;
    } catch (error) {
        console.error('[SW] Registrierung fehlgeschlagen:', error);
        return null;
    }
}

export async function unregisterServiceWorker(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            await registration.unregister();
            console.log('[SW] Service Worker deregistriert');
            return true;
        }
        return false;
    } catch (error) {
        console.error('[SW] Deregistrierung fehlgeschlagen:', error);
        return false;
    }
}
