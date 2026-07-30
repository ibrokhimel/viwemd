import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
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
  save(id: string, options?: { force?: boolean }): Promise<void>;
  reloadDisk(id: string): void;
  overwriteConflict(id: string): Promise<void>;
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
  const stateRef = useRef(state);
  const inFlight = useRef(new Set<string>());
  const autosaveTimers = useRef(
    new Map<string, { source: string; timer: ReturnType<typeof setTimeout> }>(),
  );
  stateRef.current = state;

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
            lineEnding: result.lineEnding,
            saveStatus: "clean",
            saveError: null,
            conflictSource: null,
            conflictLineEnding: null,
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

  const save = useCallback(
    async (id: string, options: { force?: boolean } = {}) => {
      if (inFlight.current.has(id)) return;
      const document = stateRef.current.tabs.find((tab) => tab.id === id);
      if (!document || document.source === document.persistedSource) return;

      inFlight.current.add(id);
      const savedSource = document.source;
      const lineEnding =
        options.force && document.conflictLineEnding
          ? document.conflictLineEnding
          : document.lineEnding;
      dispatch({ type: "saveStarted", id });
      try {
        const result = await port.saveDocument({
          path: document.path,
          source: savedSource,
          expectedSource:
            options.force && document.conflictSource !== null
              ? document.conflictSource
              : document.persistedSource,
          lineEnding,
          force: options.force,
        });
        if (result.status === "conflict") {
          dispatch({
            type: "saveConflicted",
            id,
            diskSource: result.diskSource,
            lineEnding: result.lineEnding,
          });
        } else {
          dispatch({
            type: "saveSucceeded",
            id,
            savedSource: result.source,
            lineEnding,
          });
        }
      } catch (caught) {
        dispatch({ type: "saveFailed", id, error: getErrorMessage(caught) });
      } finally {
        inFlight.current.delete(id);
      }
    },
    [port],
  );

  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    const openIds = new Set(state.tabs.map((document) => document.id));
    for (const [id, scheduled] of autosaveTimers.current) {
      const document = state.tabs.find((tab) => tab.id === id);
      if (
        !openIds.has(id) ||
        document?.saveStatus !== "dirty" ||
        document.source !== scheduled.source
      ) {
        clearTimeout(scheduled.timer);
        autosaveTimers.current.delete(id);
      }
    }

    for (const document of state.tabs) {
      if (
        document.saveStatus !== "dirty" ||
        autosaveTimers.current.has(document.id)
      ) {
        continue;
      }
      const source = document.source;
      const timer = setTimeout(() => {
        autosaveTimers.current.delete(document.id);
        void saveRef.current(document.id);
      }, 750);
      autosaveTimers.current.set(document.id, { source, timer });
    }
  }, [state.tabs]);

  useEffect(
    () => () => {
      for (const scheduled of autosaveTimers.current.values()) {
        clearTimeout(scheduled.timer);
      }
      autosaveTimers.current.clear();
    },
    [],
  );

  const reloadDisk = useCallback((id: string) => {
    dispatch({ type: "diskReloaded", id });
  }, []);

  const overwriteConflict = useCallback(
    (id: string) => save(id, { force: true }),
    [save],
  );

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
    save,
    reloadDisk,
    overwriteConflict,
  };
}
