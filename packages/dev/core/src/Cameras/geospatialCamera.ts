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
    public worldOrigin: Vector3 = Vector3.Zero();
    public worldHitPoint: Vector3;
    public geocentricNormalOfHitPoint: Vector3;
    public radius: number;
    public pitch: number;
    private _correctionMatrixTemp: Matrix = Matrix.Identity();

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

    public override resetToDefault(): void {
        super.resetToDefault();
        this.worldOrigin = Vector3.Zero();
        this.pitch = 0;
        this.worldHitPoint = new Vector3(0, 0, -50); // What is the first point on geoWorld that a ray would hit if shot from camera in lookatDirection?
        this._lookAtVector = this.worldOrigin.subtract(this.position).normalize(); // Unit vector showing direction of camera before any rotation is applied
        this.geocentricNormalOfHitPoint = this.worldHitPoint.normalizeToNew();

        this._rotation = Vector3.Zero(); // starting accumulative rotation
        this.radius = this.position.length(); // Distance from camera to geoworld origin
        this.pitchRotationAxis = new Vector3(1, 0, 0); // starting axis used to calculate rotation matrix
    }
    /**
     * This is a geospatial term which means to look directly downward towards the surface/center of the earth
     */
    public lookNadir() {
        this._rotation = Vector3.Zero();
        this._lookAtVector = Vector3.Zero().subtract(this.position).normalize(); // Unit vector showing direction of camera before any rotation is applied
        this._isViewMatrixDirty = true;
    }

    public set geoTarget(geoTargetLike: IGeoPositionLike) {
        const target = GeoPositionToPosition(geoTargetLike);
        this._target.copyFromFloats(target.x, target.y, target.z);
    }

    public lookStraightAtTarget(target: IVector3Like) {
        this._target.copyFromFloats(target.x, target.y, target.z);
        this._lookAtVector = this.worldOrigin.subtract(this.position).normalize();
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
        if (moveHitPointIfAny && this.worldHitPoint) {
            this.worldHitPoint.addInPlace(dir);
            if (this.worldHitPoint.lengthSquared() > 0) {
                this.geocentricNormalOfHitPoint.copyFrom(this.worldHitPoint).normalize();
            }
        }

        // update derived state
        this.radius = this.position.length();
        this._isViewMatrixDirty = true;
    }

    public correctCameraRotationTowardsGeocentricNormal() {
        // Calculate the cos of the angle between the camera's geocentric normal and the lookat vector
        const cosAngle = -Vector3.Dot(this._lookAtVector, this.position.normalizeToNew());

        // ArcCos to get the actual angle
        const pitch = Math.acos(cosAngle);

        // Compare to previous pitch
        const deltaPitch = this.pitch - pitch;

        // Calculate a rotation axis perpendicular to both the upVector and lookVector
        const correctionAxis = Vector3.Cross(this.upVector, this._lookAtVector);

        // Rotate lookat and upvector said delta angle around said axis
        this._correctionMatrixTemp = Matrix.RotationAxis(correctionAxis, deltaPitch);
        Vector3.TransformNormalToRef(this._lookAtVector, this._correctionMatrixTemp, this._lookAtVector);
        Vector3.TransformNormalToRef(this.upVector, this._correctionMatrixTemp, this.upVector);
    }

    protected override _recalcViewMatrix(): void {
        // Normalize key vectors
        this.geocentricNormalOfHitPoint.normalize();
        this.upVector.normalize();
        this._lookAtVector.normalize();

        // if (this._localTranslation.lengthSquared() > 0) {
        //     this.correctCameraRotationTowardsGeocentricNormal();
        // }

        // Compute a rotation axis that is perpendicular to both the upVector and the hitPoint's geocentricNormalOfHitPoint: cross(up, geocentricNormalOfHitPoint)
        Vector3.CrossToRef(this.upVector, this.geocentricNormalOfHitPoint, this.pitchRotationAxis);

        // If upVector and geocentricNormalOfHitPoint are parallel, fall back to cross(lookAtDirection, geocentricNormalOfHitPoint)
        if (this.pitchRotationAxis.lengthSquared() <= Epsilon) {
            Vector3.CrossToRef(this._lookAtVector, this.geocentricNormalOfHitPoint, this.pitchRotationAxis);
        }

        // Since these are pointed in opposite directions, we must negate the dot product to get the proper angle
        const currentPitch = Math.acos(Scalar.Clamp(-Vector3.Dot(this._lookAtVector, this.geocentricNormalOfHitPoint), -1, 1));
        const newPitch = Math.min(0.5 * Math.PI, Math.max(0, currentPitch + this._localRotation.x));
        const actualLocationRotationX = newPitch - currentPitch;

        // Build rotation matrix around normalized axis
        this.pitchRotationAxis.normalize();
        const pitchRotationMatrix = Matrix.RotationAxis(this.pitchRotationAxis, actualLocationRotationX);

        const yawRotationMatrix = Matrix.RotationAxis(this.geocentricNormalOfHitPoint, this._localRotation.y); // this axis changes if we aren't using center of screen for tilt
        const accumulatedRotationMatrix = yawRotationMatrix.multiply(pitchRotationMatrix);

        // Offset camera to be (position-hitpoint) distance from geocentricOrigin, apply rotation to position/up/lookat vectors, then reverse the offset
        const camDistanceFromHitPoint = this.position.subtract(this.worldHitPoint);
        const rotatedOffset = new Vector3();
        Vector3.TransformCoordinatesToRef(camDistanceFromHitPoint, accumulatedRotationMatrix, rotatedOffset);

        const newUp = new Vector3();
        const newLook = new Vector3();
        Vector3.TransformNormalToRef(this.upVector, accumulatedRotationMatrix, newUp);
        Vector3.TransformNormalToRef(this._lookAtVector, accumulatedRotationMatrix, newLook);

        this.upVector.copyFrom(newUp);
        this._lookAtVector.copyFrom(newLook);

        this.position = this.worldHitPoint.add(rotatedOffset);

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
