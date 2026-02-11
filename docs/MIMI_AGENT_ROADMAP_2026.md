# 🚀 MIMI Agent — Roadmap & Expertenanalyse 2026

> **Erstellt:** 2026-02-10  
> **Status:** Aktive Analyse  
> **Ziel:** MIMI zum SOTA Local-First AI Agent upgraden

---

## 📊 Aktuelle Diagnose

### ✅ Was schon funktioniert
| Feature | Status | Bewertung |
|---------|--------|-----------|
| Chat (Phi-3.5 mini) | ✅ Funktional | ⭐⭐⭐ Gut |
| RAG (Dokumentensuche) | ✅ Funktional | ⭐⭐⭐ Gut |
| Python-Ausführung (Pyodide) | ✅ Funktional | ⭐⭐⭐⭐ Sehr gut |
| Tool-Loop (3 Iterationen) | ✅ Funktional | ⭐⭐⭐ Gut |
| Voice Input/Output | ✅ Web Speech API | ⭐⭐ Basis |
| Agent-Orchestrierung | ✅ 10 Spezialisten | ⭐⭐⭐ Gut |
| Skills System | ✅ 7 builtin Skills | ⭐⭐⭐ Gut |

### 🔴 Vision — Diagnose der Probleme

**Aus den Browser-Logs:**
```
dtype not specified for "encoder_model". Using the default dtype (q8) for this device (wasm).
dtype not specified for "decoder_model_merged". Using the default dtype (q8) for this device (wasm).
```

**Problem 1: WASM statt WebGPU**
- Vision-Engine nutzt `@huggingface/transformers` mit WASM-Backend
- WASM ist 30-100x langsamer als WebGPU für Inference
- Kein GPU-Acceleration für die Bildanalyse

**Problem 2: Falsches Modell (vit-gpt2-image-captioning)**
- `Xenova/vit-gpt2-image-captioning` ist ein ~80MB Modell aus 2022
- Generiert nur 1-Satz englische Captions ("a cat sitting on a couch")
- Keine echte Bildverständnis-Fähigkeit
- Kein VQA (Visual Question Answering)
- Kein OCR
- Kein Bounding Box Detection

**Problem 3: Vision-Ergebnis nicht in Chat integriert**
- Vision-Analyse landet nur als `chatHistoryRef.current.push()` Message
- Der LLM (Phi-3.5) bekommt den Vision-Output NICHT als Kontext
- Agent-Routing ignoriert Bild-Kontext (kein Vision-Agent in Klassifikation)
- Das Capability Chip "Bildanalyse" triggert ein Upload, aber der Agent verarbeitet das Ergebnis nicht intelligent

**Problem 4: Keine `analyze_image` Tool-Integration**
- `analyze_image` ist in `executeToolCall()` implementiert (L610-623)
- ABER es fehlt in `TOOL_DEFINITIONS` (wurde auskommentiert, L75-76)
- `setToolContext()` im Engine Hook setzt kein `analyzeImage` (L80-93)
- → Der Agent kann Vision NICHT als Tool aufrufen

---

## 🏗️ Verbesserungsplan — 4 Phasen

### Phase 1: Vision Fix (Kritisch, Sprint 1) ✅ ABGESCHLOSSEN

#### 1.1 Upgrade auf SmolVLM / Florence-2 (WebGPU) ✅

**SOTA 2026 Empfehlung:** Ersetze `vit-gpt2-image-captioning` durch ein echtes VLM:

| Modell | Größe | Fähigkeiten | WebGPU | Browser-Ready |
|--------|-------|-------------|--------|---------------|
| **SmolVLM-Instruct** | ~500MB | VQA, Captioning, Chat über Bilder | ✅ | ✅ Transformers.js |
| **Florence-2-base** | ~450MB | OCR, Captioning, Object Detection, Grounding | ✅ | ✅ Transformers.js |
| **Moondream2** | ~1.6GB | VQA, Captioning, Chat | ✅ | ✅ Experimentell |
| **Phi-3.5-vision** | ~4.2GB | Volles VLM, OCR, Charts, Multi-Frame | ✅ | ✅ WebLLM |

**Empfehlung:** 
- **Primär: SmolVLM-Instruct** — Bestes Preis-Leistungs-Verhältnis für Browser
- **Fallback: Florence-2** — Robuster, guter OCR, kleinere Größe
- **Premium-Option: Phi-3.5-vision via WebLLM** — Wenn User Premium will

