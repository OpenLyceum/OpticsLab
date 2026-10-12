/**
 * Shared ray interaction for line-segment diffraction gratings.
 * Transmission and reflection use the same grating equation for sin(θ_m);
 * they differ only in whether the outgoing ray lies on the −n or +n side of the surface.
 */

import {
  GRATING_DEFAULT_WAVELENGTH_NM,
  GRATING_MAX_DIFFRACTION_ORDER,
  GRATING_MIN_DIFFRACTION_INTENSITY,
} from "../../../OpticsLabConstants.js";
import { dot, normalize, type Point, point } from "../optics/Geometry.js";
import type { IntersectionResult, RayInteractionResult, SimulationRay } from "../optics/OpticsTypes.js";

export type GratingInteractionMode = "transmission" | "reflection";

/** Numerically stable sinc²(x) = (sin(πx)/(πx))². Returns 1 at x=0. */
function sincSquared(x: number): number {
  if (Math.abs(x) < 1e-10) {
    return 1.0;
  }
  const pix = Math.PI * x;
  return (Math.sin(pix) / pix) ** 2;
}

export function gratingRayInteraction(
  linesDensity: number,
  dutyCycle: number,
  ray: SimulationRay,
  intersection: IntersectionResult,
  mode: GratingInteractionMode,
): RayInteractionResult {
  const n = intersection.normal;
  const wavelengthNm = ray.wavelength ?? GRATING_DEFAULT_WAVELENGTH_NM;
  const d = 1e-3 / linesDensity;
  const wavelengthM = wavelengthNm * 1e-9;

  const tangent = point(-n.y, n.x);
  const sinThetaI = dot(ray.direction, tangent);
  const normalSign = mode === "reflection" ? 1 : -1;

  const orders: { m: number; intensity: number; dir: Point }[] = [];

  for (let m = -GRATING_MAX_DIFFRACTION_ORDER; m <= GRATING_MAX_DIFFRACTION_ORDER; m++) {
    const sinThetaM = sinThetaI + (m * wavelengthM) / d;
    if (Math.abs(sinThetaM) >= 1) {
      continue;
    }
    const cosThetaM = Math.sqrt(1 - sinThetaM * sinThetaM);
    const outDir = normalize(
      point(normalSign * n.x * cosThetaM + tangent.x * sinThetaM, normalSign * n.y * cosThetaM + tangent.y * sinThetaM),
    );

    const arg = m * dutyCycle;
    const intensity = m === 0 ? 1.0 : sincSquared(arg);
    orders.push({ m, intensity, dir: outDir });
  }

  // Weights are relative sinc² strengths of every propagating order. Faint
  // orders are not traced, but their share stays in the truncation budget
  // instead of being folded into the orders that are emitted.
  const totalIntensity = orders.reduce((sum, o) => sum + o.intensity, 0);

  if (totalIntensity === 0) {
    return {
      isAbsorbed: true,
      truncation: ray.brightnessS + ray.brightnessP,
    };
  }

  const scale = 1 / totalIntensity;
  const newRays: SimulationRay[] = [];
  let outgoingRay: SimulationRay | undefined;
  let truncation = 0;

  for (const order of orders) {
    const brightS = ray.brightnessS * order.intensity * scale;
    const brightP = ray.brightnessP * order.intensity * scale;
    if (order.intensity < GRATING_MIN_DIFFRACTION_INTENSITY) {
      truncation += brightS + brightP;
      continue;
    }

    const diffRay: SimulationRay = {
      origin: intersection.point,
      direction: order.dir,
      // Preserve each polarisation independently rather than averaging.
      brightnessS: brightS,
      brightnessP: brightP,
      gap: false,
      isNew: false,
      wavelength: ray.wavelength,
    };

    if (order.m === 0) {
      outgoingRay = diffRay;
    } else {
      newRays.push(diffRay);
    }
  }

  if (!outgoingRay && newRays.length === 0) {
    return {
      isAbsorbed: true,
      truncation: ray.brightnessS + ray.brightnessP,
    };
  }

  const result: RayInteractionResult = { isAbsorbed: false };
  if (outgoingRay) {
    result.outgoingRay = outgoingRay;
  }
  if (newRays.length > 0) {
    result.newRays = newRays;
  }
  if (truncation > 0) {
    result.truncation = truncation;
  }
  return result;
}
