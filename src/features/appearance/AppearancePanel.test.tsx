import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { defaultAppearancePreferences } from "./appearancePreferences";
import { AppearancePanel } from "./AppearancePanel";
import type { AppearanceController } from "./useAppearance";

function createAppearance(
  overrides: Partial<AppearanceController["preferences"]> = {},
): AppearanceController {
  return {
    preferences: { ...defaultAppearancePreferences, ...overrides },
    resolvedTheme: "light",
    update: vi.fn(),
    toggleSidebar: vi.fn(),
    reset: vi.fn(),
  };
}

describe("AppearancePanel", () => {
  it("renders labeled settings and emits typed choices", async () => {
    const user = userEvent.setup();
    const appearance = createAppearance();
    const onClose = vi.fn();
    render(<AppearancePanel appearance={appearance} onClose={onClose} />);

    expect(screen.getByRole("dialog", { name: "Appearance" })).toHaveAttribute(
      "aria-modal",
      "true",
    );
    expect(
      screen
        .getByRole("button", { name: "Close appearance" })
        .querySelector("svg"),
    ).not.toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Reset appearance" })
        .querySelector("svg"),
    ).not.toBeNull();
    expect(
      screen
        .getByRole("radio", { name: "System" })
        .parentElement?.querySelector("svg"),
    ).not.toBeNull();
    expect(screen.getByRole("radio", { name: "System" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Comfortable" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Outline" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Sans" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Violet" })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Show sidebar" }),
    ).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Dark" }));
    await user.click(screen.getByRole("radio", { name: "Compact" }));
    await user.click(screen.getByRole("radio", { name: "Solid" }));
    await user.click(screen.getByRole("radio", { name: "Serif" }));
    await user.click(screen.getByRole("radio", { name: "Blue" }));
    await user.click(screen.getByRole("checkbox", { name: "Show sidebar" }));

    expect(appearance.update).toHaveBeenCalledWith("theme", "dark");
    expect(appearance.update).toHaveBeenCalledWith("sidebarDensity", "compact");
    expect(appearance.update).toHaveBeenCalledWith("iconStyle", "solid");
    expect(appearance.update).toHaveBeenCalledWith("typography", "serif");
    expect(appearance.update).toHaveBeenCalledWith("accent", "blue");
    expect(appearance.toggleSidebar).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Reset appearance" }));
    await user.click(screen.getByRole("button", { name: "Close appearance" }));
    expect(appearance.reset).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("blocks the workspace and keeps keyboard focus inside the dialog", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <AppearancePanel appearance={createAppearance()} onClose={onClose} />,
    );

    const closeButton = screen.getByRole("button", {
      name: "Close appearance",
    });
    const resetButton = screen.getByRole("button", {
      name: "Reset appearance",
    });

    resetButton.focus();
    await user.tab();
    expect(closeButton).toHaveFocus();

    closeButton.focus();
    await user.tab({ shift: true });
    expect(resetButton).toHaveFocus();

    const backdrop = container.querySelector(".appearance-backdrop");
    expect(backdrop).not.toBeNull();
    await user.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <AppearancePanel appearance={createAppearance()} onClose={onClose} />,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
