import { describe, expect, it } from "vitest";
import { initialLayoutState, layoutReducer } from "./layoutState";

describe("layoutReducer", () => {
  it("defaults to preview in a single pane", () => {
    expect(initialLayoutState).toEqual({
      layout: "single",
      singlePane: "preview",
      sidebarVisible: true,
    });
  });

  it("retains the single-pane choice while visiting other layouts", () => {
    const edited = layoutReducer(initialLayoutState, {
      type: "singlePaneChanged",
      value: "edit",
    });
    const split = layoutReducer(edited, {
      type: "layoutChanged",
      value: "split",
    });
    const single = layoutReducer(split, {
      type: "layoutChanged",
      value: "single",
    });

    expect(single.singlePane).toBe("edit");
  });

  it("returns to single layout when choosing an individual pane", () => {
    const split = layoutReducer(initialLayoutState, {
      type: "layoutChanged",
      value: "split",
    });

    expect(
      layoutReducer(split, { type: "singlePaneChanged", value: "edit" }),
    ).toMatchObject({ layout: "single", singlePane: "edit" });
  });

  it("toggles sidebar visibility", () => {
    expect(
      layoutReducer(initialLayoutState, { type: "sidebarToggled" })
        .sidebarVisible,
    ).toBe(false);
  });

  it("preserves identity when a selected layout is selected again", () => {
    expect(
      layoutReducer(initialLayoutState, {
        type: "layoutChanged",
        value: "single",
      }),
    ).toBe(initialLayoutState);
  });
});
