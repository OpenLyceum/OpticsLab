/**
 * ArcMirrorView.ts
 *
 * Scenery node for a circular-arc mirror. Samples points along the arc
 * from p1 to p2 through p3 and renders the polyline with mirror styling.
 * Handles at p1, p2, and p3 allow reshaping; body drag repositions the mirror.
 */

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import type { Tandem } from "scenerystack/tandem";
import { ARC_MIRROR_SAMPLE_COUNT } from "../../../OpticsLabConstants.js";
import OpticsLabNamespace from "../../../OpticsLabNamespace.js";
import type { ArcMirror } from "../../model/mirrors/ArcMirror.js";
import { arcFocalPoint, type Point, sampleArcPoints } from "../../model/optics/Geometry.js";
import type { ViewOptionsModel } from "../ViewOptionsModel.js";
import { CurvedMirrorView } from "./CurvedMirrorView.js";

export class ArcMirrorView extends CurvedMirrorView<ArcMirror> {
  public constructor(
    mirror: ArcMirror,
    modelViewTransform: ModelViewTransform2,
    tandem: Tandem,
    viewOptions: ViewOptionsModel,
  ) {
    super(mirror, modelViewTransform, tandem, viewOptions);
  }

  protected override computeArmPoints(): Point[][] {
    const { p1, p2, p3 } = this.mirror;
    return [sampleArcPoints(p1, p2, p3, ARC_MIRROR_SAMPLE_COUNT)];
  }

  /** Paraxial focus at R/2 from the vertex toward the center of curvature. */
  protected override computeFocalPoint(): Point | null {
    const { p1, p2, p3 } = this.mirror;
    return arcFocalPoint(p1, p2, p3);
  }
}

OpticsLabNamespace.register("ArcMirrorView", ArcMirrorView);
