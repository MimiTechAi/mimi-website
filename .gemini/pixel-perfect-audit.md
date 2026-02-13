# 🔍 MIMI Agent — Pixel-Perfect Audit: Referenz vs. IST-Zustand
## Analyse wie durch ein 10-köpfiges Entwicklerteam
### Stand: 13. Februar 2026

---

## 📐 Methodik
- **Referenz-Bild:** Das vom User bereitgestellte Manus-AI-Mockup (mit Beispiel-Chat, Code-Blöcken, gefülltem Browser, Terminal, etc.)
- **IST-Zustand:** Screenshot von `localhost:3000/mimi` (Loading-State, 3-Panel-Layout)
- **Prüfung:** Jeder einzelne Bereich, jeder Winkel, jedes Detail

---

## ═══════════════════════════════════════════════════════════
## 1. GLOBALES LAYOUT & FRAME
## ═══════════════════════════════════════════════════════════

### 1.1 Äußerer Rahmen (Viewport-Border-Glow)

| Detail | Referenz | IST-Zustand | Status | Fix nötig |
|--------|----------|-------------|--------|-----------|
| Border-Glow Farbe | **Neon-Blau/Cyan** `#00b4ff` bis `#0066ff`, dezenter äußerer Schein | ✅ Ähnlicher blauer Glow vorhanden | ⚠️ FAST | Glow ist bei uns stärker/heller als Referenz. Referenz hat subtileren, dünneren Rahmen-Schein |
| Border-Typ | **Kein sichtbarer solid Border**, nur Shadow/Glow (~3-4px weich) | Bei uns: 1px solid + Glow | ❌ FALSCH | Entferne solid Border, nur `box-shadow: 0 0 20px rgba(0,180,255,0.15)` |
| Hintergrund hinter Panels | `#050508` bis `#080a12` (tiefes Schwarz-Blau) | ✅ Stimmt | ✅ OK | — |
| Padding des Outer-Wrap | Ca. `12px` rundherum (sehr eng) | `16px 14px 12px` | ⚠️ LEICHT | Auf `12px` gleichmäßig ändern |
| Ambient Light Leaks | Referenz: **Violett/Lila Glow links-mitte** (ca. 30% vom linken Rand), KEIN Glow rechts oben | Wir haben 4 Glows (glow-1 bis glow-4) teils anders positioniert | ⚠️ ANPASSEN | Referenz hat genau EINEN violett-lila Nebel links-mitte, leicht nach unten versetzt |

### 1.2 Ambient Licht / Nebel-Effekte (hinter Panels)

| Detail | Referenz (exakt) | Wie implementieren |
|--------|------------------|-------------------|
| Lila/Violett-Nebel | Position: links bei ~20-35% horizontal, ~40-60% vertikal. Farbe: `rgba(120, 30, 180, 0.08)`. Größe: ~400×300px, blur 80px | `.glow-1 { left: 20%; top: 40%; background: radial-gradient(rgba(120,30,180,0.08), transparent); filter: blur(80px) }` |
| Zweiter Nebel | Leichter blauer Schimmer oben-mitte (kaum sichtbar) | `.glow-2 { left: 40%; top: -5%; rgba(0,100,200,0.04) }` |
| Kein Nebel rechts | Rechts gibt es KEINEN Glow in der Referenz | `glow-3` entfernen oder unsichtbar machen |
| Kein Nebel unten | Unten gibt es KEINEN Glow | `glow-4` entfernen |

---

## ═══════════════════════════════════════════════════════════
## 2. TOP LABELS (Panel-Überschriften)
## ═══════════════════════════════════════════════════════════

| Detail | Referenz | IST-Zustand | Status |
|--------|----------|-------------|--------|
| Sichtbarkeit | **KEINE sichtbaren Top-Labels** — die Panel-Titel stehen IN den Panels, nicht darüber | Bei uns: `TASK LIST & HISTORY`, `INTELLIGENCE CHAT`, `AGENT COMPUTER` als separate Zeile ÜBER den Panels | ❌ **STRUKTURFEHLER** |
| Fix | Referenz hat keinen separaten Label-Bereich über dem Grid. Der Bereich "Virtual Sandbox" steht ALS HEADER IM rechten Panel selbst | `.mimi-top-labels` entfernen oder `display: none` setzen. Panel-Titel werden INNERHALB des jeweiligen Panels angezeigt |

---

## ═══════════════════════════════════════════════════════════
## 3. LINKES PANEL — Task-Liste / Conversation History
## ═══════════════════════════════════════════════════════════

