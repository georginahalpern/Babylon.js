import { Camera } from "./camera";
import { Vector3, Matrix } from "../Maths/math.vector";
import type { Scene } from "../scene";
import { GeospatialCameraInputsManager } from "./geospatialCameraInputsManager";

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
    public _worldPosition: Vector3; // This would be offset from the target by a factor of
    private _worldTarget: Vector3; // This would be wherever the input is on the globe (or geospatial object)
    private _relativeTarget: Vector3;

    public _localDirection: Vector3;
    public _transformedDirection: Vector3;

    /** @internal */
    public readonly _cameraTransformMatrix = Matrix.Zero();
    /** @internal */
    public readonly _cameraRotationMatrix = Matrix.Zero();

    constructor(name: string, scene: Scene) {
        if (scene.activeCamera != null) {
            throw new Error("Geospatial camera must be the only active camera on a scene");
        }
        super("geospatial", Vector3.Zero(), scene); // Camera always at origin

        // Will update constructor to take in target/radius/position depending on what I decide
        const position = new Vector3(0, 0, -200);
        const target = new Vector3(0, 0, -50);
        this._worldPosition = position.clone();
        this._worldTarget = target.clone();
        this._relativeTarget = this._worldTarget.subtract(this._worldPosition);

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

        // super._checkInputs();
    }

    public override _getViewMatrix(): Matrix {
        // Camera always at origin, looking at relative target
        this._relativeTarget = this._worldTarget.subtract(this._worldPosition);
        // global.console.log(this._relativeTarget);
        if (!this._localDirection) {
            global.console.log(this._relativeTarget);
        }
        return super._getViewMatrix();
        // Matrix.LookAtLHToRef(Vector3.Zero(), this._relativeTarget, this.upVector, this._viewMatrix);
        // return this._viewMatrix;
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
