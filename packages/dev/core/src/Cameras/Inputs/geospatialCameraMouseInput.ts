import type { Nullable } from "../../types";
import type { Observer } from "../../Misc/observable";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import type { GeospatialCamera } from "../../Cameras/geospatialCamera";
import type { PointerInfo } from "../../Events/pointerEvents";
import { PointerEventTypes } from "../../Events/pointerEvents";
import { Vector2, Vector3 } from "../../Maths/math.vector";

export class GeospatialCameraMouseInput implements ICameraInput<GeospatialCamera> {
    public camera: GeospatialCamera;

    /**
     * Mouse sensitivity for rotation (lower = more sensitive)
     */
    public angularSensibility = 2000.0;

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
                            case 0: // Left button - rotate globe
                                this._handleRotation(deltaX, deltaY, evt);
                                break;
                            case 1: // Middle button - pan
                                this._handlePan(deltaX, deltaY);
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

    /**
     * Handle rotation (orbit around globe)
     */
    private _handleRotation(deltaX: number, deltaY: number, evt: PointerEvent): void {
        // Convert pixel movement to rotation angles
        const deltaAlpha = -deltaX / this.angularSensibility;
        const deltaBeta = deltaY / this.angularSensibility;

        // Accumulate into inertial offsets (ArcRotateCamera style)
        this.camera.inertialAlphaOffset += deltaAlpha;
        this.camera.inertialBetaOffset += deltaBeta;
    }

    public _orbitCamera(deltaAlpha: number, deltaBeta: number): void {
        const camera = this.camera;

        // Update spherical coordinates
        camera.alpha += deltaAlpha;
        camera.beta += deltaBeta;

        // Apply limits
        if (camera.lowerBetaLimit !== null) {
            camera.beta = Math.max(camera.beta, camera.lowerBetaLimit);
        }
        if (camera.upperBetaLimit !== null) {
            camera.beta = Math.min(camera.beta, camera.upperBetaLimit);
        }

        // Convert spherical to Cartesian (this is the TARGET position)
        const targetX = camera.radius * Math.sin(camera.beta) * Math.sin(camera.alpha);
        const targetY = camera.radius * Math.cos(camera.beta);
        const targetZ = camera.radius * Math.sin(camera.beta) * Math.cos(camera.alpha);

        // Set the new world position directly (don't accumulate)
        camera._worldPosition.copyFromFloats(targetX, targetY, targetZ);

        // Look at origin from the new position
        const direction = Vector3.Zero().subtract(camera._worldPosition).normalize();

        // Convert direction to rotation angles
        const newRotationY = Math.atan2(direction.x, direction.z);
        const newRotationX = Math.asin(-direction.y);

        // Set rotation directly (not as delta)
        camera.rotation.copyFromFloats(newRotationX, newRotationY, 0);
    }

    /**
     * Handle panning (middle mouse)
     */
    private _handlePan(deltaX: number, deltaY: number): void {
        const camera = this.camera;
        const speed = camera.radius * 0.001; // Scale with distance

        // Calculate right and up vectors
        const forward = Vector3.Zero().subtract(camera.position).normalize();
        const right = Vector3.Cross(Vector3.Up(), forward).normalize();
        const up = Vector3.Cross(forward, right);

        // Pan in camera's local space
        const panX = right.scale(deltaX * speed);
        const panY = up.scale(-deltaY * speed);

        camera._localTranslation.addInPlace(panX);
        camera._localTranslation.addInPlace(panY);
    }

    /**
     * Handle camera tilt (right mouse)
     */
    private _handleTilt(deltaX: number, deltaY: number): void {
        // Just rotate the view without moving
        this.camera._localRotation.y += -deltaX / this.angularSensibility;
        this.camera._localRotation.x += deltaY / this.angularSensibility;
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