```typescript
// NEU: vision-engine.ts — Upgrade
import { pipeline, env } from '@huggingface/transformers';

// WebGPU-First Strategy
env.backends.onnx.wasm.proxy = false;
env.backends.onnx.webgpu = true; // ← CRITICAL: WebGPU aktivieren!

// SmolVLM für echtes Bildverständnis
this.pipeline = await pipeline(
    'image-text-to-text',  // Multimodal Pipeline!
    'HuggingFaceTB/SmolVLM-Instruct',
    { 
        device: 'webgpu',  // GPU-Acceleration!
        dtype: 'q4f16',    // 4-bit Quantization für Speed
    }
);
```

#### 1.2 Vision als Tool in Agent-Loop integrieren ✅

```typescript
// tool-definitions.ts — Tool wieder aktivieren
{
    name: 'analyze_image',
    description: 'Analysiert ein hochgeladenes Bild und beantwortet Fragen dazu',
    parameters: [
        { name: 'question', type: 'string', description: 'Frage zum Bild', required: true }
    ],
    handler: 'analyzeImage'
},

// useMimiEngine.ts — Tool Context erweitern
engineRef.current.setToolContext({
    executePython: async (code) => { ... },
    searchDocuments: async (query, limit) => { ... },
    analyzeImage: async (question) => {     // ← NEU
        const visionEngine = getVisionEngine();
        if (!visionEngine.ready) throw new Error('Vision nicht geladen');
        const result = await visionEngine.askAboutImage(
            vision.uploadedImage!, question
        );
        return result.answer;
    },
});
```

#### 1.3 Bild-Kontext an LLM übergeben ✅

```typescript
// inference-engine.ts — generate() erweitern
// Nach RAG-Enrichment:
if (this.agentOrchestrator.context.imageContext) {
    const imgCtx = `\n\n🖼️ **Aktuelles Bild:**\n${this.agentOrchestrator.context.imageContext}\n`;
    enrichedMessages = enrichedMessages.map(m =>
        m === lastUserMessage
            ? { ...m, content: imgCtx + m.content }
            : m
    );
}
```

---

### Phase 2: Multimodal Upgrade (Sprint 2) ✅ ABGESCHLOSSEN

#### 2.1 Unified Multimodal Pipeline ✅

**Ziel:** Ein einziges VLM das Text + Bild versteht (statt separate Modelle)

```
AKTUELL:                          NEU (SOTA 2026):
┌─────────────────┐              ┌─────────────────────────┐
│ Phi-3.5 (Text)  │              │ Phi-3.5-vision (WebLLM) │
│ 3.8B via WebGPU │              │ 4.2B via WebGPU         │
└────────┬────────┘              │ Text + Bild unified     │
         │                       └────────────┬────────────┘
┌────────┴────────┐                           │
│ vit-gpt2 (Bild) │              ┌────────────┴────────────┐
│ 80MB via WASM   │              │ Florence-2 (Spezialist) │
│ ❌ Kein VQA     │              │ OCR, Detection, Ground  │
└─────────────────┘              │ On-Demand Lazy-Load     │
                                 └─────────────────────────┘
```

**Option A: WebLLM Phi-3.5-vision (Empfohlen für M4 MacBook)**
- Einziges Modell für Text UND Bild
- Nativ multimodal, kein Umweg über separate Vision-Engine
- ~4.2GB, passt in 16GB RAM mit WebGPU
- Braucht WebLLM Integration statt WebLLM + Transformers.js

**Option B: Dual-Model mit SmolVLM + Phi-3.5 (Konservativ)**
- Beibehaltung der aktuellen Architektur
- SmolVLM lazy-load bei Bild-Upload
- Phi-3.5 mini für Text-Chat
- Geringerer RAM-Verbrauch

#### 2.2 OCR als Killer-Feature ✅

SmolVLM bietet VQA-basiertes OCR im Browser — kein Cloud-API nötig:

```typescript
// Neue Capability: OCR aus Bildern
const ocrPipeline = await pipeline(
    'image-to-text',
    'Xenova/florence-2-base',
    { task: 'OCR', device: 'webgpu' }
);

const ocrResult = await ocrPipeline(imageUrl, {
    task: '<OCR>',
    max_new_tokens: 512
});
// → Extrahierter Text aus dem Bild, direkt nutzbar
```

