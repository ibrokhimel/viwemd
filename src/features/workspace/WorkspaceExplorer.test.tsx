import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { WorkspacePort } from "../../platform/workspace/WorkspacePort";
import { InMemoryWorkspacePort } from "../../test/InMemoryWorkspacePort";
import { WorkspaceExplorer } from "./WorkspaceExplorer";

describe("WorkspaceExplorer", () => {
  it("opens a folder, expands lazily, and selects Markdown files", async () => {
    const user = userEvent.setup();
    const onOpenFile = vi.fn();
    const port = new InMemoryWorkspacePort("/notes", {
      "/notes/README.md": "# Home",
      "/notes/docs/setup.md": "# Setup",
    });

    render(<WorkspaceExplorer port={port} onOpenFile={onOpenFile} />);

    await user.click(screen.getByRole("button", { name: "Open folder" }));
    await user.click(screen.getByRole("button", { name: "Expand docs" }));
    await user.click(screen.getByRole("button", { name: "Open setup.md" }));

    expect(port.listedDirectories).toEqual(["/notes", "/notes/docs"]);
    expect(onOpenFile).toHaveBeenCalledWith("/notes/docs/setup.md");
  });

  it("reuses cached directory entries after collapsing", async () => {
    const user = userEvent.setup();
    const port = new InMemoryWorkspacePort("/notes", {
      "/notes/docs/setup.md": "# Setup",
    });

    render(<WorkspaceExplorer port={port} onOpenFile={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Open folder" }));
    await user.click(screen.getByRole("button", { name: "Expand docs" }));
    await user.click(screen.getByRole("button", { name: "Collapse docs" }));
    await user.click(screen.getByRole("button", { name: "Expand docs" }));

    expect(port.listedDirectories).toEqual(["/notes", "/notes/docs"]);
  });

  it("keeps the prior workspace visible when a child directory fails", async () => {
    const user = userEvent.setup();
    const source = new InMemoryWorkspacePort("/notes", {
      "/notes/README.md": "# Home",
      "/notes/docs/setup.md": "# Setup",
    });
    const port: WorkspacePort = {
      chooseFolder: () => source.chooseFolder(),
      listDirectory: async (path) => {
        if (path === "/notes/docs") throw new Error("Folder access denied");
        return source.listDirectory(path);
      },
      readDocument: (path) => source.readDocument(path),
      saveDocument: (request) => source.saveDocument(request),
      watchDocument: (path, onChange) => source.watchDocument(path, onChange),
    };

    render(<WorkspaceExplorer port={port} onOpenFile={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Open folder" }));
    expect(screen.getByRole("button", { name: "Open README.md" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Expand docs" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Folder access denied",
    );
    expect(screen.getByRole("button", { name: "Open README.md" })).toBeVisible();
  });
});
