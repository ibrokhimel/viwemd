import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { WorkspacePort } from "../../platform/workspace/WorkspacePort";
import { InMemoryWorkspacePort } from "../../test/InMemoryWorkspacePort";
import { useDocuments } from "./useDocuments";

describe("useDocuments", () => {
  it("loads a path once, derives its filename, and reactivates it", async () => {
    const port = new InMemoryWorkspacePort("/notes", {
      "/notes/README.md": "# Home",
      "/notes/setup.md": "# Setup",
    });
    const readDocument = vi.spyOn(port, "readDocument");
    const { result } = renderHook(() => useDocuments(port));

    await act(() => result.current.openPath("/notes/README.md"));
    await act(() => result.current.openPath("/notes/setup.md"));
    await act(() => result.current.openPath("/notes/README.md"));

    expect(readDocument).toHaveBeenCalledTimes(2);
    expect(result.current.state.tabs.map((document) => document.name)).toEqual([
      "README.md",
      "setup.md",
    ]);
    expect(result.current.activeDocument?.path).toBe("/notes/README.md");
  });

  it("derives filenames from Windows separators", async () => {
    const path = "C:\\notes\\guide.markdown";
    const port = new InMemoryWorkspacePort("C:\\notes", {
      [path]: "# Guide",
    });
    const { result } = renderHook(() => useDocuments(port));

    await act(() => result.current.openPath(path));

    expect(result.current.activeDocument?.name).toBe("guide.markdown");
  });

  it("reports read errors without discarding open documents", async () => {
    const source = new InMemoryWorkspacePort("/notes", {
      "/notes/README.md": "# Home",
    });
    const port: WorkspacePort = {
      chooseFolder: () => source.chooseFolder(),
      listDirectory: (path) => source.listDirectory(path),
      readDocument: async (path) => {
        if (path === "/notes/missing.md") throw new Error("Read failed");
        return source.readDocument(path);
      },
      saveDocument: (request) => source.saveDocument(request),
      watchDocument: (path, onChange) => source.watchDocument(path, onChange),
    };
    const { result } = renderHook(() => useDocuments(port));

    await act(() => result.current.openPath("/notes/README.md"));
    await act(() => result.current.openPath("/notes/missing.md"));

    expect(result.current.error).toBe("Read failed");
    expect(result.current.state.tabs).toHaveLength(1);
    expect(result.current.activeDocument?.name).toBe("README.md");
  });
});