### 3.1 Panel-Abmessungen & Styling

| Detail | Referenz | IST | Fix |
|--------|----------|-----|-----|
| Breite | Ca. **240px** (etwas breiter als bei uns) | `220px` | Auf `240px` ändern |
| Border-Radius | **12px** (sanfter als bei uns) | `16px` | Auf `12px` ändern |
| Background | `rgba(10, 12, 22, 0.7)` — teildurchsichtig, dunkler als Referenz-Mitte | `rgba(8,10,20,0.65)` — ähnlich | ⚠️ Leicht heller machen auf `0.75` |
| Border | Referenz: `1px solid rgba(255,255,255,0.06)` — kaum sichtbar | `rgba(255,255,255,0.07)` | ✅ OK |
| Box-Shadow | Referenz: Leichter Schwarz-Schatten, KEIN blauer Glow auf dem Panel selbst | Wir haben `0 0 60px rgba(0,150,255,0.02)` | Entferne den blauen Glow-Shadow |

### 3.2 „M" Logo + Search Box

| Detail | Referenz | IST | Status |
|--------|----------|-----|--------|
| Logo „M" | Quadrat mit `border-radius: 8px`, **Gradient-Border** (Cyan → Lila → Pink) | ✅ Stimmt — `linear-gradient(135deg, #00d4ff, #a855f7, #ec4899)` | ✅ OK |
| Logo-Größe | Ca. 32×32px | `32px` | ✅ OK |
| Search-Box | Referenz: Dunkler Input, `🔍 Search` als Placeholder, **rechts vom Logo** in derselben Zeile | ✅ Stimmt | ✅ OK |
| Search-Box Höhe | Ca. **32px** | `30px` | Auf `32px` |
| Search-Box Background | `rgba(255,255,255,0.04)` — leicht heller als Panel | `rgba(255,255,255,0.03)` | Auf `0.04` |
| Search-Icon Farbe | Grau `rgba(255,255,255,0.25)` | `rgba(255,255,255,0.2)` | Auf `0.25` |

### 3.3 Conversation-Einträge (Referenz hat 3 Einträge)

| Detail | Referenz (exakt) | IST | Fix nötig |
|--------|------------------|-----|-----------|
| **Eintrag 1 (aktiv)** | `Project 'Chimera' Research` + `Today, 10:45 AM` — **blauer linker Rand** (3px cyan `#00c8ff`), Background `rgba(0,150,255,0.08)` | Wir zeigen "Starten Sie Ihre erste Konversation" (Empty State) | ✅ OK (Empty State korrekt wenn keine Convs). Aber: Der **aktive Eintrag** braucht einen linken Cyan-Balken |
| Aktiver Eintrag - Left Border | `border-left: 3px solid #00c8ff` | ❌ Fehlt | CSS: `.conv-entry.active { border-left: 3px solid #00c8ff; background: rgba(0,150,255,0.08); }` |
| **Eintrag 2** | `Code Optimization` + `Yesterday, 4:30 PM` — inaktiv, kein Border | — | Styling für inaktive Einträge: nur Hover-Effekt |
| **Eintrag 3** | `Data Analysis Task` + `Mar 14` — inaktiv | — | — |
| Schriftgröße Titel | **13px**, `font-weight: 500`, weiß `rgba(255,255,255,0.9)` | — | Implementieren |
| Schriftgröße Datum | **11px**, `rgba(255,255,255,0.35)` | — | Implementieren |
| Grüner Online-Punkt | Referenz hat einen grünen Punkt (●) links vom Titel des aktiven Eintrags | ❌ Fehlt | `::before { content: ''; width: 6px; height: 6px; background: #22c55e; border-radius: 50%; }` |
| Abstand zwischen Einträgen | Ca. `2px` (sehr eng, fast keine Gap) | — | `gap: 2px` oder `margin-bottom: 2px` |
| Padding pro Eintrag | `12px 14px` | — | Implementieren |

### 3.4 Footer (User-Bereich unten)

| Detail | Referenz | IST | Fix |
|--------|----------|-----|-----|
| Footer-Position | Ganz unten fixiert mit `margin-top: auto` | ✅ Ähnlich | ✅ OK |
| Footer-Inhalt Referenz | Links: ⚙️ Settings-Icon. Rechts: NICHTS. Der Footer ist minimal! | Bei uns: User-Info mit Avatar „N", Name, Status-Icons | ⚠️ Referenz ist minimaler — nur Settings-Gear-Icon unten links |
| Settings-Icon | ⚙️ Zahnrad, `rgba(255,255,255,0.3)`, ca. 18px, unten-links | Bei uns: User-Card unten | ⚠️ Referenz hat nur Gear-Icon, kein User-Card. Aber beides ist vertretbar |