#### 2.3 Bild-zu-Code Pipeline ✅

Ein Differenziator vs. Claude/ChatGPT: Bild → Python-Analyse:

```
User lädt Bild hoch (z.B. Diagramm, Tabelle)
    → SmolVLM/Florence-2 analysiert Bild
    → Agent erkennt: "Das ist ein Balkendiagramm mit Umsatzdaten"
    → Agent schreibt automatisch Python-Code zur Reproduktion
    → Pyodide führt Code aus → Matplotlib-Chart
    → User bekommt interaktives Chart back!
```

---

### Phase 3: Inference-Upgrade (Sprint 3) ✅ ABGESCHLOSSEN

#### 3.1 Modell-Upgrade — SOTA 2026 ✅

**Stand 2026:** Transformers.js v4 Preview ist verfügbar mit:
- Neues C++ WebGPU Runtime (deutlich schneller)
- Über 200 Modell-Architekturen
- MoE (Mixture of Experts) Support
- GPU-Operator-Optimierungen
- ~60 tok/s auf M4 Pro für GPT-OSS 20B (q4f16)

```json
// package.json — Upgrade
{
    "@huggingface/transformers": "^4.0.0-preview"
}
```

#### 3.2 Modell-Upgrade Pfade ✅

| Modell | Parameter | Status | Fähigkeiten |
|--------|-----------|--------|-------------|
| **Phi-3.5 mini** (legacy) | 3.8B | ✅ Verfügbar | Text, CoT, Tools |
| **Phi-4 mini** (default) | 3.8B | ✅ **NEU** | Bestes Reasoning |
| **Qwen 2.5 1.5B** (balanced) | 1.5B | ✅ **NEU** | Bestes Deutsch, Code |
| **Phi-3.5-vision** (premium) | 4.2B | ✅ **NEU** | Multimodal VLM |
| **Llama 3.2 1B** (fast) | 1B | ✅ Verfügbar | Ultraschnell |

**Empfehlung:**
- Default: **Qwen 2.5 3B** (bestes Deutsch + Code)
- Fallback Low-RAM: **Gemma 3 1B** (schnell, effizient)
- Premium: **Phi-4 mini** oder **Llama 3.2 3B**

#### 3.3 KV-Cache Reuse & Speculative Decoding

```typescript
// Neue Performance-Features
const config = {
    // KV-Cache Reuse: Spart ~40% bei Follow-up Fragen
    kvCacheReuse: true,
    
    // Speculative Decoding: Draft-Model (1B) + Verify-Model (3B)
    speculativeDecoding: {
        draftModel: 'Gemma-3-1B',
        verifyModel: 'Qwen-2.5-3B',
        // → 2-3x Speedup bei gleicher Qualität
    },
    
    // Continuous Batching für Multi-Turn
    continuousBatching: true,
};
```

---

### Phase 4: Competitive Parity (Sprint 4)

#### 4.1 MIMI vs. Claude/ChatGPT — Feature-Matrix

| Feature | Claude 3.5 | ChatGPT-4o | **MIMI (Aktuell)** | **MIMI (Ziel)** |
|---------|-----------|-----------|-------------------|----------------|
| Text Chat | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Vision/Bild | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ (kaputt) | ⭐⭐⭐⭐ |
| Code Execution | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| RAG/Dokumente | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Privatsphäre** | ❌ Cloud | ❌ Cloud | ✅ **100% Lokal** | ✅ **100% Lokal** |
| **Offline** | ❌ | ❌ | ✅ | ✅ |
| **Kosten** | $20/mo | $20/mo | **GRATIS** | **GRATIS** |
| Web Search | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Multi-Agent | ❌ | ❌ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Voice | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |

**MIMIs Killer-Features (USPs der keiner hat):**
1. **100% Lokal** → Keine Daten verlassen den Browser
2. **Gratis** → Keine Abo-Kosten
3. **Offline** → Funktioniert ohne Internet
4. **Multi-Agent Swarm** → 10+ Spezialisten-Agenten
5. **PWA** → Installierbar wie App, kein App Store nötig

#### 4.2 Neue Features für Competitive Edge

