# Viwemd

A local-first, cross-platform Markdown workspace and renderer built with Tauri, React, and TypeScript.

## Current status

The foundation workspace is operational: choose a local folder, lazily browse supported Markdown files, open multiple tabs, edit with CodeMirror, render a sanitized GitHub-flavored Markdown preview, switch among single-pane, side-by-side, and stacked layouts, and personalize the interface with persistent appearance controls.

Supported filename extensions are `.md`, `.markdown`, `.mdown`, `.mkd`, `.mkdn`, and `.mdwn`, matched without case sensitivity.

Editor changes currently stay in memory and are labeled as unsaved because the Save/autosave UI lands in the next slice. The workspace boundary now has a tested atomic-write primitive: it compares fresh disk content, preserves LF or CRLF, writes a unique sibling temporary file, and renames only after that write succeeds. Nothing in the current interface invokes it yet.

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

## Workspace controls

- Open a folder from the Explorer and select Markdown files to open tabs.
- Use Edit or Preview for a single pane, or choose Side by side or Stacked.
- Toggle the Explorer with its activity-rail button or `Ctrl+B` / `Cmd+B`.
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