---

## ═══════════════════════════════════════════════════════════
## 4. MITTLERES PANEL — Intelligence Chat
## ═══════════════════════════════════════════════════════════

### 4.1 Agent Status Bar (oben im Chat)

| Detail | Referenz (exakt) | IST | Fix |
|--------|------------------|-----|-----|
| Position | Zentriert oben im Chat-Panel, **schwebend** mit eigenem Background | ✅ Ähnlich — Status-Pille oben zentriert | ⚠️ ANPASSEN |
| Text | `AGENT STATUS:` (grau, 10px, tracking) + `Researching... 12.3s` (weiß, 12px) | `AGENT STATUS:` + `Loading... 0%` | ✅ Richtig formatiert (dynamisch) |
| Background | **Dunkles Pill-Shape** mit `background: rgba(0,0,0,0.5)`, `border: 1px solid rgba(255,255,255,0.1)`, `border-radius: 20px`, `padding: 6px 20px` | Ähnlich vorhanden | ⚠️ Vergleichen |
| Spinner/Indikator rechts | Referenz: **Kreisförmiger Spinner** (SVG/CSS) rechts neben dem Text, weiß/cyan, dreht sich | Bei uns: Pulsierender Punkt links | ❌ **FALSCH**: Referenz hat Spinner RECHTS, wir haben Punkt LINKS |
| Gradient-Schimmer | Referenz: Über der Status-Bar ist ein **horizontaler Gradient-Schimmer** (Cyan → Lila → Pink → transparent), ca. 60% Breite, 4px hoch | ⚠️ Teilweise vorhanden | Muss genau stimmen: `linear-gradient(90deg, transparent, #00c8ff, #a855f7, #ec4899, transparent)` |
| Gradient-Position | Referenz: Der Schimmer ist ÜBER der Status-Pille, nicht Teil davon — separat frei schwebend | — | Separates `::before` Element mit absoluter Positionierung |

### 4.2 Chat-Nachrichten (Referenz zeigt 3 Nachrichten)

#### 4.2.1 User-Nachricht (rechts)

| Detail | Referenz | IST | Fix |
|--------|----------|-----|-----|
| Alignment | **Rechtsbündig** — Nachricht schwebt rechts | Bei uns: Normal linksbündig oder zentriert | ❌ Prüfen — User-Nachrichten müssen rechts sein |
| Background | `rgba(255,255,255,0.06)` — leicht heller als Chat-BG | — | Implementieren |
| Border | `1px solid rgba(255,255,255,0.1)` | — | Implementieren |
| Border-Radius | `12px 12px 4px 12px` (unten-rechts flach = "Sprechblasen-Ecke") | — | Implementieren |
| Max-Width | Ca. `65-70%` der Chat-Breite | — | `max-width: 70%` |
| Avatar | **User-Avatar** (runder Kopf-Icon, 28px) **rechts** neben der Nachricht | — | Kleiner Avatar-Circle rechts |
| Schrift | `13px`, `rgba(255,255,255,0.9)`, `line-height: 1.5` | — | Implementieren |
| Padding | `12px 16px` | — | Implementieren |

#### 4.2.2 Agent-Nachricht (links) — MIT Code-Block

| Detail | Referenz (exakt) | IST | Fix |
|--------|------------------|-----|-----|
| Alignment | **Linksbündig** — Nachricht schwebt links | — | Prüfen |
| Avatar | Runder **Agent-Avatar** (🤖 oder Kreis mit Gradient) **links** neben der Nachricht, `28px` | — | Implementieren |
| Background | `rgba(0, 150, 255, 0.04)` — ganz leichter Blau-Hauch | — | Implementieren |
| Border | `1px solid rgba(0, 180, 255, 0.12)` — **dezent Cyan** | — | ❌ Aktuell fehlt Cyan-Border auf Agent-Messages |
| Border-Radius | `12px 12px 12px 4px` (unten-links flach = Agent-Seite) | — | Implementieren |
| Embedded Code-Block | Referenz zeigt ein **Python Code-Snippet** MIT: | | |
| → Header-Zeile | **3 Punkte** (🔴🟡🟢) links oben + Copy-Icon (📋) rechts oben | ❌ Fehlt | Implementieren: `.code-block-header { display: flex; gap: 4px }` mit 3 farbigen Dots |
| → 3 Dots Farben | Rot `#ff5f57`, Gelb `#ffbd2e`, Grün `#27c93f` — jeweils 8px Kreise | — | CSS Dots implementieren |
| → Copy-Button | Clipboard-Icon rechts oben im Code-Header, `rgba(255,255,255,0.3)` | — | Button mit Clipboard-SVG |
| → Code Background | `rgba(0,0,0,0.35)` — dunkler als Nachricht | — | Implementieren |
| → Code Font | `JetBrains Mono`, `12px`, Syntax-Highlighting (kein echtes, aber farbiger Text) | — | Font-Family setzen + farbige Keywords |
| → Code Border | `1px solid rgba(255,255,255,0.08)`, `border-radius: 8px` | — | Implementieren |
| → Python Highlighting | `import` = lila, `pandas` = weiß, `as` = lila, `pd` = weiß, Strings in grün | — | Einfaches Regex-basiertes Highlighting oder Highlight.js |

