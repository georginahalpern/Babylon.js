// =============================-===--======- -    -
// Floating-Origin Camera
//
// This camera is based on UniversalCamera,
// but it acts differently. It is fixed
// at world's origin (0, 0, 0),
// and it moves all Entities added to its list
// around the origin, mitigating floating-point
// imprecisions at places with huge coordinates.
// ===========================-===--======- -    -

import { Vector3 } from "core/Maths";
import { UniversalCamera } from "./universalCamera";
import type { Scene } from "../scene";
import { TransformNode } from "core/Meshes";
import { RegisterClass } from "core/Misc";

// Our floating-origin OriginCamera
export class OriginCamera extends UniversalCamera {
    private _list: Array<Entity> = new Array<Entity>();

    // double precision position
    // you must use the doublepos to change its position, instead of position directly.
    private _doublepos: Vector3 = new Vector3();
    public get doublepos() {
        return this._doublepos;
    }
    public set doublepos(pos: Vector3) {
        this._doublepos.copyFrom(pos);
    }

    // double precision target
    // you must use the doubletgt to change it, instead of setTarget() directly.
    private _doubletgt: Vector3 = new Vector3();
    public get doubletgt() {
        return this._doubletgt;
    }
    public set doubletgt(tgt: Vector3) {
        this._doubletgt.copyFrom(tgt);
        this.setTarget(this._doubletgt.subtract(this._doublepos));
    }

    // Constructor
    constructor(name: string, position: Vector3, targetDisplace: Vector3, scene: Scene) {
        super(name, Vector3.Zero(), scene);

        this.doublepos = position;

        // Set presets
        this.doubletgt = position.subtractInPlace(targetDisplace);
        this.touchAngularSensibility = 10000;
        this.inertia = 0;
        this.speed = 1000;
        this.keysUp.push(87); // W
        this.keysDown.push(83); // D
        this.keysLeft.push(65); // A
        this.keysRight.push(68); // S
        this.keysUpward.push(69); // E
        this.keysDownward.push(81); // Q
        this.minZ = 0.5;
        this.maxZ = 50000000;
        this.fov = 1;
        // adjust camera speed with mouse wheel

        // addEventListener("wheel", function (e) {
        //     this.speed = Math.min(1000, Math.max(1, (this.speed += e.deltaY * 0.5)));
        // });

        this._scene.onBeforeActiveMeshesEvaluationObservable.add(() => {
            // accumulate any movement on current frame
            // to the double precision position,
            // then clear the camera movement (move camera back to origin);
            // this would not be necessary if we moved the camera
            // ouselves from this class, but for now we're
            // leaving that responsibility for the original UniversalCamera,
            // so when it moves from origin, we must update our doublepos
            // and reset the UniversalCamera back to origin.
            this.doublepos.addInPlace(this.position);
            this.position.set(0, 0, 0);

            // iterate through all registered Entities
            for (let i = 0; i < this._list.length; i++) {
                // update the Entity
                this._list[i].update(this);
            }
        });
    }

    // Register an Entity
    add(entity: Entity): void {
        this._list.push(entity);
    }
}

// =============================-===--======- -    -
// Floating-Origin Entity
//
// Put any objects you want to become floating-origin
// as children of an Entity.
//
// You can have as many Entities as you want,
// but this is better if you space them, objects
// close to each other should be inside an unique Entity.
// ===========================-===--======- -    -

// Out floating-origin Entity
export class Entity extends TransformNode {
    // you must use the doublepos property instead of position directly
    private _doublepos: Vector3 = new Vector3();
    public get doublepos() {
        return this._doublepos;
    }
    public set doublepos(pos: Vector3) {
        this._doublepos.copyFrom(pos);
    }

    constructor(name: string, scene: Scene) {
        super(name, scene);
    }

    // This is called automatically by OriginCamera
    public update(cam: OriginCamera): void {
        this.position = this.doublepos.subtract(cam.doublepos);
    }
}

// Register Class Name
RegisterClass("BABYLON.OriginCamera", OriginCamera);
RegisterClass("BABYLON.Entity", Entity);
