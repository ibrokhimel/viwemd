# Viwemd Appearance Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Use test-driven development for every behavior change.

**Goal:** Add persistent, accessible appearance controls for Light/Dark/System theme, sidebar visibility and density, icon style, typography, and accent color.

**Architecture:** A versioned `AppearancePreferences` value is the single source of truth for display settings. Pure parsing and normalization functions protect the app from malformed local storage, while a React hook persists validated preferences and applies semantic data attributes/CSS variables to the root document. The appearance panel edits this state through typed controls; `App` consumes the same state for sidebar visibility, including `Ctrl/Cmd+B`, so the panel and shell never drift apart.

**Tech Stack:** Existing React 19, TypeScript 7, Vitest, Testing Library, CSS custom properties, browser `localStorage`, and `matchMedia`. No new runtime dependency or native permission is required.

## Constraints

- Keep all preferences on-device under a versioned local-storage key; no backend, account, or telemetry.
- Treat stored JSON as untrusted: reject invalid values field-by-field and preserve valid fields.
- Default to System theme, comfortable density, outline icons, sans typography, violet accent, and a visible sidebar.
- System theme must respond to live operating-system color-scheme changes without rewriting the saved preference.
- Every visual choice must retain text labels, visible focus, sufficient contrast, and reduced-motion behavior.
- Sidebar visibility is owned by appearance state after this slice; layout state remains responsible only for document pane layout.
- Persist only after initialization so malformed storage is safely normalized without render-time writes.
- Open a public ready PR, verify it, squash-merge it, remove its branch/worktree, and fast-forward `main`.

## Stable Types

```ts
export type ThemePreference = "system" | "light" | "dark";
export type SidebarDensity = "compact" | "comfortable" | "spacious";
export type IconStyle = "outline" | "solid";
export type TypographyPreference = "sans" | "serif" | "mono";
export type AccentPreference = "violet" | "blue" | "emerald" | "rose" | "amber";

export interface AppearancePreferences {
  version: 1;
  theme: ThemePreference;
  sidebarDensity: SidebarDensity;
  sidebarVisible: boolean;
  iconStyle: IconStyle;
  typography: TypographyPreference;
  accent: AccentPreference;
}
```

---

### Task 1: Versioned Preference Domain and Storage

**Branch:** `agent/appearance-settings`

**Files:**
- Create: `src/features/appearance/appearancePreferences.ts`
- Create: `src/features/appearance/appearancePreferences.test.ts`
- Create: `src/features/appearance/appearanceStorage.ts`
- Create: `src/features/appearance/appearanceStorage.test.ts`

- [ ] **Step 1: Create the implementation worktree from updated `main`**

```powershell
git pull --ff-only origin main
git worktree add -b agent/appearance-settings .worktrees/appearance-settings main
npm ci
```

- [ ] **Step 2: Write failing preference normalization tests**

Cover defaults, a fully valid value, malformed JSON, non-object input, unknown enum values, wrong booleans, and mixed input where valid fields survive while invalid fields fall back.

```ts
expect(normalizeAppearancePreferences({ theme: "dark", accent: "blue" })).toMatchObject({
  theme: "dark",
  accent: "blue",
  sidebarDensity: "comfortable",
});
```

- [ ] **Step 3: Verify RED, then implement pure domain helpers**

Run: `npm test -- src/features/appearance/appearancePreferences.test.ts`

Expected: FAIL because the module does not exist.

Export `defaultAppearancePreferences`, `normalizeAppearancePreferences(value)`, `resolveTheme(theme, systemIsDark)`, and preset maps for accent colors and font stacks. Use explicit allowlists rather than unchecked type assertions.

- [ ] **Step 4: Write failing storage tests, then implement the adapter**

Use key `viwemd.appearance.v1`. Cover empty storage, valid JSON, malformed JSON, and serialized writes. Export:

```ts
export function readAppearancePreferences(storage: Pick<Storage, "getItem">): AppearancePreferences;
export function writeAppearancePreferences(
  storage: Pick<Storage, "setItem">,
  preferences: AppearancePreferences,
): void;
```

The read path never throws. The write path stores only the normalized versioned object.

---

### Task 2: Appearance Hook and Root Application

**Files:**
- Create: `src/features/appearance/useAppearance.ts`
- Create: `src/features/appearance/useAppearance.test.tsx`
- Modify: `src/test/setup.ts`

- [ ] **Step 1: Write failing hook tests**

Cover initialization from storage, a typed field update, reset to defaults, persistence after changes, root `data-theme`, `data-density`, `data-icon-style`, and `data-typography` attributes, accent custom properties, and live System-theme changes dispatched from a controllable `matchMedia` test double.

