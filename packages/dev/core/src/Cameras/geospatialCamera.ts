// // // =============================-===--======- -    -
// // // Floating-Origin Geospatial Camera

// // // This camera extends Camera directly to handle large real-world coordinates
// // // by implementing a floating-origin system. The camera stays at (0,0,0) internally
// // // while exposing real-world coordinate API to callers.

// // // Features:
// // // - Caller uses normal mesh.position and camera.position with real-world coords
// // // - Internal camera stays at origin to avoid floating-point precision issues
// // // - Automatically tracks and updates all meshes in the scene
// // // - Full control over positioning without inheritance complexity
// // // ===========================-===--======- -    -

// // import { Vector3, Vector2, Matrix } from "core/Maths";
// // import { Camera } from "./camera";
// // import type { Scene } from "../scene";
// // import { RegisterClass } from "core/Misc";
// // import type { AbstractMesh } from "core/Meshes";
// // import { GeospatialCameraInputsManager } from "./geospatialCameraInputsManager";

// // type MeshTrackingData = {
// //     meshWorldPosition: Vector3;
// //     originalDescriptor: PropertyDescriptor | undefined;
// // };

// // /**
// //  * GeospatialCamera extends Camera directly to provide floating-origin rendering
// //  * for handling large real-world coordinate systems without precision loss.
// //  *
// //  * Usage:
// //  * - Use camera.position normally with real-world coordinates
// //  * - Use mesh.position normally with real-world coordinates
// //  * - Camera automatically handles precision internally by staying at origin
// //  * - All meshes are automatically tracked and positioned relative to camera
// //  */
// // export class GeospatialCamera extends Camera {
// //     // Input management
// //     public override inputs: GeospatialCameraInputsManager;

// //     // Movement and rotation state
// //     public cameraDirection = new Vector3(0, 0, 0);
// //     public cameraRotation = new Vector2(0, 0);
// //     public rotation = new Vector3(0, 0, 0);
// //     public speed = 1000;
// //     public override inertia = 0;

// //     // Geospatial-specific properties
// //     private _meshPositions = new Map<AbstractMesh, MeshTrackingData>();
// //     private _worldPosition: Vector3 = new Vector3(); // Real-world position
// //     private _worldTarget: Vector3 = new Vector3(); // Real-world target
// //     private readonly _viewMatrix = Matrix.Zero();
// //     private readonly _currentTarget = Vector3.Zero();

// //     // Override position property to use real-world coordinates
// //     public override get position(): Vector3 {
// //         return this._worldPosition.clone();
// //     }

// //     public override set position(pos: Vector3) {
// //         if (!this._worldPosition) {
// //             return; // if this is happening in constructor of camera we can ignore
// //         }
// //         this._worldPosition.copyFrom(pos);
// //         // Internal camera position stays at origin - this is key!
// //         super.position.copyFromFloats(0, 0, 0);
// //         this._updateAllMeshRelativePositions();
// //         global.console.log(`GeospatialCamera position set to world: (${pos.x}, ${pos.y}, ${pos.z}), internal: (0, 0, 0)`);
// //     }

// //     constructor(name: string, position: Vector3, scene: Scene) {
// //         super(name, Vector3.Zero(), scene); // Always create internal camera at origin

// //         // Set up input management
// //         this.inputs = new GeospatialCameraInputsManager(this);
// //         this.inputs.addMouse();
// //         // this.inputs.addKeyboard().addMouse().addGamepad().addVirtualJoystick();

// //         // Store initial world position
// //         this._worldPosition.copyFrom(position);

// //         // Camera settings for geospatial use
// //         this.minZ = 0.5;
// //         this.maxZ = 50000000;
// //         this.fov = Math.PI / 3;

// //         // Track existing meshes
// //         for (const mesh of scene.meshes) {
// //             this._trackMesh(mesh);
// //         }

// //         // Track new meshes
// //         scene.onNewMeshAddedObservable.add((mesh) => {
// //             this._trackMesh(mesh);
// //         });

// //         scene.onMeshRemovedObservable.add((mesh) => {
// //             this._untrackMesh(mesh);
// //         });
// //     }

