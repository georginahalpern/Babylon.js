import { Camera } from "./camera";
import { Vector3, Matrix } from "../Maths/math.vector";
import type { Scene } from "../scene";

/**
 * @experimental
 * This camera avoids floating-point imprecision (resulting in visual jittering) when rendering large-scale coordinate systems (ex: navigating a globe).
 *
 * It solves this by
 * 1. Setting the engine to use double point precision via the useHighPrecisionMatrix flag
 * 2. Centering the camera at world origin and offsetting all meshes by the camera's position
 *
 * This offsetting logic is done in 2 parts
 * 1. Overriding the camera's viewMatrix calculation to use Vector3.Zero as the position in the lookAt matrix calculation
 * 2. Detecting this camera in the transform node's worldMatrix calculation and translating the root nodes by the camera's position
 */
export class FloatingOriginCamera extends Camera {
    protected _isViewMatrixDirty = true;
    protected _viewMatrix: Matrix;
    protected _lookAtVector: Vector3;

    constructor(name: string, position: Vector3, scene: Scene) {
        if (scene.activeCamera != null) {
            throw new Error("FloatingOrigin camera must be the only active camera on a scene");
        }
        super(name, position, scene);
        this._resetToDefault(); // Initialize vectors
        scene.getEngine().getCreationOptions().useHighPrecisionMatrix = true;
        scene.floatingOriginOffsetRef = this.position;
    }

    protected _resetToDefault(): void {
        this.upVector = Vector3.Up(); // Up vector of the camera
        this._lookAtVector = this.position.negate().normalize(); // Lookat vector of the camera
        this._viewMatrix = Matrix.Identity();
        this._isViewMatrixDirty = true;
    }

    protected _setDirty() {
        // early out if already dirty
        this._isViewMatrixDirty = true;
        for (const node of this.getScene().rootNodes) {
            node.markAsDirty();
        }
    }

    /** @internal */
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

    /** @internal */
    public override _isSynchronizedViewMatrix(): boolean {
        if (!super._isSynchronizedViewMatrix() || this._isViewMatrixDirty) {
            return false;
        }
        return true;
    }
}
