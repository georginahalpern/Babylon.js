import { Camera } from "./camera";
import { Vector3, Matrix } from "../Maths/math.vector";
import type { Scene } from "../scene";
import { GeospatialCameraInputsManager } from "./geospatialCameraInputsManager";
import { Epsilon, Scalar } from "../Maths";

export class GeospatialCamera extends Camera {
    // Input handling
    public override inputs: GeospatialCameraInputsManager;

    // Movement state (what inputs set)
    public _localTranslation = Vector3.Zero();
    public _localRotation = Vector3.Zero();

    // Speed and inertia
    public speed = 1.0;
    public override inertia = 0.9;

    // World tracking
    public _worldPosition: Vector3;
    public _worldTarget: Vector3; // This would be wherever the input is on the globe (or geospatial object)
    private _rotationChanged: boolean = false;
    public _positionChanged: boolean = true;
    private _rotation: Vector3 = Vector3.Zero();
    private _viewMatrix: Matrix = Matrix.Identity();

    constructor(name: string, scene: Scene) {
        if (scene.activeCamera != null) {
            throw new Error("Geospatial camera must be the only active camera on a scene");
        }
        super(name, Vector3.Zero(), scene); // Camera always at origin

        // Will update constructor to take in target/radius/position depending on what I decide
        const position = new Vector3(0, 0, -200);
        const target = new Vector3(0, 0, -50);
        this._worldPosition = position.clone();
        this._worldTarget = target.clone();

        this._rotation = Vector3.Zero();

        // Set up inputs
        this.inputs = new GeospatialCameraInputsManager(this);
        this.inputs.addKeyboard().addMouse();

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
        this._rotationChanged = true;
    }

    public setTarget(target: Vector3): void {
        this._worldTarget.copyFrom(target);
    }

    /**
     * This is a geospatial term which means to look directly downward towards the surface/center of the earth
     */
    public lookNadir() {
        this._rotation = Vector3.Zero();
        this._rotationChanged = true;
    }

    /**
     * Geospatial terminology for rotating along the x axis. Think of it as moving head/camera up/down towards sky/ground
     * Also known as pitch/tilt/inclination
     * @param tilt
     */
    public setTilt(tilt: number): void {
        this._rotation.x = tilt;
        this._rotationChanged = true;
    }
    /**
     * Geospatial terminology for rotating along the y axis. Think of it as moving head/camera left/right.
     * Also known as yaw/bearing/rotation/azimuth/orientation
     * @param heading
     */
    public setHeading(heading: number): void {
        this._rotation.y = heading;
        this._rotationChanged = true;
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
        if (!this._rotationChanged) {
            return this._viewMatrix;
        }
        // Reset rotation change flag when we recalculate
        this._rotationChanged = false;
        // Reset local rotation (this prevents it from returning to center!)
        // Use accumulated rotation to calculate new rotationMatrix
        const rotationMatrix = Matrix.RotationYawPitchRoll(
            this._rotation.y, // Use rotation, not _localRotation!
            this._rotation.x,
            this._rotation.z
        );

        const forward = Vector3.TransformCoordinates(new Vector3(0, 0, 1), rotationMatrix);
        const up = Vector3.TransformCoordinates(Vector3.Up(), rotationMatrix);

        Matrix.LookAtLHToRef(Vector3.Zero(), forward, up, this._viewMatrix);

        return this._viewMatrix;
    }

    public override _checkInputs(): void {
        if (!this._localTranslation) {
            this._localTranslation = Vector3.Zero();
        }
        // Let inputs populate cameraDirection/cameraRotation
        this.inputs.checkInputs();

        // Handle movement
        if (this._localTranslation.lengthSquared() > 0) {
            // Update world position
            this._worldPosition.addInPlace(this._localTranslation);
            this._positionChanged = true;
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
            this._rotationChanged = true;
            this._localRotation.copyFromFloats(0, 0, 0); // or should this live in viewmatrix calc
        }
    }

    public override _isSynchronizedViewMatrix(): boolean {
        if (!super._isSynchronizedViewMatrix() || this._rotationChanged) {
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
