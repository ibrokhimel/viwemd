# Premium Viwemd Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the complete Viwemd shell with a premium, reference-led desktop interface using one integrated sidebar and Phosphor icons while preserving all existing local Markdown workflows.

**Architecture:** Keep `App` as the state orchestrator and keep the existing workspace, document, layout, appearance, editor, preview, and Tauri boundaries unchanged. Add focused presentation components for icon weight, the integrated sidebar, and document chrome; then replace the legacy CSS token/shell system in reviewable slices. Each task is a separate public PR based on the latest merged `main`.

**Tech Stack:** Tauri 2, React 19, TypeScript 7, Vite 8, Tailwind CSS 4, CodeMirror 6, Framer Motion 12, `@phosphor-icons/react`, Vitest, Testing Library.

## Global Constraints

- Preserve folder selection, lazy file browsing, tabs, editing, sanitized preview, single/split/stacked layouts, save/autosave/conflict behavior, appearance persistence, keyboard shortcuts, and Tauri permissions.
- Use a 288 px integrated desktop sidebar, 16 px primary shell spacing, 8 px dense spacing, 10 px control radii, and 14 px elevated pane radii.
- Use near-black neutral dark surfaces and warm-neutral light surfaces; existing accent preferences remain functional.
- Use Phosphor for every visible functional icon. Outline maps to `regular`; solid maps to `fill` for active navigation/folders and `bold` for actions without a clear fill treatment.
- Hide layout labels below 980 px and use an overlay sidebar plus centered Appearance sheet below 720 px.
- Use 180 ms surface transitions and retain the 400 ms no-bounce folder spring; disable nonessential motion for `prefers-reduced-motion`.
- Do not add search, outline, accounts, cloud, collaboration, billing, telemetry, remote fonts, remote images, or dashboard content.
- Use direct Phosphor CSR icon entry points such as `@phosphor-icons/react/dist/csr/Folder`.
- Use `apply_patch` for source changes and strict TDD: observe each new test fail before implementation.
- Before every PR: run targeted tests, full `npm test`, `npm run build`, `cargo fmt --manifest-path src-tauri/Cargo.toml --check`, `cargo check --manifest-path src-tauri/Cargo.toml --locked`, and `git diff --check`.
- After every PR: squash-merge, pull `main`, re-run the relevant merged checks, and safely remove the task worktree and local/remote feature branch.

---

## File map

- `src/components/ui/AppIconStyle.tsx`: React context translating stored outline/solid preference into Phosphor weights.
- `src/components/ui/filesystem-item.tsx`: reusable animated tree item; Phosphor caret/folder/file icons and reduced-motion support.
- `src/features/workspace/PremiumSidebar.tsx`: app identity, active Explorer row, collapse control, embedded workspace, and Appearance entry.
- `src/features/workspace/WorkspaceExplorer.tsx`: folder identity, Open folder action, messages, and filesystem tree only.
- `src/features/documents/DocumentHeader.tsx`: sidebar reveal, document identity/save state, save action, and layout controls.
- `src/features/documents/TabStrip.tsx`: premium tabs with Phosphor Markdown/close icons.
- `src/features/layout/LayoutControls.tsx`: Phosphor-backed view and pane controls.
- `src/features/documents/ConflictNotice.tsx`: warning callout with Phosphor status icon.
- `src/features/appearance/AppearancePanel.tsx`: premium settings sheet with Phosphor header/actions/theme affordances.
- `src/app/App.tsx`: orchestration and composition only.
- `src/app/app.css`: complete surface tokens, shell geometry, component states, responsive rules, and reduced motion.

---

### Task 1: Phosphor icon foundation and filesystem tree

**Files:**
- Create: `src/components/ui/AppIconStyle.tsx`
- Create: `src/components/ui/AppIconStyle.test.tsx`
- Modify: `src/components/ui/filesystem-item.tsx`
- Modify: `src/components/ui/filesystem-item.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `AppIconStyleProvider({ style, children })` and `useAppIconWeight(active?: boolean): IconWeight`.
- Produces: every descendant can consume the stored appearance icon style without adding icon-style props through feature layers.
- Preserves: `FilesystemNode` and `FilesystemItemProps` public behavior.

- [ ] **Step 1: Write the failing icon-weight context test**

Create `src/components/ui/AppIconStyle.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppIconStyleProvider, useAppIconWeight } from "./AppIconStyle";

