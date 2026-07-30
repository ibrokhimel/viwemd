import {
  normalizeAppearancePreferences,
  type AppearancePreferences,
} from "./appearancePreferences";

export const appearanceStorageKey = "viwemd.appearance.v1";

export function readAppearancePreferences(
  storage: Pick<Storage, "getItem">,
): AppearancePreferences {
  try {
    const stored = storage.getItem(appearanceStorageKey);
    return normalizeAppearancePreferences(stored === null ? undefined : JSON.parse(stored));
  } catch {
    return normalizeAppearancePreferences(undefined);
  }
}

export function writeAppearancePreferences(
  storage: Pick<Storage, "setItem">,
  preferences: AppearancePreferences,
): void {
  storage.setItem(
    appearanceStorageKey,
    JSON.stringify(normalizeAppearancePreferences(preferences)),
  );
}
