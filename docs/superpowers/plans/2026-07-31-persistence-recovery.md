# Viwemd Persistence and Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans and superpowers:test-driven-development. Complete each task as its own public, verified, squash-merged PR before starting the next task.

**Goal:** Enable safe Markdown writes with atomic replacement, optimistic conflict detection, debounced autosave, recovery snapshots, close protection, filesystem watching, and clear save/conflict UI.

**Architecture:** Extend the narrow `WorkspacePort` instead of calling Tauri from React. The production adapter performs a compare-before-write and sibling temporary-file replacement; the in-memory adapter deterministically simulates successful writes, failures, and external edits. Document state owns save lifecycle and conflict data. A separate versioned recovery store snapshots dirty editor state locally before autosave. Filesystem watching is advisory; every write still performs a fresh compare so correctness never depends on watcher delivery.

**Tech Stack:** Existing Tauri 2 fs/dialog plugins, React, TypeScript, Vitest, Testing Library, browser local storage for bounded recovery snapshots, and CSS. No backend or network access.

## Global Safety Constraints

- Never write outside the user-selected workspace scope.
- Save through a uniquely named sibling temporary file, then rename over the destination; best-effort remove the temporary file after any failure.
- Re-read immediately before every save and compare normalized disk content with the document's `persistedSource`. A mismatch returns a conflict and does not write.
- Preserve CRLF versus LF when writing; the editor uses normalized `\n` internally.
- Autosave waits 750 ms after the last edit. Recovery snapshots wait 250 ms, so recoverable state exists before autosave begins.
- A conflicted or failed document never retries autosave in a loop; user action or a new edit is required.
- Recovery data is versioned, bounded to 1 MiB per document and 4 MiB total, and never includes credentials or non-document files.
- Dirty tab close and application close require explicit confirmation unless a successful save has made the document clean.
- Watcher events are debounced and self-write events are suppressed by comparing normalized source.
- Every task follows RED-GREEN-REFACTOR, full verification, public PR inspection, squash merge, post-merge verification, and branch/worktree cleanup.

## Stable Persistence Contracts

```ts
export type LineEnding = "lf" | "crlf";

export interface ReadDocumentResult {
  path: string;
  source: string;          // normalized to LF
  lineEnding: LineEnding;
}

export interface SaveDocumentRequest {
  path: string;
  source: string;          // normalized LF editor source
  expectedSource: string;  // normalized LF last-known disk source
  lineEnding: LineEnding;
  force?: boolean;
}

export type SaveDocumentResult =
  | { status: "saved"; source: string }
  | { status: "conflict"; diskSource: string; lineEnding: LineEnding };

export interface WorkspacePort {
  chooseFolder(): Promise<string | null>;
  listDirectory(path: string): Promise<WorkspaceEntry[]>;
  readDocument(path: string): Promise<ReadDocumentResult>;
  saveDocument(request: SaveDocumentRequest): Promise<SaveDocumentResult>;
  watchDocument(path: string, onChange: () => void): Promise<() => void>;
}
```

---

### Task 1: Atomic Workspace Persistence Boundary

**Branch:** `agent/atomic-persistence`

**Files:**
- Modify: `src/platform/workspace/types.ts`
- Modify: `src/platform/workspace/WorkspacePort.ts`
- Create: `src/platform/workspace/textFormat.ts`
- Create: `src/platform/workspace/textFormat.test.ts`
- Modify: `src/platform/workspace/tauriWorkspacePort.ts`
- Modify: `src/test/InMemoryWorkspacePort.ts`
- Create: `src/platform/workspace/workspacePersistence.test.ts`
- Modify: `src-tauri/capabilities/default.json`
- Modify: `README.md`

- [ ] Add failing tests for CRLF/LF detection, normalization, serialization, successful compare-and-save, conflict without write, force save, write failure, and test-adapter external edits.
- [ ] Extend read results with `lineEnding`; update all fixtures and document creation sites.
- [ ] Implement `saveDocument` in memory and Tauri. The Tauri adapter uses `readTextFile`, `writeTextFile(temp, data, { createNew: true })`, `rename(temp, path)`, and best-effort `remove(temp)` on failure. Generate temp names with `crypto.randomUUID()` and keep them beside the destination.
- [ ] Grant only `fs:allow-write-text-file`, `fs:allow-rename`, and `fs:allow-remove` in addition to existing selected-folder read permissions. Do not grant blanket home-directory scope.
- [ ] Add a placeholder `watchDocument` that returns a no-op unsubscriber; live watching lands in Task 4.
- [ ] Verify tests/build/Rust/diffs, publish PR `Add the atomic persistence boundary`, inspect permission scope, merge, and reverify `main`.

**Exit:** The port can safely save, but no UI invokes it yet.

---

### Task 2: Document Save State, Manual Save, Autosave, and Conflicts

**Branch:** `agent/document-saving`

**Files:**
- Modify: `src/features/documents/documentState.ts`
- Modify: `src/features/documents/documentState.test.ts`
- Modify: `src/features/documents/useDocuments.ts`
- Modify: `src/features/documents/useDocuments.test.tsx`
- Create: `src/features/documents/SaveControls.tsx`
- Create: `src/features/documents/SaveControls.test.tsx`
- Create: `src/features/documents/ConflictNotice.tsx`
- Create: `src/features/documents/ConflictNotice.test.tsx`
- Modify: `src/app/App.tsx`, `src/app/App.test.tsx`, `src/app/app.css`

