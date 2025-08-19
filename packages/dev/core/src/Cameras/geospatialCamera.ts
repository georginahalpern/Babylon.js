import { Camera } from "./camera";
import { Vector3, Matrix } from "../Maths/math.vector";
import type { Scene } from "../scene";
import { GeospatialCameraInputsManager } from "./geospatialCameraInputsManager";
import { Epsilon, Scalar, Vector2 } from "../Maths";
import type { Quaternion } from "../Maths";
import type { Nullable } from "../types";

export class GeospatialCamera extends Camera {
    // Movement state (set via inputs)
    public _localTranslation = Vector3.Zero();
    public _localRotation = Vector3.Zero();
    private _isViewMatrixDirty: boolean = false;
    private _viewMatrix: Matrix = Matrix.Identity();
    public _lookAtVector: Vector3 = new Vector3(0, 0, 1);

    public _relativeTarget: Vector3 = Vector3.Zero();

    // What caller sees when retrieving position/target/rotation
    public _worldPosition: Vector3 = Vector3.Zero();
    public _worldTarget: Vector3 = Vector3.Zero();
    private _rotation: Vector3 = Vector3.Zero();
    public _localTarget: Vector3 = Vector3.Zero();

    // Target Camera properties
    public invertRotation = false;
    public rotationQuaternion: Quaternion;
    public speed = 1.0;
    public override inertia = 0.9;

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
    public panningInertia = 0.9;

    public targetScreenOffset = Vector2.Zero();
    public allowUpsideDown = true;
    public useInputToRestoreState = true;
    public restoreStateInterpolationFactor = 0;
    // private _currentInterpolationFactor = 0;

    public _useCtrlForPanning: boolean;
    public _panningMouseButton: number;

    public panningAxis: Vector3 = new Vector3(1, 1, 0);
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

    // Override position to track world position
    public override get position(): Vector3 {
        if (!this._worldPosition) {
            this._worldPosition = Vector3.Zero(); // Initialize if not set
        }
        return this._worldPosition.clone();
    }

    public override set position(value: Vector3) {
        if (!this._worldPosition) {
            this._worldPosition = Vector3.Zero(); // Initialize if not set
        }
        this._worldPosition.copyFrom(value);
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

    public setTarget(target: Vector3): void {
        this._worldTarget.copyFrom(target);
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
        this._worldPosition.z = elevation;
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

        if (this.getScene().useRightHandedSystem) {
            Matrix.LookAtRHToRef(this._worldPosition, this._lookAtVector, this.upVector, this._viewMatrix);
        } else {
            Matrix.LookAtLHToRef(this._worldPosition, this._lookAtVector, this.upVector, this._viewMatrix);
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

        this._worldTarget.y = Math.max(this._worldTarget.y, this.lowerTargetYLimit);
    }

    public override _checkInputs(): void {
        if (!this._localTranslation) {
            this._localTranslation = Vector3.Zero();
        }
        // Let inputs populate cameraDirection/cameraRotation
        this.inputs.checkInputs();

        this._checkInputsSpherical();
        this._checkInputsCartesian();

        this._recalculateWorldPositionFromSpherical();

        super._checkInputs();
    }

    /**
     * Calculates the camera's world position from spherical coordinates.
     * The camera orbits around a fixed world target (e.g., Earth's origin).
     */
    private _recalculateWorldPositionFromSpherical(): void {
        // Spherical to Cartesian conversion
        const x = this.radius * Math.sin(this.beta) * Math.sin(this.alpha);
        const y = this.radius * Math.cos(this.beta);
        const z = this.radius * Math.sin(this.beta) * Math.cos(this.alpha);

        // // Rotate according to up vector -- add back!
        // if (this._upVector.x !== 0 || this._upVector.y !== 1.0 || this._upVector.z !== 0) {
        //     Vector3.TransformCoordinatesToRef(this._computationVector, this._yToUpMatrix, this._computationVector);
        // }

        // Spherical to Cartesian conversion
        this._worldPosition = this._worldTarget.add(new Vector3(x, y, z));

        // Direction to target
        this._lookAtVector = this._worldTarget.subtract(this._worldPosition).normalize();

        // Recalculate up vector based on accumulated rotation (pitch/yaw/roll)
        if (this._rotation.lengthSquared() > 0) {
            const rotationMatrix = Matrix.RotationYawPitchRoll(this._rotation.y, this._rotation.x, this._rotation.z);
            Vector3.TransformNormalToRef(Vector3.UpReadOnly, rotationMatrix, this.upVector);
        } else {
            this.upVector.copyFrom(Vector3.UpReadOnly);
        }
        // Ensure viewmatrix is recalculated due to the rotation change caused by spherical coordinate change
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
        }

        // Panning inertia -- come back to this

        // Limits
        this._checkLimits();
    }

    public resetToDefault(): void {
        const position = new Vector3(0, 0, -200);
        const target = new Vector3(0, 0, 0);
        this._worldPosition = position.clone();
        this._worldTarget = target.clone();
        this._relativeTarget = this._worldTarget.subtract(this._worldPosition);
        this._lookAtVector = this._worldTarget.subtract(this._worldPosition).normalize();
        this._rotation = Vector3.Zero();

        // Initialize spherical coordinates from position
        this.radius = position.length();
        this.alpha = Math.atan2(position.x, position.z);
        this.beta = Math.acos(position.y / this.radius);
        this._isViewMatrixDirty = true;
    }

    private _checkInputsCartesian() {
        // Handle movement
        if (this._localTranslation.lengthSquared() > 0) {
            // Update world position
            this._worldPosition.addInPlace(this._localTranslation);
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
            // Accumulate rotation
            this._rotation.addInPlace(this._localRotation);

            // Clamp pitch to avoid flipping
            this._rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this._rotation.x));
            this._rotation.y = Scalar.NormalizeRadians(this._rotation.y); // Yaw wrapped to -π to π
            this._rotation.z = Scalar.NormalizeRadians(this._rotation.z); // Roll wrapped to -π to π

            // Mark as changed
            this._isViewMatrixDirty = true;
            this._localRotation.copyFromFloats(0, 0, 0); // or should this live in viewmatrix calc
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
