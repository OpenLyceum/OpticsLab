/**
 * ParabolicMirror.ts
 *
 * A parabolic mirror defined by two endpoints (p1, p2) and the vertex (p3).
 * The parabola is approximated by a series of line segments, and ray
 * intersection is tested against each segment. The local surface normal
 * is interpolated from the neighboring segment normals.
 */

import { PARABOLIC_MIRROR_SEGMENT_COUNT } from "../../../OpticsLabConstants.js";
import { ELEMENT_CATEGORY_MIRROR, ELEMENT_TYPE_PARABOLIC_MIRROR } from "../../../OpticsLabStrings.js";
import { BaseElement } from "../optics/BaseElement.js";
import {
  type Bounds,
  dot,
  normalize,
  type Point,
  point,
  pointsBounds,
  raySegmentIntersection,
  sampleParabolaPoints,
  segment,
  segmentNormal,
} from "../optics/Geometry.js";
import { MIN_RAY_LENGTH_SQ } from "../optics/OpticsConstants.js";
import type {
  ElementCategory,
  IntersectionResult,
  RayInteractionResult,
  SimulationRay,
} from "../optics/OpticsTypes.js";

export class ParabolicMirror extends BaseElement {
  public readonly type = ELEMENT_TYPE_PARABOLIC_MIRROR;
  public readonly category: ElementCategory = ELEMENT_CATEGORY_MIRROR;

  public p1: Point;
  public p2: Point;
  /** Vertex of the parabola. */
  public p3: Point;

  public constructor(p1: Point, p2: Point, p3: Point) {
    super();
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }

  /**
   * Compute the polyline approximation of the parabola in scene coordinates.
   * The parabola is defined so that its vertex is at p3, its axis is
   * perpendicular to the chord p1–p2 passing through p3, and it passes
   * through p1 and p2.
   */
  private computePoints(): Point[] {
    return sampleParabolaPoints(this.p1, this.p2, this.p3, PARABOLIC_MIRROR_SEGMENT_COUNT);
  }

  public getBounds(): Bounds {
    return pointsBounds(this.computePoints());
  }

  public override checkRayIntersection(ray: SimulationRay): IntersectionResult | null {
    const parabolaPoints = this.computePoints();
    let bestT = Infinity;
    let bestHit: { point: Point; segIndex: number } | null = null;

    for (let i = 0; i < parabolaPoints.length - 1; i++) {
      const p1 = parabolaPoints[i];
      const p2 = parabolaPoints[i + 1];
      if (!(p1 && p2)) {
        continue;
      }
      const hit = raySegmentIntersection(ray.origin, ray.direction, segment(p1, p2));
      if (hit && hit.t < bestT) {
        const dSq = (hit.point.x - ray.origin.x) ** 2 + (hit.point.y - ray.origin.y) ** 2;
        if (dSq > MIN_RAY_LENGTH_SQ) {
          bestT = hit.t;
          bestHit = { point: hit.point, segIndex: i };
        }
      }
    }

    if (!bestHit) {
      return null;
    }

    const segP1 = parabolaPoints[bestHit.segIndex];
    const segP2 = parabolaPoints[bestHit.segIndex + 1];
    if (!(segP1 && segP2)) {
      return null;
    }
    const seg = segment(segP1, segP2);
    const normal = segmentNormal(seg);
    const facingRay = dot(normal, ray.direction) < 0 ? normal : point(-normal.x, -normal.y);
    return { point: bestHit.point, t: bestT, element: this, normal: facingRay };
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
