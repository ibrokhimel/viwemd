import { describe, expect, it } from "vitest";
import { isMarkdownFile, sortWorkspaceEntries } from "./paths";

describe("isMarkdownFile", () => {
  it.each(["a.md", "a.MARKDOWN", "a.mdown", "a.mkd", "a.mkdn", "a.mdwn"])(
    "recognizes %s",
    (name) => expect(isMarkdownFile(name)).toBe(true),
  );

  it.each(["a.txt", "a.md.bak", ".md", "README"])(
    "rejects %s",
    (name) => expect(isMarkdownFile(name)).toBe(false),
  );
});

describe("sortWorkspaceEntries", () => {
  it("sorts directories first and names case-insensitively", () => {
    const entries = [
      { kind: "file" as const, name: "Zoo.md", path: "/Zoo.md" },
      { kind: "directory" as const, name: "docs", path: "/docs" },
      { kind: "file" as const, name: "about.md", path: "/about.md" },
    ];

    expect(sortWorkspaceEntries(entries).map((entry) => entry.name)).toEqual([
      "docs",
      "about.md",
      "Zoo.md",
    ]);
  });
});
