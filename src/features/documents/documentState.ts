import type { LineEnding } from "../../platform/workspace/types";

export type SaveStatus =
  | "clean"
  | "dirty"
  | "saving"
  | "saved"
  | "conflict"
  | "error";

export interface OpenDocument {
  id: string;
  path: string;
  name: string;
  source: string;
  persistedSource: string;
  lineEnding: LineEnding;
  saveStatus: SaveStatus;
  saveError: string | null;
  conflictSource: string | null;
  conflictLineEnding: LineEnding | null;
  cursorOffset: number;
  editorScrollTop: number;
  previewScrollTop: number;
}

export interface DocumentState {
  tabs: OpenDocument[];
  activeId: string | null;
}

export type DocumentAction =
  | { type: "opened"; document: OpenDocument }
  | { type: "activated"; id: string }
  | { type: "closed"; id: string }
  | { type: "sourceChanged"; id: string; source: string }
  | { type: "saveStarted"; id: string }
  | {
      type: "saveSucceeded";
      id: string;
      savedSource: string;
      lineEnding: LineEnding;
    }
  | { type: "saveFailed"; id: string; error: string }
  | {
      type: "saveConflicted";
      id: string;
      diskSource: string;
      lineEnding: LineEnding;
    }
  | { type: "diskReloaded"; id: string }
  | { type: "cursorChanged"; id: string; cursorOffset: number }
  | { type: "editorScrolled"; id: string; editorScrollTop: number }
  | { type: "previewScrolled"; id: string; previewScrollTop: number };

export const initialDocumentState: DocumentState = {
  tabs: [],
  activeId: null,
};

function updateDocument(
  state: DocumentState,
  id: string,
  update: (document: OpenDocument) => OpenDocument,
): DocumentState {
  const index = state.tabs.findIndex((document) => document.id === id);
  if (index < 0) return state;

  const current = state.tabs[index];
  const updated = update(current);
  if (updated === current) return state;

  const tabs = [...state.tabs];
  tabs[index] = updated;
  return { ...state, tabs };
}

export function documentReducer(
  state: DocumentState,
  action: DocumentAction,
): DocumentState {
  switch (action.type) {
    case "opened": {
      const existing = state.tabs.find(
        (document) => document.path === action.document.path,
      );
      if (existing) {
        return state.activeId === existing.id
          ? state
          : { ...state, activeId: existing.id };
      }

      return {
        tabs: [...state.tabs, action.document],
        activeId: action.document.id,
      };
    }

    case "activated": {
      if (
        state.activeId === action.id ||
        !state.tabs.some((document) => document.id === action.id)
      ) {
        return state;
      }

      return { ...state, activeId: action.id };
    }

    case "closed": {
      const index = state.tabs.findIndex((document) => document.id === action.id);
      if (index < 0) return state;

      const tabs = state.tabs.filter((document) => document.id !== action.id);
      if (state.activeId !== action.id) return { ...state, tabs };

      return {
        tabs,
        activeId: tabs[index]?.id ?? tabs[index - 1]?.id ?? null,
      };
    }

    case "sourceChanged":
      return updateDocument(state, action.id, (document) =>
        document.source === action.source
          ? document
          : {
              ...document,
              source: action.source,
              saveStatus:
                action.source === document.persistedSource ? "clean" : "dirty",
              saveError: null,
              conflictSource: null,
              conflictLineEnding: null,
            },
      );

    case "saveStarted":
      return updateDocument(state, action.id, (document) => ({
        ...document,
        saveStatus: "saving",
        saveError: null,
      }));

    case "saveSucceeded":
      return updateDocument(state, action.id, (document) => ({
        ...document,
        persistedSource: action.savedSource,
        lineEnding: action.lineEnding,
        saveStatus:
          document.source === action.savedSource ? "saved" : "dirty",
        saveError: null,
        conflictSource: null,
        conflictLineEnding: null,
      }));

    case "saveFailed":
      return updateDocument(state, action.id, (document) => ({
        ...document,
        saveStatus: "error",
        saveError: action.error,
      }));

    case "saveConflicted":
      return updateDocument(state, action.id, (document) => ({
        ...document,
        saveStatus: "conflict",
        saveError: null,
        conflictSource: action.diskSource,
        conflictLineEnding: action.lineEnding,
      }));

    case "diskReloaded":
      return updateDocument(state, action.id, (document) =>
        document.conflictSource === null
          ? document
          : {
              ...document,
              source: document.conflictSource,
              persistedSource: document.conflictSource,
              lineEnding: document.conflictLineEnding ?? document.lineEnding,
              saveStatus: "clean",
              saveError: null,
              conflictSource: null,
              conflictLineEnding: null,
            },
      );

    case "cursorChanged":
      return updateDocument(state, action.id, (document) =>
        document.cursorOffset === action.cursorOffset
          ? document
          : { ...document, cursorOffset: action.cursorOffset },
      );

    case "editorScrolled":
      return updateDocument(state, action.id, (document) =>
        document.editorScrollTop === action.editorScrollTop
          ? document
          : { ...document, editorScrollTop: action.editorScrollTop },
      );

    case "previewScrolled":
      return updateDocument(state, action.id, (document) =>
        document.previewScrollTop === action.previewScrollTop
          ? document
          : { ...document, previewScrollTop: action.previewScrollTop },
      );
  }
}
