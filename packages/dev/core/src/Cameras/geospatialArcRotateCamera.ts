// =============================-===--======- -    -
// Floating-Origin Geospatial Camera
//
// This camera extends UniversalCamera to handle large real-world coordinates
// by implementing a floating-origin system. The camera stays at (0,0,0) internally
// while exposing real-world coordinate API to callers.
//
// Features:
// - Caller uses normal mesh.position and camera.position with real-world coords
// - Internal camera stays at origin to avoid floating-point precision issues
// - Automatically tracks and updates all meshes in the scene
// - No entity concept - uses Babylon.js built-in node system
// ===========================-===--======- -    -

import { Vector3 } from "core/Maths";
import type { Scene } from "../scene";
// import { TransformNode } from "core/Meshes";
import { RegisterClass } from "core/Misc";
// import type { AbstractMesh } from "core/Meshes";
import { ArcRotateCamera } from "./arcRotateCamera";
// import type { AbstractMesh } from "core/Meshes";
// import type { Nullable } from "core/types";
// import { InterceptProperty } from "./hooks";
// type MeshTrackingData = {
//     meshCallerPosition: Vector3;
//     meshPositionRelativeToCamera: Vector3;
//     interceptToken: IDisposable;
// };
const RADIUS = 50; // Default radius for geospatial camera
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
export class GeospatialArcRotateCamera extends ArcRotateCamera {
    // private _lastAlpha: number = 0;
    // private _lastBeta: number = 0;
    // private _lastRadius: number = 0;

    // left handed vs right handed
    // can have constraints for v1

    // // Storage for meshes and their real-world / relative positions
    // private _meshPositions = new Map<AbstractMesh, MeshTrackingData>();

    // // The camera's real-world position (what caller sees)
    private _callerPosition: Vector3 = new Vector3();

    // // The camera's real-world target (what caller sees)
    // private _callerTarget: Vector3 = new Vector3();
    constructor(name: string, scene: Scene, setActiveOnSceneIfNoneActive?: boolean) {
        super(name, 0, 1, RADIUS * 3, Vector3.Zero(), scene, setActiveOnSceneIfNoneActive);
        this.lowerRadiusLimit = RADIUS + 1;
        this.upperRadiusLimit = RADIUS * 3; // Allow zooming out to 10x radius
        // this.panningDistanceLimit = RADIUS;
        // this.lowerTargetYLimit = RADIUS * 3;
        // const camera = new ArcRotateCamera("camera", 0, 1, 10, Vector3.Zero(), scene);

        // Initialize _callerPosition based on the camera's initial spherical position
        // The camera starts at alpha=0, beta=1, radius=RADIUS*3, target=Vector3.Zero()
        this._callerPosition = this.getInternalCameraPosition();
        global.console.log(this._callerPosition);
        // Store initial spherical coordinates for tracking changes
        // this._lastAlpha = this.alpha;
        // this._lastBeta = this.beta;
        // this._lastRadius = this.radius;
        // Enable high precision matrix calculations
        // scene.getEngine().getCreationOptions().useHighPrecisionMatrix = true;

        // Set camera presets for geospatial usage
        // this.touchAngularSensibility = 10000;
        this.inertia = 0;
        this.speed = 1000;
        this.minZ = 0.5;
        this.maxZ = 50000000;
        this.fov = Math.PI / 3; // 60 degrees - much wider field of view

        // Before each frame, update the floating-origin system
        // this._scene.onBeforeActiveMeshesEvaluationObservable.add(() => {
        //     this._updateFloatingOrigin();
        // });

        // // Track when meshes are added/removed from scene
        // this._scene.onNewMeshAddedObservable.add((mesh) => {
        //     this._trackMesh(mesh);
        // });

        // this._scene.onMeshRemovedObservable.add((mesh) => {
        //     const meshData = this._meshPositions.get(mesh);
        //     meshData && this._disposeMeshData(meshData);
        //     this._meshPositions.delete(mesh);
        // });

        // // Track existing meshes in scene
        // for (const mesh of this._scene.meshes) {
        //     this._trackMesh(mesh);
        // }
    }

    public getInternalCameraPosition(): Vector3 {
        // Calculate position from spherical coordinates
        const x = this.radius * Math.sin(this.beta) * Math.cos(this.alpha);
        const y = this.radius * Math.cos(this.beta);
        const z = this.radius * Math.sin(this.beta) * Math.sin(this.alpha);

        const target = super.getTarget(); // Get the internal target (should be at origin)
        return new Vector3(x + target.x, y + target.y, z + target.z);
    }

    // // Override the position getter to return world coordinates
    // public override get position(): Vector3 {
    //     if (!this._callerPosition) {
    //         this._callerPosition = Vector3.Zero();
    //     }

    //     // For ArcRotateCamera, we need to calculate world position differently
    //     // The "position" is where the camera would be in world space
    //     const internalPos = this.getInternalCameraPosition();
    //     const worldPosition = internalPos.add(this._callerPosition);

    //     return worldPosition;
    // }

