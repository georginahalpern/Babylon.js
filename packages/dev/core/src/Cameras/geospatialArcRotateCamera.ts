// =============================-===--======- -    -
// Floating-Origin Geospatial Camera
//
// This camera extends UniversalCamera to handle large real-world coordinates
// by implementing a floating-origin system. The camera stays at (0,0,0) internally
// while exposing real-world coordinate API to callers.
//
// Features:
// - Caller uses normal mesh.position and camera.position with real-world coords
// - Internal camera stays at origin to avoid floating-point precision issues
// - Automatically tracks and updates all meshes in the scene
// - No entity concept - uses Babylon.js built-in node system
// ===========================-===--======- -    -

import { Vector3 } from "core/Maths";
import type { Scene } from "../scene";
// import { TransformNode } from "core/Meshes";
import { RegisterClass } from "core/Misc";
// import type { AbstractMesh } from "core/Meshes";
import { ArcRotateCamera } from "./arcRotateCamera";

const RADIUS = 50; // Default radius for geospatial camera
/**
 * GeospatialCamera extends UniversalCamera to provide floating-origin rendering
 * for handling large real-world coordinate systems without precision loss.
 *
 * Usage:
 * - Use camera.position normally with real-world coordinates
 * - Use mesh.position normally with real-world coordinates
 * - Camera automatically handles precision internally by staying at origin
 * - All meshes are automatically tracked and positioned relative to camera
 */
export class GeospatialArcRotateCamera extends ArcRotateCamera {
    constructor(name: string, scene: Scene, setActiveOnSceneIfNoneActive?: boolean) {
        super(name, 0, 1, RADIUS * 3, Vector3.Zero(), scene, setActiveOnSceneIfNoneActive);
        this.lowerRadiusLimit = RADIUS + 1;
        this.upperRadiusLimit = RADIUS * 3; // Allow zooming out to 10x radius
        // this.panningDistanceLimit = RADIUS;
        // this.lowerTargetYLimit = RADIUS * 3;
        // const camera = new ArcRotateCamera("camera", 0, 1, 10, Vector3.Zero(), scene);

        // Store the initial world position
        // this._worldPosition = Vector3.Zero();
        // this.position = this._worldPosition; // Ensure position is initialized

        // Enable high precision matrix calculations
        scene.getEngine().getCreationOptions().useHighPrecisionMatrix = true;

        // Set camera presets for geospatial usage
        // this.touchAngularSensibility = 10000;
        this.inertia = 0;
        this.speed = 1000;
        this.keysUp.push(87); // W
        this.keysDown.push(83); // S
        this.keysLeft.push(65); // A
        this.keysRight.push(68); // D
        // this.keysUpward.push(69); // E
        // this.keysDownward.push(81); // Q
        this.minZ = 0.5;
        this.maxZ = 50000000;
        this.fov = Math.PI / 3; // 60 degrees - much wider field of view

        // // Before each frame, update the floating-origin system
        // this._scene.onBeforeActiveMeshesEvaluationObservable.add(() => {
        //     this._updateFloatingOrigin();
        // });

        // // Track when meshes are added/removed from scene
        // this._scene.onNewMeshAddedObservable.add((mesh) => {
        //     this._trackMesh(mesh);
        // });

        // this._scene.onMeshRemovedObservable.add((mesh) => {
        //     this._meshWorldPositions.delete(mesh);
        // });

        // // Track existing meshes in scene
        // for (const mesh of this._scene.meshes) {
        //     this._trackMesh(mesh);
        // }
    }
}

RegisterClass("GeospatialArcRotateCamera", GeospatialArcRotateCamera);
