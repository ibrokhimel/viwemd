import { useEffect, type ReactElement, type ReactNode } from "react";
import {
  accentPresets,
  type AccentPreference,
  type IconStyle,
  type SidebarDensity,
  type ThemePreference,
  type TypographyPreference,
} from "./appearancePreferences";
import type { AppearanceController } from "./useAppearance";

interface AppearancePanelProps {
  appearance: AppearanceController;
  onClose(): void;
}

interface Choice<T extends string> {
  value: T;
  label: string;
  decoration?: ReactNode;
}

interface ChoiceGroupProps<T extends string> {
  label: string;
  name: string;
  value: T;
  choices: readonly Choice<T>[];
  onChange(value: T): void;
}

function ChoiceGroup<T extends string>({
  label,
  name,
  value,
  choices,
  onChange,
}: ChoiceGroupProps<T>): ReactElement {
  return (
    <fieldset className="appearance-group">
      <legend>{label}</legend>
      <div className="appearance-choices">
        {choices.map((choice) => (
          <label className="appearance-choice" key={choice.value}>
            <input
              type="radio"
              name={name}
              value={choice.value}
              checked={choice.value === value}
              onChange={() => onChange(choice.value)}
            />
            {choice.decoration}
            <span>{choice.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const themeChoices: readonly Choice<ThemePreference>[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const densityChoices: readonly Choice<SidebarDensity>[] = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
];

const iconChoices: readonly Choice<IconStyle>[] = [
  { value: "outline", label: "Outline" },
  { value: "solid", label: "Solid" },
];

const typographyChoices: readonly Choice<TypographyPreference>[] = [
  { value: "sans", label: "Sans" },
  { value: "serif", label: "Serif" },
  { value: "mono", label: "Mono" },
];

const accentChoices = (
  Object.keys(accentPresets) as AccentPreference[]
).map((value) => ({
  value,
  label: `${value[0].toUpperCase()}${value.slice(1)}`,
  decoration: (
    <span
      className="appearance-swatch"
      style={{ backgroundColor: accentPresets[value].value }}
      aria-hidden="true"
    />
  ),
})) satisfies Choice<AccentPreference>[];

export function AppearancePanel({
  appearance,
  onClose,
}: AppearancePanelProps): ReactElement {
  const { preferences } = appearance;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <aside className="appearance-panel" aria-labelledby="appearance-title">
      <header className="appearance-header">
        <div>
          <span className="sidebar-eyebrow">Preferences</span>
          <h2 id="appearance-title">Appearance</h2>
        </div>
        <button
          className="appearance-close"
          type="button"
          aria-label="Close appearance"
          autoFocus
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className="appearance-content">
        <ChoiceGroup
          label="Theme"
          name="appearance-theme"
          value={preferences.theme}
          choices={themeChoices}
          onChange={(value) => appearance.update("theme", value)}
        />
        <ChoiceGroup
          label="Sidebar density"
          name="appearance-density"
          value={preferences.sidebarDensity}
          choices={densityChoices}
          onChange={(value) => appearance.update("sidebarDensity", value)}
        />
        <div className="appearance-toggle">
          <span>
            <label htmlFor="appearance-sidebar-visible">
              <strong>Show sidebar</strong>
            </label>
            <small id="appearance-sidebar-description">
              Explorer stays ready when hidden.
            </small>
          </span>
          <input
            id="appearance-sidebar-visible"
            type="checkbox"
            checked={preferences.sidebarVisible}
            aria-describedby="appearance-sidebar-description"
            onChange={appearance.toggleSidebar}
          />
        </div>
        <ChoiceGroup
          label="Icon style"
          name="appearance-icons"
          value={preferences.iconStyle}
          choices={iconChoices}
          onChange={(value) => appearance.update("iconStyle", value)}
        />
        <ChoiceGroup
          label="Typography"
          name="appearance-typography"
          value={preferences.typography}
          choices={typographyChoices}
          onChange={(value) => appearance.update("typography", value)}
        />
        <ChoiceGroup
          label="Accent color"
          name="appearance-accent"
          value={preferences.accent}
          choices={accentChoices}
          onChange={(value) => appearance.update("accent", value)}
        />
      </div>

      <footer className="appearance-footer">
        <span>
          {preferences.theme === "system"
            ? `Following system · ${appearance.resolvedTheme}`
            : `${appearance.resolvedTheme} theme`}
        </span>
        <button type="button" onClick={appearance.reset}>
          Reset appearance
        </button>
      </footer>
    </aside>
  );
}
