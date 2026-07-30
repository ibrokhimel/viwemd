import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InMemoryWorkspacePort } from "../../test/InMemoryWorkspacePort";
import { PremiumSidebar } from "./PremiumSidebar";

describe("PremiumSidebar", () => {
  it("combines identity, Explorer, collapse, and Appearance in one sidebar", async () => {
    const user = userEvent.setup();
    const onHide = vi.fn();
    const onOpenAppearance = vi.fn();

    render(
      <PremiumSidebar
        port={
          new InMemoryWorkspacePort("/notes", {
            "/notes/README.md": "# Home",
          })
        }
        onOpenFile={vi.fn()}
        onHide={onHide}
        onOpenAppearance={onOpenAppearance}
        appearanceOpen={false}
      />,
    );

    expect(
      screen.getByRole("complementary", { name: "Viwemd sidebar" }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Viwemd" })).toBeVisible();
    expect(screen.getByText("Local workspace")).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Workspace explorer" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Hide sidebar" }));
    await user.click(screen.getByRole("button", { name: "Appearance" }));

    expect(onHide).toHaveBeenCalledOnce();
    expect(onOpenAppearance).toHaveBeenCalledOnce();
  });
});
