// // =============================-===--======- -    -
// // Floating-Origin Geospatial Camera
// //
// // This camera extends UniversalCamera to handle large real-world coordinates
// // by implementing a floating-origin system. The camera stays at (0,0,0) internally
// // while exposing real-world coordinate API to callers.
// //
// // Features:
// // - Caller uses normal mesh.position and camera.position with real-world coords
// // - Internal camera stays at origin to avoid floating-point precision issues
// // - Automatically tracks and updates all meshes in the scene
// // - No entity concept - uses Babylon.js built-in node system
// // ===========================-===--======- -    -

import { Matrix, Vector3 } from "core/Maths/math.vector";
import { UniversalCamera } from "./universalCamera";
import type { IDisposable, Scene } from "../scene";
// import { TransformNode } from "core/Meshes";
import { RegisterClass } from "core/Misc";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Nullable } from "core/types";
import { InterceptProperty } from "./hooks";

type MeshTrackingData = {
    meshCallerPosition: Vector3;
    meshPositionRelativeToCamera: Vector3;
    interceptToken: IDisposable;
};
/**
 * GeospatialCamera extends UniversalCamera to provide floating-origin rendering
 * for handling large real-world coordinate systems without precision loss.
 *
 * Usage:
 * - Use camera.position normally with real-world coordinates
 * - Use mesh.position normally with real-world coordinates
 * - Camera automatically handles precision internally by staying at origin
 * - All meshes are automatically tracked and positioned relative to camera
 */
export class GeospatialCameraUniversal extends UniversalCamera {
    // Storage for meshes and their real-world / relative positions
    private _meshPositions = new Map<AbstractMesh, MeshTrackingData>();

    // The camera's real-world position (what caller sees)
    private _callerPosition: Vector3 = new Vector3();

    // The camera's real-world target (what caller sees)
    private _callerTarget: Vector3 = new Vector3();

    // Override position property to use real-world coordinates
    public override get position(): Vector3 {
        if (!this._callerPosition) {
            this._callerPosition = Vector3.Zero();
        }

        // global.console.log(
        //     `GeospatialCamera.GETPOSITION: world (caller) position (${this._callerPosition.x}, ${this._callerPosition.y}, ${this._callerPosition.z}) -> relative (${super.position.x}, ${super.position.y}, ${super.position.z})`
        // );
        return this._callerPosition.clone(); // Do I need to clone here?
    }

    // public override _updatePosition(): void {
    //     // DO NOT call super._updatePosition() - that would move the camera
    //     // Instead, just update our world position tracking
    //     this._callerPosition.addInPlace(this.cameraDirection);

    //     // Keep internal position at origin
    //     super.position.copyFromFloats(0, 0, 0);
    // }
    public override set position(pos: Vector3) {
        // Store the camera's caller position (so that we can later return it when getPosition is called).
        // No actual camera position change (i.e. no change to super.position) - camera stays at origin (0,0,0)
        if (!this._callerPosition) {
            this._callerPosition = Vector3.Zero();
        }
        this._callerPosition.copyFrom(pos);

        global.console.log(
            `GeospatialCamera.setPosition: world (caller) position (${pos.x}, ${pos.y}, ${pos.z}) -> relative (${super.position.x}, ${super.position.y}, ${super.position.z})`
        );
    }

    // Override target methods to use real-world coordinates
    public override getTarget(): Vector3 {
        global.console.log(
            `GeospatialCamera.getTarget: world (caller) target (${this._callerTarget.x}, ${this._callerTarget.y}, ${this._callerTarget.z}) -> relative (${super.getTarget().x}, ${super.getTarget().y}, ${super.getTarget().z})`
        );
        return this._callerTarget.clone();
    }

    public override setTarget(target: Vector3): void {
        // Initialize _worldTarget if it doesn't exist yet (during construction)
        if (!this._callerTarget) {
            this._callerTarget = new Vector3();
        }
        this._callerTarget.copyFrom(target);
        // Set the actual camera target relative to origin
        const relativeTarget = this._callerTarget.subtract(this._callerPosition);
        global.console.log(
            `GeospatialCamera.setTarget: world (caller) target (${target.x}, ${target.y}, ${target.z}) -> relative(send to super) (${relativeTarget.x}, ${relativeTarget.y}, ${relativeTarget.z})`
        );
        super.setTarget(relativeTarget);
    }

