# MIMI Agent 2.0 — UI/UX Design System

> **Stitch Project ID:** `10272626665752350758`
> **Created:** 2026-02-12 · **Status:** ✅ Complete Design System
> **Inspired by:** Manus AI, Genspark, Devin AI, Cursor IDE

---

## 📐 Screen Inventory

| # | Screen Name | Device | Screen ID | Purpose |
|---|---|---|---|---|
| 1 | **Workspace Dashboard** | Desktop | `3ae2576db78b4ebfb3bea2e5da8db8e8` | Main 3-panel AI workspace |
| 2 | **Agent Steps Expanded** | Desktop | `dcbfc48d7f88432cb8d93056dbced316` | Real-time task execution timeline |
| 3 | **Welcome Screen** | Desktop | `1687581fead442cf86ec37b623fb67cd` | First-time / empty state |
| 4 | **Preview Dashboard** | Desktop | `3cc3beb8f6d6419eb34f4a93ee7c6f7b` | Sandbox preview tab with rendered output |
| 5 | **Mobile Chat View** | Mobile | `c452a61e81644c0d868ae082f6b83b25` | iPhone-optimized chat |
| 6 | **Model Loading** | Desktop | `ccc241fc099b479b92d42a73653d0753` | AI model initialization |
| 7 | **Onboarding Tour** | Desktop | `b504e9bf493e41709c17b827c3eaa0f0` | Feature discovery overlay |

---

## 🎨 Design Tokens

### Colors
```css
/* Primary Palette */
--agent-cyan: #00E5FF;
--agent-purple: #8B5CF6;
--agent-cyan-glow: rgba(0, 229, 255, 0.15);
--agent-purple-glow: rgba(139, 92, 246, 0.15);

/* Status Colors */
--status-success: #10B981;
--status-error: #EF4444;
--status-warning: #F59E0B;
--status-info: #3B82F6;
--status-active: #00E5FF;

/* Background System */
--bg-primary: #0a0a0f;
--bg-surface-1: rgba(255, 255, 255, 0.03);
--bg-surface-2: rgba(255, 255, 255, 0.05);
--bg-surface-3: rgba(255, 255, 255, 0.08);
--bg-overlay: rgba(0, 0, 0, 0.70);

/* Text */
--text-primary: rgba(255, 255, 255, 0.95);
--text-secondary: rgba(255, 255, 255, 0.70);
--text-muted: rgba(255, 255, 255, 0.40);

/* Borders */
--border-subtle: rgba(255, 255, 255, 0.08);
--border-default: rgba(255, 255, 255, 0.12);
--border-active: rgba(0, 229, 255, 0.40);
```

### Typography
```css
/* Font Family */
font-family: 'Inter', -apple-system, system-ui, sans-serif;

/* Scale */
--text-xs: 0.75rem;    /* 12px - badges, timestamps */
--text-sm: 0.875rem;   /* 14px - body text */
--text-base: 1rem;     /* 16px - default */
--text-lg: 1.125rem;   /* 18px - message text */
--text-xl: 1.25rem;    /* 20px - section headers */
--text-2xl: 1.5rem;    /* 24px - panel titles */
--text-3xl: 2rem;      /* 32px - page titles */
--text-4xl: 3rem;      /* 48px - hero title */
```

### Glassmorphism
```css
/* Surface Card */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
}

/* Elevated Card */
.glass-elevated {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* Active State */
.glass-active {
  border-color: rgba(0, 229, 255, 0.3);
  box-shadow: 0 0 20px rgba(0, 229, 255, 0.1);
}
```

### Spacing & Layout
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;

/* Panel Widths */
--sidebar-width: 280px;
--sandbox-width: 45%;
--chat-width: flex 1;

