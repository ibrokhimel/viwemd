import type { ReactElement } from "react";
import { ColumnsIcon } from "@phosphor-icons/react/dist/csr/Columns";
import { EyeIcon } from "@phosphor-icons/react/dist/csr/Eye";
import { PencilSimpleIcon } from "@phosphor-icons/react/dist/csr/PencilSimple";
import { RowsIcon } from "@phosphor-icons/react/dist/csr/Rows";
import { SquareIcon } from "@phosphor-icons/react/dist/csr/Square";
import { useAppIconWeight } from "../../components/ui/AppIconStyle";
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
  const iconWeight = useAppIconWeight();
  const activeIconWeight = useAppIconWeight(true);
  const editActive = layout === "single" && singlePane === "edit";
  const previewActive = layout === "single" && singlePane === "preview";

  return (
    <div className="layout-controls" role="toolbar" aria-label="Document view">
      <div className="control-group" aria-label="Single pane content">
        <button
          type="button"
          aria-pressed={editActive}
          title="Edit"
          onClick={() => onSinglePaneChange("edit")}
        >
          <PencilSimpleIcon
            weight={editActive ? activeIconWeight : iconWeight}
            data-icon-weight={editActive ? activeIconWeight : iconWeight}
            aria-hidden="true"
          />
          <span className="control-label">Edit</span>
        </button>
        <button
          type="button"
          aria-pressed={previewActive}
          title="Preview"
          onClick={() => onSinglePaneChange("preview")}
        >
          <EyeIcon
            weight={previewActive ? activeIconWeight : iconWeight}
            data-icon-weight={previewActive ? activeIconWeight : iconWeight}
            aria-hidden="true"
          />
          <span className="control-label">Preview</span>
        </button>
      </div>
      <div className="control-group" aria-label="Workspace layout">
        <button
          type="button"
          aria-pressed={layout === "single"}
          title="Single pane"
          onClick={() => onLayoutChange("single")}
        >
          <SquareIcon
            weight={layout === "single" ? activeIconWeight : iconWeight}
            data-icon-weight={
              layout === "single" ? activeIconWeight : iconWeight
            }
            aria-hidden="true"
          />
          <span className="control-label">Single pane</span>
        </button>
        <button
          type="button"
          aria-pressed={layout === "split"}
          title="Side by side"
          onClick={() => onLayoutChange("split")}
        >
          <ColumnsIcon
            weight={layout === "split" ? activeIconWeight : iconWeight}
            data-icon-weight={
              layout === "split" ? activeIconWeight : iconWeight
            }
            aria-hidden="true"
          />
          <span className="control-label">Side by side</span>
        </button>
        <button
          type="button"
          aria-pressed={layout === "stacked"}
          title="Stacked"
          onClick={() => onLayoutChange("stacked")}
        >
          <RowsIcon
            weight={layout === "stacked" ? activeIconWeight : iconWeight}
            data-icon-weight={
              layout === "stacked" ? activeIconWeight : iconWeight
            }
            aria-hidden="true"
          />
          <span className="control-label">Stacked</span>
        </button>
      </div>
    </div>
  );
}
