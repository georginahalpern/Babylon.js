/* eslint-disable @typescript-eslint/naming-convention */
import { Vector3, Matrix } from "../Maths/math.vector";
import type { Scene } from "../scene";
import { GeospatialCameraInputsManager } from "./geospatialCameraInputsManager";
import { Epsilon, Scalar } from "../Maths";
import type { Plane, IVector3Like } from "../Maths";
import { GeoPositionToPosition, PositionToGeoPosition } from "../Maths/math.geo";
import type { IGeoPositionLike } from "../Maths/math.geo";
import { FloatingOriginCamera } from "./floatingOriginCamera";
import type { Ray } from "../Culling";

export class GeospatialCamera extends FloatingOriginCamera {
    public pitchRotationAxis: Vector3;

    // What caller sees when retrieving position/target/rotation
    public geoworldOrigin: Vector3;
    public geoworldHitPoint: Vector3;
    public geocentricNormalOfHitPoint: Vector3;
    public radius: number;

    public override inputs: GeospatialCameraInputsManager;

    constructor(name: string, scene: Scene) {
        if (scene.activeCamera != null) {
            throw new Error("Geospatial camera must be the only active camera on a scene");
        }
        super(name, new Vector3(0, 0, -200), scene);

        // Set up inputs
        this.inputs = new GeospatialCameraInputsManager(this);
        this.inputs.addKeyboard().addMouse().addMouseWheel();
    }

    public override resetToDefault(position?: Vector3): void {
        super.resetToDefault(position);
        this.geoworldOrigin = new Vector3(0, 0, 0); // Where is the camera target in geoworld space
        this.geoworldHitPoint = new Vector3(0, 0, -50); // What is the first point on geoWorld that a ray would hit if shot from camera in lookatDirection?
        this._lookAtVector = this.geoworldOrigin.subtract(this.position).normalize(); // Unit vector showing direction of camera before any rotation is applied
        this.geocentricNormalOfHitPoint = this.geoworldHitPoint.normalizeToNew();

        this._rotation = Vector3.Zero(); // starting accumulative rotation
        this.radius = this.position.length(); // Distance from camera to geoworld origin
        this.pitchRotationAxis = new Vector3(1, 0, 0); // starting axis used to calculate rotation matrix
    }
    /**
     * This is a geospatial term which means to look directly downward towards the surface/center of the earth
     */
    public lookNadir() {
        this._rotation = Vector3.Zero();
        this._lookAtVector = this.geoworldOrigin.subtract(this.position).normalize(); // Unit vector showing direction of camera before any rotation is applied
        this._isViewMatrixDirty = true;
    }

    public set geoTarget(geoTargetLike: IGeoPositionLike) {
        const target = GeoPositionToPosition(geoTargetLike);
        this._target.copyFromFloats(target.x, target.y, target.z);
    }

    public lookStraightAtTarget(target: IVector3Like) {
        this._target.copyFromFloats(target.x, target.y, target.z);
        this._lookAtVector = this.geoworldOrigin.subtract(this.position).normalize();
        // update pos?
        this._isViewMatrixDirty = true;
    }

    public lookStraightAtGeoTarget(geoTarget: IGeoPositionLike) {
        const target = GeoPositionToPosition(geoTarget);
        this.lookStraightAtTarget(target);
    }

    public get geoPositionLike(): IGeoPositionLike {
        return PositionToGeoPosition(this.position);
    }

    public set geoPositionLike(geoPosition: IGeoPositionLike) {
        const position = GeoPositionToPosition(geoPosition);
        this.position.copyFromFloats(position.x, position.y, position.z);
    }

    /**
     * Geospatial terminology for rotating along the x axis. Think of it as moving head/camera up/down towards sky/ground
     * Also known as pitch/tilt/inclination
     * @param tilt
     */
    public setTilt(tilt: number): void {
        this._rotation.x = tilt;
        this._isViewMatrixDirty = true;
    }
    /**
     * Geospatial terminology for rotating along the y axis. Think of it as moving head/camera left/right.
     * Also known as yaw/bearing/rotation/azimuth/orientation
     * @param heading
     */
    public setHeading(heading: number): void {
        this._rotation.y = heading;
        this._isViewMatrixDirty = true;
    }

    /**
     * Geospatial terminology for height above surface.
     * Increasing radius will increase altitude
     * Increasing zoomLevel will decrease altitude
     * @param elevation
     */
    public setAltitude(elevation: number): void {
        this.position.z = elevation;
    }

    /**
     * Move the camera forward/back along the current look vector.
     * @param distance positive = move forward (in direction of vector), negative = move backward
     * @param moveHitPointIfAny if true, shift geoworldHitPoint together with the camera (useful to keep same world-under-cursor)
     */
    public zoomAlongLook(distance: number, moveHitPointIfAny = false): void {
        // move camera
        const dir = moveAlongVector(distance, this._lookAtVector);
        this.position.addInPlace(dir);

        // optionally move the stored hit point and recompute the geocentric normal
        if (moveHitPointIfAny && this.geoworldHitPoint) {
            this.geoworldHitPoint.addInPlace(dir);
            if (this.geoworldHitPoint.lengthSquared() > 0) {
                this.geocentricNormalOfHitPoint.copyFrom(this.geoworldHitPoint).normalize();
            }
        }

        // update derived state
        this.radius = this.position.length();
        this._isViewMatrixDirty = true;
    }

