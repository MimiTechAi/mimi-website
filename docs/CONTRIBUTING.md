# Contributing Guide

> **Version:** 2.0 | **Updated:** 2026-02-13

Thank you for your interest in contributing to the MIMI Intelligent Workspace.

---

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch from `main`
4. Install dependencies: `npm install`
5. Start the dev server: `npm run dev`

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed setup instructions.

---

## Branch Strategy

- `main` -- Production branch, auto-deploys to Vercel
- Feature branches: `feature/description`
- Bug fixes: `fix/description`
- Documentation: `docs/description`

---

## Making Changes

### Before You Start

1. Check existing issues and PRs to avoid duplicate work
2. For large changes, open an issue first to discuss the approach

### Code Style

- **TypeScript** with strict mode
- **Tailwind CSS** for styling (no custom CSS unless absolutely necessary)
- Use `cn()` from `src/lib/utils.ts` for conditional class names
- Follow existing naming conventions (see [DEVELOPMENT.md](./DEVELOPMENT.md))
- Keep components small and focused

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add image export to ArtifactCard
fix: resolve WebGPU detection on Firefox
docs: update API reference with new tool definitions
refactor: extract voice logic into useMimiVoice hook
test: add E2E tests for document upload flow
```

Prefixes: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`

---

## Testing Requirements

Before submitting a PR:

1. **Unit tests pass:** `npm test`
2. **Lint passes:** `npm run lint`
3. **Build succeeds:** `npm run build`
4. **E2E tests pass** (if you changed UI): `npm run test:e2e`

Add tests for new functionality:
- Unit tests go in `__tests__/` directories next to the source
- E2E tests go in `tests/e2e/`
- Storybook stories for new UI components

---

## Pull Request Process

1. Create a PR against `main`
2. Fill in the PR template with:
   - Summary of changes
   - How to test
   - Screenshots (for UI changes)
3. Ensure all CI checks pass
4. Request a review
5. Address review feedback
6. Merge after approval

---

## Areas for Contribution

### High Impact

- Improving agent task routing accuracy
- Adding new tool definitions and handlers
- Performance optimization for model loading
- Accessibility improvements (WCAG AAA)
- Mobile responsiveness

### Documentation

- Improving this guide
- Adding code examples
- Translating docs (DE/EN)
- Writing tutorials

### Testing

- Increasing unit test coverage
- Adding E2E test scenarios
- Browser compatibility testing
- Performance benchmarking

---

## Architecture Notes

Before contributing to the MIMI engine, read:
- [ARCHITECTURE.md](../ARCHITECTURE.md) for the system overview
- [API.md](./API.md) for tool and agent definitions
- [COMPONENTS.md](./COMPONENTS.md) for the component hierarchy

Key architectural decisions:
- **Singleton pattern** for `MimiInferenceEngine` and `AgentOrchestrator`
- **Composition** over inheritance for hooks (`useMimiEngine` composes sub-hooks)
- **Skills as Markdown** for easy authoring and runtime injection
- **Hardened JSON parsing** for LLM tool calls (small models output imperfect JSON)

---

## Code of Conduct

Be respectful, constructive, and collaborative. Focus on the work, not the person.
