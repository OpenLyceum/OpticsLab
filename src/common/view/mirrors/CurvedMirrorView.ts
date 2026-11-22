/**
 * CurvedMirrorView.ts
 *
 * Abstract base for mirrors defined by two endpoints (p1, p2) and a vertex (p3)
 * constrained to the chord's perpendicular bisector: arc, parabolic, and
 * apertured parabolic mirrors. Owns the endpoint and curvature handles, the
 * focal-point marker, and one or more mirror arms (back stroke, front stroke,
 * and body hit path). Each arm translates the whole mirror when dragged.
 *
 * Subclasses supply the sampled model-space polyline for each arm and the
 * focal point. Both hooks run during this constructor, so they may read only
 * `this.mirror` and constants, not subclass fields.
 */

import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { type Circle, Path, type RichDragListener } from "scenerystack/scenery";
import type { Tandem } from "scenerystack/tandem";
import OpticsLabColors from "../../../OpticsLabColors.js";
import {
  LINE_HIT_HALF_WIDTH_PX,
  MIRROR_BACK_WIDTH,
  MIRROR_FOCAL_MARKER_SIZE_M,
  MIRROR_FRONT_WIDTH,
} from "../../../OpticsLabConstants.js";
import OpticsLabNamespace from "../../../OpticsLabNamespace.js";
import type { Point } from "../../model/optics/Geometry.js";
import { BaseOpticalElementView } from "../BaseOpticalElementView.js";
import {
  attachCurvatureHandleDrag,
  attachTranslationDrag,
  buildDiamondShape,
  buildPolylineViewShape,
  createHandle,
  type DragHandle,
  makeEndpointHandle,
  pointAccessors,
  projectPointOntoPerpendicularBisector,
} from "../ViewHelpers.js";
import type { ViewOptionsModel } from "../ViewOptionsModel.js";

/** Model shape shared by every curved mirror: endpoints plus a vertex. */
export type ThreePointMirror = { p1: Point; p2: Point; p3: Point };

type MirrorArm = { backPath: Path; frontPath: Path; bodyHitPath: Path };

const ROUND_STROKE = { lineCap: "round", lineJoin: "round" } as const;

/** Tandem names for each arm's translation listener, in arm order. */
const ARM_DRAG_TANDEM_NAMES = ["bodyDragListener", "bodyDragListenerRight"] as const;

export abstract class CurvedMirrorView<M extends ThreePointMirror> extends BaseOpticalElementView {
  public readonly bodyDragListener: RichDragListener;
  /** Translation listeners for arms after the first; the first is bodyDragListener. */
  private readonly extraBodyDragListeners: Array<{ node: Path; listener: RichDragListener }> = [];
  private readonly arms: MirrorArm[];
  private readonly focalMarker: Path;
  private readonly handle1: DragHandle;
  private readonly handle2: DragHandle;
  private readonly handle3: Circle;

  protected readonly mirror: M;
  protected readonly modelViewTransform: ModelViewTransform2;

