import { useCallback, useState } from "react";
import type { WorkspacePort } from "../../platform/workspace/WorkspacePort";
import type { WorkspaceEntry } from "../../platform/workspace/types";

export interface WorkspaceController {
  rootPath: string | null;
  entriesByDirectory: Readonly<Record<string, WorkspaceEntry[]>>;
  expandedDirectories: ReadonlySet<string>;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  chooseFolder(): Promise<void>;
  toggleDirectory(path: string): Promise<void>;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load workspace";
}

export function useWorkspace(port: WorkspacePort): WorkspaceController {
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [entriesByDirectory, setEntriesByDirectory] = useState<
    Record<string, WorkspaceEntry[]>
  >({});
  const [expandedDirectories, setExpandedDirectories] = useState<Set<string>>(
    new Set(),
  );
  const [status, setStatus] = useState<WorkspaceController["status"]>("idle");
  const [error, setError] = useState<string | null>(null);

  const chooseFolder = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const selected = await port.chooseFolder();
      if (selected === null) {
        setStatus(rootPath === null ? "idle" : "ready");
        return;
      }

      const entries = await port.listDirectory(selected);
      setRootPath(selected);
      setEntriesByDirectory({ [selected]: entries });
      setExpandedDirectories(new Set());
      setStatus("ready");
    } catch (caught) {
      setError(getErrorMessage(caught));
      setStatus("error");
    }
  }, [port, rootPath]);

  const toggleDirectory = useCallback(
    async (path: string) => {
      if (expandedDirectories.has(path)) {
        setExpandedDirectories((current) => {
          const next = new Set(current);
          next.delete(path);
          return next;
        });
        return;
      }

      setStatus("loading");
      setError(null);

      try {
        if (!Object.hasOwn(entriesByDirectory, path)) {
          const entries = await port.listDirectory(path);
          setEntriesByDirectory((current) => ({ ...current, [path]: entries }));
        }

        setExpandedDirectories((current) => new Set(current).add(path));
        setStatus("ready");
      } catch (caught) {
        setError(getErrorMessage(caught));
        setStatus("error");
      }
    },
    [entriesByDirectory, expandedDirectories, port],
  );

  return {
    rootPath,
    entriesByDirectory,
    expandedDirectories,
    status,
    error,
    chooseFolder,
    toggleDirectory,
  };
}
