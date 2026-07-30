import { join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { isMarkdownFile, sortWorkspaceEntries } from "./paths";
import type { WorkspacePort } from "./WorkspacePort";

export const tauriWorkspacePort: WorkspacePort = {
  async chooseFolder() {
    const selected = await open({ directory: true, multiple: false });
    return typeof selected === "string" ? selected : null;
  },

  async listDirectory(path) {
    const entries = await readDir(path);
    const mapped = await Promise.all(
      entries
        .filter(
          (entry) =>
            entry.isDirectory || (entry.isFile && isMarkdownFile(entry.name)),
        )
        .map(async (entry) => ({
          kind: entry.isDirectory ? ("directory" as const) : ("file" as const),
          name: entry.name,
          path: await join(path, entry.name),
        })),
    );

    return sortWorkspaceEntries(mapped);
  },

  async readDocument(path) {
    return { path, source: await readTextFile(path) };
  },
};
