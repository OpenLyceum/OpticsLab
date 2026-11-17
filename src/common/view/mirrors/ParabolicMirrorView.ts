/**
 * ParabolicMirrorView.ts
 *
 * Scenery node for a parabolic mirror. Shares the model's polyline
 * approximation (80 segments) and renders it with mirror styling.
 * Handles at p1, p2, and p3 allow reshaping; body drag repositions the mirror.
 */

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import type { Tandem } from "scenerystack/tandem";
import { PARABOLIC_MIRROR_SEGMENT_COUNT } from "../../../OpticsLabConstants.js";
import OpticsLabNamespace from "../../../OpticsLabNamespace.js";
import type { ParabolicMirror } from "../../model/mirrors/ParabolicMirror.js";
import { type Point, parabolaFocalPoint, sampleParabolaPoints } from "../../model/optics/Geometry.js";
import type { ViewOptionsModel } from "../ViewOptionsModel.js";
import { CurvedMirrorView } from "./CurvedMirrorView.js";

export class ParabolicMirrorView extends CurvedMirrorView<ParabolicMirror> {
  public constructor(
    mirror: ParabolicMirror,
    modelViewTransform: ModelViewTransform2,
    tandem: Tandem,
    viewOptions: ViewOptionsModel,
  ) {
    super(mirror, modelViewTransform, tandem, viewOptions);
  }

  protected override computeArmPoints(): Point[][] {
    const { p1, p2, p3 } = this.mirror;
    return [sampleParabolaPoints(p1, p2, p3, PARABOLIC_MIRROR_SEGMENT_COUNT)];
  }

  protected override computeFocalPoint(): Point | null {
    const { p1, p2, p3 } = this.mirror;
    return parabolaFocalPoint(p1, p2, p3);
  }
}

OpticsLabNamespace.register("ParabolicMirrorView", ParabolicMirrorView);
