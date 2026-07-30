# Viwemd Foundation and Core Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an installable Tauri desktop shell that opens a local folder, browses Markdown files, opens documents in tabs, edits them in memory, renders a safe GFM preview, and switches among the three approved layouts.

**Architecture:** A React/TypeScript interface consumes a narrow `WorkspacePort`; the Tauri adapter implements local folder selection and read-only file access while tests use an in-memory adapter. Workspace navigation, document state, editor integration, rendering, and layout state remain independent modules. Durable writing is disabled in this slice and follows in the persistence plan, so the foundation cannot overwrite a file before atomic saves and conflict detection exist.

**Tech Stack:** Tauri 2.11, React 19.2, TypeScript 7.0, Vite 8.2, Vitest 4.1, Testing Library 16.3, CodeMirror 6, `react-markdown` 10.1, `remark-gfm` 4, `rehype-raw` 7, `rehype-sanitize` 6, `rehype-slug` 6, and npm 11.

## Global Constraints

- Runtime behavior is local-only: no backend, account, telemetry, remote image fetch, or remote metadata fetch.
- Target Windows, macOS, and Linux through Tauri 2 with React and TypeScript.
- Filesystem access is limited to the user-selected workspace; this slice reads but does not write documents.
- Recognize `.md`, `.markdown`, `.mdown`, `.mkd`, `.mkdn`, and `.mdwn` without case sensitivity.
- The default layout is single-pane with Edit/Preview switching; side-by-side and stacked layouts are also available.
- Use semantic controls, keyboard navigation, visible focus, and non-color state labels from the first component.
- Treat Markdown as untrusted input and sanitize raw HTML before it reaches the preview DOM.
- Every task starts from updated `main`, uses its exact branch, opens a public ready PR, verifies it, squash-merges it, deletes the remote branch, and fast-forwards local `main`.
- Follow-up slices are persistence/recovery, rich Markdown interactions, appearance/search/accessibility, and packaging/release validation.

---

## Planned File Structure

```text
index.html                         Vite entry document
package.json                       npm scripts and dependencies
package-lock.json                  reproducible JavaScript dependency graph
tsconfig.json                      strict browser TypeScript settings
tsconfig.node.json                 Vite configuration TypeScript settings
vite.config.ts                     Vite and Vitest configuration
src/main.tsx                       React bootstrap
src/app/App.tsx                    composition root and dependency injection
src/app/App.test.tsx               application integration tests
src/app/app.css                    shell layout and global tokens
src/test/setup.ts                  DOM matchers and CodeMirror polyfills
src/test/InMemoryWorkspacePort.ts  deterministic test adapter
src/platform/workspace/types.ts    workspace value types
src/platform/workspace/paths.ts    Markdown filename rules
src/platform/workspace/WorkspacePort.ts
src/platform/workspace/tauriWorkspacePort.ts
src/features/workspace/*           lazy Explorer state and UI
src/features/documents/*           tabs and document reducer
src/features/editor/*              controlled CodeMirror editor
src/features/preview/*             sanitized GFM preview
src/features/layout/*              three layout modes and controls
src-tauri/*                        native configuration and read permissions
```

## Stable Interfaces

Task 2 introduces this contract and later tasks use it unchanged:

```ts
export type WorkspaceEntry =
  | { kind: "directory"; name: string; path: string }
  | { kind: "file"; name: string; path: string };

export interface ReadDocumentResult {
  path: string;
  source: string;
}

export interface WorkspacePort {
  chooseFolder(): Promise<string | null>;
  listDirectory(path: string): Promise<WorkspaceEntry[]>;
  readDocument(path: string): Promise<ReadDocumentResult>;
}
```

Task 4 introduces this document contract:

```ts
export interface OpenDocument {
  id: string;
  path: string;
  name: string;
  source: string;
  persistedSource: string;
  cursorOffset: number;
  editorScrollTop: number;
  previewScrollTop: number;
}
```

---

### Task 1: Tauri, React, and Test Harness

**Branch:** `agent/foundation-shell`

**Files:**
- Create: `package.json`, `package-lock.json`, `index.html`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`
- Create: `src/main.tsx`, `src/vite-env.d.ts`, `src/app/App.tsx`, `src/app/App.test.tsx`, `src/app/app.css`, `src/test/setup.ts`
- Create: `src-tauri/Cargo.toml`, `src-tauri/build.rs`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`, `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`, `src-tauri/icons/*`
- Modify: `.gitignore`, `README.md`

**Interfaces:**
- Consumes: none
- Produces: `App(): ReactElement`, npm scripts `dev`, `build`, `test`, `test:watch`, `tauri`, and a Tauri binary named `viwemd`

