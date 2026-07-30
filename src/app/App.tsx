import type { ReactElement } from "react";
import { TabStrip } from "../features/documents/TabStrip";
import { useDocuments } from "../features/documents/useDocuments";
import { MarkdownEditor } from "../features/editor/MarkdownEditor";
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
            <MarkdownEditor
              key={activeDocument.id}
              value={activeDocument.source}
              onChange={(source) =>
                documents.updateSource(activeDocument.id, source)
              }
            />
            <MarkdownPreview source={activeDocument.source} />
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
