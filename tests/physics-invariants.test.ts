/**
 * physics-invariants.test.ts
 *
 * Exit refraction must use the index ratio of the medium the ray is actually
 * crossing, from either side of a surface. Grating orders that are too faint
 * to trace, and fiber bend loss, must leave that power in the truncation budget.
 */

import { describe, expect, it } from "vitest";
import { FiberCoreGlass } from "../src/common/model/fiber/FiberOpticElement.js";
import { CircleGlass } from "../src/common/model/glass/CircleGlass.js";
import { HalfPlaneGlass } from "../src/common/model/glass/HalfPlaneGlass.js";
import { SlabGlass } from "../src/common/model/glass/SlabGlass.js";
import { SphericalLens } from "../src/common/model/glass/SphericalLens.js";
import { ReflectionGrating } from "../src/common/model/gratings/ReflectionGrating.js";
import { TransmissionGrating } from "../src/common/model/gratings/TransmissionGrating.js";
import { point } from "../src/common/model/optics/Geometry.js";
import type { OpticalElement, SimulationRay } from "../src/common/model/optics/OpticsTypes.js";

const NO_PARTIAL = { partialReflectionEnabled: false, lensRimBlockingEnabled: false } as const;

function ray(origin: { x: number; y: number }, direction: { x: number; y: number }): SimulationRay {
  return {
    origin: point(origin.x, origin.y),
    direction: point(direction.x, direction.y),
    brightnessS: 0.5,
    brightnessP: 0.5,
    gap: false,
    isNew: false,
  };
}

function brightness(r: SimulationRay | undefined): number {
  return r ? r.brightnessS + r.brightnessP : 0;
}

type Refractor = OpticalElement & {
  partialReflect: boolean;
  getIncidentType: (ray: SimulationRay, surfacePoint: { x: number; y: number }) => number;
};

/** Entry then exit for one ray. Fresnel reflections are off so the transmitted ray carries the power. */
function traceThrough(element: Refractor, incident: SimulationRay) {
  element.partialReflect = false;
  const entry = element.checkRayIntersection(incident);
  if (!entry) {
    return null;
  }
  const entered = element.onRayIncident(incident, entry, NO_PARTIAL);
  const inside = entered.outgoingRay;
  if (!inside) {
    return null;
  }
  const exitHit = element.checkRayIntersection(inside);
  if (!exitHit) {
    return null;
  }
  const exited = element.onRayIncident(inside, exitHit, NO_PARTIAL);
  return {
    entryType: element.getIncidentType(incident, entry.point),
    exitType: element.getIncidentType(inside, exitHit.point),
    inside,
    out: exited.outgoingRay,
  };
}

describe("exit refraction", () => {
  it("leaves a plane-parallel slab parallel to the incident ray from either side", () => {
    const slab = new SlabGlass(point(0, 0), 1, 1, 1.5, 0, false);
    const fromLeft = traceThrough(slab, ray({ x: -2, y: 0.1 }, { x: 1, y: 0.05 }));
    const fromRight = traceThrough(slab, ray({ x: 2, y: 0.1 }, { x: -1, y: 0.05 }));
    expect(fromLeft).not.toBeNull();
    expect(fromRight).not.toBeNull();
    if (!(fromLeft?.out && fromRight?.out)) {
      return;
    }
    expect(fromLeft.exitType).toBe(1);
    expect(fromRight.exitType).toBe(1);
    expect(fromLeft.out.direction.y / fromLeft.out.direction.x).toBeCloseTo(0.05, 8);
    expect(fromRight.out.direction.y / fromRight.out.direction.x).toBeCloseTo(-0.05, 8);
  });

  it("bends a symmetric spherical lens toward the axis from either side", () => {
    const lens = new SphericalLens(point(0, 0.4), point(0, -0.4), 0.8, -0.8, 1.5);
    const fromLeft = traceThrough(lens, ray({ x: -3, y: 0.15 }, { x: 1, y: 0 }));
    const fromRight = traceThrough(lens, ray({ x: 3, y: 0.15 }, { x: -1, y: 0 }));
    expect(fromLeft?.out).toBeDefined();
    expect(fromRight?.out).toBeDefined();
    if (!(fromLeft?.out && fromRight?.out)) {
      return;
    }
    expect(fromLeft.exitType).toBe(1);
    expect(fromRight.exitType).toBe(1);
    expect(fromLeft.out.direction.x).toBeGreaterThan(0);
    expect(fromLeft.out.direction.y).toBeLessThan(0);
    expect(fromRight.out.direction.x).toBeCloseTo(-fromLeft.out.direction.x, 5);
    expect(fromRight.out.direction.y).toBeCloseTo(fromLeft.out.direction.y, 5);
  });

  it("treats the far side of a circle as an exit for every impact parameter", () => {
    const glass = new CircleGlass(point(0, 0), point(1, 0), 1.5);
    for (const y of [-0.8, -0.4, -0.1, 0, 0.1, 0.4, 0.8]) {
      for (const dir of [1, -1]) {
        const traced = traceThrough(glass, ray({ x: -3 * dir, y }, { x: dir, y: 0 }));
        expect(traced?.exitType, `y=${y} dir=${dir}`).toBe(1);
      }
    }
    const offAxis = traceThrough(glass, ray({ x: -3, y: 0.4 }, { x: 1, y: 0 }));
    expect(offAxis?.inside).toBeDefined();
    expect(offAxis?.out).toBeDefined();
    if (!(offAxis?.inside && offAxis.out)) {
      return;
    }
    // Glass-to-air bends away from the normal, so the exit slope is steeper than the interior slope.
    const interiorSlope = Math.abs(offAxis.inside.direction.y / offAxis.inside.direction.x);
    const exitSlope = Math.abs(offAxis.out.direction.y / offAxis.out.direction.x);
    expect(exitSlope).toBeGreaterThan(interiorSlope);
  });

  it("bends a ray entering a glass half-plane toward the normal", () => {
    const plane = new HalfPlaneGlass(point(0, -1), point(0, 1), 1.5);
    plane.partialReflect = false;
    const incident = ray({ x: 2, y: 0.2 }, { x: -1, y: 0.3 });
    const hit = plane.checkRayIntersection(incident);
    expect(hit).not.toBeNull();
    if (!hit) {
      return;
    }
    expect(plane.getIncidentType(incident, hit.point)).toBe(-1);
    const entered = plane.onRayIncident(incident, hit, NO_PARTIAL);
    const dir = entered.outgoingRay?.direction;
    expect(dir).toBeDefined();
    if (!dir) {
      return;
    }
    const incidentSlope = Math.abs(0.3 / -1);
    expect(Math.abs(dir.y / dir.x)).toBeLessThan(incidentSlope);
    expect(dir.x).toBeLessThan(0);
  });
});