// //     public setTarget(target: Vector3): void {
// //         this._worldTarget.copyFrom(target);
// //         const relativeTarget = this._worldTarget.subtract(this._worldPosition);
// //         // Update internal target relative to origin
// //         this._currentTarget.copyFrom(relativeTarget);
// //         global.console.log(
// //             `GeospatialCamera target set to world: (${target.x}, ${target.y}, ${target.z}), relative: (${relativeTarget.x}, ${relativeTarget.y}, ${relativeTarget.z})`
// //         );
// //     }

// //     public getTarget(): Vector3 {
// //         return this._worldTarget.clone();
// //     }

// //     /**
// //      * Main input processing - this is where we intercept movement
// //      */
// //     public override _checkInputs(): void {
// //         // Process inputs to get movement/rotation intent
// //         this.inputs.checkInputs();

// //         // Check if camera wants to move
// //         const needToMove = this._decideIfNeedsToMove();

// //         if (needToMove) {
// //             global.console.log(`Movement detected: (${this.cameraDirection.x}, ${this.cameraDirection.y}, ${this.cameraDirection.z})`);

// //             // Instead of moving camera, move all meshes in opposite direction
// //             this._moveMeshesInsteadOfCamera(this.cameraDirection.clone());

// //             // Update world position for our tracking
// //             this._worldPosition.addInPlace(this.cameraDirection);

// //             // Clear movement to prevent internal camera from moving
// //             this.cameraDirection.copyFromFloats(0, 0, 0);
// //         }

// //         // Handle rotation normally (or intercept this too if needed)
// //         if (this.cameraRotation.x !== 0 || this.cameraRotation.y !== 0) {
// //             this.rotation.x += this.cameraRotation.x;
// //             this.rotation.y += this.cameraRotation.y;

// //             // Apply inertia to rotation
// //             this.cameraRotation.scaleInPlace(this.inertia);
// //         }

// //         super._checkInputs();
// //     }

// //     private _decideIfNeedsToMove(): boolean {
// //         return Math.abs(this.cameraDirection.x) > 0 || Math.abs(this.cameraDirection.y) > 0 || Math.abs(this.cameraDirection.z) > 0;
// //     }

// //     private _moveMeshesInsteadOfCamera(movement: Vector3): void {
// //         const inverseMovement = movement.negate();

// //         this._meshPositions.forEach((trackingData, mesh) => {
// //             // Update mesh world position
// //             trackingData.meshWorldPosition.addInPlace(inverseMovement);

// //             // Set mesh to new relative position
// //             const relativePosition = trackingData.meshWorldPosition.subtract(this._worldPosition);
// //             this._setMeshInternalPosition(mesh, relativePosition);
// //         });

// //         global.console.log(`Moved ${this._meshPositions.size} meshes by (${inverseMovement.x}, ${inverseMovement.y}, ${inverseMovement.z})`);
// //     }

// //     private _trackMesh(mesh: AbstractMesh): void {
// //         if (!this._meshPositions.has(mesh)) {
// //             // Store mesh's world position and original property descriptor
// //             const worldPosition = mesh.position.clone();
// //             const originalDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(mesh), "position");

// //             // Override mesh position property
// //             Object.defineProperty(mesh, "position", {
// //                 get: () => {
// //                     const data = this._meshPositions.get(mesh);
// //                     return data ? data.meshWorldPosition.clone() : Vector3.Zero();
// //                 },
// //                 set: (newPos: Vector3) => {
// //                     const data = this._meshPositions.get(mesh);
// //                     if (data) {
// //                         data.meshWorldPosition.copyFrom(newPos);
// //                         const relativePos = newPos.subtract(this._worldPosition);
// //                         this._setMeshInternalPosition(mesh, relativePos);
// //                     }
// //                 },
// //                 enumerable: true,
// //                 configurable: true,
// //             });

// //             // Store tracking data
// //             this._meshPositions.set(mesh, {
// //                 meshWorldPosition: worldPosition,
// //                 originalDescriptor,
// //             });

// //             // Set initial relative position
// //             const relativePosition = worldPosition.subtract(this._worldPosition);
// //             this._setMeshInternalPosition(mesh, relativePosition);

// //             global.console.log(
// //                 `Tracking mesh ${mesh.name} at world (${worldPosition.x}, ${worldPosition.y}, ${worldPosition.z}) -> relative (${relativePosition.x}, ${relativePosition.y}, ${relativePosition.z})`
// //             );
// //         }
// //     }

