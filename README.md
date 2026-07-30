# Viwemd

A local-first, cross-platform Markdown workspace and renderer built with Tauri, React, and TypeScript.

## Current status

The foundation workspace is operational: choose a local folder, browse its animated lazy-loading file tree, open multiple tabs, edit with CodeMirror, render a sanitized GitHub-flavored Markdown preview, switch among single-pane, side-by-side, and stacked layouts, and personalize the interface with persistent appearance controls.

Supported filename extensions are `.md`, `.markdown`, `.mdown`, `.mkd`, `.mkdn`, and `.mdwn`, matched without case sensitivity.

Editor changes autosave locally 750 ms after the last edit and can be saved immediately from the toolbar. Every save compares fresh disk content, preserves LF or CRLF, writes a unique sibling temporary file, and renames only after that write succeeds. External changes stop the write and offer explicit Reload disk or Overwrite disk choices; dirty tabs ask before discarding local edits. Crash-recovery snapshots and live filesystem watching land in the next persistence slices.

## Development

Requirements:

- Node.js 24 or newer
- npm 11 or newer
- Rust 1.97 or newer
- The platform prerequisites listed by Tauri for Windows, macOS, or Linux

Install and run the frontend:

```sh
npm install
npm run dev
```

Run the native desktop app:

```sh
npm run tauri dev
```

### UI component structure

Viwemd uses TypeScript, Tailwind CSS through the Vite plugin, and a shadcn-compatible `components.json`. Reusable primitives live in `src/components/ui`, global styles live in `src/app/app.css`, and the `@/` alias resolves to `src/`. Keeping reusable UI in `src/components/ui` lets the shadcn CLI place and rewrite component imports consistently while feature folders remain focused on app behavior.

The animated `FilesystemItem` primitive uses Lucide icons and Framer Motion. `WorkspaceExplorer` adapts real lazy-loaded local folder entries to that reusable component; the demo data is not bundled into the app, and no image assets are required.

## Workspace controls

- Open a folder from the Explorer and select Markdown files to open tabs.
- Use Edit or Preview for a single pane, or choose Side by side or Stacked.
- Toggle the Explorer with its activity-rail button or `Ctrl+B` / `Cmd+B`.
- Save immediately from the document toolbar or with `Ctrl+S` / `Cmd+S`; otherwise a dirty document autosaves after 750 ms.
- If the file changed outside Viwemd, choose Reload disk to use that version or Overwrite disk to keep the editor version.
- Open Appearance from the bottom of the activity rail to choose Light, Dark, or System theme; compact, comfortable, or spacious sidebar density; outline or solid icons; sans, serif, or mono document typography; and one of five named accent colors.
- Appearance choices and sidebar visibility stay on this device under the versioned `viwemd.appearance.v1` preference. System theme follows live operating-system changes, and Reset appearance restores all defaults.

Validate the project:

```sh
npm test
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

Viwemd has no backend, account, telemetry, or cloud dependency. Markdown is treated as untrusted input: raw HTML is sanitized, generated heading IDs are collision-resistant, and the desktop content security policy blocks remote images and document scripts.

Filesystem commands remain scoped by Tauri to the folder selected through the native dialog. The atomic persistence boundary adds only text-write, rename, and temporary-file cleanup commands; it does not grant a blanket home-directory scope.