- [ ] **Step 1: Create the task branch**

```powershell
git switch main
git pull --ff-only origin main
git switch -c agent/foundation-shell
```

- [ ] **Step 2: Add scaffold and test configuration**

Generate the current cross-platform icon set in a contained scaffold directory, copy only the icons, and verify the delete target before removing the scaffold:

```powershell
npx --yes create-tauri-app@latest .tauri-scaffold --manager npm --template react-ts --identifier com.ibrokhimel.viwemd --tauri-version 2 --yes
New-Item -ItemType Directory -Force -Path src-tauri\icons | Out-Null
Copy-Item -Path .tauri-scaffold\src-tauri\icons\* -Destination src-tauri\icons -Recurse
$repoRoot = (Resolve-Path .).Path
$scaffoldRoot = (Resolve-Path .tauri-scaffold).Path
if (-not $scaffoldRoot.StartsWith($repoRoot + [System.IO.Path]::DirectorySeparatorChar)) { throw "Refusing to remove scaffold outside repository" }
Remove-Item -LiteralPath $scaffoldRoot -Recurse -Force
```

Create `package.json` with these exact runtime versions and scripts; run `npm install` to generate the lockfile:

```json
{
  "name": "viwemd",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.node.json && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "tauri": "tauri"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.11.1",
    "@tauri-apps/plugin-dialog": "^2.7.2",
    "@tauri-apps/plugin-fs": "^2.5.1",
    "react": "^19.2.8",
    "react-dom": "^19.2.8"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.11.4",
    "@testing-library/jest-dom": "^7.0.0",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.5",
    "jsdom": "^30.0.1",
    "typescript": "~7.0.2",
    "vite": "^8.2.0",
    "vitest": "^4.1.10"
  }
}
```

Configure `vite.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: { port: 1420, strictPort: true },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    restoreMocks: true,
  },
});
```

Use strict, no-emit TypeScript settings for both the application and Vite config:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

`index.html` contains only `<div id="root"></div>` plus the module script `/src/main.tsx`. `src/test/setup.ts` imports `@testing-library/jest-dom/vitest`.

Expected: `npm install` creates `package-lock.json` without error.

- [ ] **Step 3: Write the failing application smoke test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("identifies the local Markdown workspace", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Viwemd" })).toBeVisible();
    expect(screen.getByText("Local Markdown workspace")).toBeVisible();
  });
});
```

- [ ] **Step 4: Verify the test fails**

Run: `npm test -- src/app/App.test.tsx`

Expected: FAIL because `./App` does not exist.

- [ ] **Step 5: Implement the minimal shell**

```tsx
import type { ReactElement } from "react";
import "./app.css";

export function App(): ReactElement {
  return (
    <main className="app-shell">
      <h1>Viwemd</h1>
      <p>Local Markdown workspace</p>
    </main>
  );
}
```

Bootstrap it from `src/main.tsx` with `createRoot` and `StrictMode`. Configure the native builder:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("error while running Viwemd");
}
```

Use these Rust dependencies in `src-tauri/Cargo.toml`:

```toml
[package]
name = "viwemd"
version = "0.1.0"
description = "A local-first Markdown workspace"
authors = ["Viwemd contributors"]
edition = "2021"

[lib]
name = "viwemd_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tauri = { version = "2", features = [] }
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
```

Set the Tauri title to `Viwemd`, size to `1180x760`, minimum size to `800x520`, and identifier to `com.ibrokhimel.viwemd`. Use the following production and development CSP directives; Tauri adds nonces and hashes for bundled assets. Grant only `core:default`, `dialog:allow-open`, `fs:allow-read-dir`, and `fs:allow-read-text-file`.

```json
{
  "csp": {
    "default-src": "'self'",
    "connect-src": "ipc: http://ipc.localhost",
    "img-src": "'self' asset: http://asset.localhost data:",
    "style-src": "'self' 'unsafe-inline'"
  },
  "devCsp": {
    "default-src": "'self' http://localhost:1420",
    "connect-src": "ipc: http://ipc.localhost http://localhost:1420 ws://localhost:1420",
    "img-src": "'self' asset: http://asset.localhost data:",
    "style-src": "'self' 'unsafe-inline'"
  }
}
```

- [ ] **Step 6: Verify, commit, publish, and merge**

Run `npm test`, `npm run build`, `cargo check --manifest-path src-tauri/Cargo.toml`, and `git diff --check`; all must pass.

