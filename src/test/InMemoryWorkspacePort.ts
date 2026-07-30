import { isMarkdownFile, sortWorkspaceEntries } from "../platform/workspace/paths";
import type { WorkspacePort } from "../platform/workspace/WorkspacePort";
import type {
  ReadDocumentResult,
  SaveDocumentRequest,
  SaveDocumentResult,
  WorkspaceEntry,
} from "../platform/workspace/types";
import {
  normalizeDocumentText,
  parseDocumentText,
  serializeDocumentText,
} from "../platform/workspace/textFormat";

export class InMemoryWorkspacePort implements WorkspacePort {
  readonly listedDirectories: string[] = [];
  readonly savedDocuments: SaveDocumentRequest[] = [];
  private readonly files: Record<string, string>;
  private nextSaveError: Error | null = null;

  constructor(
    private readonly rootPath: string | null,
    files: Readonly<Record<string, string>>,
  ) {
    this.files = { ...files };
  }

  async chooseFolder(): Promise<string | null> {
    return this.rootPath;
  }

  async listDirectory(path: string): Promise<WorkspaceEntry[]> {
    this.listedDirectories.push(path);
    const prefix = path.endsWith("/") ? path : `${path}/`;
    const children = new Map<string, WorkspaceEntry>();

    for (const filePath of Object.keys(this.files)) {
      if (!filePath.startsWith(prefix)) continue;

      const [name, ...remaining] = filePath.slice(prefix.length).split("/");
      if (!name) continue;

      const entry =
        remaining.length > 0
          ? { kind: "directory" as const, name, path: `${prefix}${name}` }
          : { kind: "file" as const, name, path: filePath };

      if (entry.kind === "directory" || isMarkdownFile(entry.name)) {
        children.set(entry.path, entry);
      }
    }

    return sortWorkspaceEntries([...children.values()]);
  }

  async readDocument(path: string): Promise<ReadDocumentResult> {
    const source = this.files[path];
    if (source === undefined) {
      throw new Error(`Document not found: ${path}`);
    }

    return { path, ...parseDocumentText(source) };
  }

  async saveDocument(
    request: SaveDocumentRequest,
  ): Promise<SaveDocumentResult> {
    if (this.nextSaveError) {
      const error = this.nextSaveError;
      this.nextSaveError = null;
      throw error;
    }

    const current = this.files[request.path];
    if (current === undefined) {
      throw new Error(`Document not found: ${request.path}`);
    }

    const disk = parseDocumentText(current);
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
    this.files[request.path] = serializeDocumentText(source, request.lineEnding);
    this.savedDocuments.push({ ...request, source });
    return { status: "saved", source };
  }

  async watchDocument(
    _path: string,
    _onChange: () => void,
  ): Promise<() => void> {
    return () => {};
  }

  getFileSource(path: string): string | undefined {
    return this.files[path];
  }

  simulateExternalEdit(path: string, source: string): void {
    this.files[path] = source;
  }

  failNextSave(error: Error): void {
    this.nextSaveError = error;
  }
}