- [ ] Add `lineEnding`, `saveStatus`, `saveError`, `conflictSource`, and `conflictLineEnding` to `OpenDocument`. Define states `clean`, `dirty`, `saving`, `saved`, `conflict`, and `error`.
- [ ] Add reducer actions for save start/success/failure, conflict detection, disk reload, and conflict clearing. A successful save advances `persistedSource`; a conflict preserves local `source`.
- [ ] Implement `save(id, { force? })`; deduplicate concurrent saves per document and ignore stale completions when the editor changed during an in-flight save.
- [ ] Implement a 750 ms autosave timer for dirty documents. Cancel on tab close/unmount and pause on conflict/error. A new edit after an error makes retry possible after another debounce.
- [ ] Add a Save button and `Ctrl/Cmd+S`. Status text must say Saving, Saved locally, Unsaved, Save failed, or External conflict without relying on color.
- [ ] Add conflict actions: `Reload disk` discards local changes, `Overwrite disk` force-saves against the just-read disk version, and `Keep editing` dismisses the notice while leaving autosave paused until another edit.
- [ ] Protect dirty tab close with an accessible confirmation dialog.
- [ ] Verify, publish PR `Add safe document saving`, merge, and reverify.

**Exit:** Users can safely save and resolve compare-time conflicts; recovery and live external notifications are still pending.

---

### Task 3: Recovery Snapshots and Close Protection

**Branch:** `agent/recovery-snapshots`

**Files:**
- Create: `src/features/recovery/recoveryStore.ts`
- Create: `src/features/recovery/recoveryStore.test.ts`
- Create: `src/features/recovery/useRecoverySnapshots.ts`
- Create: `src/features/recovery/useRecoverySnapshots.test.tsx`
- Create: `src/features/recovery/RecoveryNotice.tsx`
- Create: `src/features/recovery/RecoveryNotice.test.tsx`
- Modify: `src/features/documents/useDocuments.ts`
- Modify: `src/app/App.tsx`, `src/app/App.test.tsx`, `src/app/app.css`, `README.md`

- [ ] Store versioned records `{ path, source, persistedSource, lineEnding, updatedAt }` under `viwemd.recovery.v1`; validate every field and enforce size limits before writing.
- [ ] Snapshot dirty documents after 250 ms; clear a snapshot only after save success or explicit discard.
- [ ] On open, automatically restore a compatible snapshot whose `persistedSource` matches disk and show `Recovered unsaved changes`. When disk changed, show a three-way recovery notice and never overwrite automatically.
- [ ] Add Restore, Use disk, and Dismiss actions. Preserve incompatible recovery until an explicit choice.
- [ ] Register `beforeunload` while any document is dirty/saving/conflicted, and add Tauri window-close interception if browser unload is not honored by the native smoke test.
- [ ] Verify crash-style unmount/remount recovery in tests and a real process restart with a fixture file. Publish PR `Add local recovery snapshots`, merge, and reverify.

---

### Task 4: External File Watching and Final Persistence Validation

**Branch:** `agent/external-file-watch`

**Files:**
- Modify: `src/platform/workspace/tauriWorkspacePort.ts`
- Modify: `src/test/InMemoryWorkspacePort.ts`
- Create: `src/features/documents/useDocumentWatchers.ts`
- Create: `src/features/documents/useDocumentWatchers.test.tsx`
- Modify: `src/features/documents/useDocuments.ts`
- Modify: `src/app/App.test.tsx`, `src/app/app.css`
- Modify: `src-tauri/capabilities/default.json`, `README.md`

- [ ] Implement `watchDocument` with Tauri's debounced `watch(path, callback, { delayMs: 150 })` and grant only `fs:allow-watch`.
- [ ] Subscribe once per open path and unsubscribe on close. On an event, re-read rather than trusting watcher metadata.
- [ ] If the disk source equals the current persisted source, suppress the event. If the document is clean, refresh automatically. If dirty, surface a conflict without altering local source.
- [ ] Test self-write suppression, clean refresh, dirty conflict, duplicate-event coalescing, and unsubscription.
- [ ] Native fixture smoke: preserve CRLF, autosave atomically, create no leftover temp file, recover after forced process termination, detect an external editor change, resolve both reload and overwrite, protect close, and confirm only the chosen fixture changes.
- [ ] Publish PR `Detect external Markdown changes`, merge, run the entire test/build/Rust suite on `main`, and remove all worktrees/branches.

## Persistence Exit Criteria

- No disk write occurs without a user-selected workspace and compare-before-write.
- Destination replacement is atomic and temporary files are cleaned after failures.
- LF/CRLF is preserved.
- Manual save, autosave, status, conflict resolution, and dirty-close protection work.
- Recovery exists before autosave and survives a real process restart within bounded storage.
- External edits refresh clean documents or conflict with dirty ones without losing local text.
- The app remains local-only with narrowly documented Tauri permissions.
- All tests, builds, Rust checks, diff checks, and native fixture validation pass after each PR.
