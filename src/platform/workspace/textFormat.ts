import type { LineEnding } from "./types";

export function normalizeDocumentText(source: string): string {
  return source.replace(/\r\n?/g, "\n");
}

export function parseDocumentText(source: string): {
  source: string;
  lineEnding: LineEnding;
} {
  return {
    source: normalizeDocumentText(source),
    lineEnding: source.includes("\r\n") ? "crlf" : "lf",
  };
}

export function serializeDocumentText(
  source: string,
  lineEnding: LineEnding,
): string {
  const normalized = normalizeDocumentText(source);
  return lineEnding === "crlf" ? normalized.replace(/\n/g, "\r\n") : normalized;
}