    // Always computed from origin
    public override _getViewMatrix(): Matrix {
        // Camera is always at origin
        const cameraPosition = Vector3.Zero();
        const target = this._currentTarget; // Also relative to origin
        const up = this.upVector;

        Matrix.LookAtLHToRef(cameraPosition, target, up, this._viewMatrix);
        return this._viewMatrix;
    }
    // /** @internal */
    public override _checkInputs(): void {
        // Get the movement inputs before they're applied to camera
        if (!this.cameraDirection) {
            this.cameraDirection = Vector3.Zero();
        }
        if (!this._localDirection) {
            this._localDirection = Vector3.Zero();
            this._transformedDirection = Vector3.Zero();
        }

        this.inputs.checkInputs();

        const needToMove = this._decideIfNeedsToMove();
        const cameraDirection = this.cameraDirection.clone();

        if (needToMove && cameraDirection.lengthSquared() > 0.001) {
            // Instead of moving camera, move all tracked meshes in opposite direction
            this._moveMeshesInsteadOfCamera(cameraDirection);

            // Clear camera movement to prevent actual camera movement
            this.cameraDirection.copyFromFloats(0, 0, 0);
        }

        // Let parent handle rotation (or override that too if needed)
        // super._checkInputs();
    }
    /** @internal */
    // public override _checkInputs(): void {
    //     // Ensure cameraDirection is initialized (should be done by parent, but safety check)
    //     if (!this.cameraDirection) {
    //         this.cameraDirection = Vector3.Zero();
    //     }
    //     if (!this._localDirection) {
    //         this._localDirection = Vector3.Zero();
    //         this._transformedDirection = Vector3.Zero();
    //     }

    //     // global.console.log(`BEFORE inputs.checkInputs(): cameraDirection = (${this.cameraDirection.x}, ${this.cameraDirection.y}, ${this.cameraDirection.z})`);

    //     this.inputs.checkInputs();

    //     // global.console.log(`AFTER inputs.checkInputs(): cameraDirection = (${this.cameraDirection.x}, ${this.cameraDirection.y}, ${this.cameraDirection.z})`);

    //     const needToMove = this._decideIfNeedsToMove();
    //     const cameraDirection = this.cameraDirection.clone();

    //     // global.console.log(`needToMove = ${needToMove}, cameraDirection length = ${cameraDirection.length()}`);

    //     if (needToMove && cameraDirection.lengthSquared() > 0.001) {
    //         // Instead of moving camera, move all tracked meshes in opposite direction
    //         this._moveMeshesInsteadOfCamera(cameraDirection);

    //         // Clear camera movement to prevent actual camera movement
    //         this.cameraDirection.copyFromFloats(0, 0, 0);
    //     } else {
    //         // global.console.log("NOT MOVING - needToMove:", needToMove, "cameraDirection.lengthSquared():", cameraDirection.lengthSquared());
    //     }

    //     // global.console.log(`BEFORE super._checkInputs(): cameraDirection = (${this.cameraDirection.x}, ${this.cameraDirection.y}, ${this.cameraDirection.z})`);

    //     // Let parent handle rotation (or override that too if needed)
    //     super._checkInputs();

    //     // console.log(`AFTER super._checkInputs(): cameraDirection = (${this.cameraDirection.x}, ${this.cameraDirection.y}, ${this.cameraDirection.z})`);
    // }
    /** @internal */
    // public override _checkInputs(): void {
    //     // Initialize if needed
    //     if (!this.cameraDirection) {
    //         this.cameraDirection = Vector3.Zero();
    //     }
    //     if (!this._localDirection) {
    //         this._localDirection = Vector3.Zero();
    //         this._transformedDirection = Vector3.Zero();
    //     }

    //     // Let inputs populate cameraDirection
    //     this.inputs.checkInputs();

    //     // Check if there's movement
    //     const needToMove = this._decideIfNeedsToMove();
    //     const needToRotate = this.cameraRotation.x !== 0 || this.cameraRotation.y !== 0;

    //     if (needToMove) {
    //         // Update our world position
    //         this._callerPosition.addInPlace(this.cameraDirection);

    //         // Move all meshes in opposite direction
    //         this._moveMeshesInsteadOfCamera(this.cameraDirection.clone());

