import { serialize } from "core/Misc/decorators";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import type { GeospatialCamera } from "../../Cameras/geospatialCamera";
import { KeyboardEventTypes, type KeyboardInfo } from "../../Events/keyboardEvents";
import type { Scene } from "../../scene";
import type { AbstractEngine } from "core/Engines";

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
    private _modifierPressed = false;
    private _onKeyboardObserver: Nullable<Observer<KeyboardInfo>> = null;
    private _scene: Scene;
    private _engine: AbstractEngine;
    // private _keyboardInputLookup: KeyboardInputOptimized;
    public attachControl(noPreventDefault?: boolean): void {
        if (this.camera) {
            this._scene = this.camera.getScene();
            this._engine = this._scene.getEngine();
            // this._keyboardInputLookup = new KeyboardInputOptimized({
            //     keysUp: this.keysUp,
            //     keysUpward: this.keysUpward,
            //     keysDown: this.keysDown,
            //     keysDownward: this.keysDownward,
            //     keysLeft: this.keysLeft,
            //     keysRight: this.keysRight,
            // });

            const element = this._engine.getInputElement();
            if (!element) {
                return;
            }

            this._onKeyboardObserver = this._scene.onKeyboardObservable.add((info) =>
                //KeyboardEventHandler(this._keys, info, this._keyboardInputLookup, !!noPreventDefault)
                {
                    const evt = info.event;
                    if (!evt.metaKey) {
                        if (info.type === KeyboardEventTypes.KEYDOWN) {
                            this._modifierPressed = info.event.ctrlKey || info.event.altKey;
                            if (
                                this.keysUp.indexOf(evt.keyCode) !== -1 ||
                                this.keysDown.indexOf(evt.keyCode) !== -1 ||
                                this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                                this.keysRight.indexOf(evt.keyCode) !== -1 ||
                                this.keysUpward.indexOf(evt.keyCode) !== -1 ||
                                this.keysDownward.indexOf(evt.keyCode) !== -1 ||
                                this.keysRotateLeft.indexOf(evt.keyCode) !== -1 ||
                                this.keysRotateRight.indexOf(evt.keyCode) !== -1
                                // this.keysRotateUp.indexOf(evt.keyCode) !== -1 ||
                                // this.keysRotateDown.indexOf(evt.keyCode) !== -1
                            ) {
                                const index = this._keys.indexOf(evt.keyCode);

                                if (index === -1) {
                                    this._keys.push(evt.keyCode);
                                }
                                if (!noPreventDefault) {
                                    evt.preventDefault();
                                }
                            }
                        } else {
                            if (
                                this.keysUp.indexOf(evt.keyCode) !== -1 ||
                                this.keysDown.indexOf(evt.keyCode) !== -1 ||
                                this.keysLeft.indexOf(evt.keyCode) !== -1 ||
                                this.keysRight.indexOf(evt.keyCode) !== -1 ||
                                this.keysUpward.indexOf(evt.keyCode) !== -1 ||
                                this.keysDownward.indexOf(evt.keyCode) !== -1 ||
                                this.keysRotateLeft.indexOf(evt.keyCode) !== -1 ||
                                this.keysRotateRight.indexOf(evt.keyCode) !== -1
                                // this.keysRotateUp.indexOf(evt.keyCode) !== -1 ||
                                // this.keysRotateDown.indexOf(evt.keyCode) !== -1
                            ) {
                                const index = this._keys.indexOf(evt.keyCode);

                                if (index >= 0) {
                                    this._keys.splice(index, 1);
                                }
                                if (!noPreventDefault) {
                                    evt.preventDefault();
                                }
                            }
                        }
                    }
                }
            );
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
            // Keyboard
            if (!this._keys.length) {
                return;
            }

            const camera = this.camera;
            // const panSpeed = camera._computeLocalCameraSpeed();
            const rotationSpeed = this._getLocalRotation();

            for (const keyCode of this._keys) {
                if (this._modifierPressed) {
                    // With Ctrl: Change rotation
                    if (this.keysUp.includes(keyCode)) {
                        camera._localRotation.x -= rotationSpeed;
                    } else if (this.keysDown.includes(keyCode)) {
                        camera._localRotation.x += rotationSpeed;
                    } else if (this.keysLeft.includes(keyCode)) {
                        camera._localRotation.y -= rotationSpeed;
                    } else if (this.keysRight.includes(keyCode)) {
                        camera._localRotation.y += rotationSpeed;
                    }
                } else {
                    // Without Ctrl: Movement
                    if (this.keysUp.includes(keyCode)) {
                        camera._localTranslation.z += rotationSpeed;
                    } else if (this.keysDown.includes(keyCode)) {
                        camera._localTranslation.z -= rotationSpeed;
                    } else if (this.keysLeft.includes(keyCode)) {
                        camera._localTranslation.x -= rotationSpeed;
                    } else if (this.keysRight.includes(keyCode)) {
                        camera._localTranslation.x += rotationSpeed;
                    } else if (this.keysUpward.includes(keyCode)) {
                        camera._localTranslation.y -= rotationSpeed;
                    } else if (this.keysDownward.includes(keyCode)) {
                        camera._localTranslation.y += rotationSpeed;
                    }
                }

                if (camera.getScene().useRightHandedSystem) {
                    camera._localTranslation.z *= -1;
                }
            }
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