// //     private _untrackMesh(mesh: AbstractMesh): void {
// //         const data = this._meshPositions.get(mesh);
// //         if (data) {
// //             // Restore original position property
// //             if (data.originalDescriptor) {
// //                 Object.defineProperty(mesh, "position", data.originalDescriptor);
// //             }
// //             this._meshPositions.delete(mesh);
// //         }
// //     }

// //     private _setMeshInternalPosition(mesh: AbstractMesh, position: Vector3): void {
// //         // Set mesh position directly using TransformNode's setter to bypass our override
// //         const data = this._meshPositions.get(mesh);
// //         if (data?.originalDescriptor?.set) {
// //             data.originalDescriptor.set.call(mesh, position);
// //         }
// //     }

// //     private _updateAllMeshRelativePositions(): void {
// //         this._meshPositions.forEach((trackingData, mesh) => {
// //             const relativePosition = trackingData.meshWorldPosition.subtract(this._worldPosition);
// //             this._setMeshInternalPosition(mesh, relativePosition);
// //         });
// //     }

// //     public override _getViewMatrix(): Matrix {
// //         // Always compute from origin (0,0,0) looking at relative target
// //         const cameraPosition = Vector3.Zero(); // Camera always at origin
// //         const target = this._currentTarget;
// //         const up = this.upVector;

// //         if (this.getScene().useRightHandedSystem) {
// //             Matrix.LookAtRHToRef(cameraPosition, target, up, this._viewMatrix);
// //         } else {
// //             Matrix.LookAtLHToRef(cameraPosition, target, up, this._viewMatrix);
// //         }

// //         return this._viewMatrix;
// //     }

// //     public override attachControl(noPreventDefault?: boolean): void {
// //         this.inputs.attachElement(noPreventDefault);
// //     }

// //     public override detachControl(): void {
// //         this.inputs.detachElement();
// //         this.cameraDirection.copyFromFloats(0, 0, 0);
// //         this.cameraRotation.copyFromFloats(0, 0);
// //     }

// //     public override dispose(): void {
// //         // Clean up mesh tracking
// //         this._meshPositions.forEach((data, mesh) => {
// //             this._untrackMesh(mesh);
// //         });
// //         this._meshPositions.clear();

// //         this.inputs.clear();
// //         super.dispose();
// //     }

// //     public override getClassName(): string {
// //         return "GeospatialCamera";
// //     }
// // }

// // RegisterClass("GeospatialCamera", GeospatialCamera);

// // =============================-===--======- -    -
// // Floating-Origin Geospatial Camera

// // This camera extends Camera directly to handle large real-world coordinates
// // by implementing a floating-origin system. The camera stays at (0,0,0) internally
// // while exposing real-world coordinate API to callers.

// // Features:
// // - Caller uses normal mesh.position and camera.position with real-world coords
// // - Internal camera stays at origin to avoid floating-point precision issues
// // - Automatically tracks and updates all meshes in the scene
// // - Full control over positioning without inheritance complexity
// // ===========================-===--======- -    -

// import { Vector3, Vector2, Matrix } from "core/Maths";
// import { Camera } from "./camera";
// import type { Scene } from "../scene";
// import { RegisterClass } from "core/Misc";
// import type { AbstractMesh } from "core/Meshes";
// import { GeospatialCameraInputsManager } from "./geospatialCameraInputsManager";

// type MeshTrackingData = {
//     meshWorldPosition: Vector3;
//     originalDescriptor: PropertyDescriptor | undefined;
// };

// /**
//  * GeospatialCamera extends Camera directly to provide floating-origin rendering
//  * for handling large real-world coordinate systems without precision loss.
//  *
//  * Usage:
//  * - Use camera.position normally with real-world coordinates
//  * - Use mesh.position normally with real-world coordinates
//  * - Camera automatically handles precision internally by staying at origin
//  * - All meshes are automatically tracked and positioned relative to camera
//  */
// export class GeospatialCamera extends Camera {
//     // Input management
//     public override inputs: GeospatialCameraInputsManager;

//     // Movement and rotation state
//     public cameraDirection = new Vector3(0, 0, 0);
//     public cameraRotation = new Vector2(0, 0);
//     public rotation = new Vector3(0, 0, 0);
//     public speed = 1000;
//     public override inertia = 0;

