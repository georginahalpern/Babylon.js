/* eslint-disable jsdoc/require-returns */
/* eslint-disable jsdoc/require-param */
/* eslint-disable @typescript-eslint/naming-convention */

/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable jsdoc/require-returns */
/* eslint-disable jsdoc/require-param */
import type { IVector3Like } from "./math.like";

/**
 * A branded type that represents a Vector3Like containing latitude (x), longitude (y), and altitude (z).
 * This provides type safety and better debugging context without runtime overhead.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type IGeoCoordLike = IVector3Like & { readonly isLatLonAlt: true };

export function MakeGeoCoordLike(): IGeoCoordLike {
    return { x: 0, y: 0, z: 0, isLatLonAlt: true as const };
}

export const WGS84_Converters = {
    toGeo: EcefToLatLonAltToRef,
    fromGeo: LatLonAltToEcefToRef,
};

/**
 * Converts between standard cartesian coordinate position (x,y,z) to geoPosition, where xyz represents 'lat, long, alt'
 */
export type CoordinateConverter = {
    toGeo: (position: IVector3Like, geoPositionRef: IGeoCoordLike) => IGeoCoordLike;
    fromGeo: (geoPosition: IGeoCoordLike, positionRef: IVector3Like) => IVector3Like;
};

/**
 * The distance from the center of the Earth to the equator according to the WGS 84 ellipsoid.
 */
export const MajorRadiusInMeters = 6378137.0;

/**
 * The distance from the center of the Earth to the poles according to the WGS 84 ellipsoid.
 */
export const MinorRadiusInMeters = 6356752.314245;

/**
 * This describes the oblateness of the WGS 84 ellipsoid.
 */
export const Flattening = 1.0 / 298.257223563;

/**
 * The squared eccentricity.
 */
export const EccentricitySquared = Flattening * (2.0 - Flattening);

/**
 * Converts an ECEF position in meters to {@link IGeoCoordLike} and stores the location in the result.
 */
export function EcefToLatLonAltToRef(ecef: IVector3Like, result: IGeoCoordLike): IGeoCoordLike {
    return EcefXyzToLatLonAltToRef(ecef.x, ecef.y, ecef.z, result);
}

export function LatLonAltToEcefToRef(latLonAlt: IVector3Like, result: IVector3Like): IVector3Like {
    return LatLonAltValuesToEcefToRef(latLonAlt.x, latLonAlt.y, latLonAlt.z, result);
}

/**
 * Gets the ECEF XYZ position in meters from a latitude, longitude (in radians) and altitude (in meters).
 */
export function LatLonAltValuesToEcefToRef(lat: number, lon: number, alt: number, result: IVector3Like): IVector3Like {
    // WGS84 ellipsoid constants
    const a = 6378137.0; // Semi-major axis in meters
    const f = 1 / 298.257223563; // Flattening
    const e2 = 2 * f - f * f; // Square of eccentricity

    // Convert latitude and longitude from degrees to radians
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;

    // Calculate prime vertical radius of curvature
    const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) * Math.sin(latRad));

    // Calculate ECEF coordinates
    const x = (N + alt) * Math.cos(latRad) * Math.cos(lonRad);
    const y = (N + alt) * Math.cos(latRad) * Math.sin(lonRad);
    const z = (N * (1 - e2) + alt) * Math.sin(latRad);

    result.x = x;
    result.y = y;
    result.z = z;

    return result;
}

/**
 * Converts an ECEF XYZ position in meters to {@link IGeoCoordLike} and stores the location in the result.
 */
export function EcefXyzToLatLonAltToRef(x: number, y: number, z: number, result: IGeoCoordLike): IGeoCoordLike {
    const a = 6378137.0; // Semi-major axis of WGS84 ellipsoid (meters)
    const f = 1 / 298.257223563; // Flattening
    const e2 = 2 * f - f * f; // Square of eccentricity

    const b = a * (1 - f); // Semi-minor axis
    const ep2 = (a * a - b * b) / (b * b); // Second eccentricity squared

    const p = Math.sqrt(x * x + y * y); // Distance from Z-axis
    const theta = Math.atan2(z * a, p * b); // Parametric latitude

    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    const latitude = Math.atan2(z + ep2 * b * sinTheta * sinTheta * sinTheta, p - e2 * a * cosTheta * cosTheta * cosTheta);

    const longitude = Math.atan2(y, x); // Longitude
    const radiusOfCurvature = a / Math.sqrt(1 - e2 * Math.sin(latitude) ** 2); // Radius of curvature
    const height = p / Math.cos(latitude) - radiusOfCurvature; // Height above ellipsoid

    result.x = latitude;
    result.y = longitude;
    result.z = height;
    return result;
}
