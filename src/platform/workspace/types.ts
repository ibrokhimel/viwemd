export type WorkspaceEntry =
  | { kind: "directory"; name: string; path: string }
  | { kind: "file"; name: string; path: string };

export type LineEnding = "lf" | "crlf";

export interface ReadDocumentResult {
  path: string;
  source: string;
  lineEnding: LineEnding;
}

export interface SaveDocumentRequest {
  path: string;
  source: string;
  expectedSource: string;
  lineEnding: LineEnding;
  force?: boolean;
}

export type SaveDocumentResult =
  | { status: "saved"; source: string }
  | { status: "conflict"; diskSource: string; lineEnding: LineEnding };
