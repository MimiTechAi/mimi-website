---
name: ui-design
description: UI/UX-Design, Farbschemata, Layout-Konzepte und CSS-Architektur
version: "1.0"
author: MIMI Tech AI
agents: ["design-agent"]
triggers:
  - design
  - ui
  - ux
  - farbe
  - layout
  - css
  - style
  - animation
---

# UI Design Skill

## Design-System Grundlagen

### Farbpaletten

#### Premium Dark Theme
```css
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #1a1a2e;
  --bg-card: rgba(255, 255, 255, 0.05);
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --accent-primary: #6366f1;
  --accent-secondary: #8b5cf6;
  --accent-gradient: linear-gradient(135deg, #6366f1, #8b5cf6);
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;
  --border: rgba(255, 255, 255, 0.1);
  --glass: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
}
```

#### Premium Light Theme
```css
[data-theme="light"] {
  --bg-primary: #fafafa;
  --bg-secondary: #ffffff;
  --bg-card: rgba(0, 0, 0, 0.02);
  --text-primary: #1a1a2e;
  --text-secondary: rgba(0, 0, 0, 0.6);
}
```

### Glassmorphism
```css
.glass-card {
  background: var(--glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Micro-Animations
```css
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(99, 102, 241, 0.2);
}

.glow-pulse {
  animation: glowPulse 2s ease-in-out infinite;
}
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
  50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.5); }
}
```

### Typography
```css
/* System: Inter / SF Pro */
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-feature-settings: 'liga' 1, 'kern' 1;
}

.heading-xl { font-size: 3rem; font-weight: 800; letter-spacing: -0.02em; }
.heading-lg { font-size: 2rem; font-weight: 700; letter-spacing: -0.01em; }
.heading-md { font-size: 1.5rem; font-weight: 600; }
.body-lg { font-size: 1.125rem; line-height: 1.7; }
.body-md { font-size: 1rem; line-height: 1.6; }
.caption { font-size: 0.875rem; color: var(--text-secondary); }
```

### Responsive Breakpoints
```css
/* Mobile First */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

## Barrierefreiheit (WCAG 2.1 AA)
- Kontrastverhältnis ≥ 4.5:1 für Text
- Fokus-Indikatoren sichtbar
- `prefers-reduced-motion` respektieren
- Semantisches HTML nutzen
- `aria-label` für Icon-Buttons
