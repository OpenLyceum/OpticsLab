/**
 * Smoke and sync-guard checks for the glass and lens edit-control builders.
 *
 * Refreshing the panel from the model must never write the clamped slider
 * values back into the model, and fixed-sign lenses must keep their sign.
 */

import { describe, expect, it } from "vitest";
import { BiconcaveLens } from "../../../src/common/model/glass/BiconcaveLens.js";
import { BiconvexLens } from "../../../src/common/model/glass/BiconvexLens.js";
import { DovePrism } from "../../../src/common/model/glass/DovePrism.js";
import { EquilateralPrism } from "../../../src/common/model/glass/EquilateralPrism.js";
import { ParallelogramPrism } from "../../../src/common/model/glass/ParallelogramPrism.js";
import { PlanoConcaveLens } from "../../../src/common/model/glass/PlanoConcaveLens.js";
import { PlanoConvexLens } from "../../../src/common/model/glass/PlanoConvexLens.js";
import { PorroPrism } from "../../../src/common/model/glass/PorroPrism.js";
import { RightAnglePrism } from "../../../src/common/model/glass/RightAnglePrism.js";
import { SlabGlass } from "../../../src/common/model/glass/SlabGlass.js";
import { SphericalLens } from "../../../src/common/model/glass/SphericalLens.js";
import { point } from "../../../src/common/model/optics/Geometry.js";
import {
  buildDovePrismControls,
  buildEquilateralPrismControls,
  buildParallelogramPrismControls,
  buildPlanoLensControls,
  buildPorroPrismControls,
  buildRightAnglePrismControls,
  buildSlabGlassControls,
  buildSphericalLensControls,
  buildSymmetricLensControls,
} from "../../../src/common/view/edit-controls/GlassEditControls.js";

const noop = (): void => undefined;
const P1 = point(0, 0.5);
const P2 = point(0, -0.5);

describe("lens edit controls", () => {
  for (const useCurvatureDisplay of [false, true]) {
    const mode = useCurvatureDisplay ? "curvature" : "radius";

    it(`spherical lens (${mode}): refresh does not write clamped values back`, () => {
      const lens = new SphericalLens(P1, P2, 2, -2, 1.5);
      const result = buildSphericalLensControls(lens, noop, "newCartesian", useCurvatureDisplay);
      expect(result.controls).toHaveLength(5);
      // 40 m lies outside both slider ranges (|R| ≤ 20 m, κ ≥ 0.05 m⁻¹ maps to 20 m).
      lens.applyRadiusKeepingCorners("r1", 40);
      const before = lens.getDR1R2();
      result.refreshCallback?.();
      const after = lens.getDR1R2();
      expect(after.r1).toBeCloseTo(before.r1, 9);
      expect(after.r2).toBeCloseTo(before.r2, 9);
    });

    for (const [name, make, build, surface] of [
      ["biconvex", () => new BiconvexLens(P1, P2, 2), buildSymmetricLensControls, "r1"],
      ["biconcave", () => new BiconcaveLens(P1, P2, 2), buildSymmetricLensControls, "r1"],
      ["plano-convex", () => new PlanoConvexLens(P1, P2, 2), buildPlanoLensControls, "r2"],
      ["plano-concave", () => new PlanoConcaveLens(P1, P2, 2), buildPlanoLensControls, "r2"],
    ] as const) {
      it(`${name} (${mode}): one surface slider and a preserved sign`, () => {
        const lens = make();
        const sign = Math.sign(lens.getDR1R2()[surface]);
        const result = build(lens, noop, "newCartesian", useCurvatureDisplay);
        expect(result.controls).toHaveLength(4);
        lens.applyRadiusKeepingCorners(surface, sign * 40);
        const before = lens.getDR1R2()[surface];
        result.refreshCallback?.();
        expect(lens.getDR1R2()[surface]).toBeCloseTo(before, 9);
        expect(Math.sign(lens.getDR1R2()[surface])).toBe(sign);
      });
    }
  }
});

describe("prism edit controls", () => {
  it.each([
    ["equilateral", () => buildEquilateralPrismControls(new EquilateralPrism(point(0, 0)), noop)],
    ["right-angle", () => buildRightAnglePrismControls(new RightAnglePrism(point(0, 0)), noop)],
    ["porro", () => buildPorroPrismControls(new PorroPrism(point(0, 0)), noop)],
  ])("%s prism: size, angle and refractive index", (_name, build) => {
    const result = build();
    expect(result.controls).toHaveLength(3);
    expect(() => result.refreshCallback?.()).not.toThrow();
  });

  it.each([
    ["slab", () => buildSlabGlassControls(new SlabGlass(point(0, 0)), noop)],
    ["parallelogram", () => buildParallelogramPrismControls(new ParallelogramPrism(point(0, 0)), noop)],
    ["dove", () => buildDovePrismControls(new DovePrism(point(0, 0)), noop)],
  ])("%s glass: width, height, angle and refractive index", (_name, build) => {
    const result = build();
    expect(result.controls).toHaveLength(4);
    expect(() => result.refreshCallback?.()).not.toThrow();
  });
});
