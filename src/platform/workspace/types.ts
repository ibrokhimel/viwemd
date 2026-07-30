export type WorkspaceEntry =
  | { kind: "directory"; name: string; path: string }
  | { kind: "file"; name: string; path: string };

export interface ReadDocumentResult {
  path: string;
  source: string;
}
