import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LayoutControls } from "./LayoutControls";

describe("LayoutControls", () => {
  it("exposes pressed states and typed layout actions", async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    const onSinglePaneChange = vi.fn();

    render(
      <LayoutControls
        layout="single"
        singlePane="preview"
        onLayoutChange={onLayoutChange}
        onSinglePaneChange={onSinglePaneChange}
      />,
    );

    expect(screen.getByRole("button", { name: "Edit" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "Preview" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Single pane" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Side by side" }));
    await user.click(screen.getByRole("button", { name: "Stacked" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(onLayoutChange).toHaveBeenNthCalledWith(1, "split");
    expect(onLayoutChange).toHaveBeenNthCalledWith(2, "stacked");
    expect(onSinglePaneChange).toHaveBeenCalledWith("edit");
  });
});
