import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { OpenDocument } from "./documentState";
import { TabStrip } from "./TabStrip";

const readme: OpenDocument = {
  id: "/notes/README.md",
  path: "/notes/README.md",
  name: "README.md",
  source: "# Home",
  persistedSource: "# Home",
  lineEnding: "lf",
  saveStatus: "clean",
  saveError: null,
  conflictSource: null,
  conflictLineEnding: null,
  cursorOffset: 0,
  editorScrollTop: 0,
  previewScrollTop: 0,
};

const dirtySetup: OpenDocument = {
  ...readme,
  id: "/notes/setup.md",
  path: "/notes/setup.md",
  name: "setup.md",
  source: "# Edited setup",
  persistedSource: "# Setup",
  lineEnding: "lf",
};

describe("TabStrip", () => {
  it("renders selected and dirty states with sibling close controls", async () => {
    const user = userEvent.setup();
    const onActivate = vi.fn();
    const onClose = vi.fn();

    render(
      <TabStrip
        tabs={[readme, dirtySetup]}
        activeId={dirtySetup.id}
        onActivate={onActivate}
        onClose={onClose}
      />,
    );

    const readmeTab = screen.getByRole("tab", { name: "README.md" });
    const setupTab = screen.getByRole("tab", { name: /setup\.md/ });
    const closeSetup = screen.getByRole("button", { name: "Close setup.md" });

    expect(readmeTab).toHaveAttribute("aria-selected", "false");
    expect(setupTab).toHaveAttribute("aria-selected", "true");
    expect(readmeTab.querySelector("svg")).toHaveAttribute(
      "data-icon-weight",
      "regular",
    );
    expect(closeSetup.querySelector("svg")).not.toBeNull();
    expect(within(setupTab).getByText("Unsaved")).toHaveClass(
      "visually-hidden",
    );
    expect(setupTab).not.toContainElement(closeSetup);
    expect(setupTab.parentElement).toContainElement(closeSetup);

    await user.click(readmeTab);
    await user.click(closeSetup);

    expect(onActivate).toHaveBeenCalledWith(readme.id);
    expect(onClose).toHaveBeenCalledWith(dirtySetup.id);
  });
});
