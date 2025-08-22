import type { Nullable } from "../../types";
import type { Observer } from "../../Misc/observable";
import type { ICameraInput } from "../../Cameras/cameraInputsManager";
import type { GeospatialCamera } from "../../Cameras/geospatialCamera";
import { intersectRayWithPlaneToRef, movePtAlongVectorInPlace } from "../../Cameras/geospatialCamera";
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
    private _dragPlanePoint: Vector3 = Vector3.Zero();
    private _dragPlane: Plane = new Plane(0, 0, 0, 0);
    private _dragPlaneNormal: Vector3 = Vector3.Zero();
    private _prevPt: Vector3 = Vector3.Zero();
    private _planeHitPoint: Vector3 = Vector3.Zero();

    // private _setCursorPtToRef(evt: PointerEvent, ref: Vector2) {
    //     const rect = this.camera.getScene().getEngine().getRenderingCanvas()?.getBoundingClientRect();
    //     const x = evt.clientX - (rect ? rect.left : 0);
    //     const y = evt.clientY - (rect ? rect.top : 0);
    //     ref.copyFromFloats(x, y);
    // }

    private _recalculateHitPlaneWithCameraGeocentricNormal(distance: number) {
        // Then calculate _dragPlaneNormal (i.e. the cameras geocentric normal) and use that to find the dragPlanePoint
        // -- the point along camera's geocentric normal that has a length of above distance
        this.camera.position.normalizeToRef(this._dragPlaneNormal);
        this._dragPlanePoint.setAll(0);
        movePtAlongVectorInPlace(this._dragPlanePoint, distance, this._dragPlaneNormal);

        // Now create a plane at that point, perpendicular to the camera's geocentric normal
        Plane.FromPositionAndNormalToRef(this._dragPlanePoint, this._dragPlaneNormal, this._dragPlane);
    }

    public attachControl(noPreventDefault?: boolean): void {
        const scene = this.camera.getScene();

        this._observer = scene.onPointerObservable.add((pointerInfo) => {
            const evt = pointerInfo.event as PointerEvent;

            switch (pointerInfo.type) {
                case PointerEventTypes.POINTERDOWN:
                    if (this.buttons.includes(evt.button)) {
                        let pickResult;
                        // Determine rayOrigin based off of mouse input
                        // let pickResult2;
                        if (evt.button == 0 || evt.button == 1) {
                            // Left mouse button drag under cursor, Middle mouse button tilt around cursor
                            // Middle mouse button tilt around cursor
                            // const rect = scene.getEngine().getRenderingCanvas()?.getBoundingClientRect();
                            // const x = evt.clientX - (rect ? rect.left : 0);
                            // const y = evt.clientY - (rect ? rect.top : 0);

                            pickResult = scene.pick(scene.pointerX, scene.pointerY);
                            pickResult.ray && (this._mouseDownRay = pickResult.ray);

                            // // Create a picking ray from the camera's world position through the center of the screen
                            // const ray = scene.createPickingRay(
                            //     x,
                            //     y,
                            //     Matrix.Identity(), // world matrix, usually identity for screen picking
                            //     this.camera,
                            //     false // cameraViewSpace
                            // );
                            // pickResult2 = scene.pickWithRay(ray);
                        } else {
                            // Right mouse button tilt around screen center
                            const engine = scene.getEngine();
                            const width = engine.getRenderWidth();
                            const height = engine.getRenderHeight();
                            this._mouseDownRay = scene.createPickingRay(width / 2, height / 2, Matrix.Identity(), this.camera, false);
                            pickResult = scene.pickWithRay(this._mouseDownRay);
                        }

                        if (pickResult?.pickedPoint) {
                            // what if no hit?
                            // this returns in geoworldCoordinates so we must add the camera offset (which is actually the origin) to ensure geocentric normal is actually coming from geoworld origin
                            this._prevPt = pickResult.pickedPoint;
                            this.camera.geoworldHitPoint.copyFrom(pickResult.pickedPoint);
                            // TODO move the below into camera! or perhaps into the scene ray logic itself
                            this.camera.geoworldHitPoint.addInPlace(this.camera.position);
                            this.camera.geoworldHitPoint.normalizeToRef(this.camera.geocentricNormalOfHitPoint);

                            if (evt.button == 0) {
                                // If left mouse button 0, calculate distance from earth center to hitpoint
                                const distance = this.camera.geoworldHitPoint.length();

                                // Calculate the plane perpendicular to the camera's geocentric normal which lives that distance from earths center
                                this._recalculateHitPlaneWithCameraGeocentricNormal(distance);

                                // Lastly, find the _planeHitPoint where the _mouseDownRay intersects the _dragPlane if looking at the geoworldHitPoint
                                // As the mouse is dragged, we will recalculate the intersection point of the plane and calculate the delta movement along the plane
                                // That is the amount by which we will translate the camera
                                // Ray.CreateFromToToRef(this.camera.position, this.camera.geoworldHitPoint, this._mouseDownRay);
                                intersectRayWithPlaneToRef(this._mouseDownRay, this._dragPlane, this._planeHitPoint);
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

    private _handleDrag(scene: Scene, evt: PointerEvent): void {
        const oldIntersectionPt = this._dragPlanePoint.clone();
        const newIntersectionPt = Vector3.Zero();

        // this._recalculateHitPlaneWithCameraGeocentricNormal(this.camera.geoworldHitPoint.length());

        // With new cursor location, identify where a ray from camera would intersect with the new drag plane
        // this._setCursorPtToRef(evt, this._rayOrigin);
        // const pickResult = this.camera.getScene().pick(this._rayOrigin.x, this._rayOrigin.y);
        const pickResult = scene.pick(scene.pointerX, scene.pointerY);
        pickResult.ray && (this._mouseDownRay = pickResult.ray);

        const newPt = pickResult.pickedPoint;
        if (newPt) {
            const delta2 = newPt.subtract(this._prevPt);
            this.camera._localTranslation.subtractInPlace(delta2);
            // this.camera.target = this.camera.target.add(delta2);
            this._prevPt = newPt;
        }
        // const pickResult = this.camera.getScene().pickWithRay(this._mouseDownRay);
        // const hitPoint = ray.intersectsPlane(this._dragPlane);
        intersectRayWithPlaneToRef(this._mouseDownRay, this._dragPlane, newIntersectionPt);

        const delta = oldIntersectionPt.subtract(newIntersectionPt);

        global.console.log(
            "old",
            oldIntersectionPt,
            "\n",
            "new",
            newIntersectionPt,
            "\n",
            "ray",
            this._mouseDownRay,
            "\n",
            "localTrans",
            this.camera._localTranslation,
            "\n",

            "dragPlane",
            this._dragPlane,
            "\n",

            "delta",
            delta,
            "\n",
            "camerapos",
            this.camera.position,
            "\n",
            "newIntersectionPtWithCamOffset",
            newIntersectionPt.add(this.camera.position)
        );

        // this.camera._localTranslation.addInPlace(delta);
        // this.camera.target.addInPlace(delta);
    }

    private _handleTilt(deltaX: number, deltaY: number): void {
        // Just rotate the view without moving
        //this.camera._localRotation.y += -deltaX / this.angularSensibility; // yaw
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
