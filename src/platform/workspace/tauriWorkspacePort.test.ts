import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  join: vi.fn(),
  open: vi.fn(),
  readDir: vi.fn(),
  readTextFile: vi.fn(),
  remove: vi.fn(),
  rename: vi.fn(),
  writeTextFile: vi.fn(),
}));

vi.mock("@tauri-apps/api/path", () => ({ join: mocks.join }));
vi.mock("@tauri-apps/plugin-dialog", () => ({ open: mocks.open }));
vi.mock("@tauri-apps/plugin-fs", () => ({
  readDir: mocks.readDir,
  readTextFile: mocks.readTextFile,
  remove: mocks.remove,
  rename: mocks.rename,
  writeTextFile: mocks.writeTextFile,
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
    mocks.readTextFile.mockResolvedValue("# Local\r\ndocument\r\n");

    await expect(tauriWorkspacePort.readDocument("/vault/readme.md")).resolves.toEqual({
      path: "/vault/readme.md",
      source: "# Local\ndocument\n",
      lineEnding: "crlf",
    });
    expect(mocks.readTextFile).toHaveBeenCalledWith("/vault/readme.md");
  });

  it("writes a unique sibling then atomically renames it", async () => {
    mocks.readTextFile.mockResolvedValue("# Old\r\n");
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "00000000-0000-4000-8000-000000000001",
    );

    await expect(
      tauriWorkspacePort.saveDocument({
        path: "/vault/readme.md",
        source: "# New\n",
        expectedSource: "# Old\n",
        lineEnding: "crlf",
      }),
    ).resolves.toEqual({ status: "saved", source: "# New\n" });

    const tempPath =
      "/vault/readme.md.viwemd-00000000-0000-4000-8000-000000000001.tmp";
    expect(mocks.writeTextFile).toHaveBeenCalledWith(tempPath, "# New\r\n", {
      createNew: true,
    });
    expect(mocks.rename).toHaveBeenCalledWith(tempPath, "/vault/readme.md");
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("does not write when the preflight detects a conflict", async () => {
    mocks.readTextFile.mockResolvedValue("# External\n");

    await expect(
      tauriWorkspacePort.saveDocument({
        path: "/vault/readme.md",
        source: "# Mine\n",
        expectedSource: "# Old\n",
        lineEnding: "lf",
      }),
    ).resolves.toEqual({
      status: "conflict",
      diskSource: "# External\n",
      lineEnding: "lf",
    });
    expect(mocks.writeTextFile).not.toHaveBeenCalled();
    expect(mocks.rename).not.toHaveBeenCalled();
  });

  it("best-effort removes the sibling after a failed rename", async () => {
    mocks.readTextFile.mockResolvedValue("# Old\n");
    mocks.rename.mockRejectedValue(new Error("Rename failed"));
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "00000000-0000-4000-8000-000000000002",
    );

    await expect(
      tauriWorkspacePort.saveDocument({
        path: "/vault/readme.md",
        source: "# New\n",
        expectedSource: "# Old\n",
        lineEnding: "lf",
      }),
    ).rejects.toThrow("Rename failed");

    expect(mocks.remove).toHaveBeenCalledWith(
      "/vault/readme.md.viwemd-00000000-0000-4000-8000-000000000002.tmp",
    );
  });
});
