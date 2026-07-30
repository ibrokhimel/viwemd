import type { ReactElement } from "react";
import { FolderOpenIcon } from "@phosphor-icons/react/dist/csr/FolderOpen";
import {
  FilesystemItem,
  type FilesystemNode,
} from "@/components/ui/filesystem-item";
import { useAppIconWeight } from "@/components/ui/AppIconStyle";
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

function toFilesystemNodes(
  controller: WorkspaceController,
  directoryPath: string,
): FilesystemNode[] {
  const entries = controller.entriesByDirectory[directoryPath] ?? [];

  return entries.map((entry: WorkspaceEntry): FilesystemNode => {
    if (entry.kind === "file") {
      return entry;
    }

    const hasLoadedChildren = Object.hasOwn(
      controller.entriesByDirectory,
      entry.path,
    );

    return {
      ...entry,
      expanded: controller.expandedDirectories.has(entry.path),
      nodes: hasLoadedChildren
        ? toFilesystemNodes(controller, entry.path)
        : undefined,
    };
  });
}

function WorkspaceTree({
  controller,
  directoryPath,
  onOpenFile,
}: WorkspaceTreeProps): ReactElement {
  const nodes = toFilesystemNodes(controller, directoryPath);

  return (
    <>
      {nodes.map((node) => (
        <FilesystemItem
          node={node}
          key={node.path}
          animated
          onToggle={(directory) =>
            directory.path
              ? controller.toggleDirectory(directory.path)
              : undefined
          }
          onOpenFile={(file) => {
            if (file.path) onOpenFile(file.path);
          }}
        />
      ))}
    </>
  );
}

export function WorkspaceExplorer({
  port,
  onOpenFile,
}: WorkspaceExplorerProps): ReactElement {
  const workspace = useWorkspace(port);
  const iconWeight = useAppIconWeight();
  const rootName = workspace.rootPath
    ?.split(/[\\/]/)
    .filter(Boolean)
    .at(-1);

  return (
    <section
      className="workspace-explorer"
      aria-label="Workspace explorer"
      aria-busy={workspace.status === "loading"}
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
          <FolderOpenIcon weight={iconWeight} aria-hidden="true" />
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
      {workspace.rootPath ? (
        <ul
          className="workspace-tree"
          role="tree"
          aria-label="Markdown files"
        >
          <WorkspaceTree
            controller={workspace}
            directoryPath={workspace.rootPath}
            onOpenFile={onOpenFile}
          />
        </ul>
      ) : (
        <div className="workspace-tree">
          <p className="sidebar-empty">Open a local folder to browse Markdown.</p>
        </div>
      )}
    </section>
  );
}
