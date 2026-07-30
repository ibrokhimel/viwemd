import { join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import {
  readDir,
  readTextFile,
  remove,
  rename,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { isMarkdownFile, sortWorkspaceEntries } from "./paths";
import {
  normalizeDocumentText,
  parseDocumentText,
  serializeDocumentText,
} from "./textFormat";
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
    return { path, ...parseDocumentText(await readTextFile(path)) };
  },

  async saveDocument(request) {
    const disk = parseDocumentText(await readTextFile(request.path));
    if (
      !request.force &&
      disk.source !== normalizeDocumentText(request.expectedSource)
    ) {
      return {
        status: "conflict",
        diskSource: disk.source,
        lineEnding: disk.lineEnding,
      };
    }

    const source = normalizeDocumentText(request.source);
    const tempPath = `${request.path}.viwemd-${crypto.randomUUID()}.tmp`;
    try {
      await writeTextFile(
        tempPath,
        serializeDocumentText(source, request.lineEnding),
        { createNew: true },
      );
      await rename(tempPath, request.path);
      return { status: "saved", source };
    } catch (error) {
      try {
        await remove(tempPath);
      } catch {
        // The temporary file may not exist when creation itself failed.
      }
      throw error;
    }
  },

  async watchDocument(_path, _onChange) {
    return () => {};
  },
};
