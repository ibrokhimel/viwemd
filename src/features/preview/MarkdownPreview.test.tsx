import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownPreview } from "./MarkdownPreview";

describe("MarkdownPreview", () => {
  it("renders GFM task lists and tables", () => {
    render(
      <MarkdownPreview
        source={"- [x] Done\n\n| A | B |\n| - | - |\n| 1 | 2 |"}
      />,
    );

    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByRole("table")).toBeVisible();
  });

  it("generates stable heading anchors", () => {
    render(<MarkdownPreview source="# Getting Started" />);

    expect(
      screen.getByRole("heading", { name: "Getting Started" }),
    ).toHaveAttribute("id", "user-content-getting-started");
  });

  it("allows approved documentation HTML", () => {
    render(
      <MarkdownPreview
        source={
          '<details open><summary>More</summary><kbd>Ctrl</kbd> <mark>marked</mark> <abbr title="HyperText Markup Language">HTML</abbr></details>'
        }
      />,
    );

    expect(screen.getByText("More").closest("details")).toHaveAttribute("open");
    expect(screen.getByText("Ctrl").tagName).toBe("KBD");
    expect(screen.getByText("marked").tagName).toBe("MARK");
    expect(screen.getByText("HTML")).toHaveAttribute(
      "title",
      "HyperText Markup Language",
    );
  });

  it("removes scripts and event handlers from raw HTML", () => {
    const { container } = render(
      <MarkdownPreview
        source={'<img src="x" onerror="alert(1)"><script>alert(1)</script>'}
      />,
    );

    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
  });
});
