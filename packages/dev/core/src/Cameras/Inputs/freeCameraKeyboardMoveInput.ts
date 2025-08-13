import { serialize } from "../../Misc/decorators";
import type { Observer } from "../../Misc/observable";
import type { Nullable } from "../../types";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import type { FreeCamera } from "../../Cameras/freeCamera";
import type { KeyboardInfo } from "../../Events/keyboardEvents";
import type { Scene } from "../../scene";
import { Tools } from "../../Misc/tools";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import { RespondToInputs, KeyboardEventHandler, KeyboardInputOptimized } from "./inputUtils";
/**
 * Manage the keyboard inputs to control the movement of a free camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class FreeCameraKeyboardMoveInput implements ICameraInput<FreeCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: FreeCamera;

    /**
     * Gets or Set the list of keyboard keys used to control the forward move of the camera.
     */
    @serialize()
    public keysUp = [38];

    /**
     * Gets or Set the list of keyboard keys used to control the upward move of the camera.
     */
    @serialize()
    public keysUpward = [33];

    /**
     * Gets or Set the list of keyboard keys used to control the backward move of the camera.
     */
    @serialize()
    public keysDown = [40];

    /**
     * Gets or Set the list of keyboard keys used to control the downward move of the camera.
     */
    @serialize()
    public keysDownward = [34];

    /**
     * Gets or Set the list of keyboard keys used to control the left strafe move of the camera.
     */
    @serialize()
    public keysLeft = [37];

    /**
     * Gets or Set the list of keyboard keys used to control the right strafe move of the camera.
     */
    @serialize()
    public keysRight = [39];

    /**
     * Defines the pointer angular sensibility  along the X and Y axis or how fast is the camera rotating.
     */
    @serialize()
    public rotationSpeed = 0.5;

    /**
     * Gets or Set the list of keyboard keys used to control the left rotation move of the camera.
     */
    @serialize()
    public keysRotateLeft: number[] = [];

    /**
     * Gets or Set the list of keyboard keys used to control the right rotation move of the camera.
     */
    @serialize()
    public keysRotateRight: number[] = [];

    /**
     * Gets or Set the list of keyboard keys used to control the up rotation move of the camera.
     */
    @serialize()
    public keysRotateUp: number[] = [];

    /**
     * Gets or Set the list of keyboard keys used to control the down rotation move of the camera.
     */
    @serialize()
    public keysRotateDown: number[] = [];

    private _keys = new Array<number>();
    private _keyboardInputLookup = new KeyboardInputOptimized({
        keysUp: this.keysUp,
        keysUpward: this.keysUpward,
        keysDown: this.keysDown,
        keysDownward: this.keysDownward,
        keysLeft: this.keysLeft,
        keysRight: this.keysRight,
        keysRotateLeft: this.keysRotateLeft,
        keysRotateRight: this.keysRotateRight,
        keysRotateUp: this.keysRotateUp,
        keysRotateDown: this.keysRotateDown,
    });
    private _onCanvasBlurObserver: Nullable<Observer<AbstractEngine>>;
    private _onKeyboardObserver: Nullable<Observer<KeyboardInfo>>;
    private _engine: AbstractEngine;
    private _scene: Scene;

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(noPreventDefault?: boolean): void {
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        if (this._onCanvasBlurObserver) {
            return;
        }

        this._scene = this.camera.getScene();
        this._engine = this._scene.getEngine();

        this._onCanvasBlurObserver = this._engine.onCanvasBlurObservable.add(() => {
            this._keys.length = 0;
        });

        this._onKeyboardObserver = this._scene.onKeyboardObservable.add((info) => {
            KeyboardEventHandler(this._keys, info, this._keyboardInputLookup, noPreventDefault);
        });
    }
    /**
     * Detach the current controls from the specified dom element.
     */
    public detachControl(): void {
        if (this._scene) {
            if (this._onKeyboardObserver) {
                this._scene.onKeyboardObservable.remove(this._onKeyboardObserver);
            }

            if (this._onCanvasBlurObserver) {
                this._engine.onCanvasBlurObservable.remove(this._onCanvasBlurObserver);
            }
            this._onKeyboardObserver = null;
            this._onCanvasBlurObserver = null;
        }
        this._keys.length = 0;
    }

    /**
     * Update the current camera state depending on the inputs that have been used this frame.
     * This is a dynamically created lambda to avoid the performance penalty of looping for inputs in the render loop.
     */
    public checkInputs(): void {
        if (this._onKeyboardObserver) {
            const camera = this.camera;
            RespondToInputs(this._keys, camera, this._getLocalRotation.bind(this), this._keyboardInputLookup);
        }
    }

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return "FreeCameraKeyboardMoveInput";
    }

    /** @internal */
    public _onLostFocus(): void {
        this._keys.length = 0;
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "keyboard";
    }

    private _getLocalRotation(): number {
        const handednessMultiplier = this.camera._calculateHandednessMultiplier();
        const rotation = ((this.rotationSpeed * this._engine.getDeltaTime()) / 1000) * handednessMultiplier;

        return rotation;
    }
}

(<any>CameraInputTypes)["FreeCameraKeyboardMoveInput"] = FreeCameraKeyboardMoveInput;
