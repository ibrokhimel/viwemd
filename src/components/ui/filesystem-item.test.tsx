import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  FilesystemItem,
  type FilesystemNode,
} from "./filesystem-item";
import { AppIconStyleProvider } from "./AppIconStyle";

const docsNode: FilesystemNode = {
  kind: "directory",
  name: "docs",
  path: "/notes/docs",
  nodes: [
    {
      kind: "file",
      name: "guide.md",
      path: "/notes/docs/guide.md",
    },
  ],
};

describe("FilesystemItem", () => {
  it("expands an uncontrolled folder and opens its file", async () => {
    const user = userEvent.setup();
    const onOpenFile = vi.fn();

    render(
      <ul role="tree">
        <FilesystemItem
          node={docsNode}
          animated
          onOpenFile={onOpenFile}
        />
      </ul>,
    );

    expect(
      screen.queryByRole("button", { name: "Open guide.md" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand docs" }));
    await user.click(screen.getByRole("button", { name: "Open guide.md" }));

    expect(onOpenFile).toHaveBeenCalledWith(docsNode.nodes?.[0]);
  });

  it("reports a controlled folder toggle without changing it locally", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const controlledNode = { ...docsNode, expanded: false };

    const { rerender } = render(
      <ul role="tree">
        <FilesystemItem node={controlledNode} onToggle={onToggle} />
      </ul>,
    );

    await user.click(screen.getByRole("button", { name: "Expand docs" }));

    expect(onToggle).toHaveBeenCalledWith(controlledNode);
    expect(
      screen.queryByRole("button", { name: "Open guide.md" }),
    ).not.toBeInTheDocument();

    rerender(
      <ul role="tree">
        <FilesystemItem node={{ ...controlledNode, expanded: true }} />
      </ul>,
    );

    expect(
      screen.getByRole("button", { name: "Open guide.md" }),
    ).toBeVisible();
  });

  it("supports the supplied name-and-nodes data shape", () => {
    render(
      <ul role="tree">
        <FilesystemItem node={{ name: "Empty", nodes: [] }} />
      </ul>,
    );

    expect(
      screen.getByRole("button", { name: "Expand Empty" }),
    ).toBeVisible();
  });

  it("uses the shared Phosphor weight preference", () => {
    const { rerender } = render(
      <AppIconStyleProvider style="outline">
        <ul role="tree">
          <FilesystemItem node={docsNode} />
        </ul>
      </AppIconStyleProvider>,
    );

    expect(screen.getByTestId("folder-icon-docs")).toHaveAttribute(
      "data-icon-weight",
      "regular",
    );

    rerender(
      <AppIconStyleProvider style="solid">
        <ul role="tree">
          <FilesystemItem node={docsNode} />
        </ul>
      </AppIconStyleProvider>,
    );

    expect(screen.getByTestId("folder-icon-docs")).toHaveAttribute(
      "data-icon-weight",
      "bold",
    );
  });
});