**4.2.1 Canvas / Artifacts (wie Claude)**
- Persistente Code-Artefakte die man bearbeiten kann
- Side-by-Side Editor + Chat
- Versionierung von generierten Dokumenten

**4.2.2 Computer Use / Screen Understanding**
- Screenshot-Analyse via Vision Engine
- DOM-Manipulation Vorschläge
- UI-Debugging Hilfe

**4.2.3 MCP (Model Context Protocol) Integration**
- Anbindung an externe Tools (GitHub, Jira, etc.)
- Browser Extension als MCP Client
- Lokale Dateisystem-Integration via OPFS

**4.2.4 Agent-to-Agent Collaboration**
- Der Orchestrator koordiniert mehrere Agenten parallel
- Data Analyst → Chart → Creative Writer → Report
- Automatische Delegation bei komplexen Aufgaben

---

## 🎯 Quick-Fix: Vision sofort reparieren

### Schritt 1: `vision-engine.ts` — WebGPU + besseres Modell

```typescript
// Priority Fix: WebGPU aktivieren + SmolVLM laden
private async doInit(onProgress?: (status: string) => void): Promise<void> {
    const { pipeline, env } = await import('@huggingface/transformers');
    
    // WebGPU FIRST (30-100x schneller als WASM!)
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    
    // Versuche WebGPU
    try {
        this.pipeline = await pipeline(
            'image-text-to-text',
            'HuggingFaceTB/SmolVLM-256M-Instruct', // Smallest but smart
            {
                device: 'webgpu',
                dtype: 'q4f16',
                progress_callback: (p) => {
                    if (p.status === 'progress' && p.progress) {
                        onProgress?.(`Lade Vision: ${Math.round(p.progress)}%`);
                    }
                }
            }
        );
        this.pipelineType = 'vlm';
    } catch (e) {
        // Fallback auf Florence-2 mit WASM
        this.pipeline = await pipeline(
            'image-to-text',
            'Xenova/florence-2-base-ft',
            { progress_callback: ... }
        );
        this.pipelineType = 'captioning';
    }
}
```

### Schritt 2: `useMimiVision.ts` — Ergebnis an Orchestrator übergeben

```typescript
// Nach der Analyse: Bild-Kontext an Orchestrator
const orchestrator = getOrchestrator();
orchestrator.updateContext({
    imageContext: result.description
});
```

### Schritt 3: `useMimiEngine.ts` — analyzeImage Tool wiring

```typescript
engineRef.current.setToolContext({
    executePython: ...,
    searchDocuments: ...,
    analyzeImage: async (question: string) => {
        const visionEngine = getVisionEngine();
        if (!visionEngine.ready) {
            await visionEngine.init();
        }
        const result = await visionEngine.askAboutImage(
            vision.uploadedImage!, question
        );
        return result.answer;
    },
});
```

---

## 📅 Timeline

| Phase | Timeframe | Aufwand | Status |
|-------|-----------|---------|-----------|
| **Phase 1: Vision Fix** | 1-2 Wochen | ~20h | ✅ FERTIG (10. Feb 2026) |
| **Phase 2: Multimodal** | 2-3 Wochen | ~40h | ✅ FERTIG (10. Feb 2026) |
| **Phase 3: Inference** | 2-4 Wochen | ~30h | ✅ FERTIG (10. Feb 2026) |
| **Phase 4: Competitive** | Ongoing | ~60h | 🟢 In Arbeit |

---

## 🔗 Referenzen & SOTA 2026

- [Transformers.js v4 Preview](https://huggingface.co/docs/transformers.js) — Neues C++ WebGPU Runtime
- [WebLLM](https://github.com/nicedream1/web-llm) — OpenAI-kompatible API im Browser
- [SmolVLM](https://huggingface.co/HuggingFaceTB/SmolVLM-Instruct) — Kompaktes VLM für Browser
- [Florence-2](https://huggingface.co/microsoft/Florence-2-base-ft) — OCR + Detection im Browser
- [WebGPU Cross-Browser Support](https://caniuse.com/webgpu) — Jan 2026: Chrome, Firefox, Safari, Edge
- [Phi-3.5-vision via WebLLM](https://huggingface.co/microsoft/Phi-3.5-vision-instruct) — Volles VLM

---

*Erstellt von MIMI Experten-Team · Feb 2026*
