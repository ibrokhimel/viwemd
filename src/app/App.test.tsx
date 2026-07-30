import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryWorkspacePort } from "../test/InMemoryWorkspacePort";
import { App } from "./App";

describe("App", () => {
  beforeEach(() => localStorage.clear());

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

  it("persists appearance choices and shares sidebar visibility", async () => {
    const user = userEvent.setup();
    const workspacePort = new InMemoryWorkspacePort("/notes", {
      "/notes/README.md": "# Home",
    });
    const firstRender = render(<App workspacePort={workspacePort} />);

    await user.click(screen.getByRole("button", { name: "Open folder" }));
    const appearanceButton = screen.getByRole("button", { name: "Appearance" });
    await user.click(appearanceButton);

    expect(
      screen.getByRole("complementary", { name: "Appearance" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Close appearance" })).toHaveFocus();

    await user.click(screen.getByRole("radio", { name: "Dark" }));
    await user.click(screen.getByRole("radio", { name: "Compact" }));
    await user.click(screen.getByRole("radio", { name: "Solid" }));
    await user.click(screen.getByRole("radio", { name: "Serif" }));
    await user.click(screen.getByRole("radio", { name: "Blue" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.documentElement).toHaveAttribute("data-density", "compact");
    expect(document.documentElement).toHaveAttribute("data-icon-style", "solid");
    expect(document.documentElement).toHaveAttribute("data-typography", "serif");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe(
      "#2563eb",
    );

    await user.click(screen.getByRole("checkbox", { name: "Show sidebar" }));
    expect(
      screen.queryByRole("complementary", { name: "Workspace explorer" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show sidebar" }));
    expect(
      screen.getByRole("button", { name: "Open README.md" }),
    ).toBeVisible();

    await user.click(screen.getByRole("checkbox", { name: "Show sidebar" }));
    await user.keyboard("{Escape}");
    expect(
      screen.queryByRole("complementary", { name: "Appearance" }),
    ).not.toBeInTheDocument();
    expect(appearanceButton).toHaveFocus();

    await waitFor(() => {
      expect(localStorage.getItem("viwemd.appearance.v1")).toContain("blue");
    });

    firstRender.unmount();
    render(<App workspacePort={workspacePort} />);
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(
      screen.queryByRole("complementary", { name: "Workspace explorer" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Appearance" }));
    expect(screen.getByRole("radio", { name: "Blue" })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Show sidebar" }),
    ).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: "Reset appearance" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(document.documentElement).toHaveAttribute(
      "data-density",
      "comfortable",
    );
    expect(
      screen.getByRole("complementary", { name: "Workspace explorer" }),
    ).toBeVisible();
  });
});
