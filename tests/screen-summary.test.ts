import { Property } from "scenerystack/axon";
import { localeProperty } from "scenerystack/joist";
import { Tandem } from "scenerystack/tandem";
import { expect, it, vi } from "vitest";
import { createDefaultElement } from "../src/common/model/ComponentFactory.js";
import { OpticsScene } from "../src/common/model/optics/OpticsScene.js";
import type { OpticalElement } from "../src/common/model/optics/OpticsTypes.js";
import { OpticsLabScreenSummaryContent } from "../src/common/view/OpticsLabScreenSummaryContent.js";
import { StringManager } from "../src/i18n/StringManager.js";

it("summarizes bench edits, selection, and locale changes", () => {
  // The shared harness initializes English only; allow this test to exercise the bundled translations.
  vi.spyOn(window.phet["chipper"], "checkAndRemapLocale").mockImplementation((locale) => locale);
  const scene = new OpticsScene(Tandem.OPT_OUT);
  const selected = new Property<OpticalElement | null>(null);
  const summary = new OpticsLabScreenSummaryContent(scene, selected);
  const mirror = createDefaultElement("arcMirror", 0, 0);
  try {
    expect(summary.getVoicingDetailsString()).toBe("Optical elements on the bench: 0. No element selected.");
    scene.addElement(mirror);
    selected.value = mirror;
    expect(summary.getVoicingDetailsString()).toContain("bench: 1. Selected:");
    for (const locale of ["fr", "es", "en"] as const) {
      localeProperty.value = locale;
      const label = StringManager.getInstance().getElementTypeNameProperty(mirror.type)?.value;
      expect(label).toBeTruthy();
      expect(summary.getVoicingDetailsString()).toContain(label);
    }
    selected.value = null;
    scene.removeElement(mirror.id);
    expect(summary.getVoicingDetailsString()).toBe("Optical elements on the bench: 0. No element selected.");
    scene.history.undo();
    expect(summary.getVoicingDetailsString()).toContain("bench: 1.");
    scene.resetAll();
    expect(summary.getVoicingDetailsString()).toContain("bench: 0.");
  } finally {
    localeProperty.value = "en";
    summary.dispose();
    selected.dispose();
    scene.dispose();
    mirror.dispose();
  }
});
