/**
 * ArcMirror.ts
 *
 * A mirror shaped as a circular arc, defined by three points:
 * two endpoints (p1, p2) and a control point on the arc (p3).
 * Reflects rays off the curved surface using the local normal
 * (radial direction from the circle center).
 */

import { ELEMENT_CATEGORY_MIRROR, ELEMENT_TYPE_ARC_MIRROR } from "../../../OpticsLabStrings.js";
import { BaseElement } from "../optics/BaseElement.js";
import {
  arcBounds,
  arcControlPointForRadius,
  type Bounds,
  circle,
  circumcenter,
  distanceSquared,
  dot,
  isPointOnArc,
  normalize,
  type Point,
  point,
  rayCircleIntersections,
  subtract,
} from "../optics/Geometry.js";
import { MIN_RAY_LENGTH_SQ } from "../optics/OpticsConstants.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

export class ArcMirror extends BaseElement {
  public readonly type = ELEMENT_TYPE_ARC_MIRROR;
  public readonly category: ElementCategory = ELEMENT_CATEGORY_MIRROR;

  public p1: Point;
  public p2: Point;
  /** Control point on the arc. */
  public p3: Point;

  public constructor(p1: Point, p2: Point, p3: Point) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }

  /** Returns the radius of curvature, or null if the arc is degenerate. */
  public getRadius(): number | null {
    return this.getArcGeometry()?.radius ?? null;
  }

  /**
   * Adjusts p3 so the radius of curvature becomes R, keeping p1 and p2 fixed
   * and preserving the current orientation (which side of the chord p3 is on).
   * Does nothing for non-finite radii, radii smaller than half the chord, or a collapsed chord.
   */
  public setRadius(R: number): void {
    this.p3 = arcControlPointForRadius(this.p1, this.p2, this.p3, R);
  }

  public getBounds(): Bounds {
    // Arc-aware bounds: the arc bulges beyond the box of p1/p2/p3 (dramatically
    // for arcs spanning more than 180°), and an underestimated box would let
    // the spatial index cull rays that actually hit the mirror.
    return arcBounds(this.p1, this.p2, this.p3);
  }

  private getArcGeometry(): { center: Point; radius: number } | null {
    return circumcenter(this.p1, this.p2, this.p3);
  }

  /**
   * Whether a point on the full circle is within the arc span from p1 to p2
   * passing through p3.
   */
  private isOnArc(p: Point, center: Point): boolean {
    return isPointOnArc(p, this.p1, this.p2, this.p3, center);
  }

  public override checkRayIntersection(ray: SimulationRay): IntersectionResult | null {
    const arcGeometry = this.getArcGeometry();
    if (!arcGeometry) {
      return null; // degenerate collinear arc — not handled here
    }

    const hits = rayCircleIntersections(ray.origin, ray.direction, circle(arcGeometry.center, arcGeometry.radius));
    let best: { t: number; point: Point } | null = null;
    for (const hit of hits) {
      if (distanceSquared(hit.point, ray.origin) < MIN_RAY_LENGTH_SQ) {
        continue;
      }
      if (!this.isOnArc(hit.point, arcGeometry.center)) {
        continue;
      }
      if (!best || hit.t < best.t) {
        best = hit;
      }
    }
    if (!best) {
      return null;
    }
    const normal = normalize(subtract(best.point, arcGeometry.center));
    const facingRay = dot(normal, ray.direction) < 0 ? normal : point(-normal.x, -normal.y);
    return { point: best.point, t: best.t, element: this, normal: facingRay };
  }

  public override onRayIncident(
    ray: SimulationRay,
    intersection: IntersectionResult,
    _config?: unknown,
  ): RayInteractionResult {
    const n = intersection.normal;
    const d = ray.direction;
    const dn = dot(d, n);
    const reflectedDir = point(d.x - 2 * dn * n.x, d.y - 2 * dn * n.y);
    return {
      isAbsorbed: false,
      outgoingRay: {
        origin: intersection.point,
        direction: normalize(reflectedDir),
        brightnessS: ray.brightnessS,
        brightnessP: ray.brightnessP,
        gap: false,
        isNew: false,
        wavelength: ray.wavelength,
      },
    };
  }

  public serialize(): Record<string, unknown> {
    return { type: this.type, p1: this.p1, p2: this.p2, p3: this.p3 };
  }
}
