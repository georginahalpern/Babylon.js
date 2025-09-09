import type { Scene } from "../scene";
import { Effect } from "../Materials/effect";
import type { IMatrixLike, IVector4Like, Vector3 } from "../Maths";
import type { Tuple } from "../types";

// Store original methods we'll be wrapping
const OriginalSetMatrix = Effect.prototype.setMatrix;
const OriginalSetVector4 = Effect.prototype.setVector4;

export function ResetOriginalEffectMethods() {
    Effect.prototype.setMatrix = OriginalSetMatrix;
    Effect.prototype.setVector4 = OriginalSetVector4;
}

const TempMatArray = new Array(16).fill(0) as Tuple<number, 16>;
function GetTempMatArray() {
    return TempMatArray;
}
const TempMat: IMatrixLike = {
    asArray: GetTempMatArray,
    updateFlag: 0,
};
const TempVec4: IVector4Like = { w: 0, x: 0, y: 0, z: 0 };
const MatSet = new Set(["world", "view", "viewProjection", "worldView", "worldViewProjection"]); // TODO: find all of the matrices that need to be updated
const Vect4Offset = new Set(["vLightData", "vEyePosition"]);
const Float3Offset = new Set(["vEyePosition"]);
const Float4Offset = new Set(["vLightData", "vEyePosition"]);

function OffsetVector4(uniformName: string, vector4: IVector4Like, offset: Vector3): IVector4Like {
    if (Vect4Offset.has(uniformName)) {
        TempVec4.w = vector4.w; // w?
        TempVec4.x = vector4.x - offset.x;
        TempVec4.y = vector4.y - offset.y;
        TempVec4.z = vector4.z - offset.z;
        return TempVec4;
    }
    return vector4;
}

function OffsetMatrix(uniformName: string, matrix: IMatrixLike, offset: Vector3): IMatrixLike {
    if (MatSet.has(uniformName)) {
        ApplyMatOffsetToRef(offset, matrix.asArray(), TempMatArray);
        TempMat.updateFlag = matrix.updateFlag;
        return TempMat;
    }
    return matrix;
}

function ApplyMatOffsetToRef(offset: Vector3, mat: Tuple<number, 16>, ref: Tuple<number, 16>): Tuple<number, 16> {
    for (let i = 0; i < 16; i++) {
        ref[i] = mat[i];
    }
    ref[12] -= offset.x;
    ref[13] -= offset.y;
    ref[14] -= offset.z;
    return ref;
}

export function OverrideOffsetableEffectMethods(scene: Scene) {
    Effect.prototype.setOffsettableMatrix = function (uniformName: string, matrix: IMatrixLike) {
        this._pipelineContext!.setMatrix(uniformName, OffsetMatrix(uniformName, matrix, scene.floatingOriginOffset));
        return this;
    };

    Effect.prototype.setOffsettableVector4 = function (uniformName: string, vector4: IVector4Like) {
        this._pipelineContext!.setVector4(uniformName, OffsetVector4(uniformName, vector4, scene.floatingOriginOffset));
        return this;
    };

    Effect.prototype.setOffsettableFloat3 = function (uniformName: string, x: number, y: number, z: number) {
        if (Float3Offset.has(uniformName)) {
            this._pipelineContext!.setFloat3(uniformName, x - scene.floatingOriginOffset.x, y - scene.floatingOriginOffset.y, z - scene.floatingOriginOffset.z);
            return this;
        }
        this._pipelineContext!.setFloat3(uniformName, x, y, z);
        return this;
    };

    Effect.prototype.setOffsettableFloat4 = function (uniformName: string, x: number, y: number, z: number, w: number) {
        if (Float4Offset.has(uniformName)) {
            this._pipelineContext!.setFloat4(uniformName, x - scene.floatingOriginOffset.x, y - scene.floatingOriginOffset.y, z - scene.floatingOriginOffset.z, w);
            return this;
        }
        this._pipelineContext!.setFloat4(uniformName, x, y, z, w);
        return this;
    };
}

export function SetFloatingOriginEffectMethods(scene: Scene) {
    Effect.prototype.setMatrix = function (uniformName: string, matrix: IMatrixLike) {
        this._pipelineContext!.setMatrix(uniformName, OffsetMatrix(uniformName, matrix, scene.floatingOriginOffset));
        return this;
    };

    Effect.prototype.setVector4 = function (uniformName: string, vector4: IVector4Like) {
        this._pipelineContext!.setVector4(uniformName, OffsetVector4(uniformName, vector4, scene.floatingOriginOffset));
        return this;
    };

    Effect.prototype.setOffsettableFloat3 = function (uniformName: string, x: number, y: number, z: number) {
        if (Float3Offset.has(uniformName)) {
            this._pipelineContext!.setFloat3(uniformName, x - scene.floatingOriginOffset.x, y - scene.floatingOriginOffset.y, z - scene.floatingOriginOffset.z);
            return this;
        }
        this._pipelineContext!.setFloat3(uniformName, x, y, z);
        return this;
    };

    Effect.prototype.setOffsettableFloat4 = function (uniformName: string, x: number, y: number, z: number, w: number) {
        if (Float4Offset.has(uniformName)) {
            this._pipelineContext!.setFloat4(uniformName, x - scene.floatingOriginOffset.x, y - scene.floatingOriginOffset.y, z - scene.floatingOriginOffset.z, w);
            return this;
        }
        this._pipelineContext!.setFloat4(uniformName, x, y, z, w);
        return this;
    };
}
