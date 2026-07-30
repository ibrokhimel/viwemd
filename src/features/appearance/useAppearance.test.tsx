import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appearanceStorageKey } from "./appearanceStorage";
import { useAppearance } from "./useAppearance";

function createColorSchemeMedia(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const media = {
    get matches() {
      return matches;
    },
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(
      (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
    ),
    removeEventListener: vi.fn(
      (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
    ),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;

  return {
    media,
    emit(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

function AppearanceHarness() {
  const appearance = useAppearance();
  return (
    <div>
      <output aria-label="theme">{appearance.resolvedTheme}</output>
      <output aria-label="accent">{appearance.preferences.accent}</output>
      <output aria-label="sidebar">
        {appearance.preferences.sidebarVisible ? "shown" : "hidden"}
      </output>
      <button type="button" onClick={() => appearance.update("accent", "blue")}>
        Blue
      </button>
      <button
        type="button"
        onClick={() => appearance.update("sidebarDensity", "compact")}
      >
        Compact
      </button>
      <button type="button" onClick={appearance.toggleSidebar}>
        Toggle
      </button>
      <button type="button" onClick={appearance.reset}>
        Reset
      </button>
    </div>
  );
}

describe("useAppearance", () => {
  beforeEach(() => localStorage.clear());

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-density");
    document.documentElement.removeAttribute("data-icon-style");
    document.documentElement.removeAttribute("data-typography");
    document.documentElement.removeAttribute("style");
  });

  it("initializes from storage and applies semantic root values", async () => {
    const colorScheme = createColorSchemeMedia(false);
    vi.stubGlobal("matchMedia", vi.fn(() => colorScheme.media));
    localStorage.setItem(
      appearanceStorageKey,
      JSON.stringify({
        theme: "dark",
        sidebarDensity: "spacious",
        sidebarVisible: false,
        iconStyle: "solid",
        typography: "serif",
        accent: "rose",
      }),
    );

    render(<AppearanceHarness />);

    expect(screen.getByLabelText("theme")).toHaveTextContent("dark");
    expect(screen.getByLabelText("accent")).toHaveTextContent("rose");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.documentElement).toHaveAttribute("data-density", "spacious");
    expect(document.documentElement).toHaveAttribute("data-icon-style", "solid");
    expect(document.documentElement).toHaveAttribute("data-typography", "serif");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe(
      "#e11d48",
    );
    expect(colorScheme.media.addEventListener).not.toHaveBeenCalled();
  });

  it("updates, persists, toggles the sidebar, and resets", async () => {
    const colorScheme = createColorSchemeMedia(false);
    vi.stubGlobal("matchMedia", vi.fn(() => colorScheme.media));
    const user = userEvent.setup();
    render(<AppearanceHarness />);

    await user.click(screen.getByRole("button", { name: "Blue" }));
    await user.click(screen.getByRole("button", { name: "Compact" }));
    await user.click(screen.getByRole("button", { name: "Toggle" }));

    expect(screen.getByLabelText("accent")).toHaveTextContent("blue");
    expect(screen.getByLabelText("sidebar")).toHaveTextContent("hidden");
    expect(document.documentElement).toHaveAttribute("data-density", "compact");

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(appearanceStorageKey) ?? "null")).toMatchObject({
        accent: "blue",
        sidebarDensity: "compact",
        sidebarVisible: false,
      });
    });

    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByLabelText("accent")).toHaveTextContent("violet");
    expect(screen.getByLabelText("sidebar")).toHaveTextContent("shown");
  });

  it("follows live system changes while retaining the System preference", async () => {
    const colorScheme = createColorSchemeMedia(false);
    vi.stubGlobal("matchMedia", vi.fn(() => colorScheme.media));
    const { unmount } = render(<AppearanceHarness />);

    expect(screen.getByLabelText("theme")).toHaveTextContent("light");
    expect(colorScheme.media.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    act(() => colorScheme.emit(true));
    expect(screen.getByLabelText("theme")).toHaveTextContent("dark");

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(appearanceStorageKey) ?? "null")).toMatchObject({
        theme: "system",
      });
    });

    unmount();
    expect(colorScheme.media.removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });
});
