/**
 * GratingView.ts
 *
 * Abstract base for diffraction-grating views: a straight segment p1–p2 with
 * endpoint handles, a body hit path for translation, and evenly spaced groove
 * marks along the segment. Subclasses supply the styled line paths and draw
 * one groove mark at each sample point.
 */

import { BooleanProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import type { Path, RichDragListener } from "scenerystack/scenery";
import type { Tandem } from "scenerystack/tandem";
import OpticsLabNamespace from "../../../OpticsLabNamespace.js";
import type { Point } from "../../model/optics/Geometry.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import {
  attachTranslationDrag,
  buildLineHitShape,
  createLineBodyHitPath,
  type DragHandle,
  makeEndpointHandle,
  pointAccessors,
} from "../ViewHelpers.js";
import type { ViewOptionsModel } from "../ViewOptionsModel.js";

/** Model shape shared by gratings: a segment between two endpoints. */
export type TwoPointGrating = { p1: Point; p2: Point };

/** View-space frame at one groove position: center, unit normal, unit tangent. */
export type GrooveFrame = { cx: number; cy: number; nx: number; ny: number; tx: number; ty: number };

export abstract class GratingView extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;

  private readonly linePaths: readonly Path[];
  private readonly groovePath: Path;
  private readonly grooveCount: number;
  private readonly bodyHitPath: Path;
  private readonly handle1: DragHandle;
  private readonly handle2: DragHandle;

  private readonly grating: TwoPointGrating;
  private readonly modelViewTransform: ModelViewTransform2;

  /**
   * @param linePaths - styled paths that all render the grating segment, back to front
   * @param groovePath - path that renders the groove marks
   * @param grooveCount - number of evenly spaced interior groove marks
   */
  protected constructor(
    grating: TwoPointGrating,
    modelViewTransform: ModelViewTransform2,
    tandem: Tandem,
    viewOptions: ViewOptionsModel | undefined,
    linePaths: readonly Path[],
    groovePath: Path,
    grooveCount: number,
  ) {
    super();
    this.grating = grating;
    this.modelViewTransform = modelViewTransform;
    this.linePaths = linePaths;
    this.groovePath = groovePath;
    this.grooveCount = grooveCount;
    const handlesVisibleProperty = viewOptions?.handlesVisibleProperty ?? new BooleanProperty(true);

    this.bodyHitPath = createLineBodyHitPath();
    const makeEndpoint = (key: "p1" | "p2", tandemName: string) =>
      makeEndpointHandle(
        () => grating[key],
        (p) => {
          grating[key] = p;
        },
        this,
        modelViewTransform,
        tandem.createTandem(tandemName),
        handlesVisibleProperty,
      );
    this.handle1 = makeEndpoint("p1", "handle1DragListener");
    this.handle2 = makeEndpoint("p2", "handle2DragListener");

    for (const path of linePaths) {
      this.addChild(path);
    }
    this.addChild(groovePath);
    this.addChild(this.bodyHitPath);
    this.addChild(this.handle1);
    this.addChild(this.handle2);

    this.rebuild();

    this.bodyDragListener = attachTranslationDrag(
      this.bodyHitPath,
      pointAccessors(grating, "p1", "p2"),
      this,
      modelViewTransform,
      tandem.createTandem("bodyDragListener"),
    );
  }

  /** Appends one groove mark to `shape` in view coordinates. Must not read subclass fields. */
  protected abstract addGrooveMark(shape: Shape, frame: GrooveFrame): void;

  protected override _doRebuild(): void {
    const { p1, p2 } = this.grating;
    const mvt = this.modelViewTransform;
    const vx1 = mvt.modelToViewX(p1.x);
    const vy1 = mvt.modelToViewY(p1.y);
    const vx2 = mvt.modelToViewX(p2.x);
    const vy2 = mvt.modelToViewY(p2.y);

    const bodyShape = new Shape().moveTo(vx1, vy1).lineTo(vx2, vy2);
    for (const path of this.linePaths) {
      path.shape = bodyShape;
    }
    this.bodyHitPath.shape = buildLineHitShape(vx1, vy1, vx2, vy2);

    const dx = vx2 - vx1;
    const dy = vy2 - vy1;
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      const tx = dx / len;
      const ty = dy / len;
      const grooveShape = new Shape();
      for (let i = 1; i <= this.grooveCount; i++) {
        const t = i / (this.grooveCount + 1);
        this.addGrooveMark(grooveShape, { cx: vx1 + dx * t, cy: vy1 + dy * t, nx: -ty, ny: tx, tx, ty });
      }
      this.groovePath.shape = grooveShape;
    } else {
      this.groovePath.shape = null;
    }

    this.handle1.syncToModel();
    this.handle2.syncToModel();
    this.rebuildEmitter.emit();
  }
}

OpticsLabNamespace.register("GratingView", GratingView);
