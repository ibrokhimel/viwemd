import { describe, expect, it } from "vitest";
import {
  documentReducer,
  initialDocumentState,
  type OpenDocument,
} from "./documentState";

const readme: OpenDocument = {
  id: "/notes/README.md",
  path: "/notes/README.md",
  name: "README.md",
  source: "# Home",
  persistedSource: "# Home",
  lineEnding: "lf",
  cursorOffset: 0,
  editorScrollTop: 0,
  previewScrollTop: 0,
};

const setup: OpenDocument = {
  ...readme,
  id: "/notes/setup.md",
  path: "/notes/setup.md",
  name: "setup.md",
  source: "# Setup",
  persistedSource: "# Setup",
  lineEnding: "lf",
};

const guide: OpenDocument = {
  ...readme,
  id: "/notes/guide.md",
  path: "/notes/guide.md",
  name: "guide.md",
  source: "# Guide",
  persistedSource: "# Guide",
  lineEnding: "lf",
};

describe("documentReducer", () => {
  it("opens one tab per path and activates an existing tab", () => {
    const opened = documentReducer(initialDocumentState, {
      type: "opened",
      document: readme,
    });
    const reopened = documentReducer(opened, {
      type: "opened",
      document: readme,
    });

    expect(reopened.tabs).toEqual([readme]);
    expect(reopened.activeId).toBe(readme.id);
  });

  it("changes source without changing the persisted version", () => {
    const opened = documentReducer(initialDocumentState, {
      type: "opened",
      document: readme,
    });
    const edited = documentReducer(opened, {
      type: "sourceChanged",
      id: readme.id,
      source: "# Edited",
    });

    expect(edited.tabs[0]).toMatchObject({
      source: "# Edited",
      persistedSource: "# Home",
    });
  });

  it("closes the active tab to the right, then falls back left", () => {
    const withReadme = documentReducer(initialDocumentState, {
      type: "opened",
      document: readme,
    });
    const withSetup = documentReducer(withReadme, {
      type: "opened",
      document: setup,
    });
    const withGuide = documentReducer(withSetup, {
      type: "opened",
      document: guide,
    });
    const setupActive = documentReducer(withGuide, {
      type: "activated",
      id: setup.id,
    });

    const closedMiddle = documentReducer(setupActive, {
      type: "closed",
      id: setup.id,
    });
    expect(closedMiddle.tabs).toEqual([readme, guide]);
    expect(closedMiddle.activeId).toBe(guide.id);

    const closedRight = documentReducer(closedMiddle, {
      type: "closed",
      id: guide.id,
    });
    expect(closedRight.activeId).toBe(readme.id);

    const closedFinal = documentReducer(closedRight, {
      type: "closed",
      id: readme.id,
    });
    expect(closedFinal).toEqual({ tabs: [], activeId: null });
  });

  it("updates cursor and independent editor and preview scroll positions", () => {
    const opened = documentReducer(initialDocumentState, {
      type: "opened",
      document: readme,
    });
    const cursorMoved = documentReducer(opened, {
      type: "cursorChanged",
      id: readme.id,
      cursorOffset: 12,
    });
    const editorScrolled = documentReducer(cursorMoved, {
      type: "editorScrolled",
      id: readme.id,
      editorScrollTop: 80,
    });
    const previewScrolled = documentReducer(editorScrolled, {
      type: "previewScrolled",
      id: readme.id,
      previewScrollTop: 140,
    });

    expect(previewScrolled.tabs[0]).toMatchObject({
      cursorOffset: 12,
      editorScrollTop: 80,
      previewScrollTop: 140,
    });
  });

  it("returns the same state for no-op actions", () => {
    const opened = documentReducer(initialDocumentState, {
      type: "opened",
      document: readme,
    });

    expect(
      documentReducer(opened, { type: "activated", id: readme.id }),
    ).toBe(opened);
    expect(
      documentReducer(opened, {
        type: "sourceChanged",
        id: readme.id,
        source: readme.source,
      }),
    ).toBe(opened);
    expect(documentReducer(opened, { type: "closed", id: "missing" })).toBe(
      opened,
    );
  });
});
