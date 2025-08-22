import type { IVector3Like } from "./math.like";
import { Matrix, Quaternion, Vector3 } from "./math.vector";

export interface IGeoPositionLike {
    latitude: number; // radians
    longitude: number; // radians
    altitude: number; // meters
}

export function GeoPositionToPosition(geoPosition: IGeoPositionLike): IVector3Like {
    const { latitude, longitude, altitude } = geoPosition;
    // Constants for WGS84 ellipsoid
    const a = 6378137; // semi-major axis
    const f = 1 / 298.257223563; // flattening
    const e = Math.sqrt(2 * f - f * f); // eccentricity

    // Calculate N, the radius of curvature in the prime vertical
    const n = a / Math.sqrt(1 - Math.pow(e, 2) * Math.sin(latitude) * Math.sin(latitude));

    // Calculate Cartesian coordinates
    const x = (n + altitude) * Math.cos(latitude) * Math.cos(longitude);
    const y = (n + altitude) * Math.cos(latitude) * Math.sin(longitude);
    const z = ((1 - Math.pow(e, 2)) * n + altitude) * Math.sin(latitude);

    return { x, y, z };
}

export function PositionToGeoPosition(position: IVector3Like): IGeoPositionLike {
    const { x, y, z } = position;
    // Constants for WGS84 ellipsoid
    const a = 6378137; // semi-major axis
    const f = 1 / 298.257223563; // flattening
    const b = a * (1 - f); // semi-minor axis
    const e = Math.sqrt(2 * f - f * f); // eccentricity

    const p = Math.sqrt(x * x + z * z); // distance from minor axis
    const th = Math.atan2(a * y, b * p); // angle between p and y

    // Calculate longitude
    const longitude = Math.atan2(-z, x);

    // Calculate latitude
    const latitude = Math.atan2(y + Math.pow(e, 2) * b * Math.pow(Math.sin(th), 3), p - Math.pow(e, 2) * a * Math.pow(Math.cos(th), 3));

    // Calculate N, the radius of curvature in the prime vertical
    const n = a / Math.sqrt(1 - Math.pow(e, 2) * Math.sin(latitude) * Math.sin(latitude));

    // Calculate altitude
    const altitude = p / Math.cos(latitude) - n;

    return { latitude, longitude, altitude };
}

export function LatLongToEulerAngles(lat: number, long: number) {
    let matrix = Matrix.FromArray([
        -Math.sin(long),
        0,
        -Math.cos(long),
        0,
        Math.cos(lat) * Math.cos(long),
        Math.sin(lat),
        -Math.cos(lat) * Math.sin(long),
        0,
        Math.sin(lat) * Math.cos(long),
        -Math.cos(lat),
        -Math.sin(lat) * Math.sin(long),
        0,
        0,
        0,
        0,
        1,
    ]);

    matrix = matrix.transpose();
    const scale = new Vector3();
    const rotation = new Quaternion();
    const position = new Vector3();

    // variable matrix is matrix you're trying to derive yaw, pitch, and roll from
    matrix.decompose(scale, rotation, position);

    // convert quaternion to Euler angles
    return rotation; //.toEulerAngles();
}
