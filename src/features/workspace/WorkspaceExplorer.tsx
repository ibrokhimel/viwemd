import type { ReactElement } from "react";
import type { WorkspacePort } from "../../platform/workspace/WorkspacePort";
import type { WorkspaceEntry } from "../../platform/workspace/types";
import { useWorkspace, type WorkspaceController } from "./useWorkspace";

interface WorkspaceExplorerProps {
  port: WorkspacePort;
  onOpenFile(path: string): void;
  hidden?: boolean;
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
            <div className="tree-item" role="treeitem" key={entry.path}>
              <button
                className="tree-row"
                type="button"
                aria-label={`Open ${entry.name}`}
                title={entry.path}
                onClick={() => onOpenFile(entry.path)}
              >
                <span className="tree-icon file-icon" aria-hidden="true">
                  M
                </span>
                <span className="tree-name">{entry.name}</span>
              </button>
            </div>
          );
        }

        const isExpanded = controller.expandedDirectories.has(entry.path);
        return (
          <div
            className="tree-item"
            role="treeitem"
            aria-expanded={isExpanded}
            key={entry.path}
          >
            <button
              className="tree-row"
              type="button"
              aria-label={`${isExpanded ? "Collapse" : "Expand"} ${entry.name}`}
              title={entry.path}
              onClick={() => void controller.toggleDirectory(entry.path)}
            >
              <span className="tree-disclosure" aria-hidden="true">
                {isExpanded ? "⌄" : "›"}
              </span>
              <span className="tree-icon folder-icon" aria-hidden="true">
                ▰
              </span>
              <span className="tree-name">{entry.name}</span>
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
  hidden = false,
}: WorkspaceExplorerProps): ReactElement {
  const workspace = useWorkspace(port);
  const rootName = workspace.rootPath
    ?.split(/[\\/]/)
    .filter(Boolean)
    .at(-1);

  return (
    <aside
      className="workspace-explorer"
      aria-label="Workspace explorer"
      aria-busy={workspace.status === "loading"}
      hidden={hidden}
    >
      <header className="sidebar-header">
        <div>
          <span className="sidebar-eyebrow">Explorer</span>
          <strong title={workspace.rootPath ?? undefined}>
            {rootName ?? "No folder open"}
          </strong>
        </div>
        <button
          className="open-folder-button"
          type="button"
          onClick={() => void workspace.chooseFolder()}
        >
          <span aria-hidden="true">＋</span>
          Open folder
        </button>
      </header>
      {workspace.status === "loading" ? (
        <p className="sidebar-message" role="status">
          Loading workspace…
        </p>
      ) : null}
      {workspace.error ? (
        <p className="sidebar-message is-error" role="alert">
          {workspace.error}
        </p>
      ) : null}
      <div className="workspace-tree" role="tree" aria-label="Markdown files">
        {workspace.rootPath ? (
          <WorkspaceTree
            controller={workspace}
            directoryPath={workspace.rootPath}
            onOpenFile={onOpenFile}
          />
        ) : (
          <p className="sidebar-empty">Open a local folder to browse Markdown.</p>
        )}
      </div>
    </aside>
  );
}
