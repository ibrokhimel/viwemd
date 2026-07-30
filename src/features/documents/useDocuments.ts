import { useCallback, useMemo, useReducer, useState } from "react";
import type { WorkspacePort } from "../../platform/workspace/WorkspacePort";
import {
  documentReducer,
  initialDocumentState,
  type DocumentState,
  type OpenDocument,
} from "./documentState";

export interface DocumentsController {
  state: DocumentState;
  activeDocument: OpenDocument | null;
  error: string | null;
  openPath(path: string): Promise<void>;
  activate(id: string): void;
  close(id: string): void;
  updateSource(id: string, source: string): void;
}

function filenameFromPath(path: string): string {
  return path.split(/[\\/]/).filter(Boolean).at(-1) ?? path;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to read document";
}

export function useDocuments(port: WorkspacePort): DocumentsController {
  const [state, dispatch] = useReducer(documentReducer, initialDocumentState);
  const [error, setError] = useState<string | null>(null);

  const openPath = useCallback(
    async (path: string) => {
      setError(null);
      const existing = state.tabs.find((document) => document.path === path);
      if (existing) {
        dispatch({ type: "activated", id: existing.id });
        return;
      }

      try {
        const result = await port.readDocument(path);
        dispatch({
          type: "opened",
          document: {
            id: result.path,
            path: result.path,
            name: filenameFromPath(result.path),
            source: result.source,
            persistedSource: result.source,
            cursorOffset: 0,
            editorScrollTop: 0,
            previewScrollTop: 0,
          },
        });
      } catch (caught) {
        setError(getErrorMessage(caught));
      }
    },
    [port, state.tabs],
  );

  const activate = useCallback((id: string) => {
    dispatch({ type: "activated", id });
  }, []);

  const close = useCallback((id: string) => {
    dispatch({ type: "closed", id });
  }, []);

  const updateSource = useCallback((id: string, source: string) => {
    dispatch({ type: "sourceChanged", id, source });
  }, []);

  const activeDocument = useMemo(
    () => state.tabs.find((document) => document.id === state.activeId) ?? null,
    [state.activeId, state.tabs],
  );

  return {
    state,
    activeDocument,
    error,
    openPath,
    activate,
    close,
    updateSource,
  };
}
