import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { InMemoryWorkspacePort } from "../test/InMemoryWorkspacePort";
import { App } from "./App";

describe("App", () => {
  it("exposes the product identity and local workspace boundary", () => {
    const workspacePort = new InMemoryWorkspacePort(null, {});

    render(<App workspacePort={workspacePort} />);

    expect(screen.getByRole("main")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Viwemd" })).toBeVisible();
    expect(screen.getByText("Local Markdown workspace")).toBeVisible();
    expect(screen.getByRole("button", { name: "Open folder" })).toBeVisible();
  });

  it("switches layouts, previews live edits, and toggles the sidebar", async () => {
    const user = userEvent.setup();
    const workspacePort = new InMemoryWorkspacePort("/notes", {
      "/notes/README.md": "# Home",
    });

    render(<App workspacePort={workspacePort} />);

    await user.click(screen.getByRole("button", { name: "Open folder" }));
    await user.click(screen.getByRole("button", { name: "Open README.md" }));

    expect(screen.getByRole("tab", { name: "README.md" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const preview = screen.getByRole("article", { name: "Markdown preview" });
    expect(within(preview).getByRole("heading", { name: "Home" })).toBeVisible();
    expect(
      screen.queryByRole("textbox", { name: "Markdown source" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Side by side" }));
    const editor = screen.getByRole("textbox", { name: "Markdown source" });
    expect(editor).toHaveTextContent("# Home");
    expect(preview).toBeVisible();

    await user.click(editor);
    await user.keyboard("{End}!");

    expect(
      screen.getByText(
        "Changes are kept in memory; durable saving is not enabled yet",
      ),
    ).toBeVisible();
    expect(
      within(preview).getByRole("heading", { name: "Home!" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Stacked" }));
    expect(screen.getByTestId("document-workspace")).toHaveAttribute(
      "data-layout",
      "stacked",
    );
    expect(screen.getByText("Unsaved in-memory changes")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Preview" }));
    expect(screen.queryByLabelText("Markdown source")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Markdown preview")).toBeVisible();

    const modifiedShortcut = new KeyboardEvent("keydown", {
      key: "b",
      ctrlKey: true,
      shiftKey: true,
      cancelable: true,
    });
    window.dispatchEvent(modifiedShortcut);
    expect(modifiedShortcut.defaultPrevented).toBe(false);
    expect(
      screen.getByRole("complementary", { name: "Workspace explorer" }),
    ).toBeVisible();

    await user.keyboard("{Control>}b{/Control}");
    expect(
      screen.queryByRole("complementary", { name: "Workspace explorer" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Local only")).toBeVisible();

    await user.keyboard("{Control>}b{/Control}");
    expect(
      screen.getByRole("complementary", { name: "Workspace explorer" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Open README.md" }),
    ).toBeVisible();
  });
});
