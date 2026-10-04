import { describe, expect, it } from "vitest";
import { DetectorElement } from "../src/common/model/detectors/DetectorElement.js";
import { point } from "../src/common/model/optics/Geometry.js";

describe("Detector acquisition scene changes", () => {
  it("cancels an unfinished acquisition and starts fresh", () => {
    const detector = new DetectorElement(point(0, 0), point(1, 0));
    detector.startAcquisition();
    detector.acquisition.accumulate(0.5, 2);
    detector.stepAcquisition(0.1);
    detector.clearAcquisition();
    expect(detector.isAcquiring).toBe(false);
    expect(detector.acquisitionComplete).toBe(false);
    expect(detector.acquiredBins).toEqual([]);
    expect(detector.stepAcquisition(100)).toBe(false);
    detector.startAcquisition();
    expect(detector.acquiredBins.every((bin) => bin === 0)).toBe(true);
    expect(detector.stepAcquisition(0.1)).toBe(false);
  });

  it("discards completed results too", () => {
    const detector = new DetectorElement(point(0, 0), point(1, 0));
    detector.startAcquisition();
    detector.acquisition.accumulate(0.5, 2);
    expect(detector.stepAcquisition(100)).toBe(true);
    detector.clearAcquisition();
    expect(detector.acquisitionComplete).toBe(false);
    expect(detector.acquiredBins).toEqual([]);
  });
});
