# Viwemd

A local-first, cross-platform Markdown workspace and renderer built with Tauri, React, and TypeScript.

## Current status

The foundation workspace is operational: choose a local folder, lazily browse supported Markdown files, open multiple tabs, edit with CodeMirror, render a sanitized GitHub-flavored Markdown preview, and switch among single-pane, side-by-side, and stacked layouts.

Supported filename extensions are `.md`, `.markdown`, `.mdown`, `.mkd`, `.mkdn`, and `.mdwn`, matched without case sensitivity.

The current slice is deliberately read-only on disk. Editor changes stay in memory and are labeled as unsaved; no Save control or document-writing permission is enabled until atomic persistence, recovery snapshots, and conflict handling are implemented.

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

## Foundation controls

- Open a folder from the Explorer and select Markdown files to open tabs.
- Use Edit or Preview for a single pane, or choose Side by side or Stacked.
- Toggle the Explorer with its activity-rail button or `Ctrl+B` / `Cmd+B`.
- The interface follows the operating system light or dark preference. Persistent Light, Dark, and System choices plus typography, accent, density, and icon settings land in the appearance slice.

Validate the project:

```sh
npm test
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

Viwemd has no backend, account, telemetry, or cloud dependency. Markdown is treated as untrusted input: raw HTML is sanitized, generated heading IDs are collision-resistant, and the desktop content security policy blocks remote images and document scripts.
