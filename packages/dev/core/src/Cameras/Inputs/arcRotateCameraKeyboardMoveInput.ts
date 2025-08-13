import type { Nullable } from "../../types";
import { serialize } from "../../Misc/decorators";
import type { Observer } from "../../Misc/observable";
import type { Scene } from "../../scene";
import type { ArcRotateCamera } from "../../Cameras/arcRotateCamera";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import { CameraInputTypes } from "../../Cameras/cameraInputsManager";
import type { KeyboardInfo } from "../../Events/keyboardEvents";
import { Tools } from "../../Misc/tools";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import { KeyboardEventHandler, KeyboardInputOptimized } from "./inputUtils";
import type { KeyboardInputTypes } from "./inputUtils";

/**
 * Manage the keyboard inputs to control the movement of an arc rotate this.camera.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/customizingCameraInputs
 */
export class ArcRotateCameraKeyboardMoveInput implements ICameraInput<ArcRotateCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: ArcRotateCamera;

    /**
     * Defines the list of key codes associated with the up action (increase alpha)
     */
    @serialize()
    public keysUp = [38];

    /**
     * Defines the list of key codes associated with the down action (decrease alpha)
     */
    @serialize()
    public keysDown = [40];

    /**
     * Defines the list of key codes associated with the left action (increase beta)
     */
    @serialize()
    public keysLeft = [37];

    /**
     * Defines the list of key codes associated with the right action (decrease beta)
     */
    @serialize()
    public keysRight = [39];

    /**
     * Defines the list of key codes associated with the reset action.
     * Those keys reset the this.camera to its last stored state (with the method this.camera.storeState())
     */
    @serialize()
    public keysReset = [220];

    /**
     * Defines the panning sensibility of the inputs.
     * (How fast is the this.camera panning)
     */
    @serialize()
    public panningSensibility: number = 50.0;

    /**
     * Defines the zooming sensibility of the inputs.
     * (How fast is the this.camera zooming)
     */
    @serialize()
    public zoomingSensibility: number = 25.0;

    /**
     * Defines whether maintaining the alt key down switch the movement mode from
     * orientation to zoom.
     */
    @serialize()
    public useAltToZoom: boolean = true;

    /**
     * Rotation speed of the this.camera
     */
    @serialize()
    public angularSpeed = 0.01;

    private _keys = new Array<number>();
    private _keyboardInputLookup: KeyboardInputOptimized;
    private _keyActions: Record<KeyboardInputTypes, () => void>;
    private _ctrlPressed: boolean;
    private _altPressed: boolean;
    private _onCanvasBlurObserver: Nullable<Observer<AbstractEngine>>;
    private _onKeyboardObserver: Nullable<Observer<KeyboardInfo>>;
    private _engine: AbstractEngine;
    private _scene: Scene;

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(noPreventDefault?: boolean): void {
        // was there a second variable defined?
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);

        if (this._onCanvasBlurObserver) {
            return;
        }

        this._scene = this.camera.getScene();
        this._engine = this._scene.getEngine();

        this._onCanvasBlurObserver = this._engine.onCanvasBlurObservable.add(() => {
            this._keys.length = 0;
        });

        this._keyboardInputLookup = new KeyboardInputOptimized({
            keysUp: this.keysUp,
            keysDown: this.keysDown,
            keysLeft: this.keysLeft,
            keysRight: this.keysRight,
            keysReset: this.keysReset,
        });
        const onKeyDown = (info: KeyboardInfo) => {
            this._ctrlPressed = info.event.ctrlKey;
            this._altPressed = info.event.altKey;
        };
        this._onKeyboardObserver = this._scene.onKeyboardObservable.add((info) => KeyboardEventHandler(this._keys, info, this._keyboardInputLookup, noPreventDefault, onKeyDown));

        // Define actions matching KeyboardInputTypes
        this._keyActions = {
            keysLeft: () => {
                if (this._ctrlPressed && this.camera._useCtrlForPanning) {
                    this.camera.inertialPanningX -= 1 / this.panningSensibility;
                } else {
                    this.camera.inertialAlphaOffset -= this.angularSpeed;
                }
            },
            keysUp: () => {
                if (this._ctrlPressed && this.camera._useCtrlForPanning) {
                    this.camera.inertialPanningY += 1 / this.panningSensibility;
                } else if (this._altPressed && this.useAltToZoom) {
                    this.camera.inertialRadiusOffset += 1 / this.zoomingSensibility;
                } else {
                    this.camera.inertialBetaOffset -= this.angularSpeed;
                }
            },
            keysRight: () => {
                if (this._ctrlPressed && this.camera._useCtrlForPanning) {
                    this.camera.inertialPanningX += 1 / this.panningSensibility;
                } else {
                    this.camera.inertialAlphaOffset += this.angularSpeed;
                }
            },
            keysDown: () => {
                if (this._ctrlPressed && this.camera._useCtrlForPanning) {
                    this.camera.inertialPanningY -= 1 / this.panningSensibility;
                } else if (this._altPressed && this.useAltToZoom) {
                    this.camera.inertialRadiusOffset -= 1 / this.zoomingSensibility;
                } else {
                    this.camera.inertialBetaOffset += this.angularSpeed;
                }
            },
            keysReset: () => {
                if (this.camera.useInputToRestoreState) {
                    this.camera.restoreState();
                }
            },
            // Add empty functions for unused KeyboardInputTypes
            keysUpward: () => {},
            keysDownward: () => {},
            keysRotateLeft: () => {},
            keysRotateRight: () => {},
            keysRotateUp: () => {},
            keysRotateDown: () => {},
        };
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
        if (!this._onKeyboardObserver) {
            return;
        }

        // Process each pressed key
        for (const keyCode of this._keys) {
            // Check each key array directly
            if (this.keysLeft.includes(keyCode)) {
                this._keyActions.keysLeft();
            } else if (this.keysUp.includes(keyCode)) {
                this._keyActions.keysUp();
            } else if (this.keysRight.includes(keyCode)) {
                this._keyActions.keysRight();
            } else if (this.keysDown.includes(keyCode)) {
                this._keyActions.keysDown();
            } else if (this.keysReset.includes(keyCode)) {
                this._keyActions.keysReset();
            }
        }
    }

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return "ArcRotateCameraKeyboardMoveInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "keyboard";
    }
}

(<any>CameraInputTypes)["ArcRotateCameraKeyboardMoveInput"] = ArcRotateCameraKeyboardMoveInput;
