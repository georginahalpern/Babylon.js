import { Camera } from "./camera";
import { Vector3, Matrix } from "../Maths/math.vector";
import type { Scene } from "../scene";
// import type { Mesh } from "../Meshes";

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
    protected _viewMatrix: Matrix;
    protected _lookAtVector: Vector3;

    private _isViewMatrixDirty: boolean;
    private _tempWorld: Matrix;

    constructor(name: string, position: Vector3, scene: Scene) {
        if (scene.activeCamera != null) {
            throw new Error("FloatingOrigin camera must be the only active camera on a scene");
        }
        super(name, position, scene);
        this._resetToDefault(); // Initialize vectors
        scene.getEngine().getCreationOptions().useHighPrecisionMatrix = true;

        scene.onBeforeRenderObservable.add(() => {
            scene.rootNodes.forEach((node) => {
                if (node == this) {
                    return;
                }
                // Some nodes (like meshes) use getWorldMatrix to set matrix on ubo buffer
                const anyNode = node as any;
                if (anyNode.position) {
                    anyNode
                        .getWorldMatrix()
                        .setTranslationFromFloats(anyNode.position.x - this.position.x, anyNode.position.y - this.position.y, anyNode.position.z - this.position.z);
                }
                // Some nodes (like lights) use absolutePosition instead of worldMatrix when setting the worldmatrix on ubo buffer
                if (anyNode.getAbsolutePosition) {
                    anyNode.getAbsolutePosition().subtractToRef(this.position, anyNode.getAbsolutePosition());
                }
            });

            const world = this.getViewMatrix();
            this._tempWorld.copyFrom(world);
            world.setTranslationFromFloats(0, 0, 0);
        });

        scene.onAfterRenderObservable.add(() => {
            scene.rootNodes.forEach((node) => {
                if (node == this) {
                    return;
                }
                const anyNode = node as any;
                if (anyNode.position) {
                    anyNode.getWorldMatrix().setTranslation(anyNode.position);
                }

                if (anyNode.getAbsolutePosition) {
                    anyNode.getAbsolutePosition().addToRef(this.position, anyNode.getAbsolutePosition());
                }
            });

            this.getViewMatrix().copyFrom(this._tempWorld);
        });
    }

    protected _resetToDefault(): void {
        this.upVector = Vector3.Up(); // Up vector of the camera
        this._lookAtVector = this.position.negate().normalize(); // Lookat vector of the camera
        this._viewMatrix = Matrix.Identity();
        this._tempWorld = Matrix.Identity();
        this._setDirty();
    }

    protected _setDirty() {
        if (!this._isViewMatrixDirty) {
            this._isViewMatrixDirty = true;
            for (const node of this.getScene().rootNodes) {
                node.markAsDirty();
            }
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

        // Calculate view matrix with actual position to maintain correct perspective
        if (this.getScene().useRightHandedSystem) {
            Matrix.LookAtRHToRef(this.position, this.position.add(this._lookAtVector), this.upVector, this._viewMatrix);
        } else {
            Matrix.LookAtLHToRef(this.position, this.position.add(this._lookAtVector), this.upVector, this._viewMatrix);
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
