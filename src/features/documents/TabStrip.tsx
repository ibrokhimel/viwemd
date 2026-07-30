import type { ReactElement } from "react";
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
              <span>{document.name}</span>
              {isDirty ? (
                <>
                  <span className="dirty-indicator" aria-hidden="true">
                    ●
                  </span>
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
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
