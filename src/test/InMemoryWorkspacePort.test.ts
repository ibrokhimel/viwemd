import { describe, expect, it } from "vitest";
import { InMemoryWorkspacePort } from "./InMemoryWorkspacePort";

const files = {
  "/vault/README.md": "# Root",
  "/vault/notes/zeta.md": "# Zeta",
  "/vault/notes/alpha.markdown": "# Alpha",
  "/vault/notes/ignore.txt": "not Markdown",
  "/vault/archive/deep/file.md": "# Deep",
  "/vault/plain.txt": "not Markdown",
};

describe("InMemoryWorkspacePort", () => {
  it("returns the configured folder selection", async () => {
    const port = new InMemoryWorkspacePort("/vault", files);
    const cancelledPort = new InMemoryWorkspacePort(null, files);

    await expect(port.chooseFolder()).resolves.toBe("/vault");
    await expect(cancelledPort.chooseFolder()).resolves.toBeNull();
  });

  it("derives sorted immediate Markdown children and records listings", async () => {
    const port = new InMemoryWorkspacePort("/vault", files);

    await expect(port.listDirectory("/vault")).resolves.toEqual([
      { kind: "directory", name: "archive", path: "/vault/archive" },
      { kind: "directory", name: "notes", path: "/vault/notes" },
      { kind: "file", name: "README.md", path: "/vault/README.md" },
    ]);
    await expect(port.listDirectory("/vault/notes")).resolves.toEqual([
      {
        kind: "file",
        name: "alpha.markdown",
        path: "/vault/notes/alpha.markdown",
      },
      { kind: "file", name: "zeta.md", path: "/vault/notes/zeta.md" },
    ]);
    expect(port.listedDirectories).toEqual(["/vault", "/vault/notes"]);
  });

  it("reads existing documents and rejects missing paths", async () => {
    const port = new InMemoryWorkspacePort("/vault", files);

    await expect(port.readDocument("/vault/README.md")).resolves.toEqual({
      path: "/vault/README.md",
      source: "# Root",
      lineEnding: "lf",
    });
    await expect(port.readDocument("/vault/missing.md")).rejects.toThrow(
      "Document not found: /vault/missing.md",
    );
  });
});
