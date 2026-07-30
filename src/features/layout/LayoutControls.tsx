import type { ReactElement } from "react";
import type { LayoutMode, SinglePaneMode } from "./layoutState";

interface LayoutControlsProps {
  layout: LayoutMode;
  singlePane: SinglePaneMode;
  onLayoutChange(value: LayoutMode): void;
  onSinglePaneChange(value: SinglePaneMode): void;
}

export function LayoutControls({
  layout,
  singlePane,
  onLayoutChange,
  onSinglePaneChange,
}: LayoutControlsProps): ReactElement {
  return (
    <div className="layout-controls" role="toolbar" aria-label="Document view">
      <div className="control-group" aria-label="Single pane content">
        <button
          type="button"
          aria-pressed={layout === "single" && singlePane === "edit"}
          onClick={() => onSinglePaneChange("edit")}
        >
          <span aria-hidden="true">✎</span>
          Edit
        </button>
        <button
          type="button"
          aria-pressed={layout === "single" && singlePane === "preview"}
          onClick={() => onSinglePaneChange("preview")}
        >
          <span aria-hidden="true">◉</span>
          Preview
        </button>
      </div>
      <div className="control-group" aria-label="Workspace layout">
        <button
          type="button"
          aria-pressed={layout === "single"}
          onClick={() => onLayoutChange("single")}
        >
          <span aria-hidden="true">▣</span>
          Single pane
        </button>
        <button
          type="button"
          aria-pressed={layout === "split"}
          onClick={() => onLayoutChange("split")}
        >
          <span aria-hidden="true">◫</span>
          Side by side
        </button>
        <button
          type="button"
          aria-pressed={layout === "stacked"}
          onClick={() => onLayoutChange("stacked")}
        >
          <span aria-hidden="true">⬒</span>
          Stacked
        </button>
      </div>
    </div>
  );
}
