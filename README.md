# Viwemd

A local-first, cross-platform Markdown workspace and renderer built with Tauri, React, and TypeScript.

## Current status

The repository currently contains the tested desktop shell and native build foundation. Folder browsing, tabs, editing, preview, layouts, and safe persistence land as separate reviewed pull requests.

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

Validate the project:

```sh
npm test
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
```

Viwemd has no backend, account, telemetry, or cloud dependency. Document writing remains disabled until atomic persistence and conflict recovery are implemented.
