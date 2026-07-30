import type { WorkspaceEntry } from "./types";

const MARKDOWN_EXTENSION = /\.(md|markdown|mdown|mkd|mkdn|mdwn)$/i;

export function isMarkdownFile(name: string): boolean {
  return name.length > 3 && MARKDOWN_EXTENSION.test(name);
}

export function sortWorkspaceEntries(
  entries: WorkspaceEntry[],
): WorkspaceEntry[] {
  return [...entries].sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === "directory" ? -1 : 1;
    }

    return left.name.localeCompare(right.name, undefined, {
      sensitivity: "base",
    });
  });
}
