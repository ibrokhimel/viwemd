import { describe, expect, it } from "vitest";
import capability from "../../../src-tauri/capabilities/default.json";

describe("native persistence capability", () => {
  it("grants only the commands required for selected-folder atomic writes", () => {
    expect(capability.permissions).toEqual([
      "core:default",
      "dialog:allow-open",
      "fs:allow-read-dir",
      "fs:allow-read-text-file",
      "fs:allow-write-text-file",
      "fs:allow-rename",
      "fs:allow-remove",
    ]);
    expect(capability.description).toContain("selected workspace");
  });
});
