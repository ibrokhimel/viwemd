import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InMemoryWorkspacePort } from "../test/InMemoryWorkspacePort";
import { App } from "./App";

describe("App", () => {
  it("exposes the product identity and local workspace boundary", () => {
    const workspacePort = new InMemoryWorkspacePort(null, {});

    render(<App workspacePort={workspacePort} />);

    expect(screen.getByRole("main")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Viwemd" })).toBeVisible();
    expect(screen.getByText("Local Markdown workspace")).toBeVisible();
    expect(screen.getByRole("button", { name: "Open folder" })).toBeVisible();
  });
});
