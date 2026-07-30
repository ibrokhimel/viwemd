import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkspacePort } from "../../platform/workspace/WorkspacePort";
import { InMemoryWorkspacePort } from "../../test/InMemoryWorkspacePort";
import { useDocuments } from "./useDocuments";

describe("useDocuments", () => {
  afterEach(() => vi.useRealTimers());

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

  it("saves the captured source and keeps later edits dirty", async () => {
    const port = new InMemoryWorkspacePort("/notes", {
      "/notes/README.md": "# Home\n",
    });
    const { result } = renderHook(() => useDocuments(port));

    await act(() => result.current.openPath("/notes/README.md"));
    act(() => result.current.updateSource("/notes/README.md", "# Edited\n"));
    await act(() => result.current.save("/notes/README.md"));

    expect(port.getFileSource("/notes/README.md")).toBe("# Edited\n");
    expect(result.current.activeDocument).toMatchObject({
      persistedSource: "# Edited\n",
      saveStatus: "saved",
    });
  });

  it("autosaves 750 ms after the last edit", async () => {
    vi.useFakeTimers();
    const port = new InMemoryWorkspacePort("/notes", {
      "/notes/README.md": "# Home\n",
    });
    const { result } = renderHook(() => useDocuments(port));

    await act(() => result.current.openPath("/notes/README.md"));
    act(() => result.current.updateSource("/notes/README.md", "# Edited\n"));
    act(() => vi.advanceTimersByTime(749));
    expect(port.savedDocuments).toHaveLength(0);

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(port.savedDocuments).toHaveLength(1);
  });

  it("surfaces conflicts, reloads disk, and force-overwrites explicitly", async () => {
    const port = new InMemoryWorkspacePort("/notes", {
      "/notes/README.md": "# Home\n",
    });
    const { result } = renderHook(() => useDocuments(port));

    await act(() => result.current.openPath("/notes/README.md"));
    act(() => result.current.updateSource("/notes/README.md", "# Mine\n"));
    port.simulateExternalEdit("/notes/README.md", "# External\r\n");
    await act(() => result.current.save("/notes/README.md"));
    expect(result.current.activeDocument).toMatchObject({
      source: "# Mine\n",
      saveStatus: "conflict",
      conflictSource: "# External\n",
    });

    await act(() => result.current.overwriteConflict("/notes/README.md"));
    expect(port.getFileSource("/notes/README.md")).toBe("# Mine\r\n");
    expect(result.current.activeDocument?.saveStatus).toBe("saved");

    act(() => result.current.updateSource("/notes/README.md", "# Again\n"));
    port.simulateExternalEdit("/notes/README.md", "# New external\n");
    await act(() => result.current.save("/notes/README.md"));
    act(() => result.current.reloadDisk("/notes/README.md"));
    expect(result.current.activeDocument).toMatchObject({
      source: "# New external\n",
      persistedSource: "# New external\n",
      saveStatus: "clean",
    });
  });

  it("keeps dirty source and reports a save failure", async () => {
    const port = new InMemoryWorkspacePort("/notes", {
      "/notes/README.md": "# Home\n",
    });
    port.failNextSave(new Error("Disk full"));
    const { result } = renderHook(() => useDocuments(port));

    await act(() => result.current.openPath("/notes/README.md"));
    act(() => result.current.updateSource("/notes/README.md", "# Mine\n"));
    await act(() => result.current.save("/notes/README.md"));

    expect(result.current.activeDocument).toMatchObject({
      source: "# Mine\n",
      persistedSource: "# Home\n",
      saveStatus: "error",
      saveError: "Disk full",
    });
    expect(port.getFileSource("/notes/README.md")).toBe("# Home\n");
  });
});
