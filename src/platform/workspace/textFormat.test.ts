import { describe, expect, it } from "vitest";
import {
  normalizeDocumentText,
  parseDocumentText,
  serializeDocumentText,
} from "./textFormat";

describe("document text formatting", () => {
  it("detects and normalizes CRLF documents", () => {
    expect(parseDocumentText("# One\r\n\r\nTwo\r\n")).toEqual({
      source: "# One\n\nTwo\n",
      lineEnding: "crlf",
    });
  });

  it("treats LF, empty, and lone carriage returns as normalized LF", () => {
    expect(parseDocumentText("# One\nTwo\n")).toEqual({
      source: "# One\nTwo\n",
      lineEnding: "lf",
    });
    expect(parseDocumentText("")).toEqual({ source: "", lineEnding: "lf" });
    expect(normalizeDocumentText("a\rb\r\nc")).toBe("a\nb\nc");
  });

  it("serializes normalized editor text with the original convention", () => {
    expect(serializeDocumentText("a\nb\n", "crlf")).toBe("a\r\nb\r\n");
    expect(serializeDocumentText("a\r\nb\n", "lf")).toBe("a\nb\n");
  });
});
