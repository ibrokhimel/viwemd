# Viwemd Markdown Desktop App Design

Date: 2026-07-31

## Product Summary

Viwemd is a cross-platform, local-first desktop application for browsing, editing, and rendering Markdown files. It opens a user-selected folder as a workspace, presents Markdown documents in a file tree and tabs, and supports single-pane, side-by-side, and stacked editing layouts.

The application runs entirely on the user's computer. It requires no account, backend service, cloud storage, telemetry, or AI provider. Document content never leaves the device. External links open in the system browser, while the app renders local images from the selected workspace.

## Goals

- Provide a polished Markdown reading and editing experience on Windows, macOS, and Linux.
- Make folder-based document collections easy to navigate with a file tree, search, tabs, and an outline.
- Render GitHub-flavored Markdown with high-value interactions for headings, tasks, code, links, images, tables, callouts, footnotes, emoji, frontmatter, and safe embedded HTML.
- Save edits automatically without silently overwriting external changes.
- Preserve unsaved work during filesystem failures or application crashes.
- Offer user-controlled themes, typography, accent colors, sidebar density, sidebar visibility, and icon style.
- Remain responsive with large documents, large folders, and multiple open tabs.

## Non-Goals for the First Release

- Cloud synchronization, accounts, collaboration, comments, or telemetry
- AI chat, code explanation, model selection, or generated edits
- Executing code blocks or terminal commands
- WYSIWYG or inline rich-text editing
- Math/LaTeX rendering and Mermaid diagrams
- Advanced spreadsheet-style table editing
- Moving or deleting files and folders from inside the app
- Gist, task-manager, source-control-host, or other online integrations
- Automatic loading of remote images or remote link-preview metadata

## Technology and Runtime

- **Desktop shell:** Tauri 2
- **Interface:** React with TypeScript
- **Build target:** Windows, macOS, and Linux desktop packages
- **Persistence:** User documents remain in their workspace; preferences and recovery data live in the operating system's application-data directory
- **Native boundary:** Tauri commands and plugins expose only the paths and operations needed by the selected workspace

Tauri uses the operating system webview instead of bundling a browser engine. Most product logic stays in TypeScript. A small Rust layer owns atomic replacement and any filesystem operations that need stronger guarantees than the frontend plugin provides.

## Architecture

### Interface Components

- **App shell:** Native-window content, command palette, global search entry, settings access, and window-level shortcuts.
- **Activity rail:** Switches between Explorer, Search, and Outline views and provides help access.
- **Workspace Explorer:** Displays supported Markdown files and folders, lazy-loads large trees, and tracks the active document.
- **Tab strip:** Opens multiple documents and shows active, dirty, externally changed, missing, and save-error states.
- **Layout controls:** Switch among single-pane, side-by-side, and stacked layouts. Single-pane is the default and toggles between Edit and Preview.
- **Markdown editor:** Source editor with undo/redo, Markdown-aware editing, selection, cursor restoration, and accessible keyboard operation.
- **Preview:** Sanitized rendered document plus approved element-specific interactions.
- **Appearance panel:** Controls theme, sidebar density, sidebar visibility, icon style, reading font, font size, and accent color.
- **Status bar:** Shows save state, file type, encoding, cursor position, and document statistics.

### Services and Stores

- **Workspace service:** Opens a folder, enforces workspace scope, discovers supported files, and builds the folder tree.
- **Document store:** Owns each open document's path, source, last persisted version, revision, cursor, scroll position, render state, and conflict state.
- **Markdown pipeline:** Parses GitHub-flavored Markdown, extracts frontmatter and outline data, sanitizes HTML, resolves local assets, and produces the preview model.
- **Save coordinator:** Debounces writes, serializes saves per file, performs atomic replacement, and reports durable save status.
- **Filesystem watcher:** Detects edits, renames, and deletions made outside Viwemd while suppressing events caused by the app's own saves.
- **Settings store:** Persists global appearance preferences and per-workspace session state locally.
- **Recovery store:** Keeps local snapshots only while a document contains changes that are not confirmed durable on disk.

Each interface component depends on service contracts rather than direct filesystem calls. This keeps native access narrow and allows the UI, Markdown pipeline, and save logic to be tested independently.

## Workspace and Document Behavior

1. The user selects a folder through a native dialog.
2. Viwemd grants access only to that folder, scans for supported Markdown files, and builds the Explorer tree.
3. Supported extensions are `.md`, `.markdown`, `.mdown`, `.mkd`, `.mkdn`, and `.mdwn`, matched without case sensitivity.
4. Selecting a file opens or activates a tab. Tabs retain cursor and scroll position while the application remains open.
5. The last workspace, tabs, active document, layout, and sidebar visibility are restored at startup when the paths remain available. Global appearance preferences are loaded separately.
6. Missing paths never block startup. The application opens an empty workspace and offers to choose another folder.