    protected override _recalcViewMatrix(): void {
        // Normalize key vectors
        this.geocentricNormalOfHitPoint.normalize();
        this.upVector.normalize();
        this._lookAtVector.normalize();

        // Compute a rotation axis that is perpendicular to both the upVector and the hitPoint's geocentricNormalOfHitPoint: cross(up, geocentricNormalOfHitPoint)
        Vector3.CrossToRef(this.upVector, this.geocentricNormalOfHitPoint, this.pitchRotationAxis);

        // If upVector and geocentricNormalOfHitPoint are parallel, fall back to cross(lookAtDirection, geocentricNormalOfHitPoint)
        if (this.pitchRotationAxis.lengthSquared() <= Epsilon) {
            Vector3.CrossToRef(this._lookAtVector, this.geocentricNormalOfHitPoint, this.pitchRotationAxis);
        }

        const currentPitch = Math.acos(Scalar.Clamp(-Vector3.Dot(this._lookAtVector, this.geocentricNormalOfHitPoint), -1, 1));
        const newPitch = Math.min(0.5 * Math.PI, Math.max(0, currentPitch + this._localRotation.x));
        const actualLocationRotationX = newPitch - currentPitch;

        // Build rotation matrix around normalized axis
        this.pitchRotationAxis.normalize();
        const pitchRotationMatrix = Matrix.RotationAxis(this.pitchRotationAxis, actualLocationRotationX);
        const yawRotationMatrix = Matrix.RotationAxis(this.geocentricNormalOfHitPoint, this._localRotation.y); // this axis changes if we aren't using center of screen for tilt
        const accumulatedRotationMatrix = yawRotationMatrix.multiply(pitchRotationMatrix);

        // Offset camera to be (position-hitpoint) distance from geocentricOrigin, apply rotation to position/up/lookat vectors, then reverse the offset
        const camDistanceFromHitPoint = this.position.subtract(this.geoworldHitPoint);
        const rotatedOffset = new Vector3();
        Vector3.TransformCoordinatesToRef(camDistanceFromHitPoint, accumulatedRotationMatrix, rotatedOffset);

        const newUp = new Vector3();
        const newLook = new Vector3();
        Vector3.TransformNormalToRef(this.upVector, accumulatedRotationMatrix, newUp);
        Vector3.TransformNormalToRef(this._lookAtVector, accumulatedRotationMatrix, newLook);

        this.upVector.copyFrom(newUp);
        this._lookAtVector.copyFrom(newLook);

        this.position = this.geoworldHitPoint.add(rotatedOffset);

        // Update radius!
        this.radius = this.position.length();

        super._recalcViewMatrix();
    }
}

export function moveAlongVector(distance: number, alongVector: Vector3): Vector3 {
    // clone to avoid mutating alongVector
    const dir = alongVector.clone();
    // ensure unit length
    dir.normalize();
    // scale by requested distance
    dir.scaleInPlace(distance);
    return dir;
}

export function movePtAlongVectorInPlace(point: Vector3, distance: number, alongVector: Vector3): Vector3 {
    const dir = moveAlongVector(distance, alongVector);
    point.addInPlace(dir);
    return point;
}

export function intersectRayWithPlaneToRef(ray: Ray, plane: Plane, ref: Vector3): boolean {
    // Distance along the ray to the plane; null if no hit
    const dist = ray.intersectsPlane(plane);

    global.console.log("intersecting ray", ray, "\n", "with plane", plane, "\n", "calcdist", dist);

    if (dist !== null && dist >= 0) {
        ref.copyFrom(ray.origin.add(ray.direction.scale(dist)));
        global.console.log("rayorigin ", ray.origin, "\n", "ray dir ", ray.direction, "\n", "calcdist", dist, "\n", "finalRef", ref);

        return true;
    }
    return false;
}

export function movePointAlongPlane(pointToMove: Vector3, planePoint: Vector3, planeNormal: Vector3, x: number, y: number) {
    // Ensure N is normalized
    const n = planeNormal.normalize();

    // Project P onto the plane
    pointToMove.subtractInPlace(n.scale(Vector3.Dot(pointToMove.subtract(planePoint), n)));

    // Pick reference that isn't parallel to n
    const ref = Math.abs(Vector3.Dot(n, Vector3.Up())) > 0.9 ? Vector3.Right() : Vector3.Up();

    // First in-plane axis
    const u = Vector3.Cross(n, ref).normalize();

    // Second in-plane axis
    const v = Vector3.Cross(n, u).normalize();

    // Move P along the plane
    pointToMove.addInPlace(u.scale(x)).add(v.scale(y));
}