describe("energy that is not traced", () => {
  it("counts faint grating orders as truncation instead of boosting the rest", () => {
    const grating = new TransmissionGrating(point(0, -1), point(0, 1), 600, 0.98);
    const incident = ray({ x: -1, y: 0 }, { x: 1, y: 0 });
    const hit = grating.checkRayIntersection(incident);
    expect(hit).not.toBeNull();
    if (!hit) {
      return;
    }
    const result = grating.onRayIncident(incident, hit);
    const emitted = brightness(result.outgoingRay) + (result.newRays ?? []).reduce((sum, r) => sum + brightness(r), 0);
    const truncation = result.truncation ?? 0;
    expect(truncation).toBeGreaterThan(0);
    expect(emitted + truncation).toBeCloseTo(1, 8);
    expect(brightness(result.outgoingRay)).toBeLessThan(1);
  });

  it("reflects the zero order with the specular sign", () => {
    const grating = new ReflectionGrating(point(0, -1), point(0, 1), 600, 0.5);
    const incident = ray({ x: -1, y: 0 }, { x: 1, y: 0.25 });
    const hit = grating.checkRayIntersection(incident);
    expect(hit).not.toBeNull();
    if (!hit) {
      return;
    }
    const dir = grating.onRayIncident(incident, hit).outgoingRay?.direction;
    expect(dir).toBeDefined();
    if (!dir) {
      return;
    }
    expect(dir.x).toBeLessThan(0);
    expect(dir.y).toBeGreaterThan(0);
  });

  it("records fiber bend loss in the truncation budget", () => {
    const core = new FiberCoreGlass(1.5, 1.45);
    core.partialReflect = false;
    core.path = [
      { x: -0.5, y: -0.4 },
      { x: 0.5, y: -0.4 },
      { x: 0.5, y: 0.4 },
      { x: -0.5, y: 0.4 },
    ];
    core.bendLossCoeff = 1;
    core.criticalBendRadius = 1;
    core.spineCurvatures = [{ point: point(-0.5, 0), curvature: 3 }];

    const incident = ray({ x: -2, y: 0 }, { x: 1, y: 0 });
    const hit = core.checkRayIntersection(incident);
    expect(hit).not.toBeNull();
    if (!hit) {
      return;
    }
    const result = core.onRayIncident(incident, hit, NO_PARTIAL);
    const out = brightness(result.outgoingRay);
    const reflected = (result.newRays ?? []).reduce((sum, r) => sum + brightness(r), 0);
    const truncation = result.truncation ?? 0;
    expect(out).toBeGreaterThan(0);
    expect(out).toBeLessThan(1);
    expect(out + reflected + truncation).toBeCloseTo(1, 8);
  });
});
