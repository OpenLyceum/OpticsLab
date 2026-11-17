/**
 * ReflectionGratingView.ts
 *
 * View for a reflection diffraction grating. Rendered as a mirror-like line
 * segment with angled hatch marks to represent the grooved reflective surface.
 */

import type { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Path } from "scenerystack/scenery";
import type { Tandem } from "scenerystack/tandem";
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  MIRROR_BACK_WIDTH,
  MIRROR_FRONT_WIDTH,
  REFLECTION_GRATING_GROOVE_COUNT,
  REFLECTION_GRATING_GROOVE_LENGTH_PX,
} from "../../../OpticsLabConstants.js";
import OpticsLabNamespace from "../../../OpticsLabNamespace.js";
import type { ReflectionGrating } from "../../model/gratings/ReflectionGrating.js";
import type { ViewOptionsModel } from "../ViewOptionsModel.js";
import { GratingView, type GrooveFrame } from "./GratingView.js";

export class ReflectionGratingView extends GratingView {
  public constructor(
    grating: ReflectionGrating,
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
          stroke: OpticsLabColors.mirrorBackStrokeProperty,
          lineWidth: MIRROR_BACK_WIDTH,
          lineCap: "round",
          pickable: false,
        }),
        new Path(null, {
          stroke: OpticsLabColors.mirrorFrontStrokeProperty,
          lineWidth: MIRROR_FRONT_WIDTH,
          lineCap: "round",
          pickable: false,
        }),
      ],
      new Path(null, { stroke: OpticsLabColors.mirrorFrontStrokeProperty, lineWidth: 1, pickable: false }),
      REFLECTION_GRATING_GROOVE_COUNT,
    );
  }

  /** Angled hatch on the back side (opposite the reflective side), slanting away from the surface. */
  protected override addGrooveMark(shape: Shape, { cx, cy, nx, ny, tx, ty }: GrooveFrame): void {
    shape.moveTo(cx, cy);
    shape.lineTo(
      cx - nx * REFLECTION_GRATING_GROOVE_LENGTH_PX + tx * 2,
      cy - ny * REFLECTION_GRATING_GROOVE_LENGTH_PX + ty * 2,
    );
  }
}

OpticsLabNamespace.register("ReflectionGratingView", ReflectionGratingView);
