import { describe, expect, it } from "vitest";
import {
  accentPresets,
  defaultAppearancePreferences,
  normalizeAppearancePreferences,
  resolveTheme,
  typographyPresets,
} from "./appearancePreferences";

describe("appearance preferences", () => {
  it("provides the approved defaults", () => {
    expect(defaultAppearancePreferences).toEqual({
      version: 1,
      theme: "system",
      sidebarDensity: "comfortable",
      sidebarVisible: true,
      iconStyle: "outline",
      typography: "sans",
      accent: "violet",
    });
  });

  it("retains every valid preference", () => {
    const preferences = {
      version: 1,
      theme: "dark",
      sidebarDensity: "compact",
      sidebarVisible: false,
      iconStyle: "solid",
      typography: "serif",
      accent: "blue",
    } as const;

    expect(normalizeAppearancePreferences(preferences)).toEqual(preferences);
  });

  it("recovers valid fields while replacing malformed fields", () => {
    expect(
      normalizeAppearancePreferences({
        version: 99,
        theme: "dark",
        sidebarDensity: "tiny",
        sidebarVisible: "no",
        iconStyle: "solid",
        typography: null,
        accent: "emerald",
      }),
    ).toEqual({
      ...defaultAppearancePreferences,
      theme: "dark",
      iconStyle: "solid",
      accent: "emerald",
    });
  });

  it.each([null, undefined, [], "dark", 42])(
    "falls back for non-record input %j",
    (value) => {
      expect(normalizeAppearancePreferences(value)).toEqual(
        defaultAppearancePreferences,
      );
    },
  );

  it("resolves System without changing explicit themes", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("defines complete named accent and typography presets", () => {
    expect(Object.keys(accentPresets)).toEqual([
      "violet",
      "blue",
      "emerald",
      "rose",
      "amber",
    ]);
    expect(Object.keys(typographyPresets)).toEqual(["sans", "serif", "mono"]);
    expect(accentPresets.violet).toMatchObject({
      value: expect.stringMatching(/^#/),
      strong: expect.stringMatching(/^#/),
      soft: expect.stringMatching(/^rgba?\(/),
    });
  });
});