#### 4.2.3 Agent-Nachricht 2 (mit Bullet-Liste)

| Detail | Referenz | Fix |
|--------|----------|-----|
| Inhalt | Bullet-Liste mit **fett markierten** Begriffen: `• **Cloud Services Expansion**: 25% YoY` | Schon via formatContent() implementiert — prüfen ob `<strong>` korrekt rendered |
| Bullet-Punkt | Runder Punkt `•`, Indent `16px`, normaler Fließtext danach | CSS: `ul { list-style: disc; padding-left: 16px; }` |
| Fett-Text | `**text**` → `<strong>` mit `font-weight: 600` | ✅ Sollte via formatContent() funktionieren |

### 4.3 Chat-Eingabebereich (Input Bar)

| Detail | Referenz | IST | Fix |
|--------|----------|-----|-----|
| Position | **Fixiert unten** im Chat-Panel, schwebend | ✅ Ähnlich | ⚠️ Check |
| Background | `rgba(10, 15, 25, 0.8)` — dunkler als Chat-BG | Ähnlich | OK |
| Border | `1px solid rgba(255,255,255,0.08)` | Ähnlich | OK |
| Border-Radius | **24px** (Pill-Shape) | — | Prüfen |
| Placeholder | `Type a message...` (Englisch in Referenz) | `Initializing...` | ⚠️ Dynamisch: Loading → "Type a message..." |
| Attachment-Icon links | 📎 Büroklammer (oder Paperclip-SVG), `rgba(255,255,255,0.3)` | ✅ Vorhanden | OK |
| Send-Button rechts | **Blauer Kreis** (Gradient: `#0088ff` → `#00c8ff`), 36px, mit Pfeil-Icon ➤ (weiß) | ✅ Ähnlich | ⚠️ Prüfe ob Gradient korrekt |
| Avatar links | Referenz zeigt **kleinen User-Avatar** (28px) links NEBEN dem Input | ❌ Fehlt bei uns | Avatar-Circle links vom Input hinzufügen |
| Input-Höhe | Ca. `44px` Gesamt (Input selbst `36px` + Padding) | — | Prüfen |
| Disclaimer-Text | `Type a message...` — KEIN separater Disclaimer sichtbar in Referenz | Bei uns: "MIMI kann Fehler machen..." | ⚠️ Referenz hat keinen Disclaimer |

---

## ═══════════════════════════════════════════════════════════
## 5. RECHTES PANEL — Virtual Sandbox / Agent Computer
## ═══════════════════════════════════════════════════════════

### 5.1 Panel-Header

| Detail | Referenz | IST | Fix |
|--------|----------|-----|-----|
| Titel | **`Virtual Sandbox`** (groß, weiß, 15px, `font-weight: 500`) — INNERHALB des Panels | `Agent Computer` + "AGENT COMPUTER" als Top-Label | ❌ Umbenennen zu `Virtual Sandbox` |
| Titel-Position | Ganz oben IM Panel, Padding `14px 16px` | — | Implementieren |
| Control-Buttons | Referenz: **KEINE Minimize/Maximize Buttons sichtbar** | Bei uns: ⊖ und ⊕ Buttons | ❌ Entfernen — Referenz hat keine Window-Controls im Sandbox-Header |

### 5.2 Tab-System

