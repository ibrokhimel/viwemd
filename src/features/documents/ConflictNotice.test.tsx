import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConflictNotice } from "./ConflictNotice";

describe("ConflictNotice", () => {
  it("keeps both recovery actions beside a visible warning icon", async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    const onOverwrite = vi.fn();

    render(<ConflictNotice onReload={onReload} onOverwrite={onOverwrite} />);

    const alert = screen.getByRole("alert");
    expect(alert.querySelector("svg")).not.toBeNull();
    expect(alert).toHaveTextContent(
      "Your local edits have not been overwritten",
    );

    await user.click(screen.getByRole("button", { name: "Reload disk" }));
    await user.click(screen.getByRole("button", { name: "Overwrite disk" }));
    expect(onReload).toHaveBeenCalledOnce();
    expect(onOverwrite).toHaveBeenCalledOnce();
  });
});
