import { isMarkdownFile, sortWorkspaceEntries } from "../platform/workspace/paths";
import type { WorkspacePort } from "../platform/workspace/WorkspacePort";
import type {
  ReadDocumentResult,
  WorkspaceEntry,
} from "../platform/workspace/types";

export class InMemoryWorkspacePort implements WorkspacePort {
  readonly listedDirectories: string[] = [];

  constructor(
    private readonly rootPath: string | null,
    private readonly files: Readonly<Record<string, string>>,
  ) {}

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

    return { path, source };
  }
}