| Detail | Referenz | IST | Fix |
|--------|----------|-----|-----|
| Tab-Reihenfolge | `Browser` · `Terminal` · `Editor` · `Files` | ✅ Gleich | ✅ OK |
| Tab-Icons | 🌐 Browser, ⬛ Terminal, ✏️ Editor, 📁 Files | ✅ Ähnlich | ✅ OK |
| Aktiver Tab | Referenz: **Hellerer Text** + **cyanfarbene Unterlinie** (2px), KEIN Background-Change | — | CSS: `.tab.active { color: #fff; border-bottom: 2px solid #00c8ff; }` ohne Background-Änderung |
| Inaktive Tabs | `rgba(255,255,255,0.4)`, kein Underline | — | OK |
| Tab-Spacing | `gap: 0`, Tabs berühren sich fast, nur Text-Abstand | — | `gap: 4px` maximal |
| Tab-Zeile Background | Referenz: Leichte Border-Bottom-Linie unter der gesamten Tab-Row | — | `border-bottom: 1px solid rgba(255,255,255,0.06)` |

### 5.3 Browser-Tab (aktiv in Referenz)

| Detail | Referenz (exakt) | IST | Fix |
|--------|------------------|-----|-----|
| Address-Bar | **3 Dots** (🔴🟡🟢 traffic lights, 8px) links + `🔒 Financial` als "URL" + Tab-Titel | Bei uns: `○ ○ ○ 🔒 mimi-agent.local` | ⚠️ Traffic-Light-Dots fehlen (sind grau bei uns statt farbig) |
| Light-Dots Farben | `#ff5f57` (rot), `#ffbd2e` (gelb), `#27c93f` (grün), je 10px, Kreise | Wir haben graue ○ ○ ○ | ❌ Muss farbig sein |
| Browser-Inhalt | Referenz: **Echtes Webseiten-Preview** — "TechNova's Q4 Earnings Exceed Expectations" mit Bild, Text, Layout | Bei uns: Leerer Platzhalter "Browser bereit..." | ⚠️ OK für Loading-State, aber brauchen Web-Preview wenn Agent arbeitet |
| Preview-Rendering | Referenz zeigt: Bild (Büro-Meeting), Headline (fett, 16px), Subtext | — | `iframe` oder gerenderte HTML-Vorschau im Browser-Tab |

### 5.4 Terminal-Tab

| Detail | Referenz (exakt) | IST | Fix |
|--------|------------------|-----|-----|
| Background | Referenz: **Sehr dunkel** `#0a0c14` | — | OK |
| Zeilen-Inhalt | Referenz zeigt 4 Zeilen: | | |
| Zeile 1 | `[MIMUS-AI]: Accessing external database...` (cyan prefix, weiß text) | — | Format stimmt |
| Zeile 2 | `[TARUS-AI]: Retrieving financial records...` (grün prefix) | — | Verschiedene Agent-Prefixes in verschiedenen Farben |
| Zeile 3 | `[MIMUS-AI]: Running data analysis script...` | — | — |
| Zeile 4 | `[NIDBS-AI]: Generating report....` | — | — |
| Prefix-Farbe | Referenz: **Jeder Agent hat eigene Farbe** — Cyan, Grün, gelb, etc. | Bei uns: Enheitlich | ❌ Multi-Color-Prefixes implementieren |
| Font | `JetBrains Mono`, `11px`, `line-height: 1.6` | — | Prüfen |
| Cursor-Blinker | Referenz: Kein blinkender Cursor sichtbar | — | — |

### 5.5 Editor-Tab

| Detail | Referenz (exakt) | IST | Fix |
|--------|------------------|-----|-----|
| **File-Tabs** | Referenz: Horizontale Tab-Leiste mit: `analysis.py ×` · `config.json` · `report.md` | Bei uns: Monaco Editor ohne File-Tabs | ❌ **File-Tab-Bar fehlt** |
| Tab-Styling | Aktiver Tab: Hellerer BG `rgba(255,255,255,0.06)`, weißer Text. Inaktive: Dunkler, `rgba(255,255,255,0.4)` | — | File-Tab-Komponente implementieren |
| Tab-Close-Button | `×` Button rechts neben dem aktiven Tab-Titel | — | Implementieren |
| Code-Inhalt | Referenz: Python-Code mit Syntax-Highlighting (farbig) | ✅ Monaco Editor vorhanden | ✅ OK |
| Editor-Theme | Referenz: Dark Background, Grün für Strings, Lila für Keywords, Weiß für Identifiers | ✅ Monaco `vs-dark` | ✅ OK |
| Zeilennummern | Referenz: KEINE Zeilennummern sichtbar | Monaco zeigt Zeilennummern | ⚠️ Monaco: `lineNumbers: 'off'` setzen |

### 5.6 Files-Tab