//     // Geospatial-specific properties
//     private _meshPositions = new Map<AbstractMesh, MeshTrackingData>();
//     private _worldPosition: Vector3 = new Vector3(); // Real-world position
//     private _worldTarget: Vector3 = new Vector3(); // Real-world target
//     private readonly _viewMatrix = Matrix.Zero();
//     private readonly _currentTarget = Vector3.Zero();

//     // Override position property to use real-world coordinates
//     public override get position(): Vector3 {
//         return this._worldPosition.clone();
//     }

//     public override set position(pos: Vector3) {
//         if (!this._worldPosition) {
//             return; // if this is happening in constructor of camera we can ignore
//         }
//         this._worldPosition.copyFrom(pos);
//         // Internal camera position stays at origin - this is key!
//         super.position.copyFromFloats(0, 0, 0);
//         this._updateAllMeshRelativePositions();
//         global.console.log(`GeospatialCamera position set to world: (${pos.x}, ${pos.y}, ${pos.z}), internal: (0, 0, 0)`);
//     }

//     constructor(name: string, position: Vector3, scene: Scene) {
//         super(name, Vector3.Zero(), scene); // Always create internal camera at origin

//         // Set up input management
//         this.inputs = new GeospatialCameraInputsManager(this);
//         this.inputs.addKeyboard().addMouse();

//         // Store initial world position
//         this._worldPosition.copyFrom(position);

//         // Camera settings for geospatial use
//         this.minZ = 0.5;
//         this.maxZ = 50000000;
//         this.fov = Math.PI / 3;

//         // Track existing meshes
//         for (const mesh of scene.meshes) {
//             this._trackMesh(mesh);
//         }

//         // Track new meshes
//         scene.onNewMeshAddedObservable.add((mesh) => {
//             this._trackMesh(mesh);
//         });

//         scene.onMeshRemovedObservable.add((mesh) => {
//             this._untrackMesh(mesh);
//         });
//     }

//     public setTarget(target: Vector3): void {
//         this._worldTarget.copyFrom(target);
//         const relativeTarget = this._worldTarget.subtract(this._worldPosition);
//         // Update internal target relative to origin
//         this._currentTarget.copyFrom(relativeTarget);
//         global.console.log(
//             `GeospatialCamera target set to world: (${target.x}, ${target.y}, ${target.z}), relative: (${relativeTarget.x}, ${relativeTarget.y}, ${relativeTarget.z})`
//         );
//     }

//     public getTarget(): Vector3 {
//         return this._worldTarget.clone();
//     }

//     /**
//      * Main input processing - this is where we intercept movement
//      */
//     public override _checkInputs(): void {
//         // Process inputs to get movement/rotation intent
//         this.inputs.checkInputs();

//         // Check if camera wants to move
//         const needToMove = this._decideIfNeedsToMove();

//         if (needToMove) {
//             global.console.log(`Movement detected: (${this.cameraDirection.x}, ${this.cameraDirection.y}, ${this.cameraDirection.z})`);

//             // Instead of moving camera, move all meshes in opposite direction
//             this._moveMeshesInsteadOfCamera(this.cameraDirection.clone());

//             // Update world position for our tracking
//             this._worldPosition.addInPlace(this.cameraDirection);

//             // Clear movement to prevent internal camera from moving
//             this.cameraDirection.copyFromFloats(0, 0, 0);
//         }

//         // Handle rotation normally (or intercept this too if needed)
//         if (this.cameraRotation.x !== 0 || this.cameraRotation.y !== 0) {
//             this.rotation.x += this.cameraRotation.x;
//             this.rotation.y += this.cameraRotation.y;

//             // Apply inertia to rotation
//             this.cameraRotation.scaleInPlace(this.inertia);
//         }

//         super._checkInputs();
//     }

//     private _decideIfNeedsToMove(): boolean {
//         return Math.abs(this.cameraDirection.x) > 0 || Math.abs(this.cameraDirection.y) > 0 || Math.abs(this.cameraDirection.z) > 0;
//     }

//     private _moveMeshesInsteadOfCamera(movement: Vector3): void {
//         const inverseMovement = movement.negate();

