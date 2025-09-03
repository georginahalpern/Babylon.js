import { Camera } from "./camera";
import { Vector3, Matrix } from "../Maths/math.vector";
import type { Scene } from "../scene";
import type { Mesh } from "../Meshes";
// // import { PickingCustomization, FloatingOriginInternalPicker } from "../Culling/ray.core";
// import type { Mesh } from "../Meshes";
// import { Node } from "../node";

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
        // scene.floatingOriginOffsetRef = this.position;
        // PickingCustomization.internalPickerForMesh = FloatingOriginInternalPicker;
        // scene.rootNodes.forEach((node: any) => {
        //     if (node.onBeforeCameraRenderObservable) {
        //         node.onBeforeCameraRenderObservable.add(() => {
        //             node.getWorldMatrix().setTranslationFromFloats(0, 0, 0);
        //         });
        //         node.onAfterCameraRenderObservable.add(() => {
        //             node.getWorldMatrix().setTranslationFromFloats(0, 0, 0);
        //         });
        //     }
        // });
        const beforeRender = (mesh: Mesh) => {
            mesh.onBeforeRenderObservable?.clear();
            mesh.onAfterRenderObservable?.clear();

            // Store original position
            const originalPosition = mesh.position.clone();
            if (mesh.onBeforeRenderObservable) {
                mesh.onBeforeRenderObservable.add(() => {
                    if (!mesh.parent) {
                        mesh.getWorldMatrix().setTranslationFromFloats(
                            originalPosition.x - this.position.x,
                            originalPosition.y - this.position.y,
                            originalPosition.z - this.position.z
                        );
                    }
                });
            }
            if (mesh.onAfterRenderObservable) {
                mesh.onAfterRenderObservable.add(() => {
                    if (!mesh.parent) {
                        mesh.getWorldMatrix().setTranslation(originalPosition);
                    }
                });
            }
        };

        scene.meshes.forEach((mesh) => beforeRender(mesh as Mesh));
        scene.onNewMeshAddedObservable.add((mesh) => beforeRender(mesh as Mesh));

        // const perNode = (node: Node) => {
        //     const anyNode = node as any;
        //     if (anyNode.getAbsolutePosition && anyNode != this) {
        //         node.onBeforeRenderObservable.add(() => {
        //             const absolutePosition = anyNode.getAbsolutePosition();
        //             node.getWorldMatrix().setTranslationFromFloats(
        //                 absolutePosition.x - this.position.x,
        //                 absolutePosition.y - this.position.y,
        //                 absolutePosition.z - this.position.z
        //             );
        //         });
        //         node.onAfterRenderObservable.add(() => {
        //             const absolutePosition = anyNode.getAbsolutePosition();
        //             node.getWorldMatrix().setTranslationFromFloats(absolutePosition.x, absolutePosition.y, absolutePosition.z);
        //         });
        //     }
        // };
        scene.onBeforeRenderObservable.add(() => {
            // scene.rootNodes.forEach((node) => {
            //     const anyNode = node as any;
            //     const absolutePosition = anyNode.getAbsolutePosition ? anyNode.getAbsolutePosition() : undefined;
            //     if (absolutePosition && anyNode != this) {
            //         const newPosition = absolutePosition.subtract(this.position);
            //         node.getWorldMatrix().setTranslation(newPosition);
            //     }
            // });

            const world = this.getViewMatrix();
            this._tempWorld.copyFrom(world);
            world.setTranslationFromFloats(0, 0, 0);
        });

        scene.onAfterRenderObservable.add(() => {
            // scene.rootNodes.forEach((node) => {
            //     const anyNode = node as any;
            //     const absolutePosition = anyNode.getAbsolutePosition ? anyNode.getAbsolutePosition() : undefined;
            //     if (absolutePosition && anyNode != this) {
            //         const newPosition = absolutePosition.add(this.position);
            //         node.getWorldMatrix().setTranslation(newPosition);
            //     }
            // });
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
        //Calculate view matrix with actual position to maintain correct perspective
        // if (this.getScene().useRightHandedSystem) {
        //     Matrix.LookAtRHToRef(Vector3.Zero(), this._lookAtVector, this.upVector, this._viewMatrix);
        // } else {
        //     Matrix.LookAtLHToRef(Vector3.Zero(), this._lookAtVector, this.upVector, this._viewMatrix);
        // }

        return this._viewMatrix;
    }

    // public override getWorldMatrix(): Matrix {

    // }

    /** @internal */
    public override _isSynchronizedViewMatrix(): boolean {
        if (!super._isSynchronizedViewMatrix() || this._isViewMatrixDirty) {
            return false;
        }
        return true;
    }
}