| Detail | Referenz (exakt) | IST | Fix |
|--------|------------------|-----|-----|
| Datei-Baum-Ansicht | Referenz zeigt **hierarchischen Dateibaum**: | | |
| Root-Ordner | `📁 Project_Chimera` | — | TreeView-Komponente |
| Sub-Ordner 1 | `  ▸ 📁 data` (collapsible) | — | |
| Sub-Ordner 2 | `  ▸ 📁 scripts` | — | |
| Datei | `  📄 output` | — | |
| Icons | 📁 für Ordner, 📄 für Dateien — jeweils mit eigenem Icon | — | File-Icons implementieren |
| Indent | Referenz: `20px` Einrückung pro Level, vertikale Linien | — | CSS mit `border-left: 1px solid rgba(255,255,255,0.08)` |
| Expand/Collapse | `▸`/`▾` Pfeil-Icons für Ordner | — | Toggle-Logik |

### 5.7 PROGRESS STEPS (unten im rechten Panel)

| Detail | Referenz (exakt) | IST | Fix |
|--------|------------------|-----|-----|
| Sektion-Titel | **`PROGRESS STEPS`** — Uppercase, `8px`, Tracking `3px`, `rgba(255,255,255,0.3)` | `PROGRESS STEPS` | ✅ OK |
| Position | Fixiert am unteren Rand des rechten Panels, eigener Bereich mit `border-top` | Am unteren Rand | ✅ Ähnlich |
| Background | Referenz: Eigenes dunkleres BG `rgba(5,8,15,0.6)`, `border: 1px solid rgba(255,255,255,0.06)`, `border-radius: 10px` | — | ❌ Progress Steps brauchen eigenes Card-BG |
| **Step 1** | `✅ 1. Data Collection (Done)` — Grünes Häkchen (✓), Titel weiß, status `(Done)` grün | `✓ 1. System Initialization (Pending)` | ⚠️ Format stimmt, Farben anpassen |
| Done-Status Farbe | **Grün** `#22c55e` für Häkchen und "(Done)" Text | — | CSS: `.step-done { color: #22c55e; }` |
| **Step 2** | `🔵 2. Analysis & Processing (Active – 85%)` — **Blauer pulsierender Ring** + Prozent-Anzeige + **Cyan-Highlight** auf gesamter Zeile | Kein Prozent-Indikator | ❌ Active Step braucht: Pulsierender Kreis + Prozent + Highlight-BG |
| Active-Zeile-BG | `rgba(0,150,255,0.08)` — Gesamte Zeile leuchtet leicht cyan | — | CSS: `.step-active { background: rgba(0,150,255,0.08); border: 1px solid rgba(0,180,255,0.2); border-radius: 8px; }` |
| Active-Indikator | Pulsierender Ring (animierter `border: 2px solid #00c8ff` mit Glow) | — | CSS-Animation: `@keyframes pulse-ring { box-shadow: 0 0 0 2px rgba(0,200,255,0.3) }` |
| **Step 3** | `⭕ 3. Report Generation (Pending)` — Leerer Kreis, Text grau `rgba(255,255,255,0.3)` | `○ 2. Ready for Tasks (Pending)` | ⚠️ Format OK, Farbe anpassen |
| Pending-Text Farbe | `rgba(255,255,255,0.35)` (deutlich gedimmt) | — | Implementieren |

---

## ═══════════════════════════════════════════════════════════
## 6. GRID-PROPORTIONEN (KRITISCH!)
## ═══════════════════════════════════════════════════════════

| Detail | Referenz | IST | Fix |
|--------|----------|-----|-----|
| Grid-Aufteilung | **Links: ~240px, Mitte: ~50%, Rechts: ~35%** | `220px 1fr 1fr` (50/50 für Mitte+Rechts) | ❌ **FALSCH** — Mitte ist GRÖSSER als Rechts! |
| Korrekte Grid-Definition | `grid-template-columns: 240px 1.4fr 1fr` | `220px 1fr 1fr` | Ändern auf `240px 1.4fr 1fr` |
| Gap zwischen Panels | Ca. `6px` | `4px` | Auf `6px` ändern |
| Rechtes Panel Breite | Ca. **340-360px** (schmaler als Chat, aber mit reichem Inhalt) | `1fr` (halbe Breite) | Wird durch `1.4fr/1fr` korrigiert |

---

## ═══════════════════════════════════════════════════════════
## 7. FARB-PALETTE (exakte Werte)
## ═══════════════════════════════════════════════════════════