  protected constructor(
    mirror: M,
    modelViewTransform: ModelViewTransform2,
    tandem: Tandem,
    viewOptions: ViewOptionsModel,
    armCount: 1 | 2 = 1,
  ) {
    super();
    this.mirror = mirror;
    this.modelViewTransform = modelViewTransform;

    this.arms = Array.from({ length: armCount }, () => ({
      backPath: new Path(null, {
        ...ROUND_STROKE,
        stroke: OpticsLabColors.mirrorBackStrokeProperty,
        lineWidth: MIRROR_BACK_WIDTH,
        pickable: false,
      }),
      frontPath: new Path(null, {
        ...ROUND_STROKE,
        stroke: OpticsLabColors.mirrorFrontStrokeProperty,
        lineWidth: MIRROR_FRONT_WIDTH,
        pickable: false,
      }),
      bodyHitPath: new Path(null, {
        ...ROUND_STROKE,
        stroke: OpticsLabColors.hitAreaFillProperty,
        lineWidth: LINE_HIT_HALF_WIDTH_PX * 2,
      }),
    }));
    this.focalMarker = new Path(null, { fill: OpticsLabColors.focalMarkerFillProperty, pickable: false });
    // Moving an endpoint keeps the vertex on the new chord's perpendicular bisector.
    const makeEndpoint = (key: "p1" | "p2", tandemName: string) =>
      makeEndpointHandle(
        () => mirror[key],
        (p) => {
          mirror[key] = p;
          mirror.p3 = projectPointOntoPerpendicularBisector(mirror.p3, mirror.p1, mirror.p2);
        },
        this,
        modelViewTransform,
        tandem.createTandem(tandemName),
        viewOptions.handlesVisibleProperty,
      );
    this.handle1 = makeEndpoint("p1", "handle1DragListener");
    this.handle2 = makeEndpoint("p2", "handle2DragListener");
    this.handle3 = createHandle(mirror.p3, modelViewTransform, viewOptions.handlesVisibleProperty);

    for (const arm of this.arms) {
      this.addChild(arm.bodyHitPath);
    }
    for (const arm of this.arms) {
      this.addChild(arm.backPath);
      this.addChild(arm.frontPath);
    }
    this.addChild(this.focalMarker);
    this.excludeFromSelectionBounds(this.focalMarker);
    this.trackLinkAttribute(viewOptions.focalMarkersVisibleProperty, this.focalMarker, "visible");
    this.addChild(this.handle1);
    this.addChild(this.handle2);
    this.addChild(this.handle3);

    this.rebuild();

    const listeners = this.arms.map((arm, i) =>
      attachTranslationDrag(
        arm.bodyHitPath,
        pointAccessors(mirror, "p1", "p2", "p3"),
        this,
        modelViewTransform,
        tandem.createTandem(ARM_DRAG_TANDEM_NAMES[i] ?? `bodyDragListener${i}`),
      ),
    );
    const [firstListener] = listeners;
    if (!firstListener) {
      throw new Error("CurvedMirrorView requires at least one arm");
    }
    this.bodyDragListener = firstListener;
    for (let i = 1; i < listeners.length; i++) {
      const arm = this.arms[i];
      const listener = listeners[i];
      if (arm && listener) {
        this.extraBodyDragListeners.push({ node: arm.bodyHitPath, listener });
      }
    }

    attachCurvatureHandleDrag(
      this.handle3,
      () => mirror.p1,
      () => mirror.p2,
      () => mirror.p3,
      (p) => {
        mirror.p3 = p;
      },
      this,
      modelViewTransform,
      tandem.createTandem("curvatureDragListener"),
    );
  }

  /**
   * Model-space polyline for each arm, in arm order. An arm with fewer than
   * two points is hidden. Called after the vertex has been re-projected.
   */
  protected abstract computeArmPoints(): Point[][];

  /** Model-space focal point, or null when none should be shown. */
  protected abstract computeFocalPoint(): Point | null;

  public override dispose(): void {
    for (const { node, listener } of this.extraBodyDragListeners) {
      node.removeInputListener(listener);
      listener.dispose();
    }
    super.dispose();
  }

  protected override _doRebuild(): void {
    const { p1, p2 } = this.mirror;
    // Keep the curvature handle at the vertex (on the chord's perpendicular bisector).
    this.mirror.p3 = projectPointOntoPerpendicularBisector(this.mirror.p3, p1, p2);
    const p3 = this.mirror.p3;
    const mvt = this.modelViewTransform;

    const armPoints = this.computeArmPoints();
    this.arms.forEach((arm, i) => {
      const points = armPoints[i] ?? [];
      const shape = points.length > 1 ? buildPolylineViewShape(points, mvt) : null;
      arm.bodyHitPath.shape = shape;
      arm.backPath.shape = shape;
      arm.frontPath.shape = shape;
    });

    const focal = this.computeFocalPoint();
    this.focalMarker.shape = focal
      ? buildDiamondShape(
          mvt.modelToViewX(focal.x),
          mvt.modelToViewY(focal.y),
          Math.abs(mvt.modelToViewDeltaX(MIRROR_FOCAL_MARKER_SIZE_M)),
        )
      : null;

    this.handle1.syncToModel();
    this.handle2.syncToModel();
    this.handle3.x = mvt.modelToViewX(p3.x);
    this.handle3.y = mvt.modelToViewY(p3.y);

    this.rebuildEmitter.emit();
  }
}

OpticsLabNamespace.register("CurvedMirrorView", CurvedMirrorView);