/* Border Radius */
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 20px;
--radius-full: 9999px;
--radius-bubble: 24px;
```

---

## 🏗️ Layout Architecture

### Desktop 3-Panel Layout
```
┌─────────────────────────────────────────────────────────┐
│ [Thinking Bar]                                          │
├────────┬──────────────────────┬──────────────────────────┤
│        │                      │                          │
│  LEFT  │       CENTER         │         RIGHT            │
│ 280px  │      flex: 1         │         ~45%             │
│        │                      │                          │
│ History│    Chat Area          │   Sandbox Panel          │
│ Sidebar│                      │   (Files/Terminal/       │
│        │                      │    Preview/DB)           │
│        │                      │                          │
│        ├──────────────────────┤                          │
│        │ [Input Bar]          │                          │
├────────┴──────────────────────┴──────────────────────────┤
```

### Mobile Single-Column
```
┌──────────────────────┐
│ [Header + Tabs]      │
│ [Thinking Bar]       │
├──────────────────────┤
│                      │
│     Chat Area        │
│   (Full Width)       │
│                      │
├──────────────────────┤
│ [Input Bar]          │
└──────────────────────┘
```

---

## 🧩 Component Library

### 1. Thinking Bar
**Location:** Top of center panel  
**Purpose:** Shows agent status, current action, and elapsed time

```
┌─────────────────────────────────────────────────┐
│ 🔵 Agent: Code Specialist · Analysiert Daten... │ ⏱ 8.2s │
└─────────────────────────────────────────────────┘
```

**States:**
- `idle` — Hidden (no animation)
- `thinking` — Animated gradient border (cyan→purple sweep)
- `executing` — Pulsing cyan dot + action text
- `complete` — Fade out with ✅ flash

### 2. Agent Steps Panel
**Location:** Right panel (overlays or replaces sandbox)
**Purpose:** Real-time task execution visualization

**Step States:**
| Icon | State | Style |
|------|-------|-------|
| ✅ | Complete | Green accent, timestamp |
| 🔄 | Active | Cyan glow border, spinner |
| ⏳ | Pending | Gray/dimmed |
| ❌ | Failed | Red accent, error message |

### 3. Sandbox Panel
**Tabs:** Files | Terminal | Preview | Packages | Database

**Files Tab:**
- VS Code-like file tree
- Syntax-highlighted code editor
- File tabs with close buttons

**Terminal Tab:**
- Dark terminal with green text
- Command history
- Status indicators

**Preview Tab:**
- Device viewport toggle (Desktop/Tablet/Mobile)
- URL bar with refresh
- Rendered HTML output

### 4. Message Bubbles
**User:** Right-aligned, gradient bg (purple→cyan), rounded corners
**Agent:** Left-aligned, dark bg, with avatar, rich content support

**Rich Content in Messages:**
- Markdown rendering
- Code blocks with syntax highlighting
- Charts (line, bar, pie)
- Artifact cards (files with actions)
- Tables
- Images

### 5. Capability Badges
**Format:** Small pill-shaped indicators
```
[✓ Chain-of-Thought] [✓ Python] [✓ Dokumente] [○ Sprache] [○ Vision]
```
- Active: Filled with green checkmark
- Inactive: Outlined with gray circle

### 6. Input Bar
**Desktop:** Glassmorphism bar at bottom of chat
```
[📎 PDF] [🖼 Image] | [Text Input...] | [🎤 Mic] [➤ Send]
```

**Mobile:** Full-width, touch-optimized, safe area padding

### 7. Welcome Screen Chips
**Grid:** 2×3 interactive suggestion cards
Each chip: Icon + Title + Subtitle + Glassmorphism card
Hover: Cyan glow border + subtle scale up

---

## 🎭 Animation System

### Thinking Bar
```css
@keyframes gradient-sweep {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.thinking-bar {
  background: linear-gradient(90deg, #00E5FF, #8B5CF6, #00E5FF);
  background-size: 200% 200%;
  animation: gradient-sweep 2s ease infinite;
}
```

### Step Complete
```css
@keyframes step-check {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}
```

### Progress Ring
```css
@keyframes ring-rotation {
  0% { stroke-dashoffset: 283; }
  100% { stroke-dashoffset: calc(283 - (283 * var(--progress) / 100)); }
}
```

### Message Appear
```css
@keyframes message-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Desktop | ≥1280px | 3-panel (sidebar + chat + sandbox) |
| Tablet | 768–1279px | 2-panel (chat + sandbox toggle) |
| Mobile | <768px | Single column chat |

### Mobile Adaptations:
- Sidebar becomes slide-out drawer (hamburger menu)
- Sandbox becomes full-screen overlay
- Agent Steps as bottom sheet
- Touch-friendly targets ≥44px
- Safe area padding (notch-aware)

---

## 🗺️ User Flow Map

```
[Model Loading] → [Welcome Screen] → [Onboarding Tour ×3]
       ↓                 ↓                    ↓
  [Ready State]    [Select Chip]         [Skip/Complete]
       ↓                 ↓                    ↓
                  [Chat + Sandbox]
                       ↓
              [Agent Steps Expand]
                       ↓
              [Preview Dashboard]
                       ↓
              [Export / Download]
```

---

## 📋 Implementation Priority

### Phase 1: Core Layout (Sprint 1)
1. 3-panel responsive layout system
2. Chat interface with message bubbles
3. Input bar with send/mic
4. Thinking bar animation

### Phase 2: Sandbox & Steps (Sprint 2)
5. Sandbox panel with tab system
6. Agent Steps panel component
7. Code editor integration
8. Terminal output display

### Phase 3: Polish & States (Sprint 3)
9. Welcome screen with capability chips
10. Model loading screen
11. Onboarding tour overlay
12. Mobile responsive optimizations

### Phase 4: Advanced Features
13. Preview tab with device viewport
14. Database tab with SQL interface
15. File upload & PDF processing
16. Voice input/output

---

## 🔗 References

- **Manus AI:** 3-panel layout, sandbox computer, task automation
- **Genspark:** Agent steps panel, real-time execution tracking
- **Devin AI:** Code editor integration, terminal, file management
- **Cursor IDE:** Thinking bar, chain-of-thought visibility
- **ChatGPT Canvas:** Side-by-side chat + workspace
- **Claude Artifacts:** Inline code output rendering

---

*© 2026 MIMI Tech AI. All rights reserved.*