```powershell
git add .gitignore README.md package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts src src-tauri
git -c user.name='Codex' -c user.email='codex@local' commit -m "feat: scaffold the Viwemd desktop shell"
git push -u origin agent/foundation-shell
gh pr create --repo ibrokhimel/viwemd --base main --head agent/foundation-shell --title "Scaffold the Viwemd desktop shell" --body "Adds the Tauri 2, React, TypeScript, Vite, and Vitest foundation. Validated with npm tests, a production frontend build, and cargo check."
gh pr merge --repo ibrokhimel/viwemd --squash --delete-branch agent/foundation-shell
git switch main
git pull --ff-only origin main
```

---

### Task 2: Workspace Contracts and Read-Only Adapter

**Branch:** `agent/workspace-domain`

**Files:**
- Create: `src/platform/workspace/types.ts`, `src/platform/workspace/WorkspacePort.ts`
- Create: `src/platform/workspace/paths.ts`, `src/platform/workspace/paths.test.ts`
- Create: `src/platform/workspace/tauriWorkspacePort.ts`, `src/test/InMemoryWorkspacePort.ts`

**Interfaces:**
- Consumes: Tauri dialog/fs plugins from Task 1
- Produces: the stable `WorkspacePort`, `isMarkdownFile(name)`, `sortWorkspaceEntries(entries)`, `tauriWorkspacePort`, and `InMemoryWorkspacePort`

- [ ] **Step 1: Create the task branch**

```powershell
git switch main
git pull --ff-only origin main
git switch -c agent/workspace-domain
```

- [ ] **Step 2: Write failing path tests**

```ts
import { describe, expect, it } from "vitest";
import { isMarkdownFile, sortWorkspaceEntries } from "./paths";

it.each(["a.md", "a.MARKDOWN", "a.mdown", "a.mkd", "a.mkdn", "a.mdwn"])(
  "recognizes %s",
  (name) => expect(isMarkdownFile(name)).toBe(true),
);

it.each(["a.txt", "a.md.bak", ".md", "README"])(
  "rejects %s",
  (name) => expect(isMarkdownFile(name)).toBe(false),
);

it("sorts directories first and names case-insensitively", () => {
  const entries = [
    { kind: "file" as const, name: "Zoo.md", path: "/Zoo.md" },
    { kind: "directory" as const, name: "docs", path: "/docs" },
    { kind: "file" as const, name: "about.md", path: "/about.md" },
  ];
  expect(sortWorkspaceEntries(entries).map((entry) => entry.name)).toEqual([
    "docs", "about.md", "Zoo.md",
  ]);
});
```

- [ ] **Step 3: Verify failure, then implement contracts and helpers**

Run: `npm test -- src/platform/workspace/paths.test.ts`

Expected: FAIL because `./paths` does not exist.

```ts
const MARKDOWN_EXTENSION = /\.(md|markdown|mdown|mkd|mkdn|mdwn)$/i;

export function isMarkdownFile(name: string): boolean {
  return name.length > 3 && MARKDOWN_EXTENSION.test(name);
}

export function sortWorkspaceEntries(entries: WorkspaceEntry[]): WorkspaceEntry[] {
  return [...entries].sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === "directory" ? -1 : 1;
    return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
  });
}
```

Create `types.ts` and `WorkspacePort.ts` exactly as shown in Stable Interfaces.

- [ ] **Step 4: Implement production and test adapters**

```ts
import { join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { isMarkdownFile, sortWorkspaceEntries } from "./paths";

export const tauriWorkspacePort: WorkspacePort = {
  async chooseFolder() {
    const selected = await open({ directory: true, multiple: false });
    return typeof selected === "string" ? selected : null;
  },
  async listDirectory(path) {
    const entries = await readDir(path);
    const mapped = await Promise.all(entries
      .filter((entry) => entry.isDirectory || (entry.isFile && isMarkdownFile(entry.name)))
      .map(async (entry) => ({
        kind: entry.isDirectory ? ("directory" as const) : ("file" as const),
        name: entry.name,
        path: await join(path, entry.name),
      })));
    return sortWorkspaceEntries(mapped);
  },
  async readDocument(path) {
    return { path, source: await readTextFile(path) };
  },
};
```

`InMemoryWorkspacePort` accepts a chosen root and a record of absolute paths to source strings, derives immediate directory listings, records calls in `listedDirectories`, and throws for a missing read:

