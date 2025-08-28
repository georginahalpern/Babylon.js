import { Camera } from "./camera";
import { Vector3, Matrix } from "../Maths/math.vector";
import type { Scene } from "../scene";

export class FloatingOriginCamera extends Camera {
    protected _isViewMatrixDirty = true;
    protected _viewMatrix: Matrix;
    protected _rotation: Vector3;
    protected _target: Vector3;

    // Changed by the inputs
    public _localTranslation: Vector3;
    public _localRotation: Vector3;
    public _lookAtVector: Vector3;

    constructor(name: string, position: Vector3, scene: Scene) {
        if (scene.activeCamera != null) {
            throw new Error("FloatingOrigin camera must be the only active camera on a scene");
        }
        super(name, position, scene);
        this.resetToDefault(); // Initialize vectors
        scene.getEngine().getCreationOptions().useHighPrecisionMatrix = true;
    }

    public resetToDefault(): void {
        this.upVector = Vector3.Up(); // Up vector of the camera
        this._lookAtVector = new Vector3(0, 0, 1); // Lookat vector of the camera
        this._target = this._lookAtVector.clone();
        this._localTranslation = Vector3.Zero(); // starting incremental translation
        this._localRotation = Vector3.Zero(); // starting incremental rotation
        this._rotation = Vector3.Zero(); // starting cumulative rotation
        this._viewMatrix = Matrix.Identity();
        this._isViewMatrixDirty = true;
    }

    public override _getViewMatrix() {
        if (!this._isViewMatrixDirty) {
            return this._viewMatrix;
        }
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
            shouldRecalc = true;
        }
        if (this._localRotation.lengthSquared() > 0) {
            // Accumulate the rotation values
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
