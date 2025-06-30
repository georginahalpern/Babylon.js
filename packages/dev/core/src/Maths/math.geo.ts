import { Matrix, Quaternion, Vector3 } from "./math";

function GeodeticToCartesian(lon: number, lat: number, alt: number) {
    // Constants for WGS84 ellipsoid
    const a = 6378137; // semi-major axis
    const f = 1 / 298.257223563; // flattening
    const e = Math.sqrt(2 * f - f * f); // eccentricity

    // Convert degrees to radians
    lon *= Math.PI / 180;
    lat *= Math.PI / 180;

    // Calculate N, the radius of curvature in the prime vertical
    const n = a / Math.sqrt(1 - Math.pow(e, 2) * Math.sin(lat) * Math.sin(lat));

    // Calculate Cartesian coordinates
    const x = (n + alt) * Math.cos(lat) * Math.cos(lon);
    const y = (n + alt) * Math.cos(lat) * Math.sin(lon);
    const z = ((1 - Math.pow(e, 2)) * n + alt) * Math.sin(lat);

    return [x, y, z];
}

function CartesianToGeodetic(x: number, y: number, z: number) {
    // Constants for WGS84 ellipsoid
    const a = 6378137; // semi-major axis
    const f = 1 / 298.257223563; // flattening
    const b = a * (1 - f); // semi-minor axis
    const e = Math.sqrt(2 * f - f * f); // eccentricity

    const p = Math.sqrt(x * x + z * z); // distance from minor axis
    const th = Math.atan2(a * y, b * p); // angle between p and y

    // Calculate longitude
    let lon = Math.atan2(-z, x);

    // Calculate latitude
    let lat = Math.atan2(y + Math.pow(e, 2) * b * Math.pow(Math.sin(th), 3), p - Math.pow(e, 2) * a * Math.pow(Math.cos(th), 3));

    // Calculate N, the radius of curvature in the prime vertical
    const n = a / Math.sqrt(1 - Math.pow(e, 2) * Math.sin(lat) * Math.sin(lat));

    // Calculate altitude
    const alt = p / Math.cos(lat) - n;

    // Convert to degrees
    lon *= 180 / Math.PI;
    lat *= 180 / Math.PI;

    return [lon, lat, alt];
}

function LatLongToEulerAngles(lat: number, long: number) {
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