```ts
export class InMemoryWorkspacePort implements WorkspacePort {
  readonly listedDirectories: string[] = [];

  constructor(
    private readonly rootPath: string | null,
    private readonly files: Readonly<Record<string, string>>,
  ) {}

  async chooseFolder(): Promise<string | null> {
    return this.rootPath;
  }

  async listDirectory(path: string): Promise<WorkspaceEntry[]> {
    this.listedDirectories.push(path);
    const prefix = path.endsWith("/") ? path : `${path}/`;
    const children = new Map<string, WorkspaceEntry>();
    for (const filePath of Object.keys(this.files)) {
      if (!filePath.startsWith(prefix)) continue;
      const [name, ...remaining] = filePath.slice(prefix.length).split("/");
      if (!name) continue;
      const entry = remaining.length > 0
        ? { kind: "directory" as const, name, path: `${prefix}${name}` }
        : { kind: "file" as const, name, path: filePath };
      if (entry.kind === "directory" || isMarkdownFile(entry.name)) children.set(entry.path, entry);
    }
    return sortWorkspaceEntries([...children.values()]);
  }

  async readDocument(path: string): Promise<ReadDocumentResult> {
    const source = this.files[path];
    if (source === undefined) throw new Error(`Document not found: ${path}`);
    return { path, source };
  }
}
```

- [ ] **Step 5: Verify, publish, and merge**

Run `npm test`, `npm run build`, `cargo check --manifest-path src-tauri/Cargo.toml`, and `git diff --check`.

```powershell
git add src/platform src/test/InMemoryWorkspacePort.ts
git -c user.name='Codex' -c user.email='codex@local' commit -m "feat: add local workspace adapters"
git push -u origin agent/workspace-domain
gh pr create --repo ibrokhimel/viwemd --base main --head agent/workspace-domain --title "Add local workspace adapters" --body "Adds tested Markdown path rules and narrow read-only workspace adapters for Tauri and component tests."
gh pr merge --repo ibrokhimel/viwemd --squash --delete-branch agent/workspace-domain
git switch main
git pull --ff-only origin main
```

---

### Task 3: Lazy Workspace Explorer

**Branch:** `agent/workspace-explorer`

**Files:**
- Create: `src/features/workspace/useWorkspace.ts`
- Create: `src/features/workspace/WorkspaceExplorer.tsx`, `src/features/workspace/WorkspaceExplorer.test.tsx`
- Modify: `src/app/App.tsx`, `src/app/App.test.tsx`

**Interfaces:**
- Consumes: `WorkspacePort` and `WorkspaceEntry` from Task 2
- Produces: `WorkspaceExplorer({ port, onOpenFile })` and `useWorkspace(port)`

- [ ] **Step 1: Create the task branch**

```powershell
git switch main
git pull --ff-only origin main
git switch -c agent/workspace-explorer
```

- [ ] **Step 2: Write the failing Explorer test**

```tsx
it("opens a folder, expands lazily, and selects Markdown files", async () => {
  const user = userEvent.setup();
  const onOpenFile = vi.fn();
  const port = new InMemoryWorkspacePort("/notes", {
    "/notes/README.md": "# Home",
    "/notes/docs/setup.md": "# Setup",
  });
  render(<WorkspaceExplorer port={port} onOpenFile={onOpenFile} />);

  await user.click(screen.getByRole("button", { name: "Open folder" }));
  await user.click(screen.getByRole("button", { name: "Expand docs" }));
  await user.click(screen.getByRole("button", { name: "Open setup.md" }));

  expect(port.listedDirectories).toEqual(["/notes", "/notes/docs"]);
  expect(onOpenFile).toHaveBeenCalledWith("/notes/docs/setup.md");
});
```

- [ ] **Step 3: Verify failure, then implement lazy workspace state**

Run: `npm test -- src/features/workspace/WorkspaceExplorer.test.tsx`

Expected: FAIL because `WorkspaceExplorer` does not exist.

`useWorkspace` loads only the root after folder selection. Its public result is:

```ts
interface WorkspaceController {
  rootPath: string | null;
  entriesByDirectory: Readonly<Record<string, WorkspaceEntry[]>>;
  expandedDirectories: ReadonlySet<string>;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  chooseFolder(): Promise<void>;
  toggleDirectory(path: string): Promise<void>;
}
```

On first expansion, `toggleDirectory` loads and caches children; later expansions reuse the cache. Failure retains the prior workspace and exposes a `role="alert"` message.

- [ ] **Step 4: Implement the accessible Explorer and inject it into App**

