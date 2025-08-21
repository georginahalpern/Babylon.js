import type { Nullable } from "../../types";
import type { Observer } from "../../Misc/observable";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import type { GeospatialCamera } from "../../Cameras/geospatialCamera";
import type { PointerInfo } from "../../Events/pointerEvents";
import { PointerEventTypes } from "../../Events/pointerEvents";
import { Matrix, Vector2 } from "../../Maths/math.vector";
// import { Epsilon } from "../../Maths";

export class GeospatialCameraMouseInput implements ICameraInput<GeospatialCamera> {
    public camera: GeospatialCamera;

    /**
     * Mouse sensitivity for rotation (lower = more sensitive)
     */
    public angularSensibility = 200.0;

    /**
     * Mouse button to use for camera control
     * 0 = left, 1 = middle, 2 = right
     */
    public buttons = [0, 1, 2];

    private _observer: Nullable<Observer<PointerInfo>>;
    private _previousPosition: Nullable<Vector2> = null;
    private _isDragging = false;
    private _button: number = -1;

    public attachControl(noPreventDefault?: boolean): void {
        const scene = this.camera.getScene();

        this._observer = scene.onPointerObservable.add((pointerInfo) => {
            const evt = pointerInfo.event as PointerEvent;

            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERDOWN:
                    if (this.buttons.includes(evt.button)) {
                        if (evt.button == 1 || evt.button == 2) {
                            const rayOrigin = new Vector2();
                            if (evt.button == 1) {
                                const rect = scene.getEngine().getRenderingCanvas()?.getBoundingClientRect();
                                const x = evt.clientX - (rect ? rect.left : 0);
                                const y = evt.clientY - (rect ? rect.top : 0);
                                rayOrigin.copyFromFloats(x, y);
                            } else {
                                // Get engine and screen size
                                const engine = scene.getEngine();
                                const width = engine.getRenderWidth();
                                const height = engine.getRenderHeight();

                                // Shoot ray from center of screen
                                rayOrigin.copyFromFloats(width / 2, height / 2);
                            }

                            // Create a picking ray from the camera's world position through the center of the screen
                            const ray = scene.createPickingRay(
                                rayOrigin.x,
                                rayOrigin.y,
                                Matrix.Identity(), // world matrix, usually identity for screen picking
                                this.camera,
                                false // cameraViewSpace
                            );

                            // Pick with the ray
                            const pickResult = scene.pickWithRay(ray);
                            if (pickResult?.pickedPoint) {
                                // what if no hit?
                                this.camera.hitPosition.copyFrom(pickResult.pickedPoint);
                                this.camera.hitPosition.addInPlace(this.camera._worldPosition); // this returns in geospatial world coordinates which ensures the geocentric normal is actually coming from geoworld origin
                                this.camera.hitPosition.normalizeToRef(this.camera._geocentricNormal);
                            }
                        }

                        this._isDragging = true;
                        this._button = evt.button;
                        this._previousPosition = new Vector2(evt.clientX, evt.clientY);
                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                    break;

                case PointerEventTypes.POINTERUP:
                    this._isDragging = false;
                    this._previousPosition = null;
                    this._button = -1;
                    break;

                case PointerEventTypes.POINTERMOVE:
                    if (this._isDragging && this._previousPosition) {
                        const currentPosition = new Vector2(evt.clientX, evt.clientY);
                        const deltaX = currentPosition.x - this._previousPosition.x;
                        const deltaY = currentPosition.y - this._previousPosition.y;

                        // Different actions based on button
                        switch (this._button) {
                            case 0: // Left button - rotate globe around its center (drag/move, pan)
                                this._handleRotation(deltaX, deltaY, evt);
                                break;
                            case 1: // Middle button - tilt camera around cursor
                                this._handleTilt(deltaX, deltaY);
                                break;
                            case 2: // Right button - tilt camera
                                this._handleTilt(deltaX, deltaY);
                                break;
                        }

                        this._previousPosition = currentPosition;

                        if (!noPreventDefault) {
                            evt.preventDefault();
                        }
                    }
                    break;
            }
        });
    }

    private _handleRotation(deltaX: number, deltaY: number, evt: PointerEvent): void {
        // Convert pixel movement to rotation angles
        const deltaAlpha = deltaX / this.angularSensibility;
        const deltaBeta = -deltaY / this.angularSensibility;

        // Accumulate into inertial offsets (ArcRotateCamera style)
        this.camera.inertialAlphaOffset += deltaAlpha;
        this.camera.inertialBetaOffset += deltaBeta;
        //        this.camera._localRotation.z += -deltaX / this.angularSensibility; // yaw
    }

    private _handleTilt(deltaX: number, deltaY: number): void {
        // Just rotate the view without moving
        // this.camera._localRotation.y += -deltaX / this.angularSensibility; // yaw
        this.camera._localRotation.x += deltaY / this.angularSensibility; // pitch
    }

    public detachControl(): void {
        if (this._observer) {
            this.camera.getScene().onPointerObservable.remove(this._observer);
            this._observer = null;
        }

        this._isDragging = false;
        this._previousPosition = null;
        this._button = -1;
    }

    public getClassName(): string {
        return "GeospatialCameraMouseInput";
    }

    public getSimpleName(): string {
        return "mouse";
    }

    public checkInputs(): void {
        // Mouse input is event-based, no per-frame updates needed
    }
}
