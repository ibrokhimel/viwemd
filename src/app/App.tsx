import { useEffect, useReducer, type ReactElement } from "react";
import { TabStrip } from "../features/documents/TabStrip";
import { useDocuments } from "../features/documents/useDocuments";
import { MarkdownEditor } from "../features/editor/MarkdownEditor";
import { LayoutControls } from "../features/layout/LayoutControls";
import {
  initialLayoutState,
  layoutReducer,
} from "../features/layout/layoutState";
import { MarkdownPreview } from "../features/preview/MarkdownPreview";
import { WorkspaceExplorer } from "../features/workspace/WorkspaceExplorer";
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
        dispatchLayout({ type: "sidebarToggled" });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
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
        data-sidebar={layoutState.sidebarVisible ? "visible" : "hidden"}
      >
        <nav className="activity-rail" aria-label="Activity rail">
          <button
            className={`activity-button${layoutState.sidebarVisible ? " is-active" : ""}`}
            type="button"
            aria-label={layoutState.sidebarVisible ? "Hide sidebar" : "Show sidebar"}
            aria-pressed={layoutState.sidebarVisible}
            title="Toggle Explorer (Ctrl/Cmd+B)"
            onClick={() => dispatchLayout({ type: "sidebarToggled" })}
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
            className="activity-button"
            type="button"
            aria-label="Appearance — coming soon"
            title="Appearance — coming soon"
            disabled
          >
            <span aria-hidden="true">⚙</span>
          </button>
        </nav>

        <WorkspaceExplorer
          port={workspacePort}
          hidden={!layoutState.sidebarVisible}
          onOpenFile={(path) => void documents.openPath(path)}
        />

        <section className="document-area" aria-label="Document workspace">
          <TabStrip
            tabs={documents.state.tabs}
            activeId={documents.state.activeId}
            onActivate={documents.activate}
            onClose={documents.close}
          />
          <header className="document-toolbar">
            <div className="document-heading">
              <span className="document-eyebrow">Document</span>
              <strong>{activeDocument?.name ?? "No document open"}</strong>
            </div>
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
          </header>

          {documents.error ? <p role="alert">{documents.error}</p> : null}
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
                    Changes are kept in memory; durable saving is not enabled yet
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
            {isDirty ? <span>Unsaved in-memory changes</span> : null}
            <span className="status-spacer" />
            <span>{activeDocument ? "Markdown" : "Ready"}</span>
          </footer>
        </section>
      </div>
    </main>
  );
}
