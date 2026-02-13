# Deployment Guide

> **Version:** 2.0 | **Updated:** 2026-02-13

---

## Production Build

```bash
npm run build
```

This runs `next build` with Turbopack. The output is optimized with:
- Tree shaking and dead code elimination
- Advanced bundle splitting (vendor, radix, framer-motion, common chunks)
- Console removal in production
- AVIF/WebP image auto-negotiation

---

## Vercel (Primary)

The project deploys to Vercel from the `main` branch.

**Settings:**
- **Framework:** Next.js (auto-detected)
- **Build command:** `next build`
- **Node version:** 20.x
- **Region:** Auto (Edge)

### Environment Variables on Vercel

Set these in Vercel dashboard under Settings > Environment Variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXTAUTH_SECRET` | Yes | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Your production URL (e.g., `https://www.mimitechai.com`) |
| `RESEND_API_KEY` | Yes | For contact form email delivery |
| `CONTACT_TO_EMAIL` | No | Default: `info@mimitechai.com` |
| `CONTACT_FROM_EMAIL` | No | Must be a verified domain in Resend |
| `GOOGLE_ANALYTICS_ID` | No | Google Analytics measurement ID |

### Deployment Flow

1. Push to `main` branch
2. Vercel auto-deploys
3. Preview deployments are created for pull requests

---

## Self-Hosting

### Requirements

- Node.js 20.x runtime
- HTTPS (required for WebGPU and Service Workers)
- Ability to set custom HTTP headers

### Docker (Example)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

### Required Security Headers

The AI model and Python runtime require `SharedArrayBuffer`, which needs Cross-Origin Isolation headers on **every response**:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These are configured in `next.config.ts` and apply automatically when using `npm start`. For reverse proxies (Nginx, Caddy, etc.), you must add them manually.

**Nginx example:**
```nginx
server {
    listen 443 ssl;
    server_name mimitechai.com;

    add_header Cross-Origin-Opener-Policy "same-origin" always;
    add_header Cross-Origin-Embedder-Policy "require-corp" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Caddy example:**
```
mimitechai.com {
    header Cross-Origin-Opener-Policy "same-origin"
    header Cross-Origin-Embedder-Policy "require-corp"
    header X-Content-Type-Options "nosniff"
    header X-Frame-Options "SAMEORIGIN"
    reverse_proxy localhost:3000
}
```

---

## Static Export

The app can be exported as static HTML for CDN hosting, but with limitations:
- API routes (`/api/*`) will not function
- Contact form and authentication will not work
- AI model loading and inference still works (all client-side)

```bash
# Add to next.config.ts: output: 'export'
npm run build
# Output in `out/` directory
```

For static hosts (Netlify, GitHub Pages, Cloudflare Pages), configure the COOP/COEP headers in the platform's header configuration.

**Netlify `_headers` file:**
```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

---

## Performance Monitoring

The app includes:
- **Vercel Analytics** (`@vercel/analytics`) -- Automatic Web Vitals
- **Google Analytics** -- Custom events for MIMI usage tracking
- **Custom MIMI analytics** (`src/lib/mimi/analytics.ts`) -- Tracks model loading, first message, code execution, etc.

### Key Metrics to Monitor

| Metric | Target | Source |
|--------|--------|--------|
| LCP | < 2.5s | Vercel Analytics |
| FID | < 100ms | Vercel Analytics |
| CLS | < 0.1 | Vercel Analytics |
| Model load time | < 30s (cold), < 5s (cached) | Custom analytics |
| First message latency | < 3s | Custom analytics |

---

## Troubleshooting

### Build fails with memory error

Increase Node.js heap size:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### CORS errors on external resources

The `Cross-Origin-Embedder-Policy: require-corp` header blocks cross-origin resources that do not include a `Cross-Origin-Resource-Policy` header. For external images, use the Next.js Image component which proxies them through `/_next/image`.

If you need to load external scripts or resources, add `crossOrigin="anonymous"` and ensure the remote server sends appropriate CORS headers.

### Service Worker caching issues

The app registers a Service Worker (`public/sw.js`). To force-update during development:
1. Open Chrome DevTools > Application > Service Workers
2. Check "Update on reload"
3. Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