function WeightProbe({ active = false }: { active?: boolean }) {
  return <output aria-label={active ? "active" : "inactive"}>{useAppIconWeight(active)}</output>;
}

describe("AppIconStyle", () => {
  it("maps appearance preferences to consistent Phosphor weights", () => {
    const { rerender } = render(
      <AppIconStyleProvider style="outline">
        <WeightProbe />
        <WeightProbe active />
      </AppIconStyleProvider>,
    );
    expect(screen.getByLabelText("inactive")).toHaveTextContent("regular");
    expect(screen.getByLabelText("active")).toHaveTextContent("fill");

    rerender(
      <AppIconStyleProvider style="solid">
        <WeightProbe />
        <WeightProbe active />
      </AppIconStyleProvider>,
    );
    expect(screen.getByLabelText("inactive")).toHaveTextContent("bold");
    expect(screen.getByLabelText("active")).toHaveTextContent("fill");
  });
});
```

- [ ] **Step 2: Run the test and observe the missing-module failure**

Run: `npm test -- --run src/components/ui/AppIconStyle.test.tsx`

Expected: FAIL because `./AppIconStyle` does not exist.

- [ ] **Step 3: Replace Lucide with Phosphor and add the provider**

Run:

```powershell
npm uninstall lucide-react
npm install @phosphor-icons/react
```

Create `src/components/ui/AppIconStyle.tsx`:

```tsx
import { createContext, useContext, type ReactElement, type ReactNode } from "react";
import type { IconWeight } from "@phosphor-icons/react";
import type { IconStyle } from "@/features/appearance/appearancePreferences";

const AppIconStyleContext = createContext<IconStyle>("outline");

export function AppIconStyleProvider({
  style,
  children,
}: {
  style: IconStyle;
  children: ReactNode;
}): ReactElement {
  return (
    <AppIconStyleContext.Provider value={style}>
      {children}
    </AppIconStyleContext.Provider>
  );
}

export function useAppIconWeight(active = false): IconWeight {
  const style = useContext(AppIconStyleContext);
  if (active) return "fill";
  return style === "solid" ? "bold" : "regular";
}
```

Import `AppIconStyleProvider` into `App.tsx`. Immediately inside `return (`, add `<AppIconStyleProvider style={appearance.preferences.iconStyle}>` before the current `<main className="app-shell">`. Add the matching `</AppIconStyleProvider>` immediately after the current `</main>`. Make no other `App` JSX changes in this task.

- [ ] **Step 4: Migrate `FilesystemItem` to direct Phosphor imports**

Replace Lucide imports with:

```tsx
import { CaretRightIcon } from "@phosphor-icons/react/dist/csr/CaretRight";
import { FileMdIcon } from "@phosphor-icons/react/dist/csr/FileMd";
import { FolderIcon } from "@phosphor-icons/react/dist/csr/Folder";
import { useAppIconWeight } from "./AppIconStyle";
```

Inside `FilesystemItem`, calculate `const weight = useAppIconWeight(isDirectory && isOpen);`. Give each icon `data-icon-weight={weight}`, `weight={weight}`, and the existing `aria-hidden="true"`. Preserve the animated caret rotation, controlled/uncontrolled expansion, callbacks, paths, roles, and labels.

- [ ] **Step 5: Extend the tree test for outline and solid weights**

Add to `filesystem-item.test.tsx`:

```tsx
it("uses the shared Phosphor weight preference", () => {
  const { rerender } = render(
    <AppIconStyleProvider style="outline">
      <ul role="tree"><FilesystemItem node={docsNode} /></ul>
    </AppIconStyleProvider>,
  );
  expect(screen.getByTestId("folder-icon-docs")).toHaveAttribute("data-icon-weight", "regular");

  rerender(
    <AppIconStyleProvider style="solid">
      <ul role="tree"><FilesystemItem node={docsNode} /></ul>
    </AppIconStyleProvider>,
  );
  expect(screen.getByTestId("folder-icon-docs")).toHaveAttribute("data-icon-weight", "bold");
});
```

Add `data-testid={`folder-icon-${node.name}`}` to the folder icon.

- [ ] **Step 6: Run targeted and full verification**

Run:

```powershell
npm test -- --run src/components/ui/AppIconStyle.test.tsx src/components/ui/filesystem-item.test.tsx src/app/App.test.tsx
npm test
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo check --manifest-path src-tauri/Cargo.toml --locked
git diff --check
```

Expected: all tests/checks pass and `lucide-react` is absent from `package.json` and `package-lock.json`.

- [ ] **Step 7: Commit, publish, and merge the icon foundation PR**

```powershell
git add package.json package-lock.json src/components/ui/AppIconStyle.tsx src/components/ui/AppIconStyle.test.tsx src/components/ui/filesystem-item.tsx src/components/ui/filesystem-item.test.tsx src/app/App.tsx
git commit -m "feat: establish Phosphor icon system"
git push -u origin agent/phosphor-icons
gh pr create --base main --head agent/phosphor-icons --title "Establish Phosphor icon system" --body "Adds the shared icon-weight context and migrates the filesystem tree from Lucide to Phosphor."
```

Inspect the exact files and mergeability, squash-merge, pull `main`, repeat targeted tests/build, then remove the verified worktree and branches.

---

### Task 2: Integrated premium sidebar

**Files:**
- Create: `src/features/workspace/PremiumSidebar.tsx`
- Create: `src/features/workspace/PremiumSidebar.test.tsx`
- Modify: `src/features/workspace/WorkspaceExplorer.tsx`
- Modify: `src/features/workspace/WorkspaceExplorer.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/app.css`

**Interfaces:**
- Consumes: `useAppIconWeight(active?: boolean)` from Task 1.
- Produces: `PremiumSidebarProps { port, onOpenFile, onHide, onOpenAppearance, appearanceOpen }`.
- Changes: `WorkspaceExplorer` becomes an embedded labeled `section` and drops its `hidden` prop.
- Preserves: `WorkspaceExplorer` continues using `useWorkspace` and lazy directory caching.

- [ ] **Step 1: Write the failing sidebar composition test**

Create `PremiumSidebar.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InMemoryWorkspacePort } from "../../test/InMemoryWorkspacePort";
import { PremiumSidebar } from "./PremiumSidebar";