    //         // Apply inertia to cameraDirection (like parent would)
    //         if (Math.abs(this.cameraDirection.x) < this.speed * Epsilon) {
    //             this.cameraDirection.x = 0;
    //         }
    //         if (Math.abs(this.cameraDirection.y) < this.speed * Epsilon) {
    //             this.cameraDirection.y = 0;
    //         }
    //         if (Math.abs(this.cameraDirection.z) < this.speed * Epsilon) {
    //             this.cameraDirection.z = 0;
    //         }
    //         this.cameraDirection.scaleInPlace(this.inertia);
    //     }

    //     if (needToRotate) {
    //         // Handle rotation (this is safe to let parent do)
    //         this.rotation.x += this.cameraRotation.x;
    //         this.rotation.y += this.cameraRotation.y;

    //         if (!this.noRotationConstraint) {
    //             // Apply rotation limits if needed
    //             const limit = 1.570796; // PI/2
    //             if (this.rotation.x > limit) {
    //                 this.rotation.x = limit;
    //             }
    //             if (this.rotation.x < -limit) {
    //                 this.rotation.x = -limit;
    //             }
    //         }

    //         // Apply rotation inertia
    //         this.cameraRotation.scaleInPlace(this.inertia);
    //     }

    //     // Update the target based on new rotation
    //     this._updateTarget();

    //     // DO NOT call super._checkInputs() as it would move the camera!
    // }

    // // Add this helper method
    // private _updateTarget(): void {
    //     // Calculate target based on camera rotation
    //     const direction = new Vector3(0, 0, 1); // Forward
    //     const rotationMatrix = Matrix.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
    //     const rotatedDirection = Vector3.TransformNormal(direction, rotationMatrix);

    //     // Set relative target (from origin)
    //     this._currentTarget.copyFrom(rotatedDirection);
    // }

    constructor(name: string, position: Vector3, scene: Scene) {
        super(name, Vector3.Zero(), scene);

        // Store the initial world position
        this._callerPosition.copyFrom(position);

        // Enable high precision matrix calculations
        // scene.getEngine().getCreationOptions().useHighPrecisionMatrix = true;

        // Set camera presets for geospatial usage
        this.touchAngularSensibility = 10000;
        this.inertia = 0;
        this.speed = 1000;
        this.minZ = 0.5;
        this.maxZ = 50000000;
        this.fov = Math.PI / 3; // 60 degrees - much wider field of view

        // Before each frame, update the floating-origin system
        // this._scene.onBeforeActiveMeshesEvaluationObservable.add(() => {
        //     this._updateFloatingOrigin();
        // });

        // Track when meshes are added/removed from scene
        this._scene.onNewMeshAddedObservable.add((mesh) => {
            this._trackMesh(mesh);
        });

        this._scene.onMeshRemovedObservable.add((mesh) => {
            const meshData = this._meshPositions.get(mesh);
            meshData && this._disposeMeshData(meshData);
            this._meshPositions.delete(mesh);
        });

        // Track existing meshes in scene
        for (const mesh of this._scene.meshes) {
            this._trackMesh(mesh);
        }
    }