```tsx
interface WorkspaceExplorerProps {
  port: WorkspacePort;
  onOpenFile(path: string): void;
}

export function WorkspaceExplorer({ port, onOpenFile }: WorkspaceExplorerProps) {
  const workspace = useWorkspace(port);
  return (
    <aside aria-label="Workspace explorer">
      <button type="button" onClick={workspace.chooseFolder}>Open folder</button>
      {workspace.error ? <p role="alert">{workspace.error}</p> : null}
      <div role="tree" aria-label="Markdown files">
        <WorkspaceTree controller={workspace} onOpenFile={onOpenFile} />
      </div>
    </aside>
  );
}
```

`WorkspaceTree` uses buttons named `Expand <directory>`, `Collapse <directory>`, and `Open <filename>`. Directory items set `aria-expanded`; nested entries use `role="group"`. `App` accepts `workspacePort: WorkspacePort = tauriWorkspacePort`, passes it to Explorer, and tests inject `InMemoryWorkspacePort` so Tauri globals are never accessed by Vitest.

- [ ] **Step 5: Verify, publish, and merge**

Run `npm test`, `npm run build`, `cargo check --manifest-path src-tauri/Cargo.toml`, and `git diff --check`.

```powershell
git add src/app src/features/workspace
git -c user.name='Codex' -c user.email='codex@local' commit -m "feat: add the workspace explorer"
git push -u origin agent/workspace-explorer
gh pr create --repo ibrokhimel/viwemd --base main --head agent/workspace-explorer --title "Add the lazy workspace explorer" --body "Adds accessible folder selection and lazy Markdown tree navigation with injected local workspace access."
gh pr merge --repo ibrokhimel/viwemd --squash --delete-branch agent/workspace-explorer
git switch main
git pull --ff-only origin main
```

---

### Task 4: Document Tabs and In-Memory Editing State

**Branch:** `agent/document-tabs`

**Files:**
- Create: `src/features/documents/documentState.ts`, `src/features/documents/documentState.test.ts`
- Create: `src/features/documents/useDocuments.ts`
- Create: `src/features/documents/TabStrip.tsx`, `src/features/documents/TabStrip.test.tsx`
- Modify: `src/app/App.tsx`, `src/features/workspace/WorkspaceExplorer.tsx`

**Interfaces:**
- Consumes: `WorkspacePort.readDocument(path)` and Explorer `onOpenFile(path)`
- Produces: `OpenDocument`, `DocumentState`, `documentReducer`, `useDocuments(port)`, and `TabStrip`

- [ ] **Step 1: Create the task branch**

```powershell
git switch main
git pull --ff-only origin main
git switch -c agent/document-tabs
```

- [ ] **Step 2: Write failing document-reducer tests**

```ts
const readme: OpenDocument = {
  id: "/notes/README.md",
  path: "/notes/README.md",
  name: "README.md",
  source: "# Home",
  persistedSource: "# Home",
  cursorOffset: 0,
  editorScrollTop: 0,
  previewScrollTop: 0,
};

it("opens one tab per path and activates an existing tab", () => {
  const opened = documentReducer(initialDocumentState, { type: "opened", document: readme });
  const reopened = documentReducer(opened, { type: "opened", document: readme });
  expect(reopened.tabs).toEqual([readme]);
  expect(reopened.activeId).toBe(readme.id);
});

it("changes source without changing the persisted version", () => {
  const opened = documentReducer(initialDocumentState, { type: "opened", document: readme });
  const edited = documentReducer(opened, {
    type: "sourceChanged",
    id: readme.id,
    source: "# Edited",
  });
  expect(edited.tabs[0]).toMatchObject({ source: "# Edited", persistedSource: "# Home" });
});
```

- [ ] **Step 3: Verify failure, then implement immutable state transitions**

Run: `npm test -- src/features/documents/documentState.test.ts`

Expected: FAIL because `documentState` does not exist.

```ts
export type DocumentAction =
  | { type: "opened"; document: OpenDocument }
  | { type: "activated"; id: string }
  | { type: "closed"; id: string }
  | { type: "sourceChanged"; id: string; source: string }
  | { type: "cursorChanged"; id: string; cursorOffset: number }
  | { type: "editorScrolled"; id: string; editorScrollTop: number }
  | { type: "previewScrolled"; id: string; previewScrollTop: number };
```

Closing the active tab activates the tab immediately to its right, or the left tab when no right tab exists. Closing the final tab sets `activeId` to `null`. All transitions return new objects only where data changed.

- [ ] **Step 4: Implement document loading and tabs**

