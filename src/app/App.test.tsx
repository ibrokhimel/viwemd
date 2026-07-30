import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("exposes the product identity and local workspace boundary", () => {
    render(<App />);

    expect(screen.getByRole("main")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Viwemd" })).toBeVisible();
    expect(screen.getByText("Local Markdown workspace")).toBeVisible();
  });
});
