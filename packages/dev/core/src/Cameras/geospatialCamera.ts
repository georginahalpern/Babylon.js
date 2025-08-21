import { Camera } from "./camera";
import { Vector3, Matrix } from "../Maths/math.vector";
import type { Scene } from "../scene";
import { GeospatialCameraInputsManager } from "./geospatialCameraInputsManager";
import { Epsilon, Vector2 } from "../Maths";
import type { Quaternion } from "../Maths";
import type { Nullable } from "../types";

export class GeospatialCamera extends Camera {
    // Movement state (set via inputs)
    public _localTranslation: Vector3;
    public _localRotation: Vector3;
    private _isViewMatrixDirty: boolean = true;
    private _viewMatrix: Matrix = Matrix.Identity();
    public lookAtVector: Vector3;
    public pitchRotationAxis: Vector3;

    // What caller sees when retrieving position/target/rotation
    public geoworldPosition: Vector3;
    public geoworldOrigin: Vector3;
    public geoworldHitPoint: Vector3;
    public geocentricNormal: Vector3;
    public _rotation: Vector3;

    // Target Camera properties
    public invertRotation = false;
    public rotationQuaternion: Quaternion;
    public speed = 1.0;
    public override inertia = 0;

    // Arc-rotate properties
    public alpha: number = 0; // Azimuth angle - Rotation angle around the longitudinal axis (horizontal orbit).
    public beta: number = 0; // Elevation angle - Rotation angle around the latitudinal axis (vertical orbit).
    public radius: number = 200; // Distance from center
    public inertialAlphaOffset = 0;
    public inertialBetaOffset = 0;
    public inertialRadiusOffset = 0;

    // Limits
    public lowerAlphaLimit: Nullable<number> = null;
    public upperAlphaLimit: Nullable<number> = null;
    public lowerBetaLimit: Nullable<number> = 0.01;
    public upperBetaLimit: Nullable<number> = Math.PI - 0.01;
    public lowerRadiusLimit: Nullable<number> = null;
    public upperRadiusLimit: Nullable<number> = null;
    public lowerTargetYLimit: number = -Infinity;
    // Panning
    public inertialPanningX: number = 0;
    public inertialPanningY: number = 0;
    public pinchToPanMaxDistance: number = 20;
    public panningDistanceLimit: Nullable<number> = null;
    public panningOriginTarget: Vector3 = Vector3.Zero();

    public targetScreenOffset = Vector2.Zero();
    public allowUpsideDown = true;
    public useInputToRestoreState = true;
    public restoreStateInterpolationFactor = 0;
    // private _currentInterpolationFactor = 0;

    protected _transformedDirection: Vector3 = new Vector3();
    public mapPanning: boolean = false;

    public override inputs: GeospatialCameraInputsManager;

    // World tracking

    constructor(name: string, scene: Scene) {
        if (scene.activeCamera != null) {
            throw new Error("Geospatial camera must be the only active camera on a scene");
        }
        super(name, Vector3.Zero(), scene); // Camera always at origin
        this.resetToDefault();

        // Set up inputs
        this.inputs = new GeospatialCameraInputsManager(this);
        this.inputs.addKeyboard().addMouse().addMouseWheel();

        scene.getEngine().getCreationOptions().useHighPrecisionMatrix = true;
    }

    public resetToDefault(): void {
        this.geoworldPosition = new Vector3(0, 0, -200); // Where is the camera located in geoworld space (in this case, 200 units in negative Z from geoworld origin)
        this.geoworldOrigin = new Vector3(0, 0, 0); // Where is the camera target in geoworld space
        this.geoworldHitPoint = new Vector3(0, 0, -50); // What is the first point on geoWorld that a ray would hit if shot from camera in lookatDirection?
        this.upVector = Vector3.Up(); // Up vector of the camera
        this.lookAtVector = this.geoworldOrigin.subtract(this.geoworldPosition).normalize(); // Unit vector showing direction of camera before any rotation is applied
        this.geocentricNormal = this.geoworldHitPoint.normalizeToNew();

        this._localTranslation = Vector3.Zero(); // starting incremental translation
        this._localRotation = Vector3.Zero(); // starting incremental rotation
        this._rotation = Vector3.Zero(); // starting accumulative rotation
        this.pitchRotationAxis = new Vector3(1, 0, 0); // starting axis used to calculate rotation matrix

        // Initialize spherical coordinates from position
        this.radius = this.geoworldPosition.length(); // distance from camera (in geoworldspace) to geoworld origin
        this.alpha = Math.atan2(this.geoworldPosition.x, this.geoworldPosition.z);
        this.beta = Math.acos(this.geoworldPosition.y / this.radius);
        this._isViewMatrixDirty = true;
    }

