import { Camera } from "./camera";
import { Vector3, Matrix } from "../Maths/math.vector";
import type { Scene } from "../scene";
import { GeospatialCameraInputsManager } from "./geospatialCameraInputsManager";

export class GeospatialCamera extends Camera {
    // Input handling
    public override inputs: GeospatialCameraInputsManager;

    // Movement state (what inputs set)
    public _localTranslation = Vector3.Zero();
    public _localRotation = Vector3.Zero();

    // Speed and inertia
    public speed = 1.0;
    public override inertia = 0.9;

    // World tracking
    public _worldPosition: Vector3;
    public _worldTarget: Vector3; // This would be wherever the input is on the globe (or geospatial object)

    /** @internal */
    public readonly _cameraTransformMatrix = Matrix.Zero();
    /** @internal */
    public readonly _cameraRotationMatrix = Matrix.Zero();

    constructor(name: string, scene: Scene) {
        if (scene.activeCamera != null) {
            throw new Error("Geospatial camera must be the only active camera on a scene");
        }
        super(name, Vector3.Zero(), scene); // Camera always at origin

        // Will update constructor to take in target/radius/position depending on what I decide
        const position = new Vector3(0, 0, -200);
        const target = new Vector3(0, 0, -50);
        this._worldPosition = position.clone();
        this._worldTarget = target.clone();

        //position.add(new Vector3(0, 0, 150));

        // Set up inputs
        this.inputs = new GeospatialCameraInputsManager(this);
        this.inputs.addKeyboard().addMouse();

        scene.getEngine().getCreationOptions().useHighPrecisionMatrix = true;
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
        this.position.scaleInPlace(1); // temporary to trigger inspector
    }

    public setTarget(target: Vector3): void {
        this._worldTarget.copyFrom(target);
    }

    public override _checkInputs(): void {
        if (!this._localTranslation) {
            this._localTranslation = Vector3.Zero();
        }
        // Let inputs populate cameraDirection/cameraRotation
        this.inputs.checkInputs();

        // Handle movement
        if (this._localTranslation.lengthSquared() > 0) {
            // Update world position
            this._worldPosition.addInPlace(this._localTranslation);

            // After moving meshes, apply inertia to camera local translation
            if (this.inertia !== 0) {
                if (Math.abs(this._localTranslation.x) < this.speed * 0.001) {
                    this._localTranslation.x = 0;
                }
                if (Math.abs(this._localTranslation.y) < this.speed * 0.001) {
                    this._localTranslation.y = 0;
                }
                if (Math.abs(this._localTranslation.z) < this.speed * 0.001) {
                    this._localTranslation.z = 0;
                }
                this._localTranslation.scaleInPlace(this.inertia);
            }
        }

        // Handle rotation
        if (this._localRotation.lengthSquared() > 0) {
            this._localRotation.scaleInPlace(this.inertia);
        }
    }

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
