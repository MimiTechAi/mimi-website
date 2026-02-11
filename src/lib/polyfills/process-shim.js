// Process polyfill for browser environment
// Required for @xenova/transformers which calls Object.keys(process.env)
(function () {
    if (typeof window !== 'undefined') {
        window.process = window.process || {
            env: {},
            browser: true,
            version: '',
            versions: {},
            platform: 'browser',
            release: {},
            config: {},
            cwd: function () { return '/'; },
            nextTick: function (fn) { setTimeout(fn, 0); }
        };
    }
    if (typeof globalThis !== 'undefined' && !globalThis.process) {
        globalThis.process = window.process;
    }
})();
