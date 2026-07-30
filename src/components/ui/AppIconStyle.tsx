import {
  createContext,
  useContext,
  type ReactElement,
  type ReactNode,
} from "react";
import type { IconWeight } from "@phosphor-icons/react";
import type { IconStyle } from "@/features/appearance/appearancePreferences";

const AppIconStyleContext = createContext<IconStyle>("outline");

export function AppIconStyleProvider({
  style,
  children,
}: {
  style: IconStyle;
  children: ReactNode;
}): ReactElement {
  return (
    <AppIconStyleContext.Provider value={style}>
      {children}
    </AppIconStyleContext.Provider>
  );
}

export function useAppIconWeight(active = false): IconWeight {
  const style = useContext(AppIconStyleContext);
  if (active) return "fill";
  return style === "solid" ? "bold" : "regular";
}
