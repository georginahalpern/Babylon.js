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

    // Temp vars
    private _eastTemp: Vector3 = Vector3.Zero();
    private _northTemp: Vector3 = Vector3.Zero();
    private _upTemp: Vector3 = Vector3.Zero();
    private _basisMatrix: Matrix = Matrix.Identity();

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
        this._eastTemp = Vector3.Zero();
        this._northTemp = Vector3.Zero();
        this._upTemp = Vector3.Zero();
        this._basisMatrix = Matrix.Identity();
        computeLocalBasis(this.position, this._eastTemp, this._northTemp, this._upTemp);
        Matrix.FromXYZAxesToRef(this._eastTemp, this._northTemp, this._upTemp, this._basisMatrix);
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
        const dir = moveAlongVectorByDistance(this._lookAtVector, distance);
        this.position.addInPlace(dir);

        // optionally move the stored hit point and recompute the geocentric normal
        if (moveHitPointIfAny && this.worldHitPoint) {
            this.worldHitPoint.addInPlace(dir);
            if (this.worldHitPoint.lengthSquared() > 0) {
                this.geocentricNormalOfHitPoint.copyFrom(this.worldHitPoint).normalize();
            }
        }
        this._isViewMatrixDirty = true;
    }

    private _applyTranslationAndRotateCameraTowardsGeocentricNormal() {
        computeLocalBasis(this.position, this._eastTemp, this._northTemp, this._upTemp);
        Matrix.FromXYZAxesToRef(this._eastTemp, this._northTemp, this._upTemp, this._basisMatrix);

        const newPos = this.position.add(this._localTranslation);

        // First calculate the height correction to keep camera at the same radius as before the position
        // Calculate what camera pos would be if we applied localTranslation, scale that by the cameraRadius, and
        // apply that delta to localTranslation. This will ensure the translation keeps the camera at the proper height from earth's surface
        const newPosScaledByCameraRadius = newPos.normalizeToNew().scaleInPlace(this.position.length());
        const heightCorrection = newPosScaledByCameraRadius.subtract(newPos);
        this._localTranslation.addInPlace(heightCorrection);
        newPos.addInPlace(heightCorrection); // this shouldn't matter

        // Then calculate the rotation correction to keep camera facing earth
        // Calculate basis matrix off of the new position, then apply changeOfBasis to lookAt/up vectors
        const newBasis = Matrix.Identity();
        computeLocalBasis(newPos, this._eastTemp, this._northTemp, this._upTemp);
        Matrix.FromXYZAxesToRef(this._eastTemp, this._northTemp, this._upTemp, newBasis);

        // Change of basis matrix = basis2 * basis1.inverse()
        // (since orthonormal, inverse = transpose)
        const changeOfBasis = this._basisMatrix.transpose().multiply(newBasis);

        // Apply to vectors
        Vector3.TransformNormalToRef(this._lookAtVector, changeOfBasis, this._lookAtVector);
        Vector3.TransformNormalToRef(this.upVector, changeOfBasis, this.upVector);

        // Store basis for next time
        this._basisMatrix = newBasis;

        // Update the camera's position with all corrections applied
        this.position.copyFrom(newPos);
    }

    protected override _recalcViewMatrix(): void {
        // Normalize key vectors
        this.geocentricNormalOfHitPoint.normalize();
        this.upVector.normalize();
        this._lookAtVector.normalize();

        if (this._localTranslation.lengthSquared() > 0) {
            this._applyTranslationAndRotateCameraTowardsGeocentricNormal();
        }

        // Compute a rotation axis that is perpendicular to both the upVector and the hitPoint's geocentricNormalOfHitPoint: cross(up, geocentricNormalOfHitPoint)
        Vector3.CrossToRef(this.upVector, this.geocentricNormalOfHitPoint, this.pitchRotationAxis);

        // If upVector and geocentricNormalOfHitPoint are parallel, fall back to cross(lookAtDirection, geocentricNormalOfHitPoint)
        if (this.pitchRotationAxis.lengthSquared() <= Epsilon) {
            Vector3.CrossToRef(this._lookAtVector, this.geocentricNormalOfHitPoint, this.pitchRotationAxis);
        }

        let pitchRotationMatrix = Matrix.Identity();
        if (this._localRotation.x !== 0) {
            const pitchSign = Math.sign(Vector3.Dot(this.geocentricNormalOfHitPoint, this.upVector)); // If negative, camera is upside down
            // Since these are pointed in opposite directions, we must negate the dot product to get the proper angle
            const currentPitch = pitchSign * Math.acos(Scalar.Clamp(-Vector3.Dot(this._lookAtVector, this.geocentricNormalOfHitPoint), -1, 1));
            const newPitch = Math.min(0.5 * Math.PI, Math.max(0, currentPitch + this._localRotation.x));
            const actualLocationRotationX = newPitch - currentPitch;
            // Build rotation matrix around normalized axis
            this.pitchRotationAxis.normalize();
            pitchRotationMatrix = Matrix.RotationAxis(this.pitchRotationAxis, actualLocationRotationX);
        }

        const yawRotationMatrix = Matrix.RotationAxis(this.geocentricNormalOfHitPoint, this._localRotation.y); // this axis changes if we aren't using center of screen for tilt
        const accumulatedRotationMatrix = pitchRotationMatrix.multiply(yawRotationMatrix);

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

export function moveAlongVectorByDistance(alongVector: Vector3, distance: number): Vector3 {
    // clone to avoid mutating alongVector
    const dir = alongVector.clone();
    // ensure unit length
    dir.normalize();
    // scale by requested distance
    dir.scaleInPlace(distance);
    return dir;
}

export function intersectRayWithPlaneToRef(ray: Ray, plane: Plane, ref: Vector3): boolean {
    // Distance along the ray to the plane; null if no hit
    const dist = ray.intersectsPlane(plane);

    if (dist !== null && dist >= 0) {
        ref.copyFrom(ray.origin.add(ray.direction.scale(dist)));
        return true;
    }

    return false;
}

// Helper to build east/north/up basis vectors at a world position
export function computeLocalBasis(worldPos: Vector3, refEast: Vector3, refNorth: Vector3, refUp: Vector3) {
    // up = normalized position (geocentric normal)
    refUp.copyFrom(worldPos).normalize();

    // east = normalize(up × worldUp)
    // (cross product of up with world Y gives east except at poles)
    const worldUp = Vector3.Up(); // (0,1,0)
    Vector3.CrossToRef(refUp, worldUp, refEast);

    // at poles, cross with worldForward instead
    if (refEast.lengthSquared() < Epsilon) {
        Vector3.CrossToRef(refUp, Vector3.Forward(), refEast);
    }
    refEast.normalize();

    // north = up × east (completes right-handed basis)
    Vector3.CrossToRef(refUp, refEast, refNorth);
    refNorth.normalize();
}
