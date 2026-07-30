import type { ReadDocumentResult, WorkspaceEntry } from "./types";

export interface WorkspacePort {
  chooseFolder(): Promise<string | null>;
  listDirectory(path: string): Promise<WorkspaceEntry[]>;
  readDocument(path: string): Promise<ReadDocumentResult>;
}
