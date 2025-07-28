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
import { UniversalCamera } from "./universalCamera";
import type { Scene } from "../scene";
import { TransformNode } from "core/Meshes";
import { RegisterClass } from "core/Misc";
import type { AbstractMesh } from "core/Meshes";

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
export class GeospatialCamera extends UniversalCamera {
    // Storage for meshes and their real-world positions
    private _meshWorldPositions = new Map<AbstractMesh, Vector3>();

    // The camera's real-world position (what caller sees)
    private _worldPosition: Vector3 = new Vector3();

    // The camera's real-world target (what caller sees)
    private _worldTarget: Vector3 = new Vector3();

    // Override position property to use real-world coordinates
    public override get position(): Vector3 {
        return this._worldPosition.clone();
    }

    public override set position(pos: Vector3) {
        // Initialize _worldPosition if it doesn't exist yet (during construction)
        if (!this._worldPosition) {
            this._worldPosition = new Vector3();
        }
        this._worldPosition.copyFrom(pos);
        // Camera's actual position stays at origin - this is the key insight!
        // super.position remains at (0,0,0) always
    }

    // Override target methods to use real-world coordinates
    public override getTarget(): Vector3 {
        return this._worldTarget.clone();
    }

    public override setTarget(target: Vector3): void {
        // Initialize _worldTarget if it doesn't exist yet (during construction)
        if (!this._worldTarget) {
            this._worldTarget = new Vector3();
        }
        this._worldTarget.copyFrom(target);
        // Set the actual camera target relative to origin
        const relativeTarget = this._worldTarget.subtract(this._worldPosition);
        global.console.log(
            `GeospatialCamera.setTarget: world target (${target.x}, ${target.y}, ${target.z}) -> relative (${relativeTarget.x}, ${relativeTarget.y}, ${relativeTarget.z})`
        );
        super.setTarget(relativeTarget);
    }

    /**
     * Set the camera target using internal relative coordinates (for debugging/testing)
     * @param target The target position in internal coordinate space
     */
    public setInternalTarget(target: Vector3): void {
        global.console.log(`GeospatialCamera.setInternalTarget: setting internal target to (${target.x}, ${target.y}, ${target.z})`);
        // Clear the world target to prevent _updateFloatingOrigin from overriding this
        this._worldTarget = Vector3.Zero();
        super.setTarget(target);

        // Force update the view matrix immediately
        this.getViewMatrix(true);
        global.console.log(`GeospatialCamera.setInternalTarget: view matrix updated, forward vector should now point to target`);
    }

    /**
     * Force the camera to look at a target by directly setting rotation (alternative method)
     * @param target The target position in internal coordinate space
     */
    public forceDirectLookAt(target: Vector3): void {
        global.console.log(`GeospatialCamera.forceDirectLookAt: forcing camera to look at (${target.x}, ${target.y}, ${target.z})`);

        // Clear the world target to prevent _updateFloatingOrigin from overriding this
        this._worldTarget = Vector3.Zero();

        // Calculate the direction from camera to target
        const direction = target.subtract(this.position);
        direction.normalize();

        // Calculate rotation angles
        const alpha = Math.atan2(direction.x, direction.z);
        const beta = Math.asin(direction.y);

        // Set the rotation directly
        this.rotation.x = beta;
        this.rotation.y = alpha;
        this.rotation.z = 0;

        global.console.log(`GeospatialCamera.forceDirectLookAt: set rotation to (${this.rotation.x}, ${this.rotation.y}, ${this.rotation.z})`);

        // Force update the view matrix
        this.getViewMatrix(true);

        // Verify the forward vector
        const forward = this.getForwardRay().direction;
        global.console.log(`GeospatialCamera.forceDirectLookAt: forward vector is now (${forward.x.toFixed(3)}, ${forward.y.toFixed(3)}, ${forward.z.toFixed(3)})`);
    }
    constructor(name: string, position: Vector3, scene: Scene) {
        super(name, Vector3.Zero(), scene);

        // Store the initial world position
        this._worldPosition.copyFrom(position);

        // Enable high precision matrix calculations
        scene.getEngine().getCreationOptions().useHighPrecisionMatrix = true;

        // Set camera presets for geospatial usage
        this.touchAngularSensibility = 10000;
        this.inertia = 0;
        this.speed = 1000;
        this.keysUp.push(87); // W
        this.keysDown.push(83); // S
        this.keysLeft.push(65); // A
        this.keysRight.push(68); // D
        this.keysUpward.push(69); // E
        this.keysDownward.push(81); // Q
        this.minZ = 0.5;
        this.maxZ = 50000000;
        this.fov = Math.PI / 3; // 60 degrees - much wider field of view

        // Before each frame, update the floating-origin system
        this._scene.onBeforeActiveMeshesEvaluationObservable.add(() => {
            this._updateFloatingOrigin();
        });

        // Track when meshes are added/removed from scene
        this._scene.onNewMeshAddedObservable.add((mesh) => {
            this._trackMesh(mesh);
        });

        this._scene.onMeshRemovedObservable.add((mesh) => {
            this._meshWorldPositions.delete(mesh);
        });

        // Track existing meshes in scene
        for (const mesh of this._scene.meshes) {
            this._trackMesh(mesh);
        }
    }

