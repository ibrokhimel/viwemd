import type { ReactElement } from "react";
import { FileMdIcon } from "@phosphor-icons/react/dist/csr/FileMd";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useAppIconWeight } from "../../components/ui/AppIconStyle";
import type { OpenDocument } from "./documentState";

interface TabStripProps {
  tabs: OpenDocument[];
  activeId: string | null;
  onActivate(id: string): void;
  onClose(id: string): void;
}

export function TabStrip({
  tabs,
  activeId,
  onActivate,
  onClose,
}: TabStripProps): ReactElement {
  const iconWeight = useAppIconWeight();
  const activeIconWeight = useAppIconWeight(true);

  return (
    <div className="tab-strip" role="tablist" aria-label="Open documents">
      {tabs.map((document) => {
        const isDirty = document.source !== document.persistedSource;

        return (
          <div className="tab-item" key={document.id}>
            <button
              className="tab-button"
              type="button"
              role="tab"
              aria-selected={document.id === activeId}
              onClick={() => onActivate(document.id)}
            >
              <FileMdIcon
                className="tab-file-icon"
                weight={
                  document.id === activeId ? activeIconWeight : iconWeight
                }
                data-icon-weight={
                  document.id === activeId ? activeIconWeight : iconWeight
                }
                aria-hidden="true"
              />
              <span className="tab-label">{document.name}</span>
              {isDirty ? (
                <>
                  <span className="dirty-indicator" aria-hidden="true" />
                  <span className="visually-hidden">Unsaved</span>
                </>
              ) : null}
            </button>
            <button
              className="tab-close"
              type="button"
              aria-label={`Close ${document.name}`}
              onClick={() => onClose(document.id)}
            >
              <XIcon weight={iconWeight} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
