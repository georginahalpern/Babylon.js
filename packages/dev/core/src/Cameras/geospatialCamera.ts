import { Camera } from "./camera";
import { Vector3, Matrix } from "../Maths/math.vector";
import type { Scene } from "../scene";
import { GeospatialCameraInputsManager } from "./geospatialCameraInputsManager";
import { Epsilon } from "../Maths";

export class FloatingOriginCamera extends Camera {
    protected _lookAtVector: Vector3;
    private _floatingOriginOffset: Vector3;
    protected _isViewMatrixDirty = true;
    protected _viewMatrix: Matrix;

    // Changed by the inputs
    public _localTranslation: Vector3;
    public _localRotation: Vector3;

    constructor(name: string, position: Vector3, scene: Scene) {
        if (scene.activeCamera != null) {
            throw new Error("FloatingOrigin camera must be the only active camera on a scene");
        }
        super(name, Vector3.Zero(), scene); // Camera always at origin
        this.resetToDefault(position); // Initialize vectors
        scene.getEngine().getCreationOptions().useHighPrecisionMatrix = true;
    }

    public resetToDefault(position?: Vector3): void {
        this._floatingOriginOffset = position || Vector3.Zero(); // Where is the camera located in geoworld space
        this.upVector = Vector3.Up(); // Up vector of the camera
        this._lookAtVector = new Vector3(0, 0, 1); // Lookat vector of the camera
        this._localTranslation = Vector3.Zero(); // starting incremental translation
        this._localRotation = Vector3.Zero(); // starting incremental rotation
        this._viewMatrix = Matrix.Identity();
        this._isViewMatrixDirty = true;
    }

    // Override position to track world position
    public override get position(): Vector3 {
        if (!this._floatingOriginOffset) {
            this._floatingOriginOffset = Vector3.Zero(); // Initialize if not set
        }
        return this._floatingOriginOffset;
    }

    public override set position(value: Vector3) {
        if (!this._floatingOriginOffset) {
            this._floatingOriginOffset = Vector3.Zero(); // Initialize if not set
        }
        this._floatingOriginOffset.copyFrom(value);
    }

    public override _getViewMatrix() {
        if (!this._isViewMatrixDirty) {
            return this._viewMatrix;
        }
        // Reset rotation change flag when we recalculate
        this._isViewMatrixDirty = false;

        // Ensure vectors are normalized
        this.upVector.normalize();
        this._lookAtVector.normalize();

        if (this.getScene().useRightHandedSystem) {
            Matrix.LookAtRHToRef(Vector3.Zero(), this._lookAtVector, this.upVector, this._viewMatrix);
        } else {
            Matrix.LookAtLHToRef(Vector3.Zero(), this._lookAtVector, this.upVector, this._viewMatrix);
        }

        return this._viewMatrix;
    }

    public override _checkInputs(): void {
        this.inputs.checkInputs();
        let shouldRecalc = false;
        if (this._localTranslation.lengthSquared() > 0) {
            // Update world position
            this._floatingOriginOffset.addInPlace(this._localTranslation);
            shouldRecalc = true;
        }

        // Handle rotation
        if (this._localRotation.lengthSquared() > 0) {
            // // Accumulate rotation ?

            // // Clamp pitch to avoid flipping
            // this._rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this._rotation.x));
            // this._rotation.y = Scalar.NormalizeRadians(this._rotation.y); // Yaw wrapped to -π to π
            // this._rotation.z = Scalar.NormalizeRadians(this._rotation.z); // Roll wrapped to -π to π
            shouldRecalc = true;
        }

        shouldRecalc && this._recalcViewMatrix();
        super._checkInputs();
    }

    protected _recalcViewMatrix() {
        this._isViewMatrixDirty = true;
        this._localRotation.setAll(0);
        this._localTranslation.setAll(0);
    }

    public override _isSynchronizedViewMatrix(): boolean {
        if (!super._isSynchronizedViewMatrix() || this._isViewMatrixDirty) {
            return false;
        }
        return true;
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
export class GeospatialCamera extends FloatingOriginCamera {
    // public lookAtVector: Vector3;
    public pitchRotationAxis: Vector3;

    // What caller sees when retrieving position/target/rotation
    public geoworldOrigin: Vector3;
    public geoworldHitPoint: Vector3;
    public geocentricNormal: Vector3;
    public _rotation: Vector3;
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
        this.geocentricNormal = this.geoworldHitPoint.normalizeToNew();

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
        this.position.z = elevation;
    }

    protected override _recalcViewMatrix(): void {
        // Normalize key vectors
        this.geocentricNormal.normalize();
        this.upVector.normalize();
        this._lookAtVector.normalize();

        // // Calculate pitch change, clamped so camera doesn't flip
        // const currentPitch = Math.acos(Scalar.Clamp(-Vector3.Dot(this.lookAtVector, this.geocentricNormal), -1, 1));
        // const newPitch = Math.min(0.5 * Math.PI, Math.max(0, currentPitch + this._localRotation.x));
        // const actualLocationRotationX = newPitch - currentPitch;
        // Compute how much pitch to apply this frame but clamp cumulative pitch to +/- 180 degrees
        // const prevRotX = this._rotation.x;
        // // Proposed new cumulative rotation after applying local increment
        // let proposedRotX = prevRotX + this._localRotation.x;
        // const maxPitch = Math.PI; // 180 degrees
        // const minPitch = -Math.PI;
        // if (proposedRotX > maxPitch) {
        //     proposedRotX = maxPitch;
        // }
        // if (proposedRotX < minPitch) {
        //     proposedRotX = minPitch;
        // }
        // // actual per-frame rotation to apply (may be reduced by clamping)
        // const actualLocationRotationX = proposedRotX - prevRotX;

        // // Accumulate rotation for all axes (apply clamped X). Y/Z accumulate normally.
        // this._rotation.x = proposedRotX;
        // this._rotation.y += this._localRotation.y;
        // this._rotation.z += this._localRotation.z;
        const actualLocationRotationX = this._localRotation.x;

        // Compute a stable rotation axis: cross(up, geocentricNormal)
        Vector3.CrossToRef(this.upVector, this.geocentricNormal, this.pitchRotationAxis);
        // If up and geocentricNormal are parallel, fall back to cross(lookAtDirection, geocentricNormal)
        if (this.pitchRotationAxis.lengthSquared() <= Epsilon) {
            Vector3.CrossToRef(this._lookAtVector, this.geocentricNormal, this.pitchRotationAxis);
        }

        // Build rotation matrix around normalized axis
        this.pitchRotationAxis.normalize();
        const pitchRotationMatrix = Matrix.RotationAxis(this.pitchRotationAxis, actualLocationRotationX);
        const yawRotationMatrix = Matrix.RotationAxis(this.geocentricNormal, this._localRotation.y); // this changes if we aren't using center of screen for
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