`useDocuments(port)` exposes `state`, `activeDocument`, `openPath`, `activate`, `close`, and `updateSource`. `openPath` activates an existing path without rereading it; otherwise it calls `readDocument`, derives the filename from both `/` and `\` separators, and dispatches `opened`. Read errors set a non-destructive `error` string.

```tsx
interface TabStripProps {
  tabs: OpenDocument[];
  activeId: string | null;
  onActivate(id: string): void;
  onClose(id: string): void;
}
```

Each tab item contains sibling controls: a document button with `role="tab"` and `aria-selected`, plus a close button named `Close <filename>`. Interactive controls are never nested. Dirty tabs show a visible dot plus a visually hidden `Unsaved` label.

- [ ] **Step 5: Wire Explorer to tabs with a temporary editor**

At `App`, create `const documents = useDocuments(workspacePort)`, pass `documents.openPath` to Explorer, render `TabStrip`, and render the active source in `<textarea aria-label="Markdown source">`. `onChange` calls `documents.updateSource(active.id, event.target.value)`. When `source !== persistedSource`, show `Changes are kept in memory; durable saving is not enabled yet`.

- [ ] **Step 6: Verify, publish, and merge**

Run `npm test`, `npm run build`, `cargo check --manifest-path src-tauri/Cargo.toml`, and `git diff --check`.

```powershell
git add src/app src/features/documents src/features/workspace
git -c user.name='Codex' -c user.email='codex@local' commit -m "feat: add document tabs"
git push -u origin agent/document-tabs
gh pr create --repo ibrokhimel/viwemd --base main --head agent/document-tabs --title "Add Markdown document tabs" --body "Adds tested tab state, document loading, activation, closing, and explicitly in-memory editing."
gh pr merge --repo ibrokhimel/viwemd --squash --delete-branch agent/document-tabs
git switch main
git pull --ff-only origin main
```

---

### Task 5: CodeMirror Editor and Safe GFM Preview

**Branch:** `agent/editor-preview`

**Files:**
- Modify: `package.json`, `package-lock.json`, `src/test/setup.ts`
- Create: `src/features/editor/MarkdownEditor.tsx`, `src/features/editor/MarkdownEditor.test.tsx`
- Create: `src/features/preview/MarkdownPreview.tsx`, `src/features/preview/MarkdownPreview.test.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: active `OpenDocument` and `updateSource` from Task 4
- Produces: `MarkdownEditor({ value, onChange })` and `MarkdownPreview({ source })`

- [ ] **Step 1: Create the branch and install exact editor/renderer ranges**

```powershell
git switch main
git pull --ff-only origin main
git switch -c agent/editor-preview
npm install @codemirror/commands@^6.10.4 @codemirror/lang-markdown@^6.5.1 @codemirror/language@^6.12.4 @codemirror/state@^6.7.1 @codemirror/view@^6.43.7 @lezer/highlight@^1.2.3 react-markdown@^10.1.0 remark-gfm@^4.0.1 rehype-raw@^7.0.0 rehype-sanitize@^6.0.0 rehype-slug@^6.0.0
```

- [ ] **Step 2: Write failing preview tests**

```tsx
it("renders GFM task lists and tables", () => {
  render(<MarkdownPreview source={"- [x] Done\n\n| A | B |\n| - | - |\n| 1 | 2 |"} />);
  expect(screen.getByRole("checkbox")).toBeChecked();
  expect(screen.getByRole("table")).toBeVisible();
});

it("removes scripts and event handlers from raw HTML", () => {
  const { container } = render(
    <MarkdownPreview source={'<img src="x" onerror="alert(1)"><script>alert(1)</script>'} />,
  );
  expect(container.querySelector("script")).toBeNull();
  expect(container.querySelector("[onerror]")).toBeNull();
});
```

- [ ] **Step 3: Verify failure, then implement the safe preview**

Run: `npm test -- src/features/preview/MarkdownPreview.test.tsx`

Expected: FAIL because `MarkdownPreview` does not exist.

```tsx
const schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "details", "summary", "kbd", "mark", "sub", "sup", "abbr",
  ],
  attributes: {
    ...defaultSchema.attributes,
    abbr: ["title"],
    details: ["open"],
  },
};

export function MarkdownPreview({ source }: { source: string }) {
  return (
    <article className="markdown-preview" aria-label="Markdown preview">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema], rehypeSlug]}
      >
        {source}
      </Markdown>
    </article>
  );
}
```

The Tauri CSP keeps remote images inert. Safe external-link opening is reserved for the rich-rendering plan.

- [ ] **Step 4: Write the failing controlled-editor test**

```tsx
it("creates an accessible editor with the supplied source", () => {
  const { container } = render(<MarkdownEditor value="# Hello" onChange={vi.fn()} />);
  expect(container.querySelector('[aria-label="Markdown source"]')).toHaveTextContent("# Hello");
});
```

