import { serialize } from "core/Misc/decorators";
import type { EventState, Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import type { GeospatialCamera } from "../../Cameras/geospatialCamera";
import type { PointerInfo } from "../../Events/pointerEvents";
import { PointerEventTypes } from "../../Events/pointerEvents";
import type { IPointerEvent } from "../../Events/deviceInputEvents";

/**
 * Mouse input for GeospatialCamera
 * Dragging rotates the camera (inverted)
 */
export class GeospatialCameraMouseInput implements ICameraInput<GeospatialCamera> {
    /**
     * Defines the camera the input is attached to.
     */
    public camera: Nullable<GeospatialCamera> = null;

    /**
     * Defines the mouse angular sensitivity along the X axis (default: 2000)
     */
    @serialize()
    public angularSensibilityX = 2000.0;

    /**
     * Defines the mouse angular sensitivity along the Y axis (default: 2000)
     */
    @serialize()
    public angularSensibilityY = 2000.0;

    /**
     * Defines which mouse buttons activate camera rotation (default: left button)
     */
    @serialize()
    public buttons = [0];

    /**
     * Defines whether touch is enabled (default: true)
     */
    @serialize()
    public touchEnabled = true;

    private _pointerInput?: (p: PointerInfo, s: EventState) => void;
    // private _onMouseMove?: (evt: IPointerEvent) => void;
    private _observer: Nullable<Observer<PointerInfo>> = null;
    private _previousPosition: Nullable<{ x: number; y: number }> = null;

    public attachControl(noPreventDefault?: boolean): void {
        const engine = this.camera?.getEngine();
        const element = engine?.getInputElement();

        if (!element || !this.camera) {
            return;
        }

        const scene = this.camera.getScene();

        if (!this._pointerInput) {
            this._pointerInput = (p) => {
                const evt = p.event as IPointerEvent;

                if (!this.touchEnabled && evt.pointerType === "touch") {
                    return;
                }

                if (p.type === PointerEventTypes.POINTERDOWN) {
                    if (this.buttons.indexOf(evt.button) !== -1) {
                        this._previousPosition = {
                            x: evt.clientX,
                            y: evt.clientY,
                        };

                        if (!noPreventDefault) {
                            evt.preventDefault();
                            element!.focus();
                        }
                    }
                } else if (p.type === PointerEventTypes.POINTERUP) {
                    this._previousPosition = null;
                } else if (p.type === PointerEventTypes.POINTERMOVE) {
                    if (!this._previousPosition || !this.camera) {
                        return;
                    }

                    const offsetX = evt.clientX - this._previousPosition.x;
                    const offsetY = evt.clientY - this._previousPosition.y;

                    // Inverted rotation (drag left rotates camera right)
                    this.camera.cameraRotation.x = -offsetY / this.angularSensibilityY;
                    this.camera.cameraRotation.y = -offsetX / this.angularSensibilityX;

                    this._previousPosition = {
                        x: evt.clientX,
                        y: evt.clientY,
                    };
                }
            };
        }

        this._observer = scene.onPointerObservable.add(this._pointerInput, PointerEventTypes.POINTERDOWN | PointerEventTypes.POINTERUP | PointerEventTypes.POINTERMOVE);
    }

    /**
     * Detach the current controls from the specified dom element.
     */
    public detachControl(): void {
        if (this._observer) {
            this.camera?.getScene().onPointerObservable.remove(this._observer);
            this._observer = null;
            this._previousPosition = null;
        }
    }

    /**
     * Gets the class name of the current input.
     * @returns the class name
     */
    public getClassName(): string {
        return "GeospatialCameraMouseInput";
    }

    /**
     * Get the friendly name associated with the input class.
     * @returns the input friendly name
     */
    public getSimpleName(): string {
        return "mouse";
    }
}
