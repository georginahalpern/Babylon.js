import type { KeyboardInfo } from "core/Events";
import { KeyboardEventTypes } from "core/Events";

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
            onKeyDown?.(info);
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