Add deterministic JSDOM polyfills for `Range.prototype.getClientRects`, `Range.prototype.getBoundingClientRect`, `window.matchMedia`, and `ResizeObserver` in `src/test/setup.ts`.

- [ ] **Step 5: Verify failure, then implement the controlled CodeMirror editor**

Run: `npm test -- src/features/editor/MarkdownEditor.test.tsx`

Expected: FAIL because `MarkdownEditor` does not exist.

```ts
export interface MarkdownEditorProps {
  value: string;
  onChange(value: string): void;
}
```

Create one `EditorView` per mount with `markdown()`, `history()`, `historyKeymap`, `defaultKeymap`, line wrapping, `contentAttributes: { "aria-label": "Markdown source" }`, and an update listener that calls `onChange` only for `docChanged`. A second effect replaces the CodeMirror document only when the controlled `value` differs. Destroy the view on unmount.

- [ ] **Step 6: Replace the textarea, verify, publish, and merge**

Render editor and preview from the same active source. Run `npm test`, `npm run build`, `cargo check --manifest-path src-tauri/Cargo.toml`, and `git diff --check`.

```powershell
git add package.json package-lock.json src/app src/features/editor src/features/preview src/test/setup.ts
git -c user.name='Codex' -c user.email='codex@local' commit -m "feat: add Markdown editing and preview"
git push -u origin agent/editor-preview
gh pr create --repo ibrokhimel/viwemd --base main --head agent/editor-preview --title "Add Markdown editing and safe preview" --body "Adds a controlled CodeMirror editor and sanitized GFM preview with tests for rendering and hostile HTML."
gh pr merge --repo ibrokhimel/viwemd --squash --delete-branch agent/editor-preview
git switch main
git pull --ff-only origin main
```

---

### Task 6: Three Layouts and the Approved Desktop Shell

**Branch:** `agent/workspace-layouts`

**Files:**
- Create: `src/features/layout/layoutState.ts`, `src/features/layout/layoutState.test.ts`
- Create: `src/features/layout/LayoutControls.tsx`, `src/features/layout/LayoutControls.test.tsx`
- Modify: `src/app/App.tsx`, `src/app/App.test.tsx`, `src/app/app.css`, `README.md`

**Interfaces:**
- Consumes: Explorer, tabs, editor, and preview from Tasks 3–5
- Produces: `LayoutMode`, `SinglePaneMode`, `LayoutControls`, and the composed foundation UI

- [ ] **Step 1: Create the task branch**

```powershell
git switch main
git pull --ff-only origin main
git switch -c agent/workspace-layouts
```

- [ ] **Step 2: Write failing layout-state tests**

```ts
it("defaults to preview in a single pane", () => {
  expect(initialLayoutState).toEqual({ layout: "single", singlePane: "preview", sidebarVisible: true });
});

it("retains the single-pane choice while visiting other layouts", () => {
  const edited = layoutReducer(initialLayoutState, { type: "singlePaneChanged", value: "edit" });
  const split = layoutReducer(edited, { type: "layoutChanged", value: "split" });
  const single = layoutReducer(split, { type: "layoutChanged", value: "single" });
  expect(single.singlePane).toBe("edit");
});

it("toggles sidebar visibility", () => {
  expect(layoutReducer(initialLayoutState, { type: "sidebarToggled" }).sidebarVisible).toBe(false);
});
```

- [ ] **Step 3: Verify failure, then implement layout state and controls**

Run: `npm test -- src/features/layout/layoutState.test.ts`

Expected: FAIL because `layoutState` does not exist.

```ts
export type LayoutMode = "single" | "split" | "stacked";
export type SinglePaneMode = "edit" | "preview";

export const initialLayoutState = {
  layout: "single" as LayoutMode,
  singlePane: "preview" as SinglePaneMode,
  sidebarVisible: true,
};
```

`LayoutControls` renders pressed buttons named Edit, Preview, Single pane, Side by side, and Stacked. Edit/Preview updates `singlePane`; choosing either from Split or Stacked also switches to Single. Controls use `aria-pressed` and text so icon shape is not the only cue.

- [ ] **Step 4: Write the failing composition test**

```tsx
it("switches among single, split, and stacked workspaces", async () => {
  const user = userEvent.setup();
  render(<App workspacePort={new InMemoryWorkspacePort("/notes", {
    "/notes/README.md": "# Home",
  })} />);
  await user.click(screen.getByRole("button", { name: "Open folder" }));
  await user.click(screen.getByRole("button", { name: "Open README.md" }));
  expect(screen.getByLabelText("Markdown preview")).toBeVisible();
  expect(screen.queryByLabelText("Markdown source")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Side by side" }));
  expect(screen.getByLabelText("Markdown source")).toBeVisible();
  expect(screen.getByLabelText("Markdown preview")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Stacked" }));
  expect(screen.getByTestId("document-workspace")).toHaveAttribute("data-layout", "stacked");
});
```

