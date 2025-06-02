import type { Nullable } from "../types";
import { Logger } from "../Misc/logger";
import { Observable } from "../Misc/observable";
import { Quaternion, type Vector3 } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import type { ISceneComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";
import { Scene } from "../scene";
import type { IPhysicsEngine } from "./IPhysicsEngine";
import type { IPhysicsEnginePlugin as IPhysicsEnginePluginV1 } from "./v1/IPhysicsEnginePlugin";
import { PhysicsShapeType, type IPhysicsEnginePluginV2 } from "./v2/IPhysicsEnginePlugin";
import { PhysicsEngine as PhysicsEngineV1 } from "./v1/physicsEngine";
import { PhysicsEngine as PhysicsEngineV2 } from "./v2/physicsEngine";
import { HavokPlugin, PhysicsShape } from "./v2";
import { ShapeCastResult } from "./shapeCastResult";

declare module "../scene" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal (Backing field) */
        _physicsEngine: Nullable<IPhysicsEngine>;
        /** @internal */
        _physicsTimeAccumulator: number;

        /**
         * Gets the current physics engine
         * @returns a IPhysicsEngine or null if none attached
         */
        getPhysicsEngine(): Nullable<IPhysicsEngine>;

        /**
         * Enables physics to the current scene
         * @param gravity defines the scene's gravity for the physics engine. defaults to real earth gravity : (0, -9.81, 0)
         * @param plugin defines the physics engine to be used. defaults to CannonJS.
         * @returns a boolean indicating if the physics engine was initialized
         */
        enablePhysics(gravity?: Nullable<Vector3>, plugin?: IPhysicsEnginePluginV1 | IPhysicsEnginePluginV2): boolean;

        /**
         * Disables and disposes the physics engine associated with the scene
         */
        disablePhysicsEngine(): void;

        /**
         * Gets a boolean indicating if there is an active physics engine
         * @returns a boolean indicating if there is an active physics engine
         */
        isPhysicsEnabled(): boolean;

        /**
         * Deletes a physics compound impostor
         * @param compound defines the compound to delete
         */
        deleteCompoundImpostor(compound: any): void;

        /**
         * An event triggered when physic simulation is about to be run
         */
        onBeforePhysicsObservable: Observable<Scene>;

        /**
         * An event triggered when physic simulation has been done
         */
        onAfterPhysicsObservable: Observable<Scene>;
    }
}

/**
 * Gets the current physics engine
 * @returns a IPhysicsEngine or null if none attached
 */
Scene.prototype.getPhysicsEngine = function (): Nullable<IPhysicsEngine> {
    return this._physicsEngine;
};

/**
 * Enables physics to the current scene
 * @param gravity defines the scene's gravity for the physics engine
 * @param plugin defines the physics engine to be used. defaults to CannonJS.
 * @returns a boolean indicating if the physics engine was initialized
 */
Scene.prototype.enablePhysics = function (gravity: Nullable<Vector3> = null, plugin?: IPhysicsEnginePluginV1 | IPhysicsEnginePluginV2): boolean {
    if (this._physicsEngine) {
        return true;
    }

    // Register the component to the scene
    let component = this._getComponent(SceneComponentConstants.NAME_PHYSICSENGINE) as PhysicsEngineSceneComponent;
    if (!component) {
        component = new PhysicsEngineSceneComponent(this);
        this._addComponent(component);
    }

    try {
        if (!plugin || plugin?.getPluginVersion() === 1) {
            this._physicsEngine = new PhysicsEngineV1(gravity, plugin as IPhysicsEnginePluginV1);
        } else if (plugin?.getPluginVersion() === 2) {
            this._physicsEngine = new PhysicsEngineV2(gravity, plugin as IPhysicsEnginePluginV2);
        } else {
            throw new Error("Unsupported Physics plugin version.");
        }
        this._physicsTimeAccumulator = 0;
        return true;
    } catch (e) {
        Logger.Error(e.message);
        return false;
    }
};

/**
 * Disables and disposes the physics engine associated with the scene
 */
Scene.prototype.disablePhysicsEngine = function (): void {
    if (!this._physicsEngine) {
        return;
    }

    this._physicsEngine.dispose();
    this._physicsEngine = null;
};

/**
 * Gets a boolean indicating if there is an active physics engine
 * @returns a boolean indicating if there is an active physics engine
 */
Scene.prototype.isPhysicsEnabled = function (): boolean {
    return this._physicsEngine !== undefined;
};

/**
 * Deletes a physics compound impostor
 * @param compound defines the compound to delete
 */
Scene.prototype.deleteCompoundImpostor = function (compound: any): void {
    const mesh: AbstractMesh = compound.parts[0].mesh;

    if (mesh.physicsImpostor) {
        mesh.physicsImpostor.dispose(/*true*/);
        mesh.physicsImpostor = null;
    }
};

/**
 * @internal
 */
Scene.prototype._advancePhysicsEngineStep = function (step: number) {
    if (this._physicsEngine) {
        const subTime = this._physicsEngine.getSubTimeStep();
        if (subTime > 0) {
            this._physicsTimeAccumulator += step;
            while (this._physicsTimeAccumulator > subTime) {
                this.onBeforePhysicsObservable.notifyObservers(this);
                this._physicsEngine._step(subTime / 1000);
                this.onAfterPhysicsObservable.notifyObservers(this);
                this._physicsTimeAccumulator -= subTime;
            }
        } else {
            this.onBeforePhysicsObservable.notifyObservers(this);
            this._physicsEngine._step(step / 1000);
            this.onAfterPhysicsObservable.notifyObservers(this);
        }
    }
};

