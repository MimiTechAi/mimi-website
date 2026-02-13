/**
 * MIMI PWA - Inference Worker V2.0
 * 
 * Läuft auf separatem Thread für non-blocking KI-Inferenz.
 * 
 * V2 Upgrade:
 * - Multimodal Support: Text + Bild via image_url content blocks
 * - Phi-3.5-vision: Unified VLM für Text und Bildverständnis
 * - OpenAI-kompatible API für alle WebLLM-Modelle
 */

import * as webllm from "@mlc-ai/web-llm";

let engine: webllm.MLCEngine | null = null;
let currentModelId: string | null = null;

// Worker Message Handler
self.onmessage = async (e: MessageEvent) => {
    const { type, payload, id } = e.data;

    try {
        switch (type) {
            case "INIT":
                await initializeEngine(payload.modelId);
                break;

            case "GENERATE":
                await generateResponse(id, payload.messages, payload.temperature, payload.maxTokens);
                break;

            case "TERMINATE":
                if (engine) {
                    await engine.unload();
                    engine = null;
                    currentModelId = null;
                }
                self.postMessage({ type: "TERMINATED" });
                break;
        }
    } catch (error) {
        self.postMessage({
            type: "ERROR",
            id,
            payload: { message: error instanceof Error ? error.message : "Unbekannter Fehler" }
        });
    }
};

/**
 * Monkey-patches GPUAdapter.prototype.requestDevice to inject maximum
 * compute limits. WebLLM v0.2.80 internally calls detectGPUDevice() which
 * does NOT request maxComputeInvocationsPerWorkgroup — it defaults to 256,
 * but Phi-3.5-vision needs 1024. This patch intercepts all requestDevice
 * calls and merges in the adapter's maximum supported compute limits.
 *
 * Returns a cleanup function to restore the original method.
 */
function patchWebGPULimits(): () => void {
    if (typeof GPUAdapter === 'undefined') {
        console.warn('[Worker] GPUAdapter not available, skipping patch');
        return () => { };
    }

    const originalRequestDevice = GPUAdapter.prototype.requestDevice;

    GPUAdapter.prototype.requestDevice = function (
        this: GPUAdapter,
        descriptor?: GPUDeviceDescriptor
    ): Promise<GPUDevice> {
        const patchedDescriptor: GPUDeviceDescriptor = {
            ...descriptor,
            requiredLimits: {
                ...descriptor?.requiredLimits,
                // Inject max compute limits from this adapter's capabilities
                maxComputeInvocationsPerWorkgroup:
                    this.limits.maxComputeInvocationsPerWorkgroup,
                maxComputeWorkgroupSizeX:
                    this.limits.maxComputeWorkgroupSizeX,
                maxComputeWorkgroupSizeY:
                    this.limits.maxComputeWorkgroupSizeY,
                maxComputeWorkgroupSizeZ:
                    this.limits.maxComputeWorkgroupSizeZ,
            },
        };

        console.log(
            `[Worker] Patched requestDevice — maxComputeInvocationsPerWorkgroup=${this.limits.maxComputeInvocationsPerWorkgroup}`
        );

        return originalRequestDevice.call(this, patchedDescriptor);
    };

    return () => {
        GPUAdapter.prototype.requestDevice = originalRequestDevice;
    };
}

/**
 * Initialisiert die WebLLM Engine
 *
 * Wir patchen GPUAdapter.requestDevice BEVOR WebLLM seine eigene Engine
 * erstellt, damit das intern erstellte GPU-Device die maximalen Compute-Limits
 * bekommt (z.B. 1024 invocations statt dem Default 256).
 */
async function initializeEngine(modelId: string): Promise<void> {
    const startTime = Date.now();

    // Patch adapter.requestDevice so WebLLM's internal detectGPUDevice()
    // creates a device with max compute limits
    const restorePatch = patchWebGPULimits();

    try {
        engine = await webllm.CreateMLCEngine(modelId, {
            initProgressCallback: (progress) => {
                self.postMessage({
                    type: "INIT_PROGRESS",
                    payload: {
                        progress: progress.progress,
                        text: progress.text,
                        timeElapsed: (Date.now() - startTime) / 1000
                    }
                });
            },
            logLevel: "SILENT",
        });
    } finally {
        // Always restore original method, even if init fails
        restorePatch();
    }

    currentModelId = modelId;
    self.postMessage({ type: "READY" });
}

/**
 * Prüft ob das aktuelle Modell multimodal ist (Vision)
 */
function isVisionModel(): boolean {
    return currentModelId?.toLowerCase().includes('vision') || false;
}

/**
 * Konvertiert Messages für multimodale Modelle
 * Wenn ein Bild-Kontext in der Nachricht enthalten ist UND das Modell Vision unterstützt,
 * wird das Bild als image_url content block eingefügt.
 */
function prepareMessages(
    messages: Array<{ role: string; content: string }>
): webllm.ChatCompletionMessageParam[] {
    if (!isVisionModel()) {
        // Text-only: Direkt durchreichen
        return messages as webllm.ChatCompletionMessageParam[];
    }

    // Multimodal: Suche nach Bild-Referenzen und konvertiere zu image_url blocks
    return messages.map(msg => {
        // Prüfe ob die Nachricht eine Bild-Referenz enthält (base64 data URL)
        const base64Match = msg.content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);

        if (base64Match && msg.role === 'user') {
            // Extrahiere den Text ohne die base64-URL
            const textContent = msg.content.replace(base64Match[0], '').trim();

            return {
                role: msg.role as any,
                content: [
                    {
                        type: "image_url" as const,
                        image_url: { url: base64Match[0] }
                    },
                    {
                        type: "text" as const,
                        text: textContent || "Beschreibe dieses Bild."
                    }
                ]
            } as any;
        }

        return msg as webllm.ChatCompletionMessageParam;
    });
}

/**
 * Generiert Antwort mit Streaming (Text + optional Multimodal)
 */
async function generateResponse(
    id: string,
    messages: Array<{ role: string; content: string }>,
    temperature: number,
    maxTokens: number
): Promise<void> {
    if (!engine) {
        throw new Error("Engine nicht initialisiert");
    }

    // Prepare messages (multimodal conversion if vision model)
    const preparedMessages = prepareMessages(messages);

    // Streaming Response
    const stream = await engine.chat.completions.create({
        messages: preparedMessages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
        stream_options: { include_usage: true }
    });

    // Token für Token senden
    for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
            self.postMessage({
                type: "TOKEN",
                id,
                payload: content
            });
        }
    }

    self.postMessage({ type: "DONE", id });
}

// TypeScript für Web Worker
export { };
