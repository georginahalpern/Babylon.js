import type { KeyboardInfo } from "core/Events";
import { KeyboardEventTypes } from "core/Events";

import type { GeospatialCamera } from "../geospatialCamera";
import { Vector3 } from "core/Maths/math.vector";
import type { FreeCamera } from "../freeCamera";
export type KeyboardInputTypes =
    | "keysUp"
    | "keysUpward"
    | "keysDown"
    | "keysDownward"
    | "keysLeft"
    | "keysRight"
    | "keysRotateLeft"
    | "keysRotateRight"
    | "keysRotateUp"
    | "keysRotateDown"
    | "keysReset";
type KeyboardInputMapping = Partial<Record<KeyboardInputTypes, number[]>>;

export class KeyboardInputOptimized {
    private _keyInputMap: Map<number, KeyboardInputTypes>;
    private _allKeyCodes: Set<number>;

    constructor(inputMappings: KeyboardInputMapping) {
        this._keyInputMap = new Map();
        this._allKeyCodes = new Set();

        // Build the lookup map once
        Object.entries(inputMappings).forEach(([input, keyCodes]) => {
            keyCodes.forEach((keyCode) => {
                this._keyInputMap.set(keyCode, input as KeyboardInputTypes);
                this._allKeyCodes.add(keyCode);
            });
        });
    }

    // O(1) check if keycode exists
    hasKeyCode(keyCode: number): boolean {
        return this._allKeyCodes.has(keyCode);
    }

    // O(1) get input for keycode
    getAction(keyCode: number): KeyboardInputTypes | undefined {
        return this._keyInputMap.get(keyCode);
    }
}

export const KeyboardEventHandler = (
    keys: number[],
    info: KeyboardInfo,
    keyLookup: KeyboardInputOptimized,
    noPreventDefault: boolean,
    onKeyDown?: (info: KeyboardInfo) => void
) => {
    const evt = info.event;
    if (!evt.metaKey) {
        // Single O(1) check instead of multiple indexOf calls
        if (!keyLookup.hasKeyCode(evt.keyCode)) {
            return; // Early exit if key not in any mapping
        }

        if (info.type === KeyboardEventTypes.KEYDOWN) {
            const index = keys.indexOf(evt.keyCode);
            if (index === -1) {
                keys.push(evt.keyCode);
            }
            if (!noPreventDefault) {
                evt.preventDefault();
            }
        } else {
            const index = keys.indexOf(evt.keyCode);
            if (index >= 0) {
                keys.splice(index, 1);
            }
            if (!noPreventDefault) {
                evt.preventDefault();
            }
        }
    }
};

export const RespondToInputs = (keys: number[], camera: FreeCamera | GeospatialCamera, getLocalRotation: () => number, keyLookup: KeyboardInputOptimized) => {
    for (let index = 0; index < keys.length; index++) {
        const keyCode = keys[index];
        const action = keyLookup.getAction(keyCode);

        if (!action) {
            continue; // Skip if not mapped
        }

        const speed = camera._computeLocalCameraSpeed();

        // Use switch for better performance than if-else chain
        switch (action) {
            case "keysLeft":
                camera._localDirection.copyFromFloats(-speed, 0, 0);
                break;
            case "keysUp":
                camera._localDirection.copyFromFloats(0, 0, speed);
                break;
            case "keysRight":
                camera._localDirection.copyFromFloats(speed, 0, 0);
                break;
            case "keysDown":
                camera._localDirection.copyFromFloats(0, 0, -speed);
                break;
            case "keysUpward":
                camera._localDirection.copyFromFloats(0, speed, 0);
                break;
            case "keysDownward":
                camera._localDirection.copyFromFloats(0, -speed, 0);
                break;
            case "keysRotateLeft":
                camera._localDirection.copyFromFloats(0, 0, 0);
                camera.cameraRotation.y -= getLocalRotation();
                break;
            case "keysRotateRight":
                camera._localDirection.copyFromFloats(0, 0, 0);
                camera.cameraRotation.y += getLocalRotation();
                break;
            case "keysRotateUp":
                camera._localDirection.copyFromFloats(0, 0, 0);
                camera.cameraRotation.x -= getLocalRotation();
                break;
            case "keysRotateDown":
                camera._localDirection.copyFromFloats(0, 0, 0);
                camera.cameraRotation.x += getLocalRotation();
                break;
            default:
                break;
        }

        if (camera.getScene().useRightHandedSystem) {
            camera._localDirection.z *= -1;
        }

        // 1. Get the inverse of the view matrix (camera space → world space transform)

        camera.getViewMatrix().invertToRef(camera._cameraTransformMatrix);

        // 2. Transform the local direction by this matrix

        Vector3.TransformNormalToRef(camera._localDirection, camera._cameraTransformMatrix, camera._transformedDirection);

        // 3. Add the world-space movement to cameraDirection

        camera.cameraDirection.addInPlace(camera._transformedDirection);
    }
};
