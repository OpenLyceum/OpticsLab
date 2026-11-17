/**
 * AperturedParabolicMirrorView.ts
 *
 * Scenery node for a parabolic mirror with a central aperture. The mirror
 * is drawn as two half-segments (left arm and right arm) with a visible gap
 * in the center corresponding to the aperture.
 *
 * Handles at p1, p2, and p3 allow reshaping; body drag (from either arm)
 * repositions the mirror. The aperture size is adjusted via the edit panel slider.
 */

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import type { Tandem } from "scenerystack/tandem";
import { APERTURED_MIRROR_MAX_APERTURE_FRACTION } from "../../../OpticsLabConstants.js";
import OpticsLabNamespace from "../../../OpticsLabNamespace.js";
import type { AperturedParabolicMirror } from "../../model/mirrors/AperturedParabolicMirror.js";
import { distance, type Point, parabolaFocalPoint } from "../../model/optics/Geometry.js";
import type { ViewOptionsModel } from "../ViewOptionsModel.js";
import { CurvedMirrorView } from "./CurvedMirrorView.js";

export class AperturedParabolicMirrorView extends CurvedMirrorView<AperturedParabolicMirror> {
  public constructor(
    mirror: AperturedParabolicMirror,
    modelViewTransform: ModelViewTransform2,
    tandem: Tandem,
    viewOptions: ViewOptionsModel,
  ) {
    super(mirror, modelViewTransform, tandem, viewOptions, 2);
  }

  /** Splits the model's sampled points into left and right arms around the central aperture. */
  protected override computeArmPoints(): Point[][] {
    const { p1, p2 } = this.mirror;
    const chordLen = distance(p1, p2);
    if (chordLen <= 1e-10) {
      return [[], []];
    }
    const effectiveHalfWidth = Math.min(
      this.mirror.apertureHalfWidth,
      (chordLen / 2) * APERTURED_MIRROR_MAX_APERTURE_FRACTION,
    );
    const chordMidX = (p1.x + p2.x) / 2;
    const chordMidY = (p1.y + p2.y) / 2;
    const tangentX = (p2.x - p1.x) / chordLen;
    const tangentY = (p2.y - p1.y) / chordLen;

    const left: Point[] = [];
    const right: Point[] = [];
    for (const p of this.mirror.computePoints()) {
      const coord = (p.x - chordMidX) * tangentX + (p.y - chordMidY) * tangentY;
      if (coord <= -effectiveHalfWidth) {
        left.push(p);
      } else if (coord >= effectiveHalfWidth) {
        right.push(p);
      }
    }
    return [left, right];
  }

  /** The aperture does not move the focus of the underlying parabola. */
  protected override computeFocalPoint(): Point | null {
    const { p1, p2, p3 } = this.mirror;
    return parabolaFocalPoint(p1, p2, p3);
  }
}

OpticsLabNamespace.register("AperturedParabolicMirrorView", AperturedParabolicMirrorView);
