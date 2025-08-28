import type { Nullable } from "../../types";
import type { Observer } from "../../Misc/observable";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import type { GeospatialCamera } from "../../Cameras/geospatialCamera";
import { intersectRayWithPlaneToRef, moveAlongVectorByDistance } from "../../Cameras/geospatialCamera";
import type { PointerInfo } from "../../Events/pointerEvents";
import { PointerEventTypes } from "../../Events/pointerEvents";
import { Matrix, Vector2, Vector3 } from "../../Maths/math.vector";
import type { Ray } from "../../Culling";
import { Plane } from "../../Maths";
import type { Scene } from "../../scene";

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

    private _mouseDownRay: Ray;
    private _dragPlaneOriginPoint: Vector3 = Vector3.Zero();
    private _dragPlane: Plane = new Plane(0, 0, 0, 0);
    private _dragPlaneNormal: Vector3 = Vector3.Zero();
    private _dragPlaneDistanceVector: Vector3 = Vector3.Zero();
    private _dragPlaneHitPoint: Vector3 = Vector3.Zero();

    private _hitPointRadius: number;

    public attachControl(noPreventDefault?: boolean): void {
        const scene = this.camera.getScene();

        this._observer = scene.onPointerObservable.add((pointerInfo) => {
            const evt = pointerInfo.event as PointerEvent;

            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERDOWN:
                    if (this.buttons.includes(evt.button)) {
                        let pickResult;
                        // Determine rayOrigin based off of mouse input
                        if (evt.button == 0 || evt.button == 1) {
                            pickResult = scene.pick(scene.pointerX, scene.pointerY);
                            pickResult.ray && (this._mouseDownRay = pickResult.ray);
                        } else {
                            // Right mouse button tilt around screen center
                            const engine = scene.getEngine();
                            const width = engine.getRenderWidth();
                            const height = engine.getRenderHeight();
                            this._mouseDownRay = scene.createPickingRay(width / 2, height / 2, Matrix.Identity(), this.camera, false);
                            pickResult = scene.pickWithRay(this._mouseDownRay);
                        }

                        if (pickResult?.pickedPoint) {
                            this._isDragging = true;
                            this._dragPlaneDistanceVector = pickResult.pickedPoint;
                            this.camera.worldHitPoint.copyFrom(pickResult.pickedPoint);
                            this.camera.worldHitPoint.normalizeToRef(this.camera.geocentricNormalOfHitPoint);

                            if (evt.button == 0) {
                                // If left click, calculate radius from earth center to hitpoint and to camera, and store camera's normal as the dragPlaneNormal
                                this._hitPointRadius = this.camera.worldHitPoint.length();

                                // Calculate the dragPlane and the initial relativeDistance between the dragPlane hit point and origin
                                // This will later be recalculated when drag occurs, and the delta between these vectors is what will be applied to localTranslation
                                this._dragPlaneDistanceVector = this._recalculateHitPlaneAndGetNewRelativeDist();
                            }
                        } else {
                            this._isDragging = false;
                        }

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

                        switch (this._button) {
                            case 0: // Left button - drag/pan globe under cursor
                                this._handleDrag(scene, evt);
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

    private _recalculateHitPlaneAndGetNewRelativeDist() {
        // Use the camera's geocentric normal to find the dragPlaneOriginPoint which lives at hitPointRadius along the camera's geocentric normal
        this.camera.position.normalizeToRef(this._dragPlaneNormal);
        this._dragPlaneOriginPoint = moveAlongVectorByDistance(this._dragPlaneNormal, this._hitPointRadius);

        // Now create a plane at that point, perpendicular to the camera's geocentric normal
        Plane.FromPositionAndNormalToRef(this._dragPlaneOriginPoint, this._dragPlaneNormal, this._dragPlane);

        // Lastly, find the _dragPlaneHitPoint where the _mouseDownRay intersects the _dragPlane
        intersectRayWithPlaneToRef(this._mouseDownRay, this._dragPlane, this._dragPlaneHitPoint);

        // Return the new relativeDist between the drag plane's hitPoint and originPoint
        return this._dragPlaneHitPoint.subtract(this._dragPlaneOriginPoint);
    }

    private _handleDrag(scene: Scene, evt: PointerEvent): void {
        // With new cursor location, identify where a ray from camera would intersect with the new drag plane, store in _mouseDownRay
        const pickResult = scene.pick(scene.pointerX, scene.pointerY);
        pickResult.ray && (this._mouseDownRay = pickResult.ray);

        // Calc new dragPlane's relativeDistance, then apply the delta between the planes relativeDist to the camera's localTranslation
        const newRelativeDist = this._recalculateHitPlaneAndGetNewRelativeDist();
        const delta = newRelativeDist.subtract(this._dragPlaneDistanceVector);
        this.camera._localTranslation.subtractInPlace(delta);
        this._dragPlaneDistanceVector = newRelativeDist;
    }

    private _handleTilt(deltaX: number, deltaY: number): void {
        // Just rotate the view without moving
        this.camera._localRotation.y += -deltaX / this.angularSensibility; // yaw
        this.camera._localRotation.x += -deltaY / this.angularSensibility; // pitch - dragging up look towards sky
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