    // // Override position property to use real-world coordinates
    // public override get position(): Vector3 {
    //     if (!this._callerPosition) {
    //         this._callerPosition = Vector3.Zero();
    //     }

    //     // global.console.log(
    //     //     `GeospatialCamera.GETPOSITION: world (caller) position (${this._callerPosition.x}, ${this._callerPosition.y}, ${this._callerPosition.z}) -> relative (${super.position.x}, ${super.position.y}, ${super.position.z})`
    //     // );
    //     return this._callerPosition.clone(); // Do I need to clone here?
    // }

    public override _updatePosition(): void {
        global.console.log(`GeospatialCamera.update POSITION:`);
        // Update the internal camera position based on the caller's position
        //super.position.copyFrom(this._callerPosition);
    }
    // public override set position(pos: Vector3) {
    //     // Store the camera's caller position (so that we can later return it when getPosition is called).
    //     // No actual camera position change (i.e. no change to super.position) - camera stays at origin (0,0,0)
    //     if (!this._callerPosition) {
    //         this._callerPosition = Vector3.Zero();
    //     }
    //     this._callerPosition.copyFrom(pos);

    //     global.console.log(
    //         `GeospatialCamera.setPosition: world (caller) position (${pos.x}, ${pos.y}, ${pos.z}) -> relative (${super.position.x}, ${super.position.y}, ${super.position.z})`
    //     );
    // }

    // // Override target methods to use real-world coordinates
    // public override getTarget(): Vector3 {
    //     global.console.log(
    //         `GeospatialCamera.getTarget: world (caller) target (${this._callerTarget.x}, ${this._callerTarget.y}, ${this._callerTarget.z}) -> relative (${super.getTarget().x}, ${super.getTarget().y}, ${super.getTarget().z})`
    //     );
    //     return this._callerTarget.clone();
    // }

    // public override setTarget(target: Vector3): void {
    //     // Initialize _worldTarget if it doesn't exist yet (during construction)
    //     if (!this._callerTarget) {
    //         this._callerTarget = new Vector3();
    //     }
    //     this._callerTarget.copyFrom(target);
    //     // Set the actual camera target relative to origin
    //     const relativeTarget = this._callerTarget.subtract(this._callerPosition);
    //     global.console.log(
    //         `GeospatialCamera.setTarget: world (caller) target (${target.x}, ${target.y}, ${target.z}) -> relative(send to super) (${relativeTarget.x}, ${relativeTarget.y}, ${relativeTarget.z})`
    //     );
    //     super.setTarget(relativeTarget);
    // }

    // public override _checkInputs(): void {
    //     // Store previous values
    //     this._lastAlpha = this.alpha;
    //     this._lastBeta = this.beta;
    //     this._lastRadius = this.radius;

    //     // Let ArcRotateCamera process inputs
    //     this.inputs.checkInputs();

    //     // Check if camera parameters changed
    //     const alphaChanged = Math.abs(this.alpha - this._lastAlpha) > 0.001;
    //     const betaChanged = Math.abs(this.beta - this._lastBeta) > 0.001;
    //     const radiusChanged = Math.abs(this.radius - this._lastRadius) > 0.001;

    //     if (alphaChanged || betaChanged || radiusChanged) {
    //         global.console.log(`ArcRotate change: alpha=${this.alpha}, beta=${this.beta}, radius=${this.radius}`);

    //         // Calculate the effective camera movement
    //         const oldPos = this._getPositionFromSpherical(this._lastAlpha, this._lastBeta, this._lastRadius);
    //         const newPos = this._getPositionFromSpherical(this.alpha, this.beta, this.radius);
    //         const movement = newPos.subtract(oldPos);

    //         // Move meshes instead of camera
    //         this._moveMeshesInsteadOfCamera(movement);

    //         // Reset camera parameters to prevent actual movement
    //         this.alpha = this._lastAlpha;
    //         this.beta = this._lastBeta;
    //         this.radius = this._lastRadius;
    //     }

    //     // Don't call super._checkInputs() to prevent actual camera movement
    //     // super._checkInputs();
    // }

    // private _getPositionFromSpherical(alpha: number, beta: number, radius: number): Vector3 {
    //     const x = radius * Math.sin(beta) * Math.cos(alpha);
    //     const y = radius * Math.cos(beta);
    //     const z = radius * Math.sin(beta) * Math.sin(alpha);
    //     return new Vector3(x, y, z);
    // }
    // private _moveMeshesInsteadOfCamera(cameraDirection: Vector3): void {
    //     // Move all tracked meshes in the opposite direction
    //     const inverseMoveDirection = cameraDirection.negate();
    //     const cameraDisplacement = this._callerPosition.subtract(inverseMoveDirection);
    //     global.console.log(
    //         `GeospatialCamera._moveMeshesInsteadOfCamera: inverseMoveDirection = (${inverseMoveDirection.x}, ${inverseMoveDirection.y}, ${inverseMoveDirection.z})
    //             and relativeCamPos = (${cameraDisplacement.x}, ${cameraDisplacement.y}, ${cameraDisplacement.z})`
    //     );