- [ ] **Step 5: Compose the shell, keyboard shortcut, and CSS tokens**

Structure `App` as title bar, activity rail, conditional Explorer, tabs, document toolbar, workspace, and status bar. `Ctrl+B` or `Meta+B` dispatches `sidebarToggled`, calls `preventDefault`, and ignores combinations with additional modifiers.

```css
:root {
  color-scheme: light dark;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  --activity-width: 46px;
  --sidebar-width: 238px;
  --titlebar-height: 48px;
  --accent: #7c3aed;
  --shell: #111827;
  --sidebar: #121b2b;
  --surface: #ffffff;
  --border: #d9e0ea;
  --text: #172033;
}
.app-shell { min-height: 100vh; overflow: hidden; background: var(--surface); color: var(--text); }
.app-body { display: grid; grid-template-columns: var(--activity-width) var(--sidebar-width) minmax(0, 1fr); height: calc(100vh - var(--titlebar-height)); }
.app-body[data-sidebar="hidden"] { grid-template-columns: var(--activity-width) minmax(0, 1fr); }
.document-workspace[data-layout="split"] { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.document-workspace[data-layout="stacked"] { display: grid; grid-template-rows: minmax(0, 1fr) minmax(0, 1fr); }
button:focus-visible, [tabindex]:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; } }
```

The status bar says `Local only`; a dirty document also says `Unsaved in-memory changes`. No Save control is enabled in this foundation slice.

- [ ] **Step 6: Update README and run foundation verification**

Document `npm install`, `npm run tauri dev`, `npm test`, and `npm run build`. State that the foundation reads local Markdown and edits in memory but does not write to disk until persistence/recovery lands.

Run `npm test`, `npm run build`, `cargo check --manifest-path src-tauri/Cargo.toml`, and `git diff --check`. Then run `npm run tauri dev`, open a fixture folder, expand a directory, open two tabs, edit one, switch all layouts, toggle the sidebar, and close the app. Expected: no document on disk changes.

- [ ] **Step 7: Commit, publish, and merge**

```powershell
git add README.md src/app src/features/layout
git -c user.name='Codex' -c user.email='codex@local' commit -m "feat: compose the Viwemd workspace"
git push -u origin agent/workspace-layouts
gh pr create --repo ibrokhimel/viwemd --base main --head agent/workspace-layouts --title "Compose the Viwemd workspace" --body "Adds the approved single, side-by-side, and stacked layouts, desktop shell, sidebar shortcut, and foundation documentation."
gh pr merge --repo ibrokhimel/viwemd --squash --delete-branch agent/workspace-layouts
git switch main
git pull --ff-only origin main
```

## Foundation Exit Criteria

- Tauri opens a native Viwemd window and the configured project builds.
- A selected folder is the only filesystem scope exposed to the interface.
- Supported Markdown files appear in a lazy accessible tree.
- Multiple files open once each in tabs and keep independent source state.
- CodeMirror and safe GFM preview consume one document source.
- Single Edit/Preview, side-by-side, and stacked layouts work.
- No document writes occur, and the UI communicates that boundary.
- `npm test`, `npm run build`, `cargo check`, and `git diff --check` pass after every task.

The next plan adds 250-millisecond recovery snapshots, 750-millisecond autosave, atomic replacement, save statuses, close protection, filesystem watching, and conflict resolution before enabling document writes.

## Spec Coverage Review

- Covered here: Tauri/React foundation, narrow native boundary, folder workspace, supported extensions, lazy Explorer, multiple tabs, in-memory editing, safe base GFM rendering, three layouts, keyboard/focus foundations, and automated unit/component/build checks.
- Persistence plan: new files, Save As, 250-millisecond recovery, 750-millisecond autosave, atomic replacement, line-ending preservation, watcher suppression, conflicts, close protection, and recovery prompts.
- Rich-rendering plan: heading anchors, code enhancements, alerts, task source edits, local links/images, tables, footnotes, frontmatter, emoji, metadata headers, and external URL opening.
- Appearance/search/accessibility plan: global appearance settings, workspace session restore, search, outline, activity rail behavior, large-document mode, and comprehensive accessibility/performance fixtures.
- Packaging plan: Windows/macOS/Linux installers, platform smoke tests, signing documentation, and final acceptance checks.

---