    private _moveMeshesInsteadOfCamera(cameraDirection: Vector3): void {
        // Move all tracked meshes in the opposite direction
        const inverseMoveDirection = cameraDirection.negate();
        const cameraDisplacement = this._callerPosition.subtract(inverseMoveDirection);
        global.console.log(
            `GeospatialCamera._moveMeshesInsteadOfCamera: inverseMoveDirection = (${inverseMoveDirection.x}, ${inverseMoveDirection.y}, ${inverseMoveDirection.z})
            and relativeCamPos = (${cameraDisplacement.x}, ${cameraDisplacement.y}, ${cameraDisplacement.z})`
        );

        // this._callerPosition.addInPlace(inverseMoveDirection);
        this._callerPosition.addInPlace(cameraDirection); // Update world position with actual movement
        this._meshPositions.forEach((trackingData, mesh) => {
            // Update the world position of each mesh
            const newWorldPosition = trackingData.meshCallerPosition.add(inverseMoveDirection);

            // // Update our tracking data
            // trackingData.meshCallerPosition.copyFrom(newWorldPosition);
            // trackingData.meshPositionRelativeToCamera = this._calculateRelativePosition(newWorldPosition);

            // Trigger position update by calling the mesh's position setter
            // This will automatically update the internal position via our intercepted property
            mesh.position = newWorldPosition;
            //            Object.getOwnPropertyDescriptor(TransformNode.prototype, "position")!.set!.call(mesh, newWorldPosition);

            global.console.log(
                `_moveMeshesInsteadOfCamera ${mesh.name} -- (inverseMoveDirection: ${inverseMoveDirection.x}, ${inverseMoveDirection.y}, ${inverseMoveDirection.z})
            -- newWorldPosition: (${newWorldPosition.x}, ${newWorldPosition.y}, ${newWorldPosition.z})
            -- relativePosition: (${trackingData.meshPositionRelativeToCamera.x}, ${trackingData.meshPositionRelativeToCamera.y}, ${trackingData.meshPositionRelativeToCamera.z})
            -> relative(send to super) (${trackingData.meshPositionRelativeToCamera.x}, ${trackingData.meshPositionRelativeToCamera.y}, ${trackingData.meshPositionRelativeToCamera.z})`
            );
        });

        global.console.log(`Moved ${this._meshPositions.size} meshes instead of camera`);
    }
    // private _moveMeshesInsteadOfCamera(cameraDirection: Vector3): void {
    //     const inverseMoveDirection = cameraDirection.negate();

    //     this._meshPositions.forEach((trackingData, mesh) => {
    //         // Update mesh world position by moving it opposite to camera movement
    //         trackingData.meshCallerPosition.addInPlace(inverseMoveDirection);

    //         // Calculate new relative position
    //         const relativePosition = this._calculateRelativePosition(trackingData.meshCallerPosition);
    //         trackingData.meshPositionRelativeToCamera.copyFrom(relativePosition);

    //         // Trigger the position update
    //         mesh.position = trackingData.meshCallerPosition.clone();
    //     });
    // }
    /**
     * Track a mesh and store its world position when it changes
     * @param mesh The mesh to track
     */
    private _trackMesh(mesh: AbstractMesh): void {
        // Store initial world position if not already tracked
        if (!this._meshPositions.has(mesh)) {
            const callerPosition = mesh.position.clone();

            const interceptToken: Nullable<IDisposable> = InterceptProperty(mesh, "position", {
                valToSet: (set: Vector3) => {
                    return this._handleSetMeshPosition(mesh, set);
                },
                valToGet: () => {
                    return this._handleGetMeshPosition(mesh);
                },
            });

            const relativePosition = this._calculateRelativePosition(callerPosition);
            this._meshPositions.set(mesh, {
                meshCallerPosition: callerPosition,
                meshPositionRelativeToCamera: relativePosition,
                interceptToken,
            });
            global.console.log(
                `MESH.: mesh.name (${mesh.name},
                world(caller) position (${callerPosition.x}, ${callerPosition.y}, ${callerPosition.z}) -> relative (${relativePosition.x}, ${relativePosition.y}, ${relativePosition.z})`
            );
        }
    }

    private _handleGetMeshPosition(mesh: AbstractMesh): Vector3 {
        const trackingData = this._meshPositions.get(mesh);
        if (trackingData) {
            global.console.log(
                `GETPOSITION MESH.: mesh.name (${mesh.name},
            world(caller) position (${trackingData.meshCallerPosition.x}, ${trackingData.meshCallerPosition.y}, ${trackingData.meshCallerPosition.z}) -> relative (${trackingData.meshPositionRelativeToCamera.x}, ${trackingData.meshPositionRelativeToCamera.y}, ${trackingData.meshPositionRelativeToCamera.z})`
            );

            return trackingData.meshCallerPosition.clone();
        }
        // If not tracked, return the mesh's current position

        return mesh.position.clone();
    }
    private _handleSetMeshPosition(mesh: AbstractMesh, newPosition: Vector3): Vector3 {
        const trackingData = this._meshPositions.get(mesh);
        const relativePosition = this._calculateRelativePosition(newPosition);
        if (trackingData) {
            trackingData.meshCallerPosition.copyFrom(newPosition);
            trackingData.meshPositionRelativeToCamera.copyFrom(relativePosition);
            global.console.log(
                `SETPOSITION MESH.: mesh.name (${mesh.name},
            world(caller) position (${trackingData.meshCallerPosition.x}, ${trackingData.meshCallerPosition.y}, ${trackingData.meshCallerPosition.z}) -> relative (${trackingData.meshPositionRelativeToCamera.x}, ${trackingData.meshPositionRelativeToCamera.y}, ${trackingData.meshPositionRelativeToCamera.z})`
            );
        }

        return relativePosition;
    }