The default layout is single-pane with an Edit/Preview segmented control. Side-by-side places the editor left and preview right. Stacked places the editor above the preview. The user can change layouts through toolbar controls or keyboard shortcuts, and the selected layout is remembered per workspace.

The sidebar can be hidden through its control or `Ctrl/Cmd+B`. Its density can be Comfortable or Compact, and its icons can use Outline or Filled style.

### File Creation, Search, and Closing

New File creates an untitled in-memory Markdown document. Its first save uses a native Save As dialog scoped to the current workspace and requires one of the supported extensions. Save As is also available for existing documents. Moving and deleting files or folders are excluded from the first release.

Workspace search matches filenames and Markdown source text. Results show the relative path, line number, and a short source excerpt; activating a result opens its tab and selects the matching text. Search does not fetch, index, or inspect content outside the selected workspace, and no persistent search index is created.

Closing a tab first flushes its pending save. If saving fails or the document is in conflict, the app offers Keep Open, Save As, or Discard. Closing the application applies the same rule to every affected tab. Discard always requires explicit confirmation. Existing line-ending style, UTF-8 byte-order mark state, and final-newline state are preserved when an existing file is saved.

## Editing and Save Flow

Editor input updates the in-memory document immediately. Preview parsing is debounced so rapid typing does not block input. Autosave begins after 750 milliseconds without a new edit; `Ctrl/Cmd+S` requests an immediate save.

The visible save states are:

- **Editing:** Memory differs from the last durable disk version.
- **Saving:** A write is in progress.
- **Saved:** The current revision is confirmed durable.
- **Save failed:** Memory is preserved and the user can retry or save to another path.
- **Conflict:** An external version and a local edited version both exist; automatic saving is paused.

Saves are ordered per document. An older save completion cannot mark a newer revision as saved. The native layer writes to a temporary sibling file, flushes it, and replaces the target. If replacement fails, the original target remains intact and the edited source remains in memory and recovery storage.

While a document is dirty, its recovery snapshot is refreshed after 250 milliseconds without a new edit. This is independent of the 750-millisecond document autosave. A successful durable save removes the matching recovery snapshot.

## External Change and Conflict Flow

The watcher compares filesystem events with the document's last durable content identity rather than relying on timestamps alone.

- If a file changes externally and has no local edits, Viwemd reloads it and preserves the user's cursor and scroll position as closely as possible.
- If a file changes externally while local edits exist, Viwemd pauses autosave and offers Compare, Keep Mine, Reload Disk, or Save As.
- If an open file is deleted or renamed outside the app, its tab remains open with a Missing indicator. The source can be copied or saved to another path.
- Events caused by Viwemd's own atomic save are identified and ignored to avoid reload loops.

No conflict path silently discards either known version.

## Markdown Rendering Scope

### Base Syntax

The first release supports GitHub-flavored Markdown, including headings, paragraphs, bold, italic, strikethrough, inline code, fenced code blocks, blockquotes, ordered and unordered lists, task lists, links, images, tables, thematic breaks, and autolinks.

It also supports GitHub-style alerts, footnotes, emoji shortcodes, YAML frontmatter, and a sanitized subset of inline HTML.

### Interactive Enhancements

- **Headings:** Stable generated IDs, hover anchor controls, smooth internal navigation, copyable section references, and an Outline view. A copied reference uses `<workspace-relative-document-path>#<heading-id>` and is understood by Viwemd without registering a system-wide URL protocol. Duplicate headings receive deterministic suffixes.
- **Inline code:** Clear contrast and copy-on-hover.
- **Code blocks:** Syntax highlighting, copy-all, language label, line numbers, and word-wrap toggle. Diff blocks receive addition and deletion colors. Code never executes.
- **Blockquotes and alerts:** Nested quote styling and distinct Note, Tip, Important, Warning, and Caution treatments.
- **Lists:** Correct nesting and indentation guides. Ordered lists render semantic automatic numbering.
- **Task lists:** Checkboxes are keyboard accessible. Toggling a checkbox makes a targeted source edit and participates in normal undo and save behavior. A task-progress summary appears when tasks exist.
- **Links:** Local Markdown links open in app tabs. Heading links navigate within the preview. External links show an indicator and open through the operating system browser. The app does not fetch link-preview metadata.
- **Images:** Relative images and paths beginning with `/` support lazy loading, responsive sizing, optional title captions, accessible alt text, and lightbox zoom. A leading `/` resolves from the workspace root rather than the device filesystem root. Paths that resolve outside the workspace are blocked. Remote images are not fetched automatically in the first release.
- **Tables:** Row hover, sticky headers, sorting, cell copying, and CSV export. Sorting affects only the displayed view and never rewrites source Markdown.
- **Footnotes:** Hover preview, forward navigation, and return navigation.
- **Frontmatter:** Recognized fields are `title`, `author`, `date`, `updated`, `tags`, `cover`, and `draft`. Frontmatter stays hidden from the document body and supplies a metadata header. `title` becomes the visible document title only when the body has no level-one heading. `cover` accepts only a local path inside the workspace. Reading time is derived from body content. Unknown keys remain preserved and visible only in source.
- **Safe HTML:** The raw-HTML allowlist is `p`, `br`, `hr`, `strong`, `em`, `del`, `code`, `pre`, `blockquote`, `ul`, `ol`, `li`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `a`, `img`, `h1` through `h6`, `details`, `summary`, `kbd`, `mark`, `sub`, `sup`, and `abbr`. Allowed attributes are limited per element to content attributes such as `href`, `src`, `alt`, `title`, `open`, `colspan`, and `rowspan`. User-supplied styles, classes, scripts, event handlers, embedded frames, dangerous URL schemes, and all other elements or attributes are removed.

