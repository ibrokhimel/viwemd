import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { AppearancePanel } from "../features/appearance/AppearancePanel";
import { useAppearance } from "../features/appearance/useAppearance";
import { TabStrip } from "../features/documents/TabStrip";
import { ConflictNotice } from "../features/documents/ConflictNotice";
import { useDocuments } from "../features/documents/useDocuments";
import { MarkdownEditor } from "../features/editor/MarkdownEditor";
import { LayoutControls } from "../features/layout/LayoutControls";
import {
  initialLayoutState,
  layoutReducer,
} from "../features/layout/layoutState";
import { MarkdownPreview } from "../features/preview/MarkdownPreview";
import { WorkspaceExplorer } from "../features/workspace/WorkspaceExplorer";
import { AppIconStyleProvider } from "../components/ui/AppIconStyle";
import { tauriWorkspacePort } from "../platform/workspace/tauriWorkspacePort";
import type { WorkspacePort } from "../platform/workspace/WorkspacePort";
import "./app.css";

interface AppProps {
  workspacePort?: WorkspacePort;
}

export function App({
  workspacePort = tauriWorkspacePort,
}: AppProps): ReactElement {
  const documents = useDocuments(workspacePort);
  const activeDocument = documents.activeDocument;
  const appearance = useAppearance();
  const toggleSidebar = appearance.toggleSidebar;
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const appearanceButtonRef = useRef<HTMLButtonElement>(null);
  const [layoutState, dispatchLayout] = useReducer(
    layoutReducer,
    initialLayoutState,
  );
  const isDirty =
    activeDocument?.source !== activeDocument?.persistedSource &&
    activeDocument !== null;
  const showEditor =
    activeDocument !== null &&
    (layoutState.layout !== "single" || layoutState.singlePane === "edit");
  const showPreview =
    activeDocument !== null &&
    (layoutState.layout !== "single" || layoutState.singlePane === "preview");

  const closeAppearance = useCallback(() => {
    setAppearanceOpen(false);
    appearanceButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const hasOnePrimaryModifier = event.ctrlKey !== event.metaKey;
      if (
        event.key.toLowerCase() === "b" &&
        hasOnePrimaryModifier &&
        !event.altKey &&
        !event.shiftKey
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  useEffect(() => {
    function handleSaveShortcut(event: KeyboardEvent) {
      const hasOnePrimaryModifier = event.ctrlKey !== event.metaKey;
      if (
        event.key.toLowerCase() === "s" &&
        hasOnePrimaryModifier &&
        !event.altKey &&
        !event.shiftKey &&
        activeDocument
      ) {
        event.preventDefault();
        void documents.save(activeDocument.id);
      }
    }

    window.addEventListener("keydown", handleSaveShortcut);
    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, [activeDocument, documents]);

  const saveStatus = activeDocument
    ? {
        clean: "Saved on disk",
        dirty: "Unsaved changes",
        saving: "Saving…",
        saved: "Saved locally",
        conflict: "External conflict",
        error: `Save failed: ${activeDocument.saveError ?? "Unknown error"}`,
      }[activeDocument.saveStatus]
    : null;

  const closeDocument = useCallback(
    (id: string) => {
      const document = documents.state.tabs.find((tab) => tab.id === id);
      if (
        document &&
        document.source !== document.persistedSource &&
        !window.confirm(
          `Close ${document.name} and discard its unsaved changes?`,
        )
      ) {
        return;
      }
      documents.close(id);
    },
    [documents],
  );

  return (
    <AppIconStyleProvider style={appearance.preferences.iconStyle}>
      <main className="app-shell">
      <header className="titlebar">
        <div className="app-identity">
          <span className="app-mark" aria-hidden="true">
            M↓
          </span>
          <div>
            <h1>Viwemd</h1>
            <p>Local Markdown workspace</p>
          </div>
        </div>
        <div className="privacy-badge">
          <span aria-hidden="true">●</span>
          On-device
        </div>
      </header>

      <div
        className="app-body"
        data-sidebar={
          appearance.preferences.sidebarVisible ? "visible" : "hidden"
        }
      >
        <nav className="activity-rail" aria-label="Activity rail">
          <button
            className={`activity-button${
              appearance.preferences.sidebarVisible ? " is-active" : ""
            }`}
            type="button"
            aria-label={
              appearance.preferences.sidebarVisible
                ? "Hide sidebar"
                : "Show sidebar"
            }
            aria-pressed={appearance.preferences.sidebarVisible}
            title="Toggle Explorer (Ctrl/Cmd+B)"
            onClick={toggleSidebar}
          >
            <span aria-hidden="true">▱</span>
          </button>
          <button
            className="activity-button"
            type="button"
            aria-label="Search — coming soon"
            title="Search — coming soon"
            disabled
          >
            <span aria-hidden="true">⌕</span>
          </button>
          <button
            className="activity-button"
            type="button"
            aria-label="Outline — coming soon"
            title="Outline — coming soon"
            disabled
          >
            <span aria-hidden="true">☷</span>
          </button>
          <span className="activity-spacer" />
          <button
            ref={appearanceButtonRef}
            className={`activity-button${appearanceOpen ? " is-active" : ""}`}
            type="button"
            aria-label="Appearance"
            aria-pressed={appearanceOpen}
            title="Appearance"
            onClick={() => setAppearanceOpen((open) => !open)}
          >
            <span aria-hidden="true">⚙</span>
          </button>
        </nav>

        <WorkspaceExplorer
          port={workspacePort}
          hidden={!appearance.preferences.sidebarVisible}
          onOpenFile={(path) => void documents.openPath(path)}
        />

        {appearanceOpen ? (
          <AppearancePanel appearance={appearance} onClose={closeAppearance} />
        ) : null}

        <section className="document-area" aria-label="Document workspace">
          <TabStrip
            tabs={documents.state.tabs}
            activeId={documents.state.activeId}
            onActivate={documents.activate}
            onClose={closeDocument}
          />
          <header className="document-toolbar">
            <div className="document-heading">
              <span className="document-eyebrow">Document</span>
              <strong>{activeDocument?.name ?? "No document open"}</strong>
            </div>
            <div className="document-actions">
              <button
                className="save-button"
                type="button"
                aria-label={
                  activeDocument
                    ? `Save ${activeDocument.name}`
                    : "Save document"
                }
                disabled={
                  !activeDocument ||
                  !isDirty ||
                  activeDocument.saveStatus === "saving" ||
                  activeDocument.saveStatus === "conflict"
                }
                onClick={() =>
                  activeDocument && void documents.save(activeDocument.id)
                }
              >
                <span aria-hidden="true">⌘</span>
                {activeDocument?.saveStatus === "saving" ? "Saving…" : "Save"}
              </button>
              <LayoutControls
                layout={layoutState.layout}
                singlePane={layoutState.singlePane}
                onLayoutChange={(value) =>
                  dispatchLayout({ type: "layoutChanged", value })
                }
                onSinglePaneChange={(value) =>
                  dispatchLayout({ type: "singlePaneChanged", value })
                }
              />
            </div>
          </header>

          {documents.error ? <p role="alert">{documents.error}</p> : null}
          {activeDocument?.saveStatus === "conflict" ? (
            <ConflictNotice
              onReload={() => documents.reloadDisk(activeDocument.id)}
              onOverwrite={() =>
                void documents.overwriteConflict(activeDocument.id)
              }
            />
          ) : null}
          <div
            className="document-workspace"
            data-testid="document-workspace"
            data-layout={layoutState.layout}
          >
            {activeDocument ? (
              <>
                {showEditor ? (
                  <section className="surface-pane editor-pane" aria-label="Editor pane">
                    <div className="pane-label">Markdown source</div>
                    <MarkdownEditor
                      key={activeDocument.id}
                      value={activeDocument.source}
                      onChange={(source) =>
                        documents.updateSource(activeDocument.id, source)
                      }
                    />
                  </section>
                ) : null}
                {showPreview ? (
                  <section className="surface-pane preview-pane" aria-label="Preview pane">
                    <div className="pane-label">Preview</div>
                    <MarkdownPreview source={activeDocument.source} />
                  </section>
                ) : null}
                {isDirty ? (
                  <p className="memory-notice">
                    Unsaved changes will autosave locally
                  </p>
                ) : null}
              </>
            ) : (
              <div className="empty-document">
                <span className="empty-mark" aria-hidden="true">
                  M↓
                </span>
                <h2>Open a Markdown file</h2>
                <p>Choose a folder, then select a document from the Explorer.</p>
              </div>
            )}
          </div>

          <footer className="status-bar" aria-label="Document status" aria-live="polite">
            <span>
              <span className="status-dot" aria-hidden="true" />
              Local only
            </span>
            {saveStatus ? <span>{saveStatus}</span> : null}
            <span className="status-spacer" />
            <span>{activeDocument ? "Markdown" : "Ready"}</span>
          </footer>
        </section>
      </div>
      </main>
    </AppIconStyleProvider>
  );
}