- [ ] **Step 2: Verify RED, then implement the hook**

Run: `npm test -- src/features/appearance/useAppearance.test.tsx`

Expected: FAIL because the hook does not exist.

The hook returns:

```ts
interface AppearanceController {
  preferences: AppearancePreferences;
  resolvedTheme: "light" | "dark";
  update<K extends keyof Omit<AppearancePreferences, "version">>(
    key: K,
    value: AppearancePreferences[K],
  ): void;
  toggleSidebar(): void;
  reset(): void;
}
```

Apply attributes to `document.documentElement`, set `color-scheme`, `--accent`, `--accent-strong`, and `--accent-soft`, subscribe only while theme is `system`, and remove listeners/temporary inline values on cleanup.

---

### Task 3: Accessible Appearance Panel

**Files:**
- Create: `src/features/appearance/AppearancePanel.tsx`
- Create: `src/features/appearance/AppearancePanel.test.tsx`

- [ ] **Step 1: Write failing component tests**

Cover the title, labeled radio groups for theme/density/icons/typography/accent, checked state, update callbacks, sidebar visibility switch, reset, and close button. Verify Escape closes the panel and focus returns to the opener through the App integration test in Task 4.

- [ ] **Step 2: Verify RED, then implement semantic controls**

Run: `npm test -- src/features/appearance/AppearancePanel.test.tsx`

Expected: FAIL because the panel does not exist.

Render a non-modal complementary panel labeled `Appearance`. Use native radio inputs grouped by fieldset/legend, a checkbox for `Show sidebar`, visible color names alongside swatches, and buttons named `Reset appearance` and `Close appearance`. Do not rely on icons or color alone.

---

### Task 4: Compose Settings into the Shell

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/app.css`
- Modify: `src/features/layout/layoutState.ts`
- Modify: `src/features/layout/layoutState.test.ts`
- Modify: `README.md`

- [ ] **Step 1: Write the failing integration tests**

Cover opening Appearance from the activity rail, changing each setting, observing root attributes/styles, hiding/showing the sidebar from either the panel or `Ctrl/Cmd+B`, preserving the selected folder while hidden, closing with Escape, reopening with persisted choices, and resetting defaults.

- [ ] **Step 2: Verify RED, then make appearance the sidebar source of truth**

Run: `npm test -- src/app/App.test.tsx`

Expected: FAIL because Appearance is disabled and settings are unavailable.

Remove `sidebarVisible` and `sidebarToggled` from layout state. Instantiate `useAppearance()` in `App`; use `preferences.sidebarVisible` for grid composition and `toggleSidebar()` for the rail and keyboard shortcut. Enable the Appearance activity button and render `AppearancePanel` without unmounting Explorer state.

- [ ] **Step 3: Implement theme/density/icon/typography/accent CSS**

Replace media-query-only colors with default tokens plus `:root[data-theme="dark"]` overrides. Map density to row/padding variables, icon style to outlined/filled visual treatment, typography to document font variables, and accents to hook-provided custom properties. Keep responsive behavior, focus indication, high-contrast-safe borders, and `prefers-reduced-motion` intact.

- [ ] **Step 4: Update documentation**

Describe on-device persistence, all appearance controls, System live updates, sidebar shortcut behavior, and Reset. Remove wording that says appearance is only planned.

- [ ] **Step 5: Run complete verification and native smoke**

Run:

```powershell
npm test
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml --check
$env:CARGO_HTTP_MULTIPLEXING='false'; cargo check --manifest-path src-tauri/Cargo.toml --locked
git diff --check
npm run tauri dev
```

In the native app, open Appearance, exercise every setting, toggle the sidebar with both UI and keyboard, switch the OS-aware theme selection, and restart once to confirm persistence. Confirm no document write permission was introduced.

- [ ] **Step 6: Publish and merge**

Commit as `feat: add persistent appearance settings`, push `agent/appearance-settings`, open a public ready PR, inspect its exact file scope and mergeability, squash-merge it, rerun tests/build from updated `main`, and safely remove the worktree and local branch.

## Exit Criteria

- Light, Dark, and System are selectable; System follows live OS changes.
- Sidebar visibility, three densities, two icon styles, three typography choices, and five named accents are selectable and persisted locally.
- The rail shortcut and Appearance panel share one sidebar state and preserve Explorer contents.
- Invalid stored preferences cannot crash the app or bypass allowed choices.
- Settings remain usable by keyboard and do not depend on color/icon-only labels.
- No new network access, native permission, or document write behavior is introduced.
- Tests, frontend build, Rust formatting/check, diff checks, and native smoke all pass.
