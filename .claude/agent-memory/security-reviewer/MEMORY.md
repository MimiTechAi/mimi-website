# Security Reviewer Memory - MIMI Tech AI

## Project Overview
- Next.js 16 website with internal employee portal and MIMI AI agent
- Auth via next-auth with CredentialsProvider (JWT strategy)
- MIMI agent runs LLM inference in-browser (WebLLM/Pyodide/QuickJS)
- Contact form uses Resend API for email
- No middleware.ts for route protection
- .env*.local is gitignored

## Key Security Findings (2026-02-13)
- CRITICAL: Hardcoded bcrypt hash for "password123" in auth.ts and login route
- CRITICAL: Login route returns static "demo-jwt-token" string
- HIGH: XSS via dangerouslySetInnerHTML with browserContent (unsanitized HTML from LLM)
- HIGH: Email HTML injection in contact form (user input directly in HTML template)
- HIGH: Python code execution escape via triple-quote injection in code-executor.ts
- MEDIUM: new Function() in tool-definitions.ts calculator
- MEDIUM: No CSRF protection on API routes
- MEDIUM: No rate limiting on contact/newsletter/auth endpoints
- MEDIUM: No Content-Security-Policy header (only SVG CSP for images)
- LOW: In-memory data stores (chat messages, connected clients) - DoS risk
- INFO: Wiki API trusts client-sent userRole for authorization

## File Paths
- Auth: src/lib/auth.ts
- Login API: src/app/api/internal/auth/login/route.ts
- Chat API: src/app/api/internal/chat/route.ts
- Contact API: src/app/api/contact/route.ts
- MIMI page: src/app/mimi/page.tsx
- Code executor: src/lib/mimi/code-executor.ts
- JS runtime: src/lib/mimi/workspace/runtimes/javascript.ts (QuickJS - secure)
- Tool definitions: src/lib/mimi/tool-definitions.ts
- Security headers: next.config.ts (lines 120-134)
