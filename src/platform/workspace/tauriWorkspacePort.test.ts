import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  join: vi.fn(),
  open: vi.fn(),
  readDir: vi.fn(),
  readTextFile: vi.fn(),
}));

vi.mock("@tauri-apps/api/path", () => ({ join: mocks.join }));
vi.mock("@tauri-apps/plugin-dialog", () => ({ open: mocks.open }));
vi.mock("@tauri-apps/plugin-fs", () => ({
  readDir: mocks.readDir,
  readTextFile: mocks.readTextFile,
}));

import { tauriWorkspacePort } from "./tauriWorkspacePort";

describe("tauriWorkspacePort", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.join.mockImplementation(async (...parts: string[]) => parts.join("/"));
  });

  it("opens a single directory and represents cancellation as null", async () => {
    mocks.open.mockResolvedValueOnce("/vault").mockResolvedValueOnce(null);

    await expect(tauriWorkspacePort.chooseFolder()).resolves.toBe("/vault");
    await expect(tauriWorkspacePort.chooseFolder()).resolves.toBeNull();
    expect(mocks.open).toHaveBeenCalledWith({
      directory: true,
      multiple: false,
    });
  });

  it("maps, filters, joins, and sorts native directory entries", async () => {
    mocks.readDir.mockResolvedValue([
      { name: "Zoo.md", isDirectory: false, isFile: true },
      { name: "docs", isDirectory: true, isFile: false },
      { name: "ignore.txt", isDirectory: false, isFile: true },
      { name: "about.MDOWN", isDirectory: false, isFile: true },
    ]);

    await expect(tauriWorkspacePort.listDirectory("/vault")).resolves.toEqual([
      { kind: "directory", name: "docs", path: "/vault/docs" },
      { kind: "file", name: "about.MDOWN", path: "/vault/about.MDOWN" },
      { kind: "file", name: "Zoo.md", path: "/vault/Zoo.md" },
    ]);
    expect(mocks.readDir).toHaveBeenCalledWith("/vault");
    expect(mocks.join).not.toHaveBeenCalledWith("/vault", "ignore.txt");
  });

  it("returns source text from the native filesystem", async () => {
    mocks.readTextFile.mockResolvedValue("# Local document");

    await expect(tauriWorkspacePort.readDocument("/vault/readme.md")).resolves.toEqual({
      path: "/vault/readme.md",
      source: "# Local document",
    });
    expect(mocks.readTextFile).toHaveBeenCalledWith("/vault/readme.md");
  });
});
