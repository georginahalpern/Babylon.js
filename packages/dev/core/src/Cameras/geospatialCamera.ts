import { Vector3, Matrix } from "../Maths/math.vector";
import type { Scene } from "../scene";
import { GeospatialCameraInputsManager } from "./geospatialCameraInputsManager";
import { Epsilon, Scalar } from "../Maths";

import { FloatingOriginCamera } from "./floatingOriginCamera";

/**
 * @experimental
 * This camera extends the FloatingOriginCamera (centering it at world origin) and enables navigation of a large-scale world
 *
 * Its movements are limited to a camera orbiting a globe, and as the API evolves it will introduce conversions between cartesian coordinates and true lat/long/alt
 *
 * Please note this is marked as experimental and the API will change until we remove that flag
 *
 */
export class GeospatialCamera extends FloatingOriginCamera {
    public pitchPoint: Vector3;

    // Temp vars
    private _eastTemp: Vector3;
    private _northTemp: Vector3;
    private _upTemp: Vector3;
    private _basisMatrix: Matrix;
    private _pitchRotationAxis: Vector3;
    private _geocentricNormalOfPitchPoint: Vector3;

    public override inputs: GeospatialCameraInputsManager;

    constructor(name: string, scene: Scene) {
        const position = new Vector3(0, 0, -200); // since i don't want to solidify the constructor API yet I am hardcoding this. eventually this camera will have concept of lat/long/alt and an understanding of the world's size and the constructor will likely take in something other than position
        super(name, position, scene);

        // Set up inputs
        this.inputs = new GeospatialCameraInputsManager(this);
        this.inputs.addMouse().addMouseWheel();
    }

    protected override _resetToDefault(): void {
        super._resetToDefault();
        this.pitchPoint = new Vector3(0, 0, -50); // What is the first point on geoWorld that a ray would hit if shot from camera in lookatDirection? Right now hardcoding based on above hardcoded position
        this._lookAtVector = Vector3.Zero().subtract(this.position).normalize(); // Unit vector showing direction of camera before any rotation is applied
        this._geocentricNormalOfPitchPoint = this.pitchPoint.normalizeToNew();

        this._pitchRotationAxis = new Vector3(1, 0, 0); // starting axis used to calculate pitch rotation matrix
        this._eastTemp = Vector3.Zero();
        this._northTemp = Vector3.Zero();
        this._upTemp = Vector3.Zero();
        this._basisMatrix = Matrix.Identity();
        ComputeLocalBasis(this.position, this._eastTemp, this._northTemp, this._upTemp);
        Matrix.FromXYZAxesToRef(this._eastTemp, this._northTemp, this._upTemp, this._basisMatrix);
    }

    /**
     * Move the camera forward/back along the current look vector.
     * @param distance positive = move forward (in direction of vector), negative = move backward
     */
    public zoomAlongLook(distance: number): void {
        // move camera
        const dir = MoveAlongVectorByDistance(this._lookAtVector, distance);
        this.position.addInPlace(dir);
        this._isViewMatrixDirty = true;
    }

