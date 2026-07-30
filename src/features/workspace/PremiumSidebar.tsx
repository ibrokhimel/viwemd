import type { ReactElement, Ref } from "react";
import { FolderSimpleIcon } from "@phosphor-icons/react/dist/csr/FolderSimple";
import { GearSixIcon } from "@phosphor-icons/react/dist/csr/GearSix";
import { MarkdownLogoIcon } from "@phosphor-icons/react/dist/csr/MarkdownLogo";
import { SidebarSimpleIcon } from "@phosphor-icons/react/dist/csr/SidebarSimple";
import { useAppIconWeight } from "../../components/ui/AppIconStyle";
import type { WorkspacePort } from "../../platform/workspace/WorkspacePort";
import { WorkspaceExplorer } from "./WorkspaceExplorer";

interface PremiumSidebarProps {
  port: WorkspacePort;
  onOpenFile(path: string): void;
  onHide(): void;
  onOpenAppearance(): void;
  appearanceOpen: boolean;
  appearanceButtonRef?: Ref<HTMLButtonElement>;
  hidden?: boolean;
}

export function PremiumSidebar({
  port,
  onOpenFile,
  onHide,
  onOpenAppearance,
  appearanceOpen,
  appearanceButtonRef,
  hidden = false,
}: PremiumSidebarProps): ReactElement {
  const iconWeight = useAppIconWeight();
  const activeIconWeight = useAppIconWeight(true);

  return (
    <aside
      className="premium-sidebar"
      aria-label="Viwemd sidebar"
      hidden={hidden}
    >
      <header className="sidebar-brand-card">
        <span className="sidebar-brand-mark" aria-hidden="true">
          <MarkdownLogoIcon weight={activeIconWeight} />
        </span>
        <div className="sidebar-brand-copy">
          <h1>Viwemd</h1>
          <small>Local workspace</small>
        </div>
        <button
          className="sidebar-icon-button"
          type="button"
          aria-label="Hide sidebar"
          title="Hide sidebar (Ctrl/Cmd+B)"
          onClick={onHide}
        >
          <SidebarSimpleIcon weight={iconWeight} aria-hidden="true" />
        </button>
      </header>

      <div className="sidebar-section-row" aria-current="page">
        <FolderSimpleIcon weight={activeIconWeight} aria-hidden="true" />
        <span>Explorer</span>
      </div>

      <WorkspaceExplorer port={port} onOpenFile={onOpenFile} />

      <button
        ref={appearanceButtonRef}
        className="sidebar-settings-button"
        type="button"
        aria-label="Appearance"
        aria-pressed={appearanceOpen}
        onClick={onOpenAppearance}
      >
        <GearSixIcon
          weight={appearanceOpen ? activeIconWeight : iconWeight}
          aria-hidden="true"
        />
        <span>Appearance</span>
      </button>
    </aside>
  );
}
