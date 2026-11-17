/**
 * TransmissionGratingView.ts
 *
 * View for a transmission diffraction grating. Rendered as a line segment
 * with short perpendicular tick marks to represent the periodic groove structure.
 */

import type { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Path } from "scenerystack/scenery";
import type { Tandem } from "scenerystack/tandem";
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  GLASS_STROKE_WIDTH,
  TRANSMISSION_GRATING_TICK_COUNT,
  TRANSMISSION_GRATING_TICK_HALF_PX,
} from "../../../OpticsLabConstants.js";
import OpticsLabNamespace from "../../../OpticsLabNamespace.js";
import type { TransmissionGrating } from "../../model/gratings/TransmissionGrating.js";
import type { ViewOptionsModel } from "../ViewOptionsModel.js";
import { GratingView, type GrooveFrame } from "./GratingView.js";

export class TransmissionGratingView extends GratingView {
  public constructor(
    grating: TransmissionGrating,
    modelViewTransform: ModelViewTransform2,
    tandem: Tandem,
    viewOptions?: ViewOptionsModel,
  ) {
    super(
      grating,
      modelViewTransform,
      tandem,
      viewOptions,
      [
        new Path(null, {
          stroke: OpticsLabColors.glassStrokeProperty,
          lineWidth: GLASS_STROKE_WIDTH + 1,
          lineCap: "round",
          pickable: false,
        }),
      ],
      new Path(null, { stroke: OpticsLabColors.glassStrokeProperty, lineWidth: 1, pickable: false }),
      TRANSMISSION_GRATING_TICK_COUNT,
    );
  }

  /** Short tick perpendicular to the grating line, centered on it. */
  protected override addGrooveMark(shape: Shape, { cx, cy, nx, ny }: GrooveFrame): void {
    const h = TRANSMISSION_GRATING_TICK_HALF_PX;
    shape.moveTo(cx - nx * h, cy - ny * h);
    shape.lineTo(cx + nx * h, cy + ny * h);
  }
}

OpticsLabNamespace.register("TransmissionGratingView", TransmissionGratingView);
