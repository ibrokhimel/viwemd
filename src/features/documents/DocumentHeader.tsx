import type { ReactElement, Ref } from "react";
import { FileMdIcon } from "@phosphor-icons/react/dist/csr/FileMd";
import { FloppyDiskIcon } from "@phosphor-icons/react/dist/csr/FloppyDisk";
import { SidebarSimpleIcon } from "@phosphor-icons/react/dist/csr/SidebarSimple";
import { useAppIconWeight } from "../../components/ui/AppIconStyle";
import { LayoutControls } from "../layout/LayoutControls";
import type { LayoutMode, SinglePaneMode } from "../layout/layoutState";

interface DocumentHeaderProps {
  documentName: string | null;
  saveLabel: string | null;
  canSave: boolean;
  saving: boolean;
  sidebarVisible: boolean;
  layout: LayoutMode;
  singlePane: SinglePaneMode;
  onShowSidebar(): void;
  onSave(): void;
  onLayoutChange(value: LayoutMode): void;
  onSinglePaneChange(value: SinglePaneMode): void;
  sidebarButtonRef?: Ref<HTMLButtonElement>;
}

export function DocumentHeader({
  documentName,
  saveLabel,
  canSave,
  saving,
  sidebarVisible,
  layout,
  singlePane,
  onShowSidebar,
  onSave,
  onLayoutChange,
  onSinglePaneChange,
  sidebarButtonRef,
}: DocumentHeaderProps): ReactElement {
  const iconWeight = useAppIconWeight();
  const activeIconWeight = useAppIconWeight(true);

  return (
    <header
      className="document-header"
      role="banner"
      aria-label="Document header"
    >
      <div className="document-header-leading">
        {!sidebarVisible ? (
          <button
            ref={sidebarButtonRef}
            className="sidebar-reveal-button"
            type="button"
            aria-label="Show sidebar"
            title="Show sidebar (Ctrl/Cmd+B)"
            onClick={onShowSidebar}
          >
            <SidebarSimpleIcon weight={iconWeight} aria-hidden="true" />
          </button>
        ) : null}

        <span className="document-file-mark" aria-hidden="true">
          <FileMdIcon
            weight={documentName ? activeIconWeight : iconWeight}
            data-icon-weight={documentName ? activeIconWeight : iconWeight}
          />
        </span>
        <div className="document-identity">
          <strong>{documentName ?? "No document open"}</strong>
          <small>{saveLabel ?? "Choose a Markdown file"}</small>
        </div>
      </div>

      <div className="document-header-actions">
        <button
          className="save-button"
          type="button"
          aria-label={documentName ? `Save ${documentName}` : "Save document"}
          disabled={!canSave}
          onClick={onSave}
        >
          <FloppyDiskIcon weight={iconWeight} aria-hidden="true" />
          <span>{saving ? "Saving…" : "Save"}</span>
        </button>
        <LayoutControls
          layout={layout}
          singlePane={singlePane}
          onLayoutChange={onLayoutChange}
          onSinglePaneChange={onSinglePaneChange}
        />
      </div>
    </header>
  );
}