## Appearance and Accessibility

Theme options are Light, Dark, and System. System follows operating-system changes while the app is running. Users choose a reading font, reading size, preset accent color, or custom accent color. The editor's monospace settings remain separate from reading typography.

Appearance preferences are global. Layout and sidebar visibility are remembered per workspace. All preferences are stored locally.

The interface supports complete keyboard navigation, visible focus, semantic controls, screen-reader labels, sufficient contrast, zoom, and reduced motion. Color is never the only indicator of save, conflict, alert, or diff state. Preview-generated controls such as copy buttons and task checkboxes are reachable and operable without a pointer.

## Security and Privacy

- The application has no analytics, telemetry, account system, or background network service.
- Filesystem access is restricted to the selected workspace and app-data paths.
- Markdown is treated as untrusted input. HTML is sanitized before insertion into the document.
- JavaScript from documents never executes.
- Dangerous URL schemes are blocked.
- External links require an explicit click and open outside the application.
- Remote images and remote metadata are not fetched automatically.
- Recovery snapshots and recent-folder paths remain local and can be cleared from settings.

## Error Handling and Recovery

- Folder-access errors leave the current workspace unchanged and provide a retry action.
- Invalid or unreadable files open an error view without destabilizing other tabs.
- Rendering failures affect only that document's preview; source editing remains available.
- Missing images render an accessible placeholder containing the unresolved local path.
- Save failures retain the edited source in memory and recovery storage and expose Retry and Save As actions.
- Recovery snapshots are written for dirty revisions and removed after the matching revision is durably saved. On restart, newer recovery content is offered rather than applied silently.
- Large documents use reduced-effects mode: preview updates are less frequent, expensive decorations are disabled, and the editor remains responsive.
- A faulty document or plugin-free renderer feature cannot crash the entire workspace.

## Performance

- Folder nodes are loaded on demand instead of rendering an entire large tree at once.
- Markdown parsing work is debounced and isolated from editor input.
- Only the active preview performs rich rendering work.
- Tabs retain source and lightweight view state; inactive rendered preview trees are discarded and reconstructed when activated.
- Images are loaded lazily and constrained to the content width.
- Large-document mode activates when source exceeds 1 MiB or when three consecutive preview parses each exceed 100 milliseconds. Its status is visible to the user and clears after the document remains below both thresholds.

## Testing Strategy

- **Unit tests:** Markdown parsing, heading slugs, frontmatter, sanitization, task source edits, save-state transitions, settings, path validation, and conflict detection.
- **Component tests:** Explorer navigation, tabs, layouts, appearance controls, search, close confirmation, save indicators, error states, preview interactions, keyboard behavior, and accessibility semantics.
- **Filesystem integration tests:** Temporary workspaces exercise opening, scanning, atomic saving, watcher suppression, external edits, conflicts, renames, deletion, permissions failures, and recovery snapshots.
- **End-to-end tests:** Open folder, create and save a file, search, open tabs, edit, preview, switch layouts, autosave, close safely, restart, restore, detect external changes, and recover a dirty revision.
- **Security tests:** Scripts, event attributes, embedded frames, unsafe URLs, and malicious HTML fixtures cannot execute or escape the approved workspace scope.
- **Performance tests:** Large Markdown files, deep folder trees, many tabs, large tables, and image-heavy documents remain interactive.
- **Release checks:** Windows, macOS, and Linux packages build and pass a smoke workflow for opening, editing, saving, restarting, and recovering documents.

## First-Release Acceptance Criteria

The first release is ready when:

1. A user can install and run Viwemd on Windows, macOS, or Linux without a server or account.
2. A user can open a local folder, browse supported Markdown files, and work with multiple tabs.
3. All three layouts work and restore correctly.
4. Editing, live preview, delayed autosave, immediate save, atomic replacement, and visible save states work reliably.
5. External edits, deletes, and conflicts never cause silent data loss.
6. The defined Markdown syntax and first-release interactions render safely.
7. Appearance settings work, remain accessible, and persist locally.
8. Recovery restores newer unsaved work only after user confirmation.
9. The automated unit, component, integration, security, performance, end-to-end, and package smoke checks pass.
