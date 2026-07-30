export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = Exclude<ThemePreference, "system">;
export type SidebarDensity = "compact" | "comfortable" | "spacious";
export type IconStyle = "outline" | "solid";
export type TypographyPreference = "sans" | "serif" | "mono";
export type AccentPreference =
  | "violet"
  | "blue"
  | "emerald"
  | "rose"
  | "amber";

export interface AppearancePreferences {
  version: 1;
  theme: ThemePreference;
  sidebarDensity: SidebarDensity;
  sidebarVisible: boolean;
  iconStyle: IconStyle;
  typography: TypographyPreference;
  accent: AccentPreference;
}

export const defaultAppearancePreferences: AppearancePreferences = {
  version: 1,
  theme: "system",
  sidebarDensity: "comfortable",
  sidebarVisible: true,
  iconStyle: "outline",
  typography: "sans",
  accent: "violet",
};

export const accentPresets = {
  violet: { value: "#7c3aed", strong: "#6d28d9", soft: "rgba(124, 58, 237, 0.16)" },
  blue: { value: "#2563eb", strong: "#1d4ed8", soft: "rgba(37, 99, 235, 0.16)" },
  emerald: { value: "#059669", strong: "#047857", soft: "rgba(5, 150, 105, 0.16)" },
  rose: { value: "#e11d48", strong: "#be123c", soft: "rgba(225, 29, 72, 0.16)" },
  amber: { value: "#d97706", strong: "#b45309", soft: "rgba(217, 119, 6, 0.18)" },
} satisfies Record<AccentPreference, { value: string; strong: string; soft: string }>;

export const typographyPresets = {
  sans: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
  serif: "Charter, \"Bitstream Charter\", \"Sitka Text\", Cambria, serif",
  mono: "\"Cascadia Code\", \"SFMono-Regular\", Consolas, \"Liberation Mono\", monospace",
} satisfies Record<TypographyPreference, string>;

const themeValues = new Set<ThemePreference>(["system", "light", "dark"]);
const densityValues = new Set<SidebarDensity>([
  "compact",
  "comfortable",
  "spacious",
]);
const iconValues = new Set<IconStyle>(["outline", "solid"]);
const typographyValues = new Set<TypographyPreference>([
  "sans",
  "serif",
  "mono",
]);
const accentValues = new Set<AccentPreference>([
  "violet",
  "blue",
  "emerald",
  "rose",
  "amber",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function allowed<T extends string>(
  value: unknown,
  values: ReadonlySet<T>,
  fallback: T,
): T {
  return typeof value === "string" && values.has(value as T)
    ? (value as T)
    : fallback;
}

export function normalizeAppearancePreferences(
  value: unknown,
): AppearancePreferences {
  if (!isRecord(value)) return { ...defaultAppearancePreferences };

  return {
    version: 1,
    theme: allowed(value.theme, themeValues, defaultAppearancePreferences.theme),
    sidebarDensity: allowed(
      value.sidebarDensity,
      densityValues,
      defaultAppearancePreferences.sidebarDensity,
    ),
    sidebarVisible:
      typeof value.sidebarVisible === "boolean"
        ? value.sidebarVisible
        : defaultAppearancePreferences.sidebarVisible,
    iconStyle: allowed(
      value.iconStyle,
      iconValues,
      defaultAppearancePreferences.iconStyle,
    ),
    typography: allowed(
      value.typography,
      typographyValues,
      defaultAppearancePreferences.typography,
    ),
    accent: allowed(
      value.accent,
      accentValues,
      defaultAppearancePreferences.accent,
    ),
  };
}

export function resolveTheme(
  preference: ThemePreference,
  systemIsDark: boolean,
): ResolvedTheme {
  return preference === "system"
    ? systemIsDark
      ? "dark"
      : "light"
    : preference;
}
