import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DocumentHeader } from "./DocumentHeader";

describe("DocumentHeader", () => {
  it("exposes document status, sidebar recovery, save, and layout actions", async () => {
    const user = userEvent.setup();
    const onShowSidebar = vi.fn();
    const onSave = vi.fn();
    const onLayoutChange = vi.fn();
    const onSinglePaneChange = vi.fn();

    render(
      <DocumentHeader
        documentName="README.md"
        saveLabel="Unsaved changes"
        canSave
        saving={false}
        sidebarVisible={false}
        layout="single"
        singlePane="preview"
        onShowSidebar={onShowSidebar}
        onSave={onSave}
        onLayoutChange={onLayoutChange}
        onSinglePaneChange={onSinglePaneChange}
      />,
    );

    expect(
      screen.getByRole("banner", { name: "Document header" }),
    ).toBeVisible();
    expect(screen.getByText("README.md")).toBeVisible();
    expect(screen.getByText("Unsaved changes")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Show sidebar" }));
    await user.click(screen.getByRole("button", { name: "Save README.md" }));

    expect(onShowSidebar).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("hides sidebar recovery and disables saving when there is nothing to write", () => {
    render(
      <DocumentHeader
        documentName={null}
        saveLabel={null}
        canSave={false}
        saving={false}
        sidebarVisible
        layout="single"
        singlePane="preview"
        onShowSidebar={vi.fn()}
        onSave={vi.fn()}
        onLayoutChange={vi.fn()}
        onSinglePaneChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Show sidebar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save document" }),
    ).toBeDisabled();
  });

  it("announces an in-progress save without enabling a duplicate write", () => {
    render(
      <DocumentHeader
        documentName="README.md"
        saveLabel="Saving…"
        canSave={false}
        saving
        sidebarVisible
        layout="single"
        singlePane="preview"
        onShowSidebar={vi.fn()}
        onSave={vi.fn()}
        onLayoutChange={vi.fn()}
        onSinglePaneChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Save README.md" }),
    ).toBeDisabled();
    expect(screen.getAllByText("Saving…")).toHaveLength(2);
  });
});
