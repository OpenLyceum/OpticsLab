import { describe, expect, it } from "vitest";
import { DetectorElement } from "../../../../src/common/model/detectors/DetectorElement.js";
import { AperturedParabolicMirror } from "../../../../src/common/model/mirrors/AperturedParabolicMirror.js";
import { ArcMirror } from "../../../../src/common/model/mirrors/ArcMirror.js";
import { ParabolicMirror } from "../../../../src/common/model/mirrors/ParabolicMirror.js";
import { point } from "../../../../src/common/model/optics/Geometry.js";
import type { SimulationRay } from "../../../../src/common/model/optics/OpticsTypes.js";

function ray(x: number, y: number, dx: number, dy: number): SimulationRay {
  return {
    origin: point(x, y),
    direction: point(dx, dy),
    brightnessS: 0.3,
    brightnessP: 0.7,
    wavelength: 532,
    gap: false,
    isNew: false,
  };
}

for (const Element of [ArcMirror, DetectorElement]) {
  describe(`${Element.name} arc geometry`, () => {
    it.each([-1, 1])("preserves curvature side %i when changing radius", (side) => {
      const element = new Element(point(-1, 0), point(1, 0), point(0, side));
      element.setRadius(2);
      expect(element.p3.x).toBe(0);
      expect(element.p3.y).toBeCloseTo(side * (2 - Math.sqrt(3)), 12);
      expect(element.getRadius()).toBeCloseTo(2, 12);
      element.dispose();
    });

    it("retains shallow curvature for a large finite radius", () => {
      const element = new Element(point(-1, 0), point(1, 0), point(0, 1));
      element.setRadius(1e8);
      expect(element.p3.y / 5e-9).toBeCloseTo(1, 12);
      expect(element.getRadius()! / 1e8).toBeCloseTo(1, 12);
      element.dispose();
    });

    it("leaves a collapsed chord finite and unchanged", () => {
      const element = new Element(point(2, 3), point(2, 3), point(2, 3));
      element.setRadius(2);
      expect(element.p3).toEqual(point(2, 3));
      element.dispose();
    });

    it.each([0.5, -1, Number.NaN, Number.POSITIVE_INFINITY])("ignores invalid radius %s", (radius) => {
      const element = new Element(point(-1, 0), point(1, 0), point(0, 1));
      element.setRadius(radius);
      expect(element.p3).toEqual(point(0, 1));
      element.dispose();
    });

    it("starts a flat arc on the perpendicular bisector", () => {
      const element = new Element(point(0, -1), point(0, 1), point(0, 0));
      element.setRadius(1);
      expect(element.p3).toEqual(point(-1, 0));
      element.dispose();
    });

    it("intersects the chosen semicircle from either side with a facing normal", () => {
      const element = new Element(point(-1, 0), point(1, 0), point(0, 1));
      for (const direction of [-1, 1]) {
        const hit = element.checkRayIntersection(ray(0, -3 * direction, 0, direction));
        expect(hit).not.toBeNull();
        expect(hit!.point.x).toBeCloseTo(0, 12);
        expect(hit!.point.y).toBeCloseTo(1, 12);
        expect(hit!.normal.y).toBe(-direction);
      }
      element.dispose();
    });

    it("includes the sides of a major arc across the angle wrap", () => {
      const element = new Element(point(Math.sqrt(3) / 2, 0.5), point(-Math.sqrt(3) / 2, 0.5), point(0, -1));
      const hit = element.checkRayIntersection(ray(3, 0, -1, 0));
      expect(hit).not.toBeNull();
      expect(hit!.point.x).toBeCloseTo(1, 12);
      expect(hit!.point.y).toBeCloseTo(0, 12);
      element.dispose();
    });
  });
}

describe("parabolic mirror geometry", () => {
  it("samples a translated parabola with a rotated chord in model coordinates", () => {
    const mirror = new AperturedParabolicMirror(point(2, 2), point(2, 4), point(1, 3), 0.2);
    const samples = mirror.computePoints();
    expect(samples[0]).toEqual(point(2, 2));
    expect(samples.at(-1)).toEqual(point(2, 4));
    for (const sample of samples) {
      expect(sample.x).toBeCloseTo(1 + (sample.y - 3) ** 2, 12);
    }
    mirror.dispose();
  });

  it("samples the analytic parabola through the endpoints and vertex", () => {
    const mirror = new AperturedParabolicMirror(point(-1, 0), point(1, 0), point(0, 1), 0.2);
    const samples = mirror.computePoints();
    expect(samples[0]).toEqual(point(-1, 0));
    expect(samples.at(-1)).toEqual(point(1, 0));
    for (const sample of samples) {
      expect(sample.y).toBeCloseTo(1 - sample.x ** 2, 12);
    }
    mirror.dispose();
  });

  it("keeps the central aperture transparent while reflecting off-axis rays", () => {
    const solid = new ParabolicMirror(point(-1, 0), point(1, 0), point(0, 1));
    const apertured = new AperturedParabolicMirror(point(-1, 0), point(1, 0), point(0, 1), 0.2);
    const centralRay = ray(0, -3, 0, 1);
    expect(solid.checkRayIntersection(centralRay)?.point.y).toBeCloseTo(1, 12);
    expect(apertured.checkRayIntersection(centralRay)).toBeNull();
    const incident = ray(0.5, -3, 0, 1);
    const hit = apertured.checkRayIntersection(incident);
    expect(hit).not.toBeNull();
    expect(hit!.point.y).toBeCloseTo(0.75, 3);
    expect(solid.checkRayIntersection(incident)?.point).toEqual(hit!.point);
    const reflected = apertured.onRayIncident(incident, hit!).outgoingRay!;
    expect(reflected.direction.x).toBeLessThan(0);
    // y = 1 - x² has focus (0, 0.75). Segment normals approximate its tangent.
    const focusY = reflected.origin.y - (reflected.origin.x * reflected.direction.y) / reflected.direction.x;
    expect(focusY).toBeCloseTo(0.75, 1);
    expect(reflected.brightnessS + reflected.brightnessP).toBeCloseTo(1, 12);
    expect(reflected.wavelength).toBe(532);
    solid.dispose();
    apertured.dispose();
  });

  it("retains finite bounds and no intersections for a collapsed parabola", () => {
    const mirror = new AperturedParabolicMirror(point(2, 3), point(2, 3), point(2, 3), 0.2);
    expect(mirror.computePoints()).toEqual([point(2, 3), point(2, 3)]);
    expect(mirror.getBounds()).toEqual({ minX: 2, maxX: 2, minY: 3, maxY: 3 });
    expect(mirror.checkRayIntersection(ray(0, 3, 1, 0))).toBeNull();
    mirror.dispose();
  });

  it("keeps the detector's flat fallback distinct from a degenerate mirror", () => {
    const detector = new DetectorElement(point(-1, 0), point(1, 0));
    const mirror = new ArcMirror(point(-1, 0), point(1, 0), point(0, 0));
    expect(detector.checkRayIntersection(ray(0, 1, 0, -1))?.point).toEqual(point(0, 0));
    expect(mirror.checkRayIntersection(ray(0, 1, 0, -1))).toBeNull();
    detector.dispose();
    mirror.dispose();
  });
});
