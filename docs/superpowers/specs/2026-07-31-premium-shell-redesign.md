# Viwemd Premium Shell Redesign

## Goal

Redesign the complete Viwemd interface around the supplied premium dark application reference while preserving every working local-editor behavior. The result must feel calm, deliberate, and desktop-native rather than like a generic developer-tool scaffold.

The reference supplies the visual principles—near-black layered surfaces, quiet one-pixel borders, generous spacing, controlled radii, muted secondary text, and consistent line icons. Viwemd remains a Markdown editor; it will not copy dashboard content, account features, billing cards, or fake navigation.

## Chosen direction

Use a premium shell rebuild instead of a CSS-only reskin or workflow rewrite.

- Replace the activity rail plus Explorer combination with one integrated sidebar.
- Recompose the title, tabs, document actions, editor, preview, status, empty state, alerts, and Appearance panel into one coherent surface system.
- Preserve folder selection, lazy file browsing, tabs, editing, preview layouts, save/autosave/conflict behavior, appearance persistence, keyboard shortcuts, and Tauri permissions.
- Apply the redesign to Light, Dark, and System themes. Dark is the showcase reference; light uses the same hierarchy with warm neutral surfaces.

## Visual foundation

### Dark theme

- Window background: near-black charcoal rather than navy.
- Sidebar: the darkest surface, separated by a low-contrast border.
- Main workspace: slightly lighter than the sidebar.
- Elevated cards and controls: another subtle step lighter, never bright gray.
- Primary text: soft white; secondary text: neutral gray; disabled text remains legible.
- Accent color appears only on active navigation, focus rings, selections, progress, and critical status—not as broad gradients.

### Light theme

- Warm off-white window background and white elevated surfaces.
- Neutral gray borders and secondary text.
- The same dimensions, spacing, radii, and hierarchy as dark mode.
- Existing user-selected accent colors remain supported.

### Geometry and typography

- Integrated sidebar width: 288 px.
- Primary shell spacing: 16 px; dense control spacing: 8 px.
- Control radius: 10 px; elevated pane radius: 14 px.
- Borders: one pixel with low contrast; shadows used sparingly for floating UI only.
- UI typography remains a clean system sans; document typography preferences continue to affect rendered content.
- Uppercase micro-labels are removed where normal sentence case is clearer.

## Information architecture

### Integrated sidebar

The left sidebar owns navigation and the local workspace:

1. A compact Viwemd workspace card with the app mark, product name, and “Local workspace” status.
2. A primary Explorer row showing the active section and a sidebar-collapse action.
3. The current folder identity and an understated Open folder action.
4. The animated lazy-loading filesystem tree.
5. A flexible spacer.
6. A bottom Settings/Appearance row.

Search and Outline are omitted until functional instead of displaying dead premium-looking controls. Hiding the sidebar preserves `Ctrl/Cmd+B`; a reveal action appears in the document header when hidden.

### Document area

The main area is organized as:

1. A calm top bar with the active document identity, local status, save action, and sidebar reveal when needed.
2. A compact tab strip visually integrated with the top bar.
3. A secondary action row for Edit/Preview and layout selection.
4. An inset workspace with card-like editor and preview panes.
5. A low-noise status bar.

Single-pane, side-by-side, and stacked layouts retain their current state model. The layout controls become icon-led segmented controls. Labels remain visible at widths of 980 px and above; below 980 px, the buttons become icon-only and retain tooltips and accessible names.

## Component changes

- `App`: retains state orchestration but delegates shell regions to focused presentation components.
- `PremiumSidebar`: owns the workspace card, Explorer framing, collapse action, and Appearance entry.
- `WorkspaceExplorer`: owns folder selection and filesystem data only; it no longer renders a separate legacy sidebar header.
- `FilesystemItem`: migrates from Lucide to Phosphor while preserving lazy controlled expansion and Framer Motion transitions.
- `DocumentHeader`: contains document identity, save state/action, and layout actions.
- `TabStrip`: receives the new recessed/selected treatment and Phosphor close/file indicators.
- `AppearancePanel`: becomes a premium anchored sheet on desktop and a centered modal sheet below 720 px.
- `ConflictNotice` and empty/error states: become bordered callout cards with clear Phosphor status icons.

Components remain TypeScript React components under the existing feature structure; reusable primitives remain under `src/components/ui`.

## Phosphor icon system

Use `@phosphor-icons/react` for every shell, Explorer, tab, layout, status, and action icon. Remove `lucide-react` once the filesystem tree is migrated.

- Outline preference maps to `regular` weight.
- Solid preference maps to `fill` for suitable stateful icons and `bold` where a filled glyph would reduce clarity.
- Active navigation and folder icons use `fill`; inactive icons use `regular`. Under the solid preference, action icons that lack a clear filled treatment use `bold`.
- Icons inherit `currentColor`, remain decorative when adjacent to text, and receive accessible labels when they are the only content in a button.
- Import every icon from its individual `/dist/csr/<Icon>` module so Vite does not transform the entire icon catalog during development.

## Interaction and responsiveness

- Existing shortcuts remain: sidebar toggle, save, and editor behavior.
- Hover, pressed, focus, selected, disabled, saving, conflict, and error states receive explicit styling.
- Surface transitions use 180 ms easing; folder expansion keeps its existing 400 ms no-bounce spring. Reduced-motion preference disables nonessential movement.
- Below 720 px, the sidebar becomes an overlay sheet and the document area keeps the full viewport width.
- Below 980 px, layout labels collapse to icon-only buttons with tooltips.
- Editor and preview scrolling remain independent and never scroll the whole desktop shell.

## Accessibility

- Preserve semantic tree, tab, toolbar, dialog, status, and alert roles.
- Maintain visible keyboard focus with accent-colored rings.
- Text and controls meet WCAG AA contrast in both themes.
- Icon-only actions have descriptive accessible names and tooltips.
- The interface remains operable with keyboard only.
- Reduced-motion and operating-system theme preferences are respected.

## Testing and verification

- Update component tests for the integrated sidebar, sidebar reveal, Phosphor icons, layout controls, saving, tabs, and Appearance panel.
- Preserve all workspace, document, preview sanitization, persistence, and platform tests.
- Add tests ensuring outline/solid preferences select the intended Phosphor weights.
- Run the complete Vitest suite, TypeScript/Vite production build, Rust formatting/checks, and diff hygiene.
- Perform a native Tauri smoke check of opening a folder, expanding the tree, opening/editing/saving a Markdown file, switching layouts/themes, hiding/revealing the sidebar, and opening Appearance.
- Visually inspect representative dark and light states at desktop and narrow widths before merging.

## Out of scope

- New search, outline, account, collaboration, cloud, upgrade, analytics, or dashboard features.
- Changes to Markdown parsing or the persistence contract.
- Remote fonts, images, telemetry, or network-dependent UI.
- Copying the reference brand, logo, content, or promotional card.

## Acceptance criteria

- The entire visible shell uses the new premium surface, spacing, typography, and control system in dark and light themes.
- The activity rail is gone and the Explorer/Appearance entry live in one integrated sidebar.
- All visible functional icons use Phosphor and respect the stored icon-style preference.
- No working editor, preview, layout, tab, local-file, saving, conflict, appearance, or keyboard behavior regresses.
- Desktop and narrow layouts remain usable, accessible, and visually coherent.
