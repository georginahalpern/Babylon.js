/**
 * GeospatialUtils - Utilities for camera clip plane optimization with ellipsoid geometry
 *
 * Provides functionality to optimize camera near/far planes based on ellipsoid geometry,
 * preventing z-fighting artifacts and maximizing depth buffer precision for globe viewing.
 */

import type { Camera } from "../Cameras/camera";
import type { IVector3Like } from "../Maths/math.like";

/**
 * Configuration for WGS84 ellipsoid (Earth)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type WGS84Config = {
    semiMajorAxis: number;
    semiMinorAxis: number;
    minElevation: number;
    nearMargin: number;
    farMargin: number;
};

/**
 * Configuration for geospatial clip plane calculations
 */
export type GeospatialConfig = {
    semiMajorAxis?: number;
    semiMinorAxis?: number;
    minElevation?: number;
    nearMargin?: number;
    farMargin?: number;
};

/**
 * Result of clip plane calculations
 */
export type ClipPlanes = {
    near: number;
    far: number;
};

/**
 * Debug information for clip plane calculations
 */
export type ClipPlaneDebugInfo = {
    distanceToCenter: string;
    latitude: string;
    elevation: string;
    effectiveRadius: string;
    horizonDistance: string;
    near: string;
    far: string;
    ratio: string;
};

const WGS84_CONFIG: WGS84Config = {
    semiMajorAxis: 6378137, // equatorial radius in meters
    semiMinorAxis: 6356752.3142, // polar radius in meters
    minElevation: 2550, // minimum elevation for horizon calculation (avoids z-fighting)
    nearMargin: 0.25, // margin factor for near plane calculation
    farMargin: 0, // margin factor for far plane calculation
};

/**
 * Calculate the effective radius of an ellipsoid at a given latitude
 * From https://en.wikipedia.org/wiki/Earth_radius#Prime_vertical
 *
 * The effective radius is the distance from the center of the ellipsoid to the surface
 * along the normal at the given latitude.
 *
 * @param latitude - Latitude in radians
 * @param semiMajorAxis - Semi-major axis (equatorial radius)
 * @param semiMinorAxis - Semi-minor axis (polar radius)
 * @returns Effective radius at the given latitude
 */
export function CalculateEffectiveRadius(latitude: number, semiMajorAxis: number = WGS84_CONFIG.semiMajorAxis, semiMinorAxis: number = WGS84_CONFIG.semiMinorAxis): number {
    const eSquared = 1 - semiMinorAxis ** 2 / semiMajorAxis ** 2;
    const sinPhiSquared = Math.sin(latitude) ** 2;
    return semiMajorAxis / Math.sqrt(1 - eSquared * sinPhiSquared);
}

/**
 * Calculate the horizon distance from a given elevation and latitude
 * From https://aty.sdsu.edu/explain/atmos_refr/horizon.html
 *
 * Formula: horizonDistance = sqrt( 2 * R * h + h^2 )
 * where R is the effective radius and h is the elevation above the ellipsoid
 *
 * @param latitude - Latitude in radians
 * @param elevation - Elevation above ellipsoid in meters
 * @param semiMajorAxis - Semi-major axis
 * @param semiMinorAxis - Semi-minor axis
 * @returns Distance to horizon in meters
 */
export function CalculateHorizonDistance(
    latitude: number,
    elevation: number,
    semiMajorAxis: number = WGS84_CONFIG.semiMajorAxis,
    semiMinorAxis: number = WGS84_CONFIG.semiMinorAxis
): number {
    const effectiveRadius = CalculateEffectiveRadius(latitude, semiMajorAxis, semiMinorAxis);
    return Math.sqrt(2 * effectiveRadius * elevation + elevation ** 2);
}

/**
 * Extract latitude from a position in Earth-centered coordinates
 * Uses the surface normal calculation method.
 *
 * @param position - Position in Earth-centered coordinates
 * @param semiMajorAxis - Semi-major axis
 * @param semiMinorAxis - Semi-minor axis
 * @returns Latitude in radians
 */
