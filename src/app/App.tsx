import type { ReactElement } from "react";
import "./app.css";

export function App(): ReactElement {
  return (
    <main className="app-shell">
      <div className="app-identity">
        <span className="app-mark" aria-hidden="true">
          M↓
        </span>
        <div>
          <h1>Viwemd</h1>
          <p>Local Markdown workspace</p>
        </div>
      </div>
    </main>
  );
}