| Element | Farbe (Referenz) | CSS-Variable Vorschlag |
|---------|-----------------|----------------------|
| Haupt-Background | `#050508` → `#080a12` | `--bg-base: #060810` |
| Panel-Background | `rgba(10, 12, 22, 0.7)` | `--bg-panel: rgba(10,12,22,0.7)` |
| Cyan/Accent | `#00c8ff` | `--accent-cyan: #00c8ff` |
| Lila/Secondary | `#a855f7` | `--accent-purple: #a855f7` |
| Pink/Tertiary | `#ec4899` | `--accent-pink: #ec4899` |
| Text Primary | `rgba(255,255,255,0.9)` | `--text-primary: rgba(255,255,255,0.9)` |
| Text Secondary | `rgba(255,255,255,0.5)` | `--text-secondary: rgba(255,255,255,0.5)` |
| Text Dimmed | `rgba(255,255,255,0.3)` | `--text-dimmed: rgba(255,255,255,0.3)` |
| Border Default | `rgba(255,255,255,0.06)` | `--border-default: rgba(255,255,255,0.06)` |
| Border Accent | `rgba(0,200,255,0.15)` | `--border-accent: rgba(0,200,255,0.15)` |
| Success Green | `#22c55e` | `--color-success: #22c55e` |
| Error Red | `#ef4444` | `--color-error: #ef4444` |
| Warning Yellow | `#f59e0b` | `--color-warning: #f59e0b` |
| Code-Block BG | `rgba(0,0,0,0.35)` | `--bg-code: rgba(0,0,0,0.35)` |
| Active Item BG | `rgba(0,150,255,0.08)` | `--bg-active: rgba(0,150,255,0.08)` |

---

## ═══════════════════════════════════════════════════════════
## 8. TYPOGRAFIE (exakte Werte)
## ═══════════════════════════════════════════════════════════

| Element | Font | Size | Weight | Color | Letter-Spacing |
|---------|------|------|--------|-------|----------------|
| Panel-Sektions-Label | Inter | 8px | 500 | `rgba(255,255,255,0.2)` | `3px` |
| Panel-Titel (Virtual Sandbox) | Inter | 15px | 500 | `rgba(255,255,255,0.9)` | `0` |
| Conversation-Titel | Inter | 13px | 500 | `rgba(255,255,255,0.9)` | `0` |
| Conversation-Datum | Inter | 11px | 400 | `rgba(255,255,255,0.35)` | `0` |
| Agent Status Text | Inter | 12px | 500 | `#fff` | `0` |
| Agent Status Label | Inter | 10px | 500 | `rgba(255,255,255,0.4)` | `1px` |
| Chat-Message Text | Inter | 13px | 400 | `rgba(255,255,255,0.9)` | `0` |
| Code-Block | JetBrains Mono | 12px | 400 | Syntax-Colors | `0` |
| Tab-Label | Inter | 12px | 500 | `rgba(255,255,255,0.5)` | `0` |
| Tab-Label (aktiv) | Inter | 12px | 500 | `#fff` | `0` |
| Progress Step Text | Inter | 12px | 400 | `rgba(255,255,255,0.7)` | `0` |
| Progress Step (Done) | Inter | 12px | 500 | `#22c55e` | `0` |
| Terminal | JetBrains Mono | 11px | 400 | `rgba(255,255,255,0.85)` | `0` |
| Input Placeholder | Inter | 13px | 400 | `rgba(255,255,255,0.3)` | `0` |

---

## ═══════════════════════════════════════════════════════════
## 9. ANIMATIONEN & MICRO-INTERACTIONS
## ═══════════════════════════════════════════════════════════

| Animation | Referenz-Beschreibung | CSS-Implementierung |
|-----------|----------------------|---------------------|
| Status-Bar Spinner | Kreisförmiger Spinner rechts neben Status-Text, 16px, weiß/cyan, dreht sich | `@keyframes spin { 100% { transform: rotate(360deg); } }` mit SVG-Circle |
| Gradient-Schimmer | Horizontaler Farbverlauf-Balken über der Status-Pille, Cyan→Lila→Pink, shimmer-Animation | `background-size: 200% 100%; animation: shimmer 3s infinite;` |
| Progress Step Pulse | Aktiver Step hat pulsierenden Ring | `@keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(0,200,255,0.3); } 50% { box-shadow: 0 0 0 6px rgba(0,200,255,0); } }` |
| Hover auf Conv-Eintrag | Background wird leicht heller, smooth | `transition: background 0.2s; &:hover { background: rgba(255,255,255,0.04); }` |
| Hover auf Tabs | Text wird heller | `transition: color 0.15s; &:hover { color: rgba(255,255,255,0.8); }` |
| Send-Button Hover | Leichter Glow-Effekt, Button wird heller | `transition: all 0.2s; &:hover { box-shadow: 0 0 12px rgba(0,200,255,0.3); }` |
| Message-Einblendung | Referenz: Messages faden sanft ein (opacity 0→1, translateY 8px→0) | `@keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } }` |