//         this._meshPositions.forEach((trackingData, mesh) => {
//             // Update mesh world position
//             trackingData.meshWorldPosition.addInPlace(inverseMovement);

//             // Set mesh to new relative position
//             const relativePosition = trackingData.meshWorldPosition.subtract(this._worldPosition);
//             this._setMeshInternalPosition(mesh, relativePosition);
//         });

//         global.console.log(`Moved ${this._meshPositions.size} meshes by (${inverseMovement.x}, ${inverseMovement.y}, ${inverseMovement.z})`);
//     }

//     private _trackMesh(mesh: AbstractMesh): void {
//         if (!this._meshPositions.has(mesh)) {
//             // Store mesh's world position and original property descriptor
//             const worldPosition = mesh.position.clone();
//             const originalDescriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(mesh), "position");

//             // Override mesh position property
//             Object.defineProperty(mesh, "position", {
//                 get: () => {
//                     const data = this._meshPositions.get(mesh);
//                     return data ? data.meshWorldPosition.clone() : Vector3.Zero();
//                 },
//                 set: (newPos: Vector3) => {
//                     const data = this._meshPositions.get(mesh);
//                     if (data) {
//                         data.meshWorldPosition.copyFrom(newPos);
//                         const relativePos = newPos.subtract(this._worldPosition);
//                         this._setMeshInternalPosition(mesh, relativePos);
//                     }
//                 },
//                 enumerable: true,
//                 configurable: true,
//             });

//             // Store tracking data
//             this._meshPositions.set(mesh, {
//                 meshWorldPosition: worldPosition,
//                 originalDescriptor,
//             });

//             // Set initial relative position
//             const relativePosition = worldPosition.subtract(this._worldPosition);
//             this._setMeshInternalPosition(mesh, relativePosition);

//             global.console.log(
//                 `Tracking mesh ${mesh.name} at world (${worldPosition.x}, ${worldPosition.y}, ${worldPosition.z}) -> relative (${relativePosition.x}, ${relativePosition.y}, ${relativePosition.z})`
//             );
//         }
//     }

//     private _untrackMesh(mesh: AbstractMesh): void {
//         const data = this._meshPositions.get(mesh);
//         if (data) {
//             // Restore original position property
//             if (data.originalDescriptor) {
//                 Object.defineProperty(mesh, "position", data.originalDescriptor);
//             }
//             this._meshPositions.delete(mesh);
//         }
//     }

//     private _setMeshInternalPosition(mesh: AbstractMesh, position: Vector3): void {
//         // Set mesh position directly using TransformNode's setter to bypass our override
//         const data = this._meshPositions.get(mesh);
//         if (data?.originalDescriptor?.set) {
//             data.originalDescriptor.set.call(mesh, position);
//         }
//     }

//     private _updateAllMeshRelativePositions(): void {
//         this._meshPositions.forEach((trackingData, mesh) => {
//             const relativePosition = trackingData.meshWorldPosition.subtract(this._worldPosition);
//             this._setMeshInternalPosition(mesh, relativePosition);
//         });
//     }

//     public override _getViewMatrix(): Matrix {
//         // Always compute from origin (0,0,0) looking at relative target
//         const cameraPosition = Vector3.Zero(); // Camera always at origin
//         const target = this._currentTarget;
//         const up = this.upVector;

//         if (this.getScene().useRightHandedSystem) {
//             Matrix.LookAtRHToRef(cameraPosition, target, up, this._viewMatrix);
//         } else {
//             Matrix.LookAtLHToRef(cameraPosition, target, up, this._viewMatrix);
//         }

//         return this._viewMatrix;
//     }

//     public override attachControl(noPreventDefault?: boolean): void {
//         this.inputs.attachElement(noPreventDefault);
//     }

//     public override detachControl(): void {
//         this.inputs.detachElement();
//         this.cameraDirection.copyFromFloats(0, 0, 0);
//         this.cameraRotation.copyFromFloats(0, 0);
//     }

//     public override dispose(): void {
//         // Clean up mesh tracking
//         this._meshPositions.forEach((data, mesh) => {
//             this._untrackMesh(mesh);
//         });
//         this._meshPositions.clear();

//         this.inputs.clear();
//         super.dispose();
//     }

//     public override getClassName(): string {
//         return "GeospatialCamera";
//     }
// }