/**
 * @internal
 */
AbstractMesh.prototype.moveWithCollisionsPhysicsEnabled = function (data: { map: Map<AbstractMesh, PhysicsShape>; plugin: HavokPlugin }, displacement: Vector3): AbstractMesh {
    const associatedShape = data.map.get(this);
    if (!associatedShape) {
        // If there is no associated shape, that means this mesh is not setup to checkCollisions or is not enabled, thus we can move freely
        this.position.addInPlace(displacement);
        return this;
    }

    // Check for collisions
    const shapeLocalResult = new ShapeCastResult();
    const hitWorldResult = new ShapeCastResult();
    data.plugin.shapeCast(
        {
            shape: associatedShape,
            rotation: this.rotationQuaternion || new Quaternion(), // fix
            startPosition: this.getAbsolutePosition(),
            endPosition: this.position.add(displacement),
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

        this.position.addInPlace(safeMove);
    } else {
        this.position.addInPlace(displacement);
    }

    return this;
};

Scene.prototype.enablePhysicsForMoveWithCollisions = function (meshes: AbstractMesh[]) {
    // Helper to dispose of all physicsShapes and plugin and clear the map
    const cleanup = () => {
        this.physicsDataForMoveWithCollisions?.map.forEach((shape) => shape.dispose());
        this.physicsDataForMoveWithCollisions?.map.clear();
        this.physicsDataForMoveWithCollisions?.plugin.dispose();
        this.physicsDataForMoveWithCollisions = undefined; // does this also dispose of the vars inside?
    };

    const createPhysicsShapeOfMeshIfApplicable = (mesh: AbstractMesh) => {
        if (mesh.checkCollisions && mesh.isEnabled() && mesh.subMeshes) {
            const shape = new PhysicsShape({ type: PhysicsShapeType.MESH, parameters: mesh.getFacetDataParameters() }, this);
            shape.filterCollideMask = mesh.collisionMask;
            this.physicsDataForMoveWithCollisions?.map.set(mesh, shape);
        }
    };

    // If this is the first time the function is called, create the map to hold the physicsShapes and setup the observers for adding/removing meshes and disposing of the scene
    if (this.physicsDataForMoveWithCollisions === undefined) {
        // Enable physics if not already enabled, or throw if the existing physics engine is not using Havok
        let plugin: HavokPlugin | undefined;
        if (!this._physicsEngine?.getPhysicsPlugin()) {
            plugin = new HavokPlugin();
            this.enablePhysics(this.gravity, plugin);
        } else {
            if (this._physicsEngine?.getPhysicsPluginName() !== "HavokPlugin") {
                //     // TODO georgie IPhysicsEnginePluginV2  instead
                throw Error("Cannot enable physics for move with collisions if already using a plugin other than Havok");
            }
            plugin = this._physicsEngine?.getPhysicsPlugin() as HavokPlugin;
        }

        // Ensures that 'get physiccsEnabledForMoveWithCollisions' flag returns true and will be used within moveWithCollisions method
        this.physicsDataForMoveWithCollisions = {
            map: new Map<AbstractMesh, PhysicsShape>(),
            plugin,
        };

        this.onNewMeshAddedObservable.add(createPhysicsShapeOfMeshIfApplicable);

        // Dispose the associated physicsShape and remove it from the map
        this.onMeshRemovedObservable.add((mesh: AbstractMesh) => {
            const shape = this.physicsDataForMoveWithCollisions?.map.get(mesh);
            shape?.dispose();
            this.physicsDataForMoveWithCollisions?.map.delete(mesh);
        });

        // Dispose all physicsShapes and clear the map itself
        this.onDisposeObservable.add(cleanup);
    }

    // Any time this function is called, reset the map and recreate the physics bodies
    cleanup();
    this.physicsDataForMoveWithCollisions.map = new Map<AbstractMesh, PhysicsShape>();
    meshes.forEach((mesh: AbstractMesh) => createPhysicsShapeOfMeshIfApplicable(mesh));
};

/**
 * Defines the physics engine scene component responsible to manage a physics engine
 */
export class PhysicsEngineSceneComponent implements ISceneComponent {
    /**
     * The component name helpful to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_PHYSICSENGINE;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene: Scene) {
        this.scene = scene;
        this.scene.onBeforePhysicsObservable = new Observable<Scene>();
        this.scene.onAfterPhysicsObservable = new Observable<Scene>();

        // Replace the function used to get the deterministic frame time
        this.scene.getDeterministicFrameTime = () => {
            if (this.scene._physicsEngine) {
                return this.scene._physicsEngine.getTimeStep() * 1000;
            }

            return 1000.0 / 60.0;
        };
    }

    /**
     * Registers the component in a given scene
     */
    public register(): void {}

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        // Nothing to do for this component
    }

    /**
     * Disposes the component and the associated resources
     */
    public dispose(): void {
        this.scene.onBeforePhysicsObservable.clear();
        this.scene.onAfterPhysicsObservable.clear();

        if (this.scene._physicsEngine) {
            this.scene.disablePhysicsEngine();
        }
    }
}
