import { describe, expect, it } from "vitest";
import { InMemoryWorkspacePort } from "../../test/InMemoryWorkspacePort";

describe("workspace persistence contract", () => {
  it("saves when disk still matches and preserves line endings", async () => {
    const port = new InMemoryWorkspacePort("/notes", {
      "/notes/readme.md": "# Old\r\n",
    });

    await expect(
      port.saveDocument({
        path: "/notes/readme.md",
        source: "# New\n",
        expectedSource: "# Old\n",
        lineEnding: "crlf",
      }),
    ).resolves.toEqual({ status: "saved", source: "# New\n" });
    expect(port.getFileSource("/notes/readme.md")).toBe("# New\r\n");
    expect(port.savedDocuments).toHaveLength(1);
  });

  it("returns a conflict without changing either version", async () => {
    const port = new InMemoryWorkspacePort("/notes", {
      "/notes/readme.md": "# Old\n",
    });
    port.simulateExternalEdit("/notes/readme.md", "# External\r\n");

    await expect(
      port.saveDocument({
        path: "/notes/readme.md",
        source: "# Mine\n",
        expectedSource: "# Old\n",
        lineEnding: "lf",
      }),
    ).resolves.toEqual({
      status: "conflict",
      diskSource: "# External\n",
      lineEnding: "crlf",
    });
    expect(port.getFileSource("/notes/readme.md")).toBe("# External\r\n");
    expect(port.savedDocuments).toHaveLength(0);
  });

  it("force-saves only when explicitly requested", async () => {
    const port = new InMemoryWorkspacePort("/notes", {
      "/notes/readme.md": "# External\n",
    });

    await expect(
      port.saveDocument({
        path: "/notes/readme.md",
        source: "# Mine\n",
        expectedSource: "# Old\n",
        lineEnding: "lf",
        force: true,
      }),
    ).resolves.toEqual({ status: "saved", source: "# Mine\n" });
    expect(port.getFileSource("/notes/readme.md")).toBe("# Mine\n");
  });

  it("simulates a failed write without mutating disk", async () => {
    const port = new InMemoryWorkspacePort("/notes", {
      "/notes/readme.md": "# Old\n",
    });
    port.failNextSave(new Error("Disk full"));

    await expect(
      port.saveDocument({
        path: "/notes/readme.md",
        source: "# New\n",
        expectedSource: "# Old\n",
        lineEnding: "lf",
      }),
    ).rejects.toThrow("Disk full");
    expect(port.getFileSource("/notes/readme.md")).toBe("# Old\n");
    expect(port.savedDocuments).toHaveLength(0);
  });
});
