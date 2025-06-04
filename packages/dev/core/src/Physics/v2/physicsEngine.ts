import type { Nullable } from "../../types";
import { Quaternion, Vector3 } from "../../Maths/math.vector";
import type { IPhysicsEngine } from "../IPhysicsEngine";
import { PhysicsShapeType, type IPhysicsEnginePluginV2 } from "./IPhysicsEnginePlugin";
import type { IRaycastQuery } from "../physicsRaycastResult";
import { PhysicsRaycastResult } from "../physicsRaycastResult";
import { _WarnImport } from "../../Misc/devTools";
import type { PhysicsBody } from "./physicsBody";
import { HavokPlugin } from "./Plugins";
import { AbstractMesh } from "core/Meshes";
import { PhysicsShape } from "./physicsShape";
import { ShapeCastResult } from "../shapeCastResult";

/**
 * Class used to control physics engine
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
export class PhysicsEngine implements IPhysicsEngine {
    /** @internal */
    private _physicsBodies: Array<PhysicsBody> = [];
    private _subTimeStep: number = 0;

    /**
     * Gets the gravity vector used by the simulation
     */
    public gravity: Vector3;

    /**
     *
     * @returns physics plugin version
     */
    public getPluginVersion(): number {
        return this._physicsPlugin.getPluginVersion();
    }
    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Factory used to create the default physics plugin.
     * @returns The default physics plugin
     */
    public static DefaultPluginFactory(): IPhysicsEnginePluginV2 {
        throw _WarnImport("");
    }

    /**
     * Creates a new Physics Engine
     * @param gravity defines the gravity vector used by the simulation
     * @param _physicsPlugin defines the plugin to use (CannonJS by default)
     */
    constructor(
        gravity: Nullable<Vector3>,
        private _physicsPlugin: IPhysicsEnginePluginV2 = PhysicsEngine.DefaultPluginFactory()
    ) {
        gravity = gravity || new Vector3(0, -9.807, 0);
        this.setGravity(gravity);
        this.setTimeStep();
    }

    /**
     * Sets the gravity vector used by the simulation
     * @param gravity defines the gravity vector to use
     */
    public setGravity(gravity: Vector3): void {
        this.gravity = gravity;
        this._physicsPlugin.setGravity(this.gravity);
    }

    /**
     * Set the time step of the physics engine.
     * Default is 1/60.
     * To slow it down, enter 1/600 for example.
     * To speed it up, 1/30
     * Unit is seconds.
     * @param newTimeStep defines the new timestep to apply to this world.
     */
    public setTimeStep(newTimeStep: number = 1 / 60) {
        this._physicsPlugin.setTimeStep(newTimeStep);
    }

    /**
     * Get the time step of the physics engine.
     * @returns the current time step
     */
    public getTimeStep(): number {
        return this._physicsPlugin.getTimeStep();
    }

    /**
     * Set the sub time step of the physics engine.
     * Default is 0 meaning there is no sub steps
     * To increase physics resolution precision, set a small value (like 1 ms)
     * @param subTimeStep defines the new sub timestep used for physics resolution.
     */
    public setSubTimeStep(subTimeStep: number = 0) {
        this._subTimeStep = subTimeStep;
    }

    /**
     * Get the sub time step of the physics engine.
     * @returns the current sub time step
     */
    public getSubTimeStep() {
        return this._subTimeStep;
    }

    /**
     * Release all resources
     */
    public dispose(): void {
        this._physicsPlugin.dispose();
    }

    /**
     * Gets the name of the current physics plugin
     * @returns the name of the plugin
     */
    public getPhysicsPluginName(): string {
        return this._physicsPlugin.name;
    }

    /**
     * Set the maximum allowed linear and angular velocities
     * @param maxLinearVelocity maximum allowed linear velocity
     * @param maxAngularVelocity maximum allowed angular velocity
     */
    setVelocityLimits(maxLinearVelocity: number, maxAngularVelocity: number): void {
        this._physicsPlugin.setVelocityLimits(maxLinearVelocity, maxAngularVelocity);
    }

    /**
     * @returns maximum allowed linear velocity
     */
    getMaxLinearVelocity(): number {
        return this._physicsPlugin.getMaxLinearVelocity();
    }

    /**
     * @returns maximum allowed angular velocity
     */
    getMaxAngularVelocity(): number {
        return this._physicsPlugin.getMaxAngularVelocity();
    }

    /**
     * Adding a new impostor for the impostor tracking.
     * This will be done by the impostor itself.
     * @param impostor the impostor to add
     */

    /**
     * Called by the scene. No need to call it.
     * @param delta defines the timespan between frames
     */
    public _step(delta: number) {
        if (delta > 0.1) {
            delta = 0.1;
        } else if (delta <= 0) {
            delta = 1.0 / 60.0;
        }

        this._physicsPlugin.executeStep(delta, this._physicsBodies);
    }

    /**
     * Add a body as an active component of this engine
     * @param physicsBody The body to add
     */
    public addBody(physicsBody: PhysicsBody): void {
        this._physicsBodies.push(physicsBody);
    }
    /**
     * Removes a particular body from this engine
     * @param physicsBody The body to remove from the simulation
     */
    public removeBody(physicsBody: PhysicsBody): void {
        const index = this._physicsBodies.indexOf(physicsBody);
        if (index > -1) {
            /*const removed =*/ this._physicsBodies.splice(index, 1);
        }
    }
    /**
     * @returns an array of bodies added to this engine
     */
    public getBodies(): Array<PhysicsBody> {
        return this._physicsBodies;
    }

    /**
     * Gets the current plugin used to run the simulation
     * @returns current plugin
     */
    public getPhysicsPlugin(): IPhysicsEnginePluginV2 {
        return this._physicsPlugin;
    }

    /**
     * Does a raycast in the physics world
     * @param from when should the ray start?
     * @param to when should the ray end?
     * @param result resulting PhysicsRaycastResult
     * @param query raycast query object
     */
    public raycastToRef(from: Vector3, to: Vector3, result: PhysicsRaycastResult, query?: IRaycastQuery): void {
        this._physicsPlugin.raycast(from, to, result, query);
    }

    /**
     * Does a raycast in the physics world
     * @param from when should the ray start?
     * @param to when should the ray end?
     * @param query raycast query object
     * @returns PhysicsRaycastResult
     */
    public raycast(from: Vector3, to: Vector3, query?: IRaycastQuery): PhysicsRaycastResult {
        const result = new PhysicsRaycastResult();
        this._physicsPlugin.raycast(from, to, result, query);
        return result;
    }

    public physicsDataForMoveWithCollisions: Map<AbstractMesh, PhysicsShape> | undefined;

    private createPhysicsShapeOfMeshIfApplicable(mesh: AbstractMesh): void {
        if (mesh.checkCollisions && mesh.isEnabled() && mesh.subMeshes) {
            const shape = new PhysicsShape({ type: PhysicsShapeType.MESH, parameters: mesh.getFacetDataParameters() }, mesh.getScene());
            shape.filterCollideMask = mesh.collisionMask;
            this.physicsDataForMoveWithCollisions?.set(mesh, shape);
        }
    }

    public moveWithCollisions(mesh: AbstractMesh, displacement: Vector3): boolean {
        if (!this.physicsDataForMoveWithCollisions || this.getPhysicsPluginName() !== "HavokPlugin") {
            // Throw
            return false;
        }
        const plugin = this.getPhysicsPlugin() as HavokPlugin;
        const associatedShape = this.physicsDataForMoveWithCollisions.get(mesh);
        if (!associatedShape) {
            // If there is no associated shape, that means this mesh is not setup to checkCollisions or is not enabled, thus we can move freely
            mesh.position.addInPlace(displacement);
            return true; // successfully moved the mesh
        }

        // Check for collisions
        const shapeLocalResult = new ShapeCastResult();
        const hitWorldResult = new ShapeCastResult();
        plugin.shapeCast(
            {
                shape: associatedShape,
                rotation: mesh.rotationQuaternion || new Quaternion(), // fix
                startPosition: mesh.getAbsolutePosition(),
                endPosition: mesh.position.add(displacement),
                shouldHitTriggers: false,
            },
            shapeLocalResult,
            hitWorldResult
        );

        // If collision is detected, only move mesh by the allowed fraction of the displacement
        if (hitWorldResult.hasHit) {
            const buffer = 0.01; // small buffer to avoid surface overlap
            const castLength = displacement.length();

            // Ask cedric about hitworld vs shapelocal
            const safeFraction = Math.max(0, hitWorldResult.hitFraction - buffer / castLength); // adjust hitFraction by buffer
            const safeMove = displacement.scale(safeFraction);

            mesh.position.addInPlace(safeMove);
        } else {
            mesh.position.addInPlace(displacement);
        }

        return true; // successfully moved the mesh
    }

    public enablePhysicsForMoveWithCollisions(meshes: AbstractMesh[]): boolean {
        // Helper to dispose of all physicsShapes and plugin and clear the map
        const cleanup = () => {
            this.physicsDataForMoveWithCollisions?.forEach((shape) => shape.dispose());
            this.physicsDataForMoveWithCollisions?.clear();
            this.physicsDataForMoveWithCollisions = undefined; // does this also dispose of the vars inside?
        };

        // If this is the first time the function is called, create the map to hold the physicsShapes and setup the observers for adding/removing meshes and disposing of the scene
        if (this.physicsDataForMoveWithCollisions === undefined) {
            // Ensures that 'get physiccsEnabledForMoveWithCollisions' flag returns true and will be used within moveWithCollisions method
            this.physicsDataForMoveWithCollisions = new Map<AbstractMesh, PhysicsShape>();

            // scene.onNewMeshAddedObservable.add(this.createPhysicsShapeOfMeshIfApplicable);

            // // Dispose the associated physicsShape and remove it from the map
            // scene.onMeshRemovedObservable.add((mesh: AbstractMesh) => {
            //     const shape = this.physicsDataForMoveWithCollisions?.get(mesh);
            //     shape?.dispose();
            //     this.physicsDataForMoveWithCollisions?.delete(mesh);
            // });

            // // Dispose all physicsShapes and clear the map itself
            // scene.onDisposeObservable.add(cleanup);
        }

        // Any time this function is called, reset the map and recreate the physics bodies
        cleanup();
        this.physicsDataForMoveWithCollisions = new Map<AbstractMesh, PhysicsShape>();
        meshes.forEach((mesh: AbstractMesh) => this.createPhysicsShapeOfMeshIfApplicable(mesh));
        return true; // successfully enabled physics for move with collisions
    }
}
