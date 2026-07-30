import type { ReactElement } from "react";

interface ConflictNoticeProps {
  onReload(): void;
  onOverwrite(): void;
}

export function ConflictNotice({
  onReload,
  onOverwrite,
}: ConflictNoticeProps): ReactElement {
  return (
    <section className="conflict-notice" role="alert">
      <div>
        <strong>External changes detected</strong>
        <p>The file changed on disk. Your local edits have not been overwritten.</p>
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
