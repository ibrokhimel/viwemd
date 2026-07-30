import type {
  ReadDocumentResult,
  SaveDocumentRequest,
  SaveDocumentResult,
  WorkspaceEntry,
} from "./types";

export interface WorkspacePort {
  chooseFolder(): Promise<string | null>;
  listDirectory(path: string): Promise<WorkspaceEntry[]>;
  readDocument(path: string): Promise<ReadDocumentResult>;
  saveDocument(request: SaveDocumentRequest): Promise<SaveDocumentResult>;
  watchDocument(path: string, onChange: () => void): Promise<() => void>;
}
