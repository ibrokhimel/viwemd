import type { ReactElement } from "react";
import { TabStrip } from "../features/documents/TabStrip";
import { useDocuments } from "../features/documents/useDocuments";
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

  return (
    <main className="app-shell">
      <div className="app-identity">
        <span className="app-mark" aria-hidden="true">
          M↓
        </span>
        <div>
          <h1>Viwemd</h1>
          <p>Local Markdown workspace</p>
        </div>
      </div>
      <WorkspaceExplorer
        port={workspacePort}
        onOpenFile={(path) => void documents.openPath(path)}
      />
      <section aria-label="Document workspace">
        <TabStrip
          tabs={documents.state.tabs}
          activeId={documents.state.activeId}
          onActivate={documents.activate}
          onClose={documents.close}
        />
        {documents.error ? <p role="alert">{documents.error}</p> : null}
        {activeDocument ? (
          <>
            <textarea
              aria-label="Markdown source"
              value={activeDocument.source}
              onChange={(event) =>
                documents.updateSource(activeDocument.id, event.target.value)
              }
            />
            {activeDocument.source !== activeDocument.persistedSource ? (
              <p>
                Changes are kept in memory; durable saving is not enabled yet
              </p>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}
