import type { ReactElement } from "react";
import { WarningDiamondIcon } from "@phosphor-icons/react/dist/csr/WarningDiamond";
import { useAppIconWeight } from "../../components/ui/AppIconStyle";

interface ConflictNoticeProps {
  onReload(): void;
  onOverwrite(): void;
}

export function ConflictNotice({
  onReload,
  onOverwrite,
}: ConflictNoticeProps): ReactElement {
  const iconWeight = useAppIconWeight(true);

  return (
    <section className="conflict-notice" role="alert">
      <div className="conflict-copy">
        <WarningDiamondIcon weight={iconWeight} aria-hidden="true" />
        <div>
          <strong>External changes detected</strong>
          <p>
            The file changed on disk. Your local edits have not been
            overwritten.
          </p>
        </div>
      </div>
      <div className="conflict-actions">
        <button type="button" onClick={onReload}>
          Reload disk
        </button>
        <button className="danger-action" type="button" onClick={onOverwrite}>
          Overwrite disk
        </button>
      </div>
    </section>
  );
}