export function GetLatitudeFromPosition(position: IVector3Like, semiMajorAxis: number = WGS84_CONFIG.semiMajorAxis, semiMinorAxis: number = WGS84_CONFIG.semiMinorAxis): number {
    // Normalize position to get surface normal direction using inverse radii squared
    const invRadiusSqX = 1 / semiMajorAxis ** 2;
    const invRadiusSqY = 1 / semiMajorAxis ** 2;
    const invRadiusSqZ = 1 / semiMinorAxis ** 2;

    const nx = position.x * invRadiusSqX;
    const ny = position.y * invRadiusSqY;
    const nz = position.z * invRadiusSqZ;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);

    // Latitude is asin of normalized z component
    return Math.asin(nz / len);
}

/**
 * Get elevation (height above ellipsoid surface) from a position in Earth-centered coordinates
 *
 * @param position - Position in Earth-centered coordinates
 * @param semiMajorAxis - Semi-major axis
 * @param semiMinorAxis - Semi-minor axis
 * @returns Elevation above ellipsoid in meters
 */
export function GetElevationFromPosition(position: IVector3Like, semiMajorAxis: number = WGS84_CONFIG.semiMajorAxis, semiMinorAxis: number = WGS84_CONFIG.semiMinorAxis): number {
    // Scale position to unit sphere equivalent
    const scaledX = position.x / semiMajorAxis;
    const scaledY = position.y / semiMajorAxis;
    const scaledZ = position.z / semiMinorAxis;

    // Distance from center in scaled space
    const scaledDist = Math.sqrt(scaledX * scaledX + scaledY * scaledY + scaledZ * scaledZ);

    // Distance to surface along the position vector
    const distToCenter = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
    const surfaceDist = distToCenter / scaledDist;

    return distToCenter - surfaceDist;
}

/**
 * Optimize camera near/far planes to tightly encapsulate the visible ellipsoid
 * This prevents z-fighting artifacts by maximizing depth buffer precision.
 *
 * The near plane is calculated with an interpolated margin based on altitude to avoid
 * z-fighting at high altitudes, while the far plane is set to the horizon distance.
 *
 * @param camera - Babylon camera with minZ and maxZ properties
 * @param config - Configuration object (uses WGS84 as default)
 * @returns Object with calculated {near, far} values
 */
export function CalculateOptimalClipPlanes(camera: Camera, config: GeospatialConfig = {}): ClipPlanes {
    const {
        semiMajorAxis = WGS84_CONFIG.semiMajorAxis,
        semiMinorAxis = WGS84_CONFIG.semiMinorAxis,
        minElevation = WGS84_CONFIG.minElevation,
        nearMargin = WGS84_CONFIG.nearMargin,
        farMargin = WGS84_CONFIG.farMargin,
    } = config;

    const cameraPosition = camera.globalPosition;
    const maxRadius = Math.max(semiMajorAxis, semiMinorAxis);

    // Distance from camera to ellipsoid center
    const distanceToCenter = Math.sqrt(cameraPosition.x ** 2 + cameraPosition.y ** 2 + cameraPosition.z ** 2);

    // Calculate the near plane
    // near = max(minNear, distanceToCenter - maxRadius - margin)
    // Interpolate margin based on distance to avoid z-fighting at high altitude
    const margin = nearMargin * maxRadius;
    const alpha = Math.max(0, Math.min(1, (distanceToCenter - maxRadius) / margin));
    const minNear = alpha * 1000 + (1 - alpha) * 1; // lerp from 1 to 1000 based on altitude
    const nearPlane = Math.max(minNear, distanceToCenter - maxRadius - margin);

    // Calculate the far plane using horizon distance
    // far = horizonDistance + maxRadius * farMargin
    const latitude = GetLatitudeFromPosition(cameraPosition, semiMajorAxis, semiMinorAxis);
    const elevation = Math.max(GetElevationFromPosition(cameraPosition, semiMajorAxis, semiMinorAxis), minElevation);
    const horizonDistance = CalculateHorizonDistance(latitude, elevation, semiMajorAxis, semiMinorAxis);
    const farPlane = horizonDistance + 0.1 + maxRadius * farMargin;

    return {
        near: nearPlane,
        far: farPlane,
    };
}
