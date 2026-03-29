# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Best Practices

- Use comments sparingly. Only comment complex code.

## Commands

Run from the project root:

```bash
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server at http://localhost:3000 (uses Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run all tests with Vitest
npx vitest run src/lib/__tests__/file-system.test.ts  # Run a single test file
npm run db:reset     # Reset database (destructive)
```

## Environment

Copy `.env` and set:
- `ANTHROPIC_API_KEY` — if absent, a `MockLanguageModel` is used that returns static components
- `JWT_SECRET` — defaults to `"development-secret-key"` in dev

## Architecture

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma + SQLite, Vercel AI SDK, Anthropic Claude (`claude-haiku-4-5`)

### AI Generation Flow

1. User sends a chat message via `ChatContext` (`src/lib/contexts/chat-context.tsx`), which uses the Vercel AI SDK's `useChat` hook
2. The hook POSTs to `POST /api/chat` with: messages, the serialized virtual FS (`files`), and optional `projectId`
3. `src/app/api/chat/route.ts` reconstructs a `VirtualFileSystem` from the serialized data, then calls `streamText` with two tools: `str_replace_editor` and `file_manager`
4. Claude calls these tools to create/edit virtual files; tool calls stream back to the client
5. `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) intercepts `onToolCall` from the AI SDK and applies mutations to the client-side `VirtualFileSystem`
6. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) re-renders on every FS change by reading `refreshTrigger`

### Virtual File System (`src/lib/file-system.ts`)

`VirtualFileSystem` is an in-memory tree of `FileNode` objects. Key methods:
- CRUD: `createFile`, `readFile`, `updateFile`, `deleteFile`, `createDirectory`
- Text editor commands: `viewFile`, `replaceInFile` (`str_replace`), `insertInFile`
- Serialization: `serialize()` → `Record<string, FileNode>` (strips `Map` children for JSON), `deserializeFromNodes()` for reconstruction
- A module-level `fileSystem` singleton is exported for server-side use; the client always reconstructs its own instance from the serialized request body

### Preview Pipeline (`src/lib/transform/jsx-transformer.ts`)

Files are rendered live in an `<iframe>` without hitting disk:
1. `createImportMap(files)` — transforms all `.js/.jsx/.ts/.tsx` files through **Babel standalone** in the browser, creates blob URLs, and builds an ES module import map
2. Third-party package imports are resolved to `https://esm.sh/<package>`; local imports use the `@/` alias (mapped to `/`)
3. Missing local imports get auto-generated placeholder modules (empty React component stubs)
4. CSS files are inlined into `<style>` tags; Tailwind CSS is loaded from CDN
5. `createPreviewHTML()` generates the full iframe `srcdoc` with the import map, an `ErrorBoundary`, and dynamic `import()` of the entry point (`/App.jsx` by default)

### AI Tools (`src/lib/tools/`)

- `str_replace_editor` — maps Claude's text editor commands (`view`, `create`, `str_replace`, `insert`) to `VirtualFileSystem` methods. `undo_edit` is not supported.
- `file_manager` — handles `rename` and `delete` operations

### System Prompt Conventions (`src/lib/prompts/generation.tsx`)

The generation prompt instructs Claude to:
- Always create `/App.jsx` as the entry point with a default export
- Use Tailwind CSS for styling (no hardcoded styles)
- Use `@/` import alias for all local (non-library) files (e.g., `@/components/Button`)
- Never create HTML files

### Authentication (`src/lib/auth.ts`, `src/middleware.ts`)

JWT-based sessions in an `auth-token` httpOnly cookie (7-day expiry). Middleware protects `/api/projects` and `/api/filesystem`. Anonymous users can generate components; only authenticated users can persist projects.

Anonymous work (messages + FS state) is tracked in `sessionStorage` via `src/lib/anon-work-tracker.ts` so it can be offered for save after sign-up.

### Data Persistence (Prisma + SQLite)

Two models: `User` (email/password) and `Project` (stores `messages` and `data` JSON blobs — serialized messages and virtual FS). Prisma client is generated to `src/generated/prisma`. DB file: `prisma/dev.db`.

### Database

The database schema is defined in the @src/generated/prisma/schema.prisma file. Reference it anytime you need to understand the structure of data stored in the database.

### Routing

- `/` — anonymous generation, no project persistence
- `/[projectId]` — saved project view; loads initial messages and FS state from DB, passes them down to `FileSystemProvider` and `ChatProvider`

### Client Context Tree

`FileSystemProvider` must wrap `ChatProvider`. `FileSystemProvider` owns the `VirtualFileSystem` instance and exposes `handleToolCall`; `ChatProvider` consumes it to apply AI-driven mutations.
