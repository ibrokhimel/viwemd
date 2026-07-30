export type LayoutMode = "single" | "split" | "stacked";
export type SinglePaneMode = "edit" | "preview";

export interface LayoutState {
  layout: LayoutMode;
  singlePane: SinglePaneMode;
  sidebarVisible: boolean;
}

export type LayoutAction =
  | { type: "layoutChanged"; value: LayoutMode }
  | { type: "singlePaneChanged"; value: SinglePaneMode }
  | { type: "sidebarToggled" };

export const initialLayoutState: LayoutState = {
  layout: "single",
  singlePane: "preview",
  sidebarVisible: true,
};

export function layoutReducer(
  state: LayoutState,
  action: LayoutAction,
): LayoutState {
  switch (action.type) {
    case "layoutChanged":
      return state.layout === action.value
        ? state
        : { ...state, layout: action.value };

    case "singlePaneChanged":
      return state.layout === "single" && state.singlePane === action.value
        ? state
        : { ...state, layout: "single", singlePane: action.value };

    case "sidebarToggled":
      return { ...state, sidebarVisible: !state.sidebarVisible };
  }
}
