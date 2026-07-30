import { useCallback, useEffect, useMemo, useState } from "react";
import {
  accentPresets,
  defaultAppearancePreferences,
  resolveTheme,
  typographyPresets,
  type AppearancePreferences,
  type ResolvedTheme,
} from "./appearancePreferences";
import {
  readAppearancePreferences,
  writeAppearancePreferences,
} from "./appearanceStorage";

type AppearanceField = Exclude<keyof AppearancePreferences, "version">;

export interface AppearanceController {
  preferences: AppearancePreferences;
  resolvedTheme: ResolvedTheme;
  update<K extends AppearanceField>(
    key: K,
    value: AppearancePreferences[K],
  ): void;
  toggleSidebar(): void;
  reset(): void;
}

const colorSchemeQuery = "(prefers-color-scheme: dark)";

export function useAppearance(
  storage: Storage = window.localStorage,
): AppearanceController {
  const [preferences, setPreferences] = useState<AppearancePreferences>(() =>
    readAppearancePreferences(storage),
  );
  const [systemIsDark, setSystemIsDark] = useState(
    () => window.matchMedia(colorSchemeQuery).matches,
  );

  useEffect(() => {
    if (preferences.theme !== "system") return;

    const mediaQuery = window.matchMedia(colorSchemeQuery);
    setSystemIsDark(mediaQuery.matches);
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemIsDark(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [preferences.theme]);

  useEffect(() => {
    try {
      writeAppearancePreferences(storage, preferences);
    } catch {
      // Display preferences remain usable for this session if storage is blocked.
    }
  }, [preferences, storage]);

  const resolvedTheme = resolveTheme(preferences.theme, systemIsDark);

  useEffect(() => {
    const root = document.documentElement;
    const accent = accentPresets[preferences.accent];
    root.dataset.theme = resolvedTheme;
    root.dataset.density = preferences.sidebarDensity;
    root.dataset.iconStyle = preferences.iconStyle;
    root.dataset.typography = preferences.typography;
    root.style.colorScheme = resolvedTheme;
    root.style.setProperty("--accent", accent.value);
    root.style.setProperty("--accent-strong", accent.strong);
    root.style.setProperty("--accent-soft", accent.soft);
    root.style.setProperty(
      "--document-font",
      typographyPresets[preferences.typography],
    );

    return () => {
      delete root.dataset.theme;
      delete root.dataset.density;
      delete root.dataset.iconStyle;
      delete root.dataset.typography;
      root.style.removeProperty("color-scheme");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-strong");
      root.style.removeProperty("--accent-soft");
      root.style.removeProperty("--document-font");
    };
  }, [preferences, resolvedTheme]);

  const update = useCallback(
    <K extends AppearanceField>(
      key: K,
      value: AppearancePreferences[K],
    ) => {
      setPreferences((current) =>
        current[key] === value ? current : { ...current, [key]: value },
      );
    },
    [],
  );

  const toggleSidebar = useCallback(() => {
    setPreferences((current) => ({
      ...current,
      sidebarVisible: !current.sidebarVisible,
    }));
  }, []);

  const reset = useCallback(() => {
    setPreferences({ ...defaultAppearancePreferences });
  }, []);

  return useMemo(
    () => ({ preferences, resolvedTheme, update, toggleSidebar, reset }),
    [preferences, reset, resolvedTheme, toggleSidebar, update],
  );
}
