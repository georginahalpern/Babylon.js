import { serialize } from "core/Misc/decorators";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import type { GeospatialCamera } from "../../Cameras/geospatialCamera";
import type { KeyboardInfo } from "../../Events/keyboardEvents";
import type { Scene } from "../../scene";
import type { AbstractEngine } from "core/Engines";
import { KeyboardEventHandler, KeyboardInputOptimized, RespondToInputs } from "./inputUtils";

/**
 * Keyboard input for GeospatialCamera
 * Arrow keys move the camera in world space
 */
export class GeospatialCameraKeyboardInput implements ICameraInput<GeospatialCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: GeospatialCamera;

    /**
     * Defines the list of key codes for moving forward (default: up arrow)
     */
    @serialize()
    public keysUp = [38];

    /**
     * Defines the list of key codes for moving backward (default: down arrow)
     */
    @serialize()
    public keysDown = [40];

    /**
     * Defines the list of key codes for moving left (default: left arrow)
     */
    @serialize()
    public keysLeft = [37];

    /**
     * Defines the list of key codes for moving right (default: right arrow)
     */
    @serialize()
    public keysRight = [39];

    /**
     * Defines the list of key codes for moving up in world space (default: Page Up)
     */
    @serialize()
    public keysUpward = [33];

    /**
     * Defines the list of key codes for moving down in world space (default: Page Down)
     */
    @serialize()
    public keysDownward = [34];

    /**
     * Defines the list of key codes for rotating left in world space (default: Q)
     */
    @serialize()
    public keysRotateLeft = [81];

    /**
     * Defines the list of key codes for rotating left in world space (default: R)
     */
    @serialize()
    public keysRotateRight = [82];

    /**
     * Defines the pointer angular sensibility  along the X and Y axis or how fast is the camera rotating.
     */
    @serialize()
    public rotationSpeed = 0.5;

    private _keys = new Array<number>();
    // private _ctrlPressed = false;
    private _onKeyboardObserver: Nullable<Observer<KeyboardInfo>> = null;
    private _scene: Scene;
    private _engine: AbstractEngine;
    private _keyboardInputLookup: KeyboardInputOptimized;
    public attachControl(noPreventDefault?: boolean): void {
        if (this.camera) {
            this._scene = this.camera.getScene();
            this._engine = this._scene.getEngine();
            this._keyboardInputLookup = new KeyboardInputOptimized({
                keysUp: this.keysUp,
                keysUpward: this.keysUpward,
                keysDown: this.keysDown,
                keysDownward: this.keysDownward,
                keysLeft: this.keysLeft,
                keysRight: this.keysRight,
            });

            const element = this._engine.getInputElement();
            if (!element) {
                return;
            }

            this._onKeyboardObserver = this._scene.onKeyboardObservable.add((info) => KeyboardEventHandler(this._keys, info, this._keyboardInputLookup, !!noPreventDefault));
        }
    }

    /**
     * Detach the current controls from the specified dom element.
     */
    public detachControl(): void {
        if (this._scene) {
            if (this._onKeyboardObserver) {
                this._scene.onKeyboardObservable.remove(this._onKeyboardObserver);
            }
            this._onKeyboardObserver = null;
        }
        this._keys.length = 0;
    }

    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     */
    public checkInputs(): void {
        if (this._onKeyboardObserver) {
            RespondToInputs(this._keys, this.camera, this._getLocalRotation.bind(this), this._keyboardInputLookup);
        }
    }

    private _getLocalRotation(): number {
        const handednessMultiplier = this.camera._calculateHandednessMultiplier();
        const rotation = ((this.rotationSpeed * this._engine.getDeltaTime()) / 1000) * handednessMultiplier;

        return rotation;
    }

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return "GeospatialCameraKeyboardInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "keyboard";
    }
}