    //     this._callerPosition.addInPlace(inverseMoveDirection);
    //     this._meshPositions.forEach((trackingData, mesh) => {
    //         // Update the world position of each mesh
    //         const newWorldPosition = trackingData.meshCallerPosition.add(inverseMoveDirection);

    //         // // Update our tracking data
    //         // trackingData.meshCallerPosition.copyFrom(newWorldPosition);
    //         // trackingData.meshPositionRelativeToCamera = this._calculateRelativePosition(newWorldPosition);

    //         // Trigger position update by calling the mesh's position setter
    //         // This will automatically update the internal position via our intercepted property
    //         mesh.position = newWorldPosition;
    //         //            Object.getOwnPropertyDescriptor(TransformNode.prototype, "position")!.set!.call(mesh, newWorldPosition);

    //         global.console.log(
    //             `_moveMeshesInsteadOfCamera ${mesh.name} -- (inverseMoveDirection: ${inverseMoveDirection.x}, ${inverseMoveDirection.y}, ${inverseMoveDirection.z})
    //             -- newWorldPosition: (${newWorldPosition.x}, ${newWorldPosition.y}, ${newWorldPosition.z})
    //             -- relativePosition: (${trackingData.meshPositionRelativeToCamera.x}, ${trackingData.meshPositionRelativeToCamera.y}, ${trackingData.meshPositionRelativeToCamera.z})
    //             -> relative(send to super) (${trackingData.meshPositionRelativeToCamera.x}, ${trackingData.meshPositionRelativeToCamera.y}, ${trackingData.meshPositionRelativeToCamera.z})`
    //         );
    //     });

    //     global.console.log(`Moved ${this._meshPositions.size} meshes instead of camera`);
    // }
    // /**
    //  * Track a mesh and store its world position when it changes
    //  * @param mesh The mesh to track
    //  */
    // private _trackMesh(mesh: AbstractMesh): void {
    //     // Store initial world position if not already tracked
    //     if (!this._meshPositions.has(mesh)) {
    //         const callerPosition = mesh.position.clone();

    //         const interceptToken: Nullable<IDisposable> = InterceptProperty(mesh, "position", {
    //             valToSet: (set: Vector3) => {
    //                 return this._handleSetMeshPosition(mesh, set);
    //             },
    //             valToGet: () => {
    //                 return this._handleGetMeshPosition(mesh);
    //             },
    //         });

    //         const relativePosition = this._calculateRelativePosition(callerPosition);
    //         this._meshPositions.set(mesh, {
    //             meshCallerPosition: callerPosition,
    //             meshPositionRelativeToCamera: relativePosition,
    //             interceptToken,
    //         });
    //         global.console.log(
    //             `MESH.: mesh.name (${mesh.name},
    //                 world(caller) position (${callerPosition.x}, ${callerPosition.y}, ${callerPosition.z}) -> relative (${relativePosition.x}, ${relativePosition.y}, ${relativePosition.z})`
    //         );
    //     }
    // }

    // private _handleGetMeshPosition(mesh: AbstractMesh): Vector3 {
    //     const trackingData = this._meshPositions.get(mesh);
    //     if (trackingData) {
    //         global.console.log(
    //             `GETPOSITION MESH.: mesh.name (${mesh.name},
    //             world(caller) position (${trackingData.meshCallerPosition.x}, ${trackingData.meshCallerPosition.y}, ${trackingData.meshCallerPosition.z}) -> relative (${trackingData.meshPositionRelativeToCamera.x}, ${trackingData.meshPositionRelativeToCamera.y}, ${trackingData.meshPositionRelativeToCamera.z})`
    //         );

    //         return trackingData.meshCallerPosition.clone();
    //     }
    //     // If not tracked, return the mesh's current position

    //     return mesh.position.clone();
    // }
    // private _handleSetMeshPosition(mesh: AbstractMesh, newPosition: Vector3): Vector3 {
    //     const trackingData = this._meshPositions.get(mesh);
    //     const relativePosition = this._calculateRelativePosition(newPosition);
    //     if (trackingData) {
    //         trackingData.meshCallerPosition.copyFrom(newPosition);
    //         trackingData.meshPositionRelativeToCamera.copyFrom(relativePosition);
    //         global.console.log(
    //             `SETPOSITION MESH.: mesh.name (${mesh.name},
    //             world(caller) position (${trackingData.meshCallerPosition.x}, ${trackingData.meshCallerPosition.y}, ${trackingData.meshCallerPosition.z}) -> relative (${trackingData.meshPositionRelativeToCamera.x}, ${trackingData.meshPositionRelativeToCamera.y}, ${trackingData.meshPositionRelativeToCamera.z})`
    //         );
    //     }

    //     return relativePosition;
    // }

    // private _calculateRelativePosition(meshCallerPosition: Vector3): Vector3 {
    //     return meshCallerPosition.subtract(this._callerPosition);
    // }

    // private _disposeMeshData(data: MeshTrackingData): void {
    //     data.interceptToken.dispose();
    // }
}

RegisterClass("GeospatialArcRotateCamera", GeospatialArcRotateCamera);
