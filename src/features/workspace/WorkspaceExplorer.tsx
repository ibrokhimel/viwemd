import type { ReactElement } from "react";
import type { WorkspacePort } from "../../platform/workspace/WorkspacePort";
import type { WorkspaceEntry } from "../../platform/workspace/types";
import { useWorkspace, type WorkspaceController } from "./useWorkspace";

interface WorkspaceExplorerProps {
  port: WorkspacePort;
  onOpenFile(path: string): void;
}

interface WorkspaceTreeProps {
  controller: WorkspaceController;
  directoryPath: string;
  onOpenFile(path: string): void;
}

function WorkspaceTree({
  controller,
  directoryPath,
  onOpenFile,
}: WorkspaceTreeProps): ReactElement {
  const entries = controller.entriesByDirectory[directoryPath] ?? [];

  return (
    <>
      {entries.map((entry: WorkspaceEntry) => {
        if (entry.kind === "file") {
          return (
            <div role="treeitem" key={entry.path}>
              <button type="button" onClick={() => onOpenFile(entry.path)}>
                Open {entry.name}
              </button>
            </div>
          );
        }

        const isExpanded = controller.expandedDirectories.has(entry.path);
        return (
          <div role="treeitem" aria-expanded={isExpanded} key={entry.path}>
            <button
              type="button"
              onClick={() => void controller.toggleDirectory(entry.path)}
            >
              {isExpanded ? "Collapse" : "Expand"} {entry.name}
            </button>
            {isExpanded ? (
              <div role="group">
                <WorkspaceTree
                  controller={controller}
                  directoryPath={entry.path}
                  onOpenFile={onOpenFile}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </>
  );
}

export function WorkspaceExplorer({
  port,
  onOpenFile,
}: WorkspaceExplorerProps): ReactElement {
  const workspace = useWorkspace(port);

  return (
    <aside
      aria-label="Workspace explorer"
      aria-busy={workspace.status === "loading"}
    >
      <button type="button" onClick={() => void workspace.chooseFolder()}>
        Open folder
      </button>
      {workspace.status === "loading" ? (
        <p role="status">Loading workspace…</p>
      ) : null}
      {workspace.error ? <p role="alert">{workspace.error}</p> : null}
      <div role="tree" aria-label="Markdown files">
        {workspace.rootPath ? (
          <WorkspaceTree
            controller={workspace}
            directoryPath={workspace.rootPath}
            onOpenFile={onOpenFile}
          />
        ) : null}
      </div>
    </aside>
  );
}