---

## ═══════════════════════════════════════════════════════════
## 10. ZUSAMMENFASSUNG — KRITISCHE DELTA-LISTE
## ═══════════════════════════════════════════════════════════

### 🔴 KRITISCH (Muss sofort gefixt werden)

| # | Problem | Fix-Aufwand |
|---|---------|-------------|
| K1 | **Grid-Proportionen falsch**: `1fr 1fr` → Mitte und Rechts gleich breit, Referenz hat Mitte GRÖSSER | `grid-template-columns: 240px 1.4fr 1fr` — 1 Zeile CSS |
| K2 | **Top-Labels existieren als separate Zeile** — Referenz hat sie NICHT | `.mimi-top-labels { display: none }` + Header IN die Panels |
| K3 | **Status-Bar Spinner rechts statt pulsierender Punkt links** | SVG-Spinner-Komponente erstellen, rechts neben Text |
| K4 | **Traffic-Light-Dots grau statt farbig** im Browser-Tab | CSS: farbige Kreise `#ff5f57`, `#ffbd2e`, `#27c93f` |
| K5 | **Gradient-Schimmer-Balken** über Status-Bar fehlt | CSS `::before` mit `linear-gradient(90deg, transparent, #00c8ff, #a855f7, #ec4899, transparent)` |
| K6 | **Sandbox-Titel**: "Agent Computer" → **"Virtual Sandbox"** | Text umbenennen |
| K7 | **File-Tabs im Editor fehlen** | `analysis.py × | config.json | report.md` Tab-Leiste |
| K8 | **User-Nachrichten rechts, Agent-Nachrichten links** mit Avataren | Chat-Bubble-Alignment + Avatar-Circles |
| K9 | **Code-Block Header** mit 3 farbigen Dots + Copy-Button fehlt | `.code-block-header` mit Dots + Copy-Icon |
| K10 | **Aktiver Conv-Eintrag** braucht linken Cyan-Balken | `border-left: 3px solid #00c8ff` |

### 🟡 MITTEL (Soll gefixt werden)

| # | Problem | Fix-Aufwand |
|---|---------|-------------|
| M1 | Panel `border-radius`: `16px` → `12px` | 1 Zeile CSS |
| M2 | Left Panel Breite: `220px` → `240px` | 1 Zeile CSS |
| M3 | Panel-Gap: `4px` → `6px` | 1 Zeile CSS |
| M4 | Progress Steps brauchen eigene Card mit Border | ~5 Zeilen CSS |
| M5 | Active Step: Pulsierender Ring + Prozent + Highlight | CSS animation + JSX |
| M6 | Glow-Effekte: glow-3 und glow-4 entfernen, glow-1 anpassen | CSS Cleanup |
| M7 | Datum-Label Disclaimer unter Input entfernen (Referenz hat keinen) | JSX entfernen |
| M8 | Files-Tab: Hierarchischer Dateibaum statt Flat-List | TreeView-Komponente |
| M9 | Window-Controls (⊖⊕) im Sandbox-Header entfernen | JSX entfernen |
| M10 | Avatar links neben Input-Bar (User-Avatar) | JSX hinzufügen |

### 🟢 NICE-TO-HAVE (Polishing)

| # | Problem |
|---|---------|
| N1 | Verschiedenfarbige Terminal-Prefixes (Multi-Agent) |
| N2 | Monaco-Editor: Zeilennummern ausblenden |
| N3 | Conversation-Einträge: Grüner Online-Punkt |
| N4 | Message-Einblend-Animation (fadeInUp) |
| N5 | Send-Button Hover-Glow |

---

## 📋 Implementierungs-Reihenfolge

**Phase 1 (CSS-Only Fixes — 15 min):**
K1, K2, K4, K6, M1, M2, M3, M6, M7, M9

**Phase 2 (JSX-Anpassungen — 30 min):**
K3, K5, K8, K9, K10, M4, M5, M10

**Phase 3 (Neue Komponenten — 45 min):**
K7, M8

**Phase 4 (Polish — 20 min):**
N1-N5