    private _calculateRelativePosition(meshCallerPosition: Vector3): Vector3 {
        return meshCallerPosition.subtract(this._callerPosition);
    }

    private _disposeMeshData(data: MeshTrackingData): void {
        data.interceptToken.dispose();
    }

    // private _dispose(): void {
    //     this._meshWorldPositions.forEach((value) => {
    //         this._disposeMeshData(value);
    //     });
    //     this._meshWorldPositions.clear();
    // }

    // /**
    //  * Override a mesh's position property to use world coordinates
    //  * This should be called after the mesh is fully loaded and positioned
    //  * @param mesh The mesh to override
    //  */
    // public overrideMeshPosition(mesh: AbstractMesh): void {
    //     if (!this._meshWorldPositions.has(mesh)) {
    //         this._meshWorldPositions.set(mesh, mesh.position.clone());
    //     }

    //     const trackingData = this._meshWorldPositions.get(mesh)!;
    //     const worldPosition = trackingData.callerPosition;

    //     // One-time debug log when we override
    //     global.console.log(`OVERRIDE: Mesh ${mesh.name} world position stored as: ${worldPosition.x}, ${worldPosition.y}, ${worldPosition.z}`);

    //     // IMPORTANT: Immediately set the mesh to its correct relative position
    //     const relativePosition = worldPosition.subtract(this._worldPosition);
    //     global.console.log(`OVERRIDE: Setting ${mesh.name} initial relative position to: ${relativePosition.x}, ${relativePosition.y}, ${relativePosition.z}`);

    //     // Set the actual mesh position using TransformNode directly (before we override the property)
    //     Object.getOwnPropertyDescriptor(TransformNode.prototype, "position")!.set!.call(mesh, relativePosition);

    //     Object.defineProperty(mesh, "position", {
    //         get: () => {
    //             return worldPosition.clone();
    //         },
    //         set: (pos: Vector3) => {
    //             worldPosition.copyFrom(pos);
    //             this._meshWorldPositions.set(mesh, worldPosition);
    //             // The actual positioning will be handled in _updateFloatingOrigin
    //         },
    //         enumerable: true,
    //         configurable: true,
    //     });
    // }

    // /**
    //  * Update the floating-origin system each frame
    //  */
    // private _updateFloatingOrigin(): void {
    //     // Handle camera movement from UniversalCamera controls
    //     // Check the actual camera position (not our overridden world position)
    //     const actualCameraPos = super.position;
    //     if (!actualCameraPos.equalsToFloats(0, 0, 0)) {
    //         // Accumulate movement to world position
    //         this._callerPosition.addInPlace(actualCameraPos);
    //         // Reset camera back to origin - this keeps the camera at (0,0,0) always
    //         super.position.set(0, 0, 0);
    //     }

    //     // Update all tracked meshes relative to camera world position
    //     for (const [mesh, meshData] of this._meshWorldPositions) {
    //         if (mesh.isDisposed()) {
    //             this._meshWorldPositions.delete(mesh);
    //             continue;
    //         }

    //         const worldPos = meshData.meshCallerPosition;

    //         // Calculate mesh position relative to camera world position
    //         // This is the secret: mesh appears at worldPos to user, but actually renders at relative position
    //         const relativePosition = worldPos.subtract(this._callerPosition);

    //         // Set the actual mesh position (bypass our overridden property)
    //         Object.getOwnPropertyDescriptor(TransformNode.prototype, "position")!.set!.call(mesh, relativePosition);
    //     }

    //     // Update target relative to new camera position
    //     if (!this._callerTarget.equals(Vector3.Zero())) {
    //         const relativeTarget = this._callerTarget.subtract(this._callerPosition);
    //         // Set the internal camera target directly to the relative position
    //         super.setTarget(relativeTarget);
    //     }
    // }
}

RegisterClass("GeospatialCameraUniversal", GeospatialCameraUniversal);
