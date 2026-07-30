import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MarkdownEditor } from "./MarkdownEditor";

describe("MarkdownEditor", () => {
  it("creates an accessible editor with the supplied source", () => {
    render(<MarkdownEditor value="# Hello" onChange={vi.fn()} />);

    expect(
      screen.getByRole("textbox", { name: "Markdown source" }),
    ).toHaveTextContent("# Hello");
  });

  it("replaces its document when the controlled value changes", () => {
    const { rerender } = render(
      <MarkdownEditor value="# First" onChange={vi.fn()} />,
    );

    rerender(<MarkdownEditor value="# Second" onChange={vi.fn()} />);

    expect(
      screen.getByRole("textbox", { name: "Markdown source" }),
    ).toHaveTextContent("# Second");
  });

  it("reports CodeMirror document changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MarkdownEditor value="# Hello" onChange={onChange} />);

    const editor = screen.getByRole("textbox", { name: "Markdown source" });
    await user.click(editor);
    await user.keyboard("{End}!");

    expect(onChange).toHaveBeenLastCalledWith("# Hello!");
  });
});
