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
 * Initialisiert die WebLLM Engine
 * 
 * WICHTIG: Wir erstellen das GPU-Device SELBST mit maximalen Compute-Limits,
 * da der Default (256 workgroup invocations) für größere Modelle nicht reicht.
 * Phi-3.5-vision braucht z.B. 1024 invocations pro Workgroup.
 */
async function initializeEngine(modelId: string): Promise<void> {
    const startTime = Date.now();

    // Request GPU device with maximum compute limits
    let gpuDevice: GPUDevice | undefined;
    try {
        const adapter = await navigator.gpu?.requestAdapter();
        if (adapter) {
            // Request device with adapter's maximum supported limits
            gpuDevice = await adapter.requestDevice({
                requiredLimits: {
                    maxComputeInvocationsPerWorkgroup: adapter.limits.maxComputeInvocationsPerWorkgroup,
                    maxComputeWorkgroupSizeX: adapter.limits.maxComputeWorkgroupSizeX,
                    maxComputeWorkgroupSizeY: adapter.limits.maxComputeWorkgroupSizeY,
                    maxComputeWorkgroupSizeZ: adapter.limits.maxComputeWorkgroupSizeZ,
                    maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
                    maxBufferSize: adapter.limits.maxBufferSize,
                }
            });
            console.log(`[Worker] GPU Device created with maxComputeInvocations=${gpuDevice.limits.maxComputeInvocationsPerWorkgroup}`);
        }
    } catch (e) {
        console.warn('[Worker] Could not create GPU device with max limits, using WebLLM defaults:', e);
    }

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
        ...(gpuDevice ? { gpuDevice } : {})
    });

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