    /**
     * Track a mesh and store its world position when it changes
     * @param mesh The mesh to track
     */
    private _trackMesh(mesh: AbstractMesh): void {
        // Store initial world position if not already tracked
        if (!this._meshWorldPositions.has(mesh)) {
            this._meshWorldPositions.set(mesh, mesh.position.clone());
        }
    }

    /**
     * Override a mesh's position property to use world coordinates
     * This should be called after the mesh is fully loaded and positioned
     * @param mesh The mesh to override
     */
    public overrideMeshPosition(mesh: AbstractMesh): void {
        if (!this._meshWorldPositions.has(mesh)) {
            this._meshWorldPositions.set(mesh, mesh.position.clone());
        }

        const worldPosition = this._meshWorldPositions.get(mesh)!;

        // One-time debug log when we override
        global.console.log(`OVERRIDE: Mesh ${mesh.name} world position stored as: ${worldPosition.x}, ${worldPosition.y}, ${worldPosition.z}`);

        // IMPORTANT: Immediately set the mesh to its correct relative position
        const relativePosition = worldPosition.subtract(this._worldPosition);
        global.console.log(`OVERRIDE: Setting ${mesh.name} initial relative position to: ${relativePosition.x}, ${relativePosition.y}, ${relativePosition.z}`);

        // Set the actual mesh position using TransformNode directly (before we override the property)
        Object.getOwnPropertyDescriptor(TransformNode.prototype, "position")!.set!.call(mesh, relativePosition);

        Object.defineProperty(mesh, "position", {
            get: () => {
                return worldPosition.clone();
            },
            set: (pos: Vector3) => {
                worldPosition.copyFrom(pos);
                this._meshWorldPositions.set(mesh, worldPosition);
                // The actual positioning will be handled in _updateFloatingOrigin
            },
            enumerable: true,
            configurable: true,
        });
    }

    /**
     * Update the floating-origin system each frame
     */
    private _updateFloatingOrigin(): void {
        // Handle camera movement from UniversalCamera controls
        // Check the actual camera position (not our overridden world position)
        const actualCameraPos = super.position;
        if (!actualCameraPos.equalsToFloats(0, 0, 0)) {
            // Accumulate movement to world position
            this._worldPosition.addInPlace(actualCameraPos);
            // Reset camera back to origin - this keeps the camera at (0,0,0) always
            super.position.set(0, 0, 0);
        }

        // Update all tracked meshes relative to camera world position
        for (const [mesh, worldPos] of this._meshWorldPositions) {
            if (mesh.isDisposed()) {
                this._meshWorldPositions.delete(mesh);
                continue;
            }

            // Calculate mesh position relative to camera world position
            // This is the secret: mesh appears at worldPos to user, but actually renders at relative position
            const relativePosition = worldPos.subtract(this._worldPosition);

            // Set the actual mesh position (bypass our overridden property)
            Object.getOwnPropertyDescriptor(TransformNode.prototype, "position")!.set!.call(mesh, relativePosition);
        }

        // Update target relative to new camera position
        if (!this._worldTarget.equals(Vector3.Zero())) {
            const relativeTarget = this._worldTarget.subtract(this._worldPosition);
            // Set the internal camera target directly to the relative position
            super.setTarget(relativeTarget);
        }
    }

    public getMeshWorldPosition(mesh: AbstractMesh): Vector3 {
        const worldPos = this._meshWorldPositions.get(mesh);
        return worldPos ? worldPos.clone() : mesh.position.clone();
    }

    /**
     * Set a mesh's world position (real-world coordinates)
     * @param mesh The mesh to set position for
     * @param position The world position to set
     */
    public setMeshWorldPosition(mesh: AbstractMesh, position: Vector3): void {
        if (!this._meshWorldPositions.has(mesh)) {
            this._trackMesh(mesh);
        }
        mesh.position = position; // This will trigger our overridden setter
    }

    /**
     * Get the camera's internal position (for debugging)
     * @returns The camera's actual internal position used for rendering
     */
    public getInternalPosition(): Vector3 {
        return super.position.clone();
    }

    /**
     * Debug method to get current camera world position
     * @returns The camera's world position
     */
    public getCameraWorldPosition(): Vector3 {
        return this._worldPosition.clone();
    }

    /**
     * Debug method to manually test position calculation
     * @param worldPos World position of mesh
     * @returns What the relative position should be
     */
    public calculateRelativePosition(worldPos: Vector3): Vector3 {
        return worldPos.subtract(this._worldPosition);
    }
}

RegisterClass("GeospatialCamera", GeospatialCamera);