    // Override position to track world position
    public override get position(): Vector3 {
        if (!this.geoworldPosition) {
            this.geoworldPosition = Vector3.Zero(); // Initialize if not set
        }
        return this.geoworldPosition.clone();
    }

    public override set position(value: Vector3) {
        if (!this.geoworldPosition) {
            this.geoworldPosition = Vector3.Zero(); // Initialize if not set
        }
        this.geoworldPosition.copyFrom(value);
    }

    public get rotation(): Vector3 {
        if (!this._rotation) {
            this._rotation = Vector3.Zero();
        }
        return this._rotation;
    }

    public set rotation(rotation: Vector3) {
        this._rotation.copyFrom(rotation);
        if (!this._rotation) {
            this._rotation = Vector3.Zero();
        }
        this._isViewMatrixDirty = true;
    }

    /**
     * This is a geospatial term which means to look directly downward towards the surface/center of the earth
     */
    public lookNadir() {
        this._rotation = Vector3.Zero();
        this._isViewMatrixDirty = true;
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
     * Increasing radius will increase elevation
     * Increasing zoomLevel will decrease elevation
     * @param elevation
     */
    public setElevation(elevation: number): void {
        this.geoworldPosition.z = elevation;
    }

    public override _getViewMatrix() {
        // Lookat direction
        // Up direction
        // Position of camera
        if (!this._isViewMatrixDirty) {
            return this._viewMatrix;
        }
        // Reset rotation change flag when we recalculate
        this._isViewMatrixDirty = false;

        // Ensure upVector is normalized
        this.upVector.normalize();

        if (this.getScene().useRightHandedSystem) {
            Matrix.LookAtRHToRef(Vector3.Zero(), this.lookAtVector, this.upVector, this._viewMatrix);
        } else {
            Matrix.LookAtLHToRef(Vector3.Zero(), this.lookAtVector, this.upVector, this._viewMatrix);
        }

        return this._viewMatrix;
    }

    private _checkLimits(): void {
        if (this.lowerBetaLimit === null || this.lowerBetaLimit === undefined) {
            if (this.allowUpsideDown && this.beta > Math.PI) {
                this.beta = this.beta - 2 * Math.PI;
            }
        } else {
            if (this.beta < this.lowerBetaLimit) {
                this.beta = this.lowerBetaLimit;
            }
        }

        if (this.upperBetaLimit === null || this.upperBetaLimit === undefined) {
            if (this.allowUpsideDown && this.beta < -Math.PI) {
                this.beta = this.beta + 2 * Math.PI;
            }
        } else {
            if (this.beta > this.upperBetaLimit) {
                this.beta = this.upperBetaLimit;
            }
        }

        if (this.lowerAlphaLimit !== null && this.alpha < this.lowerAlphaLimit) {
            this.alpha = this.lowerAlphaLimit;
        }
        if (this.upperAlphaLimit !== null && this.alpha > this.upperAlphaLimit) {
            this.alpha = this.upperAlphaLimit;
        }

        if (this.lowerRadiusLimit !== null && this.radius < this.lowerRadiusLimit) {
            this.radius = this.lowerRadiusLimit;
            this.inertialRadiusOffset = 0;
        }
        if (this.upperRadiusLimit !== null && this.radius > this.upperRadiusLimit) {
            this.radius = this.upperRadiusLimit;
            this.inertialRadiusOffset = 0;
        }

        this.geoworldOrigin.y = Math.max(this.geoworldOrigin.y, this.lowerTargetYLimit);
    }

    public override _checkInputs(): void {
        if (!this._localTranslation) {
            this._localTranslation = Vector3.Zero();
        }
        // Let inputs populate cameraDirection/cameraRotation
        this.inputs.checkInputs();

        this._checkInputsSpherical();
        this._checkInputsCartesian();

        super._checkInputs();
    }

    private _rebuildAnglesAndRadius(): void {
        this.radius = this.geoworldPosition.length();

        if (this.radius === 0) {
            this.radius = 0.0001; // Just to avoid division by zero
        }

        // Alpha and Beta
        const previousAlpha = this.alpha;
        this.alpha = ComputeAlpha(this.geoworldPosition);
        this.beta = ComputeBeta(this.geoworldPosition.y, this.radius);

        // Calculate the number of revolutions between the new and old alpha values.
        const alphaCorrectionTurns = Math.round((previousAlpha - this.alpha) / (2.0 * Math.PI));
        // Adjust alpha so that its numerical representation is the closest one to the old value.
        this.alpha += alphaCorrectionTurns * 2.0 * Math.PI;

        this._checkLimits();
    }

    private _recalculateWorldPositionFromSpherical(): void {
        // Spherical to Cartesian conversion
        const x = this.radius * Math.sin(this.beta) * Math.sin(this.alpha);
        const y = this.radius * Math.cos(this.beta);
        const z = this.radius * Math.sin(this.beta) * Math.cos(this.alpha);
        // Spherical to Cartesian conversion
        this.geoworldPosition.copyFromFloats(x, y, z);
        // Direction to origin
        this.lookAtVector = this.geoworldOrigin.subtract(this.geoworldPosition).normalize();
        // Recalculate up vector based on accumulated rotation (pitch/yaw/roll)
        if (this._localRotation.lengthSquared() > 0) {
            const rotationMatrix = Matrix.RotationYawPitchRoll(this._localRotation.y, this._localRotation.x, this._localRotation.z);
            Vector3.TransformNormalToRef(Vector3.Up(), rotationMatrix, this.upVector);
        } else {
            this.upVector.copyFrom(Vector3.Up());
        }
        // Ensure viewmatrix is recalculated due to the rotation change caused by spherical coordinate change
        this._isViewMatrixDirty = true;
    }

    private _calcViewMatrixInputsOffCartesianRotation(): void {
        // Normalize key vectors
        this.geocentricNormal.normalize();
        this.upVector.normalize();
        this.lookAtVector.normalize();

        // // Calculate pitch change, clamped so camera doesn't flip
        // const currentPitch = Math.acos(Scalar.Clamp(-Vector3.Dot(this.lookAtVector, this.geocentricNormal), -1, 1));
        // const newPitch = Math.min(0.5 * Math.PI, Math.max(0, currentPitch + this._localRotation.x));
        // const actualLocationRotationX = newPitch - currentPitch;
        const actualLocationRotationX = this._localRotation.x;
        // if (actualLocationRotationX === 0) {
        //     return;
        // }
        this._rotation.addInPlace(this._localRotation); // Accumulate rotation to be used for spherical coordinates ?

        // Compute a stable rotation axis: cross(up, geocentricNormal)
        Vector3.CrossToRef(this.upVector, this.geocentricNormal, this.pitchRotationAxis);
        // If up and geocentricNormal are parallel, fall back to cross(lookAtDirection, geocentricNormal)
        if (this.pitchRotationAxis.lengthSquared() <= Epsilon) {
            Vector3.CrossToRef(this.lookAtVector, this.geocentricNormal, this.pitchRotationAxis);
        }

        // Build rotation matrix around normalized axis
        this.pitchRotationAxis.normalize();
        const pitchRotationMatrix = Matrix.RotationAxis(this.pitchRotationAxis, actualLocationRotationX);
        // const yawRotationMatrix = Matrix.RotationAxis(this.geocentricNormal, this._localRotation.y);
        // const accumulatedRotationMatrix = yawRotationMatrix.multiply(pitchRotationMatrix);

        const accumulatedRotationMatrix = pitchRotationMatrix;

        // Rotate camera offset (position relative to the hit/pivot), then rotate direction/up vectors
        const camDistanceFromHitPoint = this.geoworldPosition.subtract(this.geoworldHitPoint);
        const rotatedOffset = new Vector3();
        Vector3.TransformCoordinatesToRef(camDistanceFromHitPoint, accumulatedRotationMatrix, rotatedOffset);

        const newUp = new Vector3();
        const newLook = new Vector3();
        Vector3.TransformNormalToRef(this.upVector, accumulatedRotationMatrix, newUp);
        Vector3.TransformNormalToRef(this.lookAtVector, accumulatedRotationMatrix, newLook);

        this.upVector.copyFrom(newUp);
        this.lookAtVector.copyFrom(newLook);

        this.geoworldPosition = this.geoworldHitPoint.add(rotatedOffset);
        this._rebuildAnglesAndRadius();

        // Reset localRotation for next frame
        this._localRotation.copyFromFloats(0, 0, 0);
        this._isViewMatrixDirty = true;
    }

    private _checkInputsSpherical(): void {
        // Inertia
        if (this.inertialAlphaOffset !== 0 || this.inertialBetaOffset !== 0 || this.inertialRadiusOffset !== 0) {
            // hasUserInteractions = true;

            const directionModifier = this.invertRotation ? -1 : 1;
            const handednessMultiplier = this._calculateHandednessMultiplier();
            let inertialAlphaOffset = this.inertialAlphaOffset * handednessMultiplier;

            if (this.beta < 0) {
                inertialAlphaOffset *= -1;
            }

            this.alpha += inertialAlphaOffset * directionModifier;
            this.beta += this.inertialBetaOffset * directionModifier;

            this.radius -= this.inertialRadiusOffset;
            this.inertialAlphaOffset *= this.inertia;
            this.inertialBetaOffset *= this.inertia;
            this.inertialRadiusOffset *= this.inertia;
            if (Math.abs(this.inertialAlphaOffset) < Epsilon) {
                this.inertialAlphaOffset = 0;
            }
            if (Math.abs(this.inertialBetaOffset) < Epsilon) {
                this.inertialBetaOffset = 0;
            }
            if (Math.abs(this.inertialRadiusOffset) < this.speed * Epsilon) {
                this.inertialRadiusOffset = 0;
            }
            this._recalculateWorldPositionFromSpherical();
        }

        // Panning inertia -- come back to this

        // Limits
        this._checkLimits();
    }

    private _checkInputsCartesian() {
        // Handle movement
        if (this._localTranslation.lengthSquared() > 0) {
            // Update world position
            this.geoworldPosition.addInPlace(this._localTranslation);
            // After moving meshes, apply inertia to camera local translation
            if (this.inertia !== 0) {
                if (Math.abs(this._localTranslation.x) < this.speed * Epsilon) {
                    this._localTranslation.x = 0;
                }
                if (Math.abs(this._localTranslation.y) < this.speed * Epsilon) {
                    this._localTranslation.y = 0;
                }
                if (Math.abs(this._localTranslation.z) < this.speed * Epsilon) {
                    this._localTranslation.z = 0;
                }
                this._localTranslation.scaleInPlace(this.inertia);
            }
        }

        // Handle rotation
        if (this._localRotation.lengthSquared() > 0) {
            // // Accumulate rotation
            // global.console.log("loc", this._localRotation);
            // global.console.log("rot before clamp", this._rotation);

            // // Clamp pitch to avoid flipping
            // this._rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this._rotation.x));
            // this._rotation.y = Scalar.NormalizeRadians(this._rotation.y); // Yaw wrapped to -π to π
            // this._rotation.z = Scalar.NormalizeRadians(this._rotation.z); // Roll wrapped to -π to π
            // global.console.log("rot after clamp", this._rotation);

            // // Mark as changed
            // this._localRotation.copyFromFloats(0, 0, 0);
            this._calcViewMatrixInputsOffCartesianRotation();
        }
    }

    public override _isSynchronizedViewMatrix(): boolean {
        if (!super._isSynchronizedViewMatrix() || this._isViewMatrixDirty) {
            return false;
        }
        return true;
    }

    /** @internal */
    public _computeLocalCameraSpeed(): number {
        const engine = this.getEngine();
        return this.speed * Math.sqrt(engine.getDeltaTime() / (engine.getFps() * 100.0));
    }

    public override attachControl(noPreventDefault?: boolean): void {
        this.inputs.attachElement(noPreventDefault);
    }

    public override detachControl(): void {
        this.inputs.detachElement();
    }

    public override dispose(): void {
        this.inputs.clear();
        super.dispose();
    }
}

function ComputeAlpha(offset: Vector3): number {
    // Default alpha to π/2 to handle the edge case where x and z are both zero (when looking along up axis)
    let alpha = Math.PI / 2;
    if (!(offset.x === 0 && offset.z === 0)) {
        alpha = Math.acos(offset.x / Math.sqrt(Math.pow(offset.x, 2) + Math.pow(offset.z, 2)));
    }

    if (offset.z < 0) {
        alpha = 2 * Math.PI - alpha;
    }

    return alpha;
}

/**
 * Computes the beta angle based on the source position and the target position.
 * @param verticalOffset The y value of the directional offset between the source position and the target position
 * @param radius The distance between the source position and the target position
 * @returns The beta angle in radians
 */
function ComputeBeta(verticalOffset: number, radius: number): number {
    return Math.acos(verticalOffset / radius);
}
