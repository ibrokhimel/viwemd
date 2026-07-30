import type { ReactElement } from "react";
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
      <WorkspaceExplorer port={workspacePort} onOpenFile={() => undefined} />
    </main>
  );
}