it("combines identity, Explorer, collapse, and Appearance in one sidebar", async () => {
  const user = userEvent.setup();
  const onHide = vi.fn();
  const onOpenAppearance = vi.fn();
  render(
    <PremiumSidebar
      port={new InMemoryWorkspacePort("/notes", { "/notes/README.md": "# Home" })}
      onOpenFile={vi.fn()}
      onHide={onHide}
      onOpenAppearance={onOpenAppearance}
      appearanceOpen={false}
    />,
  );

  expect(screen.getByRole("complementary", { name: "Viwemd sidebar" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Viwemd" })).toBeVisible();
  expect(screen.getByText("Local workspace")).toBeVisible();
  expect(screen.getByRole("region", { name: "Workspace explorer" })).toBeVisible();

  await user.click(screen.getByRole("button", { name: "Hide sidebar" }));
  await user.click(screen.getByRole("button", { name: "Appearance" }));
  expect(onHide).toHaveBeenCalledOnce();
  expect(onOpenAppearance).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run the new test and observe the missing-component failure**

Run: `npm test -- --run src/features/workspace/PremiumSidebar.test.tsx`

Expected: FAIL because `PremiumSidebar` does not exist.

- [ ] **Step 3: Implement the focused sidebar component**

Use direct Phosphor imports for `MarkdownLogoIcon`, `SidebarSimpleIcon`, `FolderSimpleIcon`, and `GearSixIcon`. Implement this public shape:

```tsx
interface PremiumSidebarProps {
  port: WorkspacePort;
  onOpenFile(path: string): void;
  onHide(): void;
  onOpenAppearance(): void;
  appearanceOpen: boolean;
}

export function PremiumSidebar(props: PremiumSidebarProps): ReactElement {
  const weight = useAppIconWeight();
  const activeWeight = useAppIconWeight(true);
  return (
    <aside className="premium-sidebar" aria-label="Viwemd sidebar">
      <header className="sidebar-brand-card">
        <span className="sidebar-brand-mark"><MarkdownLogoIcon weight={activeWeight} aria-hidden="true" /></span>
        <span><h1>Viwemd</h1><small>Local workspace</small></span>
        <button type="button" aria-label="Hide sidebar" onClick={props.onHide}>
          <SidebarSimpleIcon weight={weight} aria-hidden="true" />
        </button>
      </header>
      <div className="sidebar-section-row" aria-current="page">
        <FolderSimpleIcon weight={activeWeight} aria-hidden="true" />
        <span>Explorer</span>
      </div>
      <WorkspaceExplorer port={props.port} onOpenFile={props.onOpenFile} />
      <button
        className="sidebar-settings-button"
        type="button"
        aria-label="Appearance"
        aria-pressed={props.appearanceOpen}
        onClick={props.onOpenAppearance}
      >
        <GearSixIcon weight={props.appearanceOpen ? activeWeight : weight} aria-hidden="true" />
        <span>Appearance</span>
      </button>
    </aside>
  );
}
```

- [ ] **Step 4: Convert `WorkspaceExplorer` to embedded content**

Remove `hidden` from its props. Replace the outer `aside` with:

```tsx
<section
  className="workspace-explorer"
  aria-label="Workspace explorer"
  aria-busy={workspace.status === "loading"}
>
```

Keep root folder name, Open folder, loading/error messaging, tree roles, lazy expansion, cached collapse/reopen behavior, and file activation. Replace the text plus glyph with a Phosphor `FolderOpenIcon` in the Open folder button.

- [ ] **Step 5: Recompose `App` around the integrated sidebar**

Remove the legacy `.titlebar` and `.activity-rail` JSX. Inside `div.app-body`, insert this conditional immediately before the existing `AppearancePanel` conditional. Leave the Appearance and document-area nodes after it in their current order:

```tsx
{appearance.preferences.sidebarVisible ? (
  <PremiumSidebar
    port={workspacePort}
    onOpenFile={(path) => void documents.openPath(path)}
    onHide={toggleSidebar}
    onOpenAppearance={() => setAppearanceOpen((open) => !open)}
    appearanceOpen={appearanceOpen}
  />
) : null}
```

Update `App.test.tsx` to query `Viwemd sidebar`, `Workspace explorer` as a region, and assert that the legacy `Activity rail` navigation no longer exists.

- [ ] **Step 6: Add the first premium shell/sidebar CSS slice**

Replace the shell geometry with these exact values:

```css
:root {
  --sidebar-width: 288px;
  --shell-gap: 16px;
  --control-radius: 10px;
  --pane-radius: 14px;
  --transition-fast: 180ms ease;
}

.app-shell { width: 100%; height: 100vh; overflow: hidden; background: var(--shell); }
.app-body { position: relative; display: grid; grid-template-columns: var(--sidebar-width) minmax(0, 1fr); width: 100%; height: 100%; }
.app-body[data-sidebar="hidden"] { grid-template-columns: minmax(0, 1fr); }
.premium-sidebar { display: flex; min-width: 0; min-height: 0; flex-direction: column; padding: 14px 12px; border-right: 1px solid var(--border); background: var(--sidebar); }
.sidebar-brand-card { display: grid; grid-template-columns: 36px minmax(0, 1fr) 32px; align-items: center; gap: 10px; padding: 8px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface-raised); }
.sidebar-settings-button { margin-top: auto; }
```

Restyle tree/header/settings states to match the approved token spacing. Remove all `.activity-*`, `.titlebar`, `.privacy-badge`, and legacy hidden-sidebar CSS.

- [ ] **Step 7: Run sidebar regression verification**

Run targeted tests:

```powershell
npm test -- --run src/features/workspace/PremiumSidebar.test.tsx src/features/workspace/WorkspaceExplorer.test.tsx src/app/App.test.tsx
```

Then run the complete verification commands from Global Constraints.

- [ ] **Step 8: Commit, publish, and merge the integrated-sidebar PR**

Commit message: `feat: add integrated premium sidebar`

Use branch `agent/premium-sidebar`, open a public PR titled `Add integrated premium sidebar`, inspect exact scope/mergeability, squash-merge, post-merge verify, and clean up.

---

### Task 3: Premium document chrome and workspace surfaces

**Files:**
- Create: `src/features/documents/DocumentHeader.tsx`
- Create: `src/features/documents/DocumentHeader.test.tsx`
- Modify: `src/features/documents/TabStrip.tsx`
- Modify: `src/features/documents/TabStrip.test.tsx`
- Modify: `src/features/layout/LayoutControls.tsx`
- Modify: `src/features/layout/LayoutControls.test.tsx`
- Modify: `src/features/documents/ConflictNotice.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/app.css`

**Interfaces:**
- Consumes: `useAppIconWeight` and the current `LayoutMode`, `SinglePaneMode`, and `SaveStatus` types.
- Produces: `DocumentHeaderProps` shown below.
- Preserves: save enabling rules remain owned by `App`; callbacks still call `documents.save` and the existing layout reducer.

- [ ] **Step 1: Write the failing document-header contract test**

Create `DocumentHeader.test.tsx` with:

```tsx
render(
  <DocumentHeader
    documentName="README.md"
    saveLabel="Unsaved changes"
    canSave
    saving={false}
    sidebarVisible={false}
    layout="single"
    singlePane="preview"
    onShowSidebar={onShowSidebar}
    onSave={onSave}
    onLayoutChange={onLayoutChange}
    onSinglePaneChange={onSinglePaneChange}
  />,
);
expect(screen.getByRole("banner", { name: "Document header" })).toBeVisible();
expect(screen.getByText("README.md")).toBeVisible();
expect(screen.getByText("Unsaved changes")).toBeVisible();
await user.click(screen.getByRole("button", { name: "Show sidebar" }));
await user.click(screen.getByRole("button", { name: "Save README.md" }));
expect(onShowSidebar).toHaveBeenCalledOnce();
expect(onSave).toHaveBeenCalledOnce();
```

- [ ] **Step 2: Run the document-header test and observe failure**

Run: `npm test -- --run src/features/documents/DocumentHeader.test.tsx`

Expected: FAIL because `DocumentHeader` does not exist.

- [ ] **Step 3: Implement `DocumentHeader`**

Use this exact interface:

```tsx
interface DocumentHeaderProps {
  documentName: string | null;
  saveLabel: string | null;
  canSave: boolean;
  saving: boolean;
  sidebarVisible: boolean;
  layout: LayoutMode;
  singlePane: SinglePaneMode;
  onShowSidebar(): void;
  onSave(): void;
  onLayoutChange(value: LayoutMode): void;
  onSinglePaneChange(value: SinglePaneMode): void;
}
```

Render a `header` with `role="banner" aria-label="Document header"`. Use direct Phosphor imports for `SidebarSimpleIcon`, `FileMdIcon`, and `FloppyDiskIcon`. Render the sidebar reveal only when hidden, a neutral file identity, save-state text, the existing save action, and `LayoutControls`.

- [ ] **Step 4: Migrate tabs, layout controls, conflict, and empty/status icons**

- `TabStrip`: add `FileMdIcon` before each filename and replace the multiplication glyph with `XIcon`; preserve sibling close buttons and dirty accessible text.
- `LayoutControls`: replace all mojibake glyphs with `PencilSimpleIcon`, `EyeIcon`, `SquareIcon`, `ColumnsIcon`, and `RowsIcon`; visible text remains for desktop and CSS hides only the label spans below 980 px.
- `ConflictNotice`: add `WarningDiamondIcon` and keep both explicit actions.
- `App` empty state: use `MarkdownLogoIcon`; status uses `HardDriveIcon` and `CheckCircleIcon` instead of text glyphs/dots.
- Add `data-icon-weight` to representative icons so component tests verify outline/solid mapping without depending on SVG paths.

- [ ] **Step 5: Replace the document composition in `App`**

Delete `header.document-toolbar`. Insert `DocumentHeader` immediately before `TabStrip`, move `TabStrip` directly after it, and leave the existing error, conflict, workspace, and footer blocks unchanged after the tab strip:

```tsx
<DocumentHeader
  documentName={activeDocument?.name ?? null}
  saveLabel={saveStatus}
  canSave={Boolean(activeDocument && isDirty && activeDocument.saveStatus !== "saving" && activeDocument.saveStatus !== "conflict")}
  saving={activeDocument?.saveStatus === "saving"}
  sidebarVisible={appearance.preferences.sidebarVisible}
  layout={layoutState.layout}
  singlePane={layoutState.singlePane}
  onShowSidebar={toggleSidebar}
  onSave={() => activeDocument && void documents.save(activeDocument.id)}
  onLayoutChange={(value) => dispatchLayout({ type: "layoutChanged", value })}
  onSinglePaneChange={(value) => dispatchLayout({ type: "singlePaneChanged", value })}
/>
<TabStrip
  tabs={documents.state.tabs}
  activeId={documents.state.activeId}
  onActivate={documents.activate}
  onClose={closeDocument}
/>
```

Delete the legacy `document-toolbar`/`document-heading` JSX. Continue calculating `saveLabel`, `isDirty`, `showEditor`, and `showPreview` in `App`.

- [ ] **Step 6: Apply the complete premium theme and workspace CSS**

Replace the existing navy dark variables with:

```css
:root[data-theme="dark"] {
  --shell: #0b0b0d;
  --sidebar: #0d0d0f;
  --surface: #111113;
  --surface-raised: #171719;
  --surface-muted: #1b1b1e;
  --hover: #202024;
  --border: #29292d;
  --border-strong: #37373c;
  --text: #f2f2f3;
  --muted: #a0a0a8;
  --subtle: #6f6f78;
}

:root[data-theme="light"] {
  --shell: #efefed;
  --sidebar: #f6f6f3;
  --surface: #fafaf8;
  --surface-raised: #ffffff;
  --surface-muted: #f1f1ee;
  --hover: #e9e9e5;
  --border: #deded8;
  --border-strong: #cecec7;
  --text: #18181a;
  --muted: #68686f;
  --subtle: #919198;
}
```

Use a 14 px inset workspace gap. Give `.surface-pane` a one-pixel border and 14 px radius; separate split/stacked panes with gap instead of shared hard dividers. Remove the radial gradient. Restyle tabs, header, segmented controls, editor gutters, preview typography, code blocks, tables, alerts, empty state, notices, and status bar with the same tokens. Do not alter Markdown parsing or editor extensions.

- [ ] **Step 7: Update tests and run complete verification**

Update existing assertions only where semantics intentionally changed. Add assertions for:

- sidebar reveal from `DocumentHeader`;
- Phosphor icons in tabs/layout controls;
- save disabled/saving states;
- conflict callout still retaining local edits;
- dirty close confirmation unchanged;
- no remaining mojibake glyphs in `src/**/*.tsx` via `rg -n "â|Ã|Â" src -g "*.tsx"` returning no matches.

Run all verification commands from Global Constraints.

- [ ] **Step 8: Commit, publish, and merge the document-chrome PR**

Commit message: `feat: redesign document workspace`

Use branch `agent/premium-document-workspace`, open public PR `Redesign premium document workspace`, inspect/merge/post-verify/clean up.

---

### Task 4: Appearance sheet, responsive behavior, and native visual validation

**Files:**
- Modify: `src/features/appearance/AppearancePanel.tsx`
- Modify: `src/features/appearance/AppearancePanel.test.tsx`
- Modify: `src/components/ui/filesystem-item.tsx`
- Modify: `src/components/ui/filesystem-item.test.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/app.css`
- Modify: `README.md`

**Interfaces:**
- Consumes: existing `AppearanceController`; no preference schema changes.
- Preserves: storage key `viwemd.appearance.v1`, Escape close, focus return, reset, theme, density, visibility, icon style, typography, and accent behavior.
- Produces: desktop anchored dialog styling, narrow centered modal styling, reduced-motion tree behavior, and documented premium shell behavior.

- [ ] **Step 1: Write failing Appearance dialog and reduced-motion tests**

Update `AppearancePanel.test.tsx` to require:

```tsx
expect(screen.getByRole("dialog", { name: "Appearance" })).toHaveAttribute("aria-modal", "true");
expect(screen.getByRole("button", { name: "Close appearance" }).querySelector("svg")).not.toBeNull();
expect(screen.getByRole("button", { name: "Reset appearance" }).querySelector("svg")).not.toBeNull();
```

Add a filesystem-item test that mocks Framer Motion’s `useReducedMotion` to `true` and asserts the motion list transition duration is `0`. Expose `data-motion-duration={reduceMotion ? 0 : 0.4}` on the animated group for deterministic testing.

- [ ] **Step 2: Run targeted tests and observe failures**

Run:

```powershell
npm test -- --run src/features/appearance/AppearancePanel.test.tsx src/components/ui/filesystem-item.test.tsx
```

Expected: FAIL because the panel is still complementary, action glyphs are text, and reduced motion is not wired.

- [ ] **Step 3: Rebuild the Appearance panel presentation**

Change the outer element to:

```tsx
<aside
  className="appearance-panel"
  role="dialog"
  aria-modal="true"
  aria-labelledby="appearance-title"
>
```

Use `XIcon` for Close and `ArrowCounterClockwiseIcon` for Reset. Add `DesktopIcon`, `SunIcon`, and `MoonIcon` decorations to System/Light/Dark choices. Use the shared icon-weight hook. Preserve all fieldsets, native radio/checkbox controls, typed updates, Escape handling, auto-focus, and reset behavior.

- [ ] **Step 4: Respect reduced motion in `FilesystemItem`**

Import `useReducedMotion` from Framer Motion:

```tsx
const prefersReducedMotion = useReducedMotion();
const motionDuration = prefersReducedMotion ? 0 : 0.4;
```

Use `motionDuration` for caret and child-list transitions and set `data-motion-duration={motionDuration}` on the motion list. Keep `bounce: 0`.

- [ ] **Step 5: Implement exact responsive CSS behavior**

Add:

```css
@media (max-width: 980px) {
  .control-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); }
  .markdown-preview { padding-inline: 32px; }
}

@media (max-width: 720px) {
  .app-body { display: block; }
  .premium-sidebar { position: absolute; z-index: 30; inset: 0 auto 0 0; width: min(288px, calc(100vw - 40px)); box-shadow: 24px 0 70px rgb(0 0 0 / 35%); }
  .appearance-panel { inset: 50% auto auto 50%; width: min(390px, calc(100vw - 24px)); max-height: calc(100vh - 24px); transform: translate(-50%, -50%); }
  .document-workspace[data-layout="split"] { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) minmax(0, 1fr); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```

Ensure icon-only controls keep `title` and accessible names. Ensure the sidebar reveal button remains reachable at narrow width.

- [ ] **Step 6: Run automated verification and source audits**

Run the complete verification commands plus:

```powershell
rg -n "lucide-react|â|Ã|Â" src package.json
npx --yes shadcn@latest info
```

Expected: no Lucide or mojibake matches; shadcn still recognizes Vite, TypeScript, Tailwind v4, `@`, and `src/components/ui`.

- [ ] **Step 7: Perform visual and native smoke validation**

Run `npm run tauri dev` and use a disposable local fixture folder containing `README.md` and `docs/setup.md`. Verify:

1. Dark, light, and system theme surfaces.
2. Outline and solid Phosphor icon weights.
3. Open folder, expand/collapse, and file activation.
4. Tab switching and dirty close protection.
5. Edit, Preview, Side by side, and Stacked layouts.
6. Save/autosave and the external-conflict callout.
7. Sidebar hide/reveal with button and `Ctrl/Cmd+B`.
8. Appearance open/close/reset and focus return.
9. Desktop width, below-980 icon controls, and below-720 overlay behavior.
10. No clipped controls, unintended whole-window scroll, illegible contrast, or visible mojibake.

Capture representative dark/light desktop and narrow screenshots for local review; do not commit fixture files or screenshots unless the user requests them.

- [ ] **Step 8: Update README and run the final verification gate**

Document the integrated sidebar, premium themes, Phosphor system, responsive behavior, and unchanged local-only boundary. Run all tests/build/Rust/diff checks fresh after the documentation change.

- [ ] **Step 9: Commit, publish, and merge the final polish PR**

Commit message: `feat: finish premium responsive shell`

Use branch `agent/premium-responsive-polish`, open public PR `Finish premium responsive shell`, include automated and native smoke evidence, inspect exact scope/mergeability, squash-merge, post-merge verify, and clean up.

---

## Final completion check

After Task 4 is merged:

```powershell
git pull --ff-only
npm install
npm test
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml --check
cargo check --manifest-path src-tauri/Cargo.toml --locked
git status --short
gh pr list --state open --head agent/phosphor-icons
gh pr list --state open --head agent/premium-sidebar
gh pr list --state open --head agent/premium-document-workspace
gh pr list --state open --head agent/premium-responsive-polish
```

Expected: all automated checks pass, `main` is clean, no task PR remains open, and all temporary branches/worktrees are removed.