// RegisterClass("GeospatialCamera", GeospatialCamera);

import { Camera } from "./camera";
import { Vector3, Matrix } from "../Maths/math.vector";
import type { Scene } from "../scene";
import { GeospatialCameraInputsManager } from "./geospatialCameraInputsManager";
import { TransformNode } from "core/Meshes";

export class GeospatialCamera extends Camera {
    // Input handling
    public override inputs: GeospatialCameraInputsManager;

    // Movement state (what inputs set)
    public cameraDirection = Vector3.Zero();
    public cameraRotation = Vector3.Zero();
    public rotation = new Vector3(0, 0, 0);

    // Speed and inertia
    public speed = 1.0;
    public override inertia = 0.9;

    // World tracking
    private _worldPosition: Vector3;
    private _worldTarget: Vector3;
    private _viewMatrix = Matrix.Zero();

    public _localDirection: Vector3;
    public _transformedDirection: Vector3;

    /** @internal */
    public readonly _cameraTransformMatrix = Matrix.Zero();
    /** @internal */
    public readonly _cameraRotationMatrix = Matrix.Zero();

    // Mesh tracking
    private _worldRoot: TransformNode;

    constructor(name: string, position: Vector3, scene: Scene) {
        super(name, Vector3.Zero(), scene); // Camera always at origin

        this._worldPosition = position.clone();
        this._worldTarget = position.add(new Vector3(0, 0, 150));

        // Set up inputs
        this.inputs = new GeospatialCameraInputsManager(this);
        this.inputs.addKeyboard().addMouse();

        // Create world root
        this._worldRoot = new TransformNode("worldRoot", scene);
        this._worldRoot.position = position.negate();

        // Parent all existing meshes
        scene.meshes.forEach((mesh) => {
            if (!mesh.parent) {
                mesh.parent = this._worldRoot;
            }
        });

        // Track when meshes are added/removed from scene
        this._scene.onNewMeshAddedObservable.add((mesh) => {
            if (!mesh.parent) {
                mesh.parent = this._worldRoot;
            }
        });
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
        // Don't update internal position - stays at origin

        // IMPORTANT: Force internal camera position to stay at origin
        if (super.position.x !== 0 || super.position.y !== 0 || super.position.z !== 0) {
            super.position.copyFromFloats(0, 0, 0);
        }

        // TODO use interception technique for position, xyz coordinates, setposition, getposition
    }

    public setTarget(target: Vector3): void {
        this._worldTarget.copyFrom(target);
    }

    public override _checkInputs(): void {
        if (!this._localDirection) {
            this._localDirection = Vector3.Zero();
            this._transformedDirection = Vector3.Zero();
        }
        // Let inputs populate cameraDirection/cameraRotation
        this.inputs.checkInputs();

        // Handle movement
        if (this.cameraDirection.lengthSquared() > 0) {
            // Update world position
            this._worldPosition.addInPlace(this.cameraDirection);

            // Move world instead of camera
            const inverseMove = this.cameraDirection.negate();
            this._worldRoot.position.addInPlace(inverseMove);

            // After moving meshes, apply inertia to cameraDirection
            if (this.inertia !== 0) {
                if (Math.abs(this.cameraDirection.x) < this.speed * 0.001) {
                    this.cameraDirection.x = 0;
                }
                if (Math.abs(this.cameraDirection.y) < this.speed * 0.001) {
                    this.cameraDirection.y = 0;
                }
                if (Math.abs(this.cameraDirection.z) < this.speed * 0.001) {
                    this.cameraDirection.z = 0;
                }
                this.cameraDirection.scaleInPlace(this.inertia);
            }
        }

        // // Handle rotation
        if (this.cameraRotation.lengthSquared() > 0) {
            this.rotation.x += this.cameraRotation.x;
            this.rotation.y += this.cameraRotation.y;
            this.cameraRotation.scaleInPlace(this.inertia);
        }

        // super._checkInputs();
    }

    public override _getViewMatrix(): Matrix {
        // Camera always at origin, looking at relative target
        const relativeTarget = this._worldTarget.subtract(this._worldPosition);
        Matrix.LookAtLHToRef(Vector3.Zero(), relativeTarget, this.upVector, this._viewMatrix);
        return this._viewMatrix;
    }

    // Methods
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
