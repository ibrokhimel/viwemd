import { beforeEach, describe, expect, it } from "vitest";
import {
  appearanceStorageKey,
  readAppearancePreferences,
  writeAppearancePreferences,
} from "./appearanceStorage";
import { defaultAppearancePreferences } from "./appearancePreferences";

describe("appearance storage", () => {
  beforeEach(() => localStorage.clear());

  it("returns defaults when no value exists", () => {
    expect(readAppearancePreferences(localStorage)).toEqual(
      defaultAppearancePreferences,
    );
  });

  it("never throws for malformed JSON", () => {
    localStorage.setItem(appearanceStorageKey, "{not json");
    expect(readAppearancePreferences(localStorage)).toEqual(
      defaultAppearancePreferences,
    );
  });

  it("never throws when storage access is blocked", () => {
    const blockedStorage = {
      getItem() {
        throw new DOMException("Blocked", "SecurityError");
      },
    };

    expect(readAppearancePreferences(blockedStorage)).toEqual(
      defaultAppearancePreferences,
    );
  });

  it("normalizes stored values field by field", () => {
    localStorage.setItem(
      appearanceStorageKey,
      JSON.stringify({ theme: "light", accent: "ocean", sidebarVisible: false }),
    );

    expect(readAppearancePreferences(localStorage)).toEqual({
      ...defaultAppearancePreferences,
      theme: "light",
      sidebarVisible: false,
    });
  });

  it("writes only the normalized versioned object", () => {
    writeAppearancePreferences(localStorage, {
      ...defaultAppearancePreferences,
      theme: "dark",
      accent: "rose",
    });

    expect(JSON.parse(localStorage.getItem(appearanceStorageKey) ?? "null")).toEqual({
      ...defaultAppearancePreferences,
      theme: "dark",
      accent: "rose",
    });
  });
});