    /**
     * When the geocentric normal has any translation change (due to dragging), we must ensure the camera remains orbiting around the world origin
     * We thus need to perform 2 correction steps
     * 1. Translation correction that keeps the camera at the same radius as before the drag
     * 2. Rotation correction that keeps the camera facing the globe (so that as we pan, the globe stays centered on screen)
     */
    private _applyTranslationAndRotateCameraTowardsGeocentricNormal() {
        const newPos = this.position.add(this._localTranslation);

        // 1. Calculate the height correction to keep camera at the same radius as before the position
        // Calculate what camera pos would be if we applied localTranslation, scale that by the cameraRadius, and
        // apply that delta to localTranslation. This will ensure the translation keeps the camera at the proper height from earth's surface
        const newPosScaledByCameraRadius = newPos.normalizeToNew().scaleInPlace(this.position.length());
        const heightCorrection = newPosScaledByCameraRadius.subtract(newPos);
        this._localTranslation.addInPlace(heightCorrection);
        newPos.addInPlace(heightCorrection); // this shouldn't matter

        // 2. Calculate the rotation correction to keep camera facing earth
        // Calculate basis matrix off of the new position, then apply changeOfBasis to lookAt/up vectors
        const newBasis = Matrix.Identity();
        ComputeLocalBasis(newPos, this._eastTemp, this._northTemp, this._upTemp);
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

    private _applyRotation(): void {
        // Normalize key vectors
        this._geocentricNormalOfPitchPoint = this.pitchPoint.normalizeToNew();
        this.upVector.normalize();
        this._lookAtVector.normalize();

        let pitchRotationMatrix = Matrix.Identity();
        let yawRotationMatrix = Matrix.Identity();
        if (this._localRotation.x !== 0) {
            // Compute a rotation axis that is perpendicular to both the upVector and the hitPoint's geocentricNormalOfHitPoint: cross(up, geocentricNormalOfHitPoint)
            Vector3.CrossToRef(this.upVector, this._geocentricNormalOfPitchPoint, this._pitchRotationAxis);

            // If upVector and geocentricNormalOfHitPoint are parallel, fall back to cross(lookAtDirection, geocentricNormalOfHitPoint)
            if (this._pitchRotationAxis.lengthSquared() <= Epsilon) {
                Vector3.CrossToRef(this._lookAtVector, this._geocentricNormalOfPitchPoint, this._pitchRotationAxis);
            }

            const pitchSign = Math.sign(Vector3.Dot(this._geocentricNormalOfPitchPoint, this.upVector)); // If negative, camera is upside down
            // Since these are pointed in opposite directions, we must negate the dot product to get the proper angle
            const currentPitch = pitchSign * Math.acos(Scalar.Clamp(-Vector3.Dot(this._lookAtVector, this._geocentricNormalOfPitchPoint), -1, 1));
            const newPitch = Scalar.Clamp(currentPitch + this._localRotation.x, 0, 0.5 * Math.PI - Epsilon);
            const actualLocationRotationX = newPitch - currentPitch;
            // Build rotation matrix around normalized axis
            this._pitchRotationAxis.normalize();
            pitchRotationMatrix = Matrix.RotationAxis(this._pitchRotationAxis, actualLocationRotationX);
        }

        if (this._localRotation.y !== 0) {
            yawRotationMatrix = Matrix.RotationAxis(this._geocentricNormalOfPitchPoint, this._localRotation.y); // this axis changes if we aren't using center of screen for tilt
        }
        const accumulatedRotationMatrix = pitchRotationMatrix.multiply(yawRotationMatrix);

        // Offset camera to be (position-hitpoint) distance from geocentricOrigin, apply rotation to position/up/lookat vectors, then reverse the offset
        const camDistanceFromHitPoint = this.position.subtract(this.pitchPoint);
        const rotatedOffset = new Vector3();

        Vector3.TransformCoordinatesToRef(camDistanceFromHitPoint, accumulatedRotationMatrix, rotatedOffset);
        Vector3.TransformNormalToRef(this.upVector, accumulatedRotationMatrix, this._upVector);
        Vector3.TransformNormalToRef(this._lookAtVector, accumulatedRotationMatrix, this._lookAtVector);

        this.position = this.pitchPoint.add(rotatedOffset);
    }

    protected override _recalcViewMatrix(): void {
        if (this._localTranslation.lengthSquared() > 0) {
            this._applyTranslationAndRotateCameraTowardsGeocentricNormal();
        }

        if (this._localRotation.lengthSquared() > 0) {
            this._applyRotation();
        }

        // Ensure floatingpointorigin camera marks viewMatrix as dirty and resets the per-frame values
        super._recalcViewMatrix();
    }
}

export function MoveAlongVectorByDistance(alongVector: Vector3, distance: number): Vector3 {
    // Ensure unit length, then scale by requested distance
    const dir = alongVector.normalizeToNew();
    dir.scaleInPlace(distance);
    return dir;
}

// Helper to build east/north/up basis vectors at a world position
export function ComputeLocalBasis(worldPos: Vector3, refEast: Vector3, refNorth: Vector3, refUp: Vector3) {
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
