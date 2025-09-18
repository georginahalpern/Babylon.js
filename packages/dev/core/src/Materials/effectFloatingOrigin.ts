import type { Scene } from "../scene";
import { Effect } from "../Materials/effect";
import type { IMatrixLike, IVector4Like } from "../Maths";
import { Vector3 } from "../Maths";
import type { Tuple } from "../types";
import { UniformBuffer } from "./uniformBuffer";

const UniformBufferInternal = UniformBuffer as any;

// Store original methods we'll be wrapping
const OriginalSetMatrix = Effect.prototype.setMatrix;
const OriginalSetVector4 = Effect.prototype.setVector4;
const OriginalSetFloat3 = Effect.prototype.setFloat3;
const OriginalSetFloat4 = Effect.prototype.setFloat4;

const OriginalUpdateMatrix = UniformBuffer.prototype.updateMatrix;
const OriginalUpdateVector4 = UniformBuffer.prototype.updateVector4;
const OriginalUpdateFloat3 = UniformBuffer.prototype.updateFloat3;
const OriginalUpdateFloat4 = UniformBuffer.prototype.updateFloat4;

const OriginalUpdateMatrixForUniform = UniformBufferInternal.prototype._updateMatrixForUniform;
const OriginalUpdateFloat3ForUniform = UniformBufferInternal.prototype._updateFloat3ForUniform;
const OriginalUpdateFloat4ForUniform = UniformBufferInternal.prototype._updateFloat4ForUniform;
const OriginalUpdateVector4ForUniform = UniformBufferInternal.prototype._updateVector4ForUniform;

export function ResetOriginalEffectMethods() {
    Effect.prototype.setMatrix = OriginalSetMatrix;
    Effect.prototype.setVector4 = OriginalSetVector4;
    Effect.prototype.setFloat3 = OriginalSetFloat3;
    Effect.prototype.setFloat4 = OriginalSetFloat4;
    UniformBuffer.prototype.updateMatrix = OriginalUpdateMatrix;
    UniformBuffer.prototype.updateVector4 = OriginalUpdateVector4;
    UniformBuffer.prototype.updateFloat3 = OriginalUpdateFloat3;
    UniformBuffer.prototype.updateFloat4 = OriginalUpdateFloat4;
    UniformBufferInternal.prototype._updateMatrixForUniform = OriginalUpdateMatrixForUniform;
    UniformBufferInternal.prototype._updateFloat3ForUniform = OriginalUpdateFloat3ForUniform;
    UniformBufferInternal.prototype._updateFloat4ForUniform = OriginalUpdateFloat4ForUniform;
    UniformBufferInternal.prototype._updateVector4ForUniform = OriginalUpdateVector4ForUniform;
}

// const TempBuffer = new Float32Array(UniformBufferInternal._MAX_UNIFORM_SIZE);
const TempMatArray = new Array(16).fill(0) as Tuple<number, 16>;
const TempMat: IMatrixLike = {
    asArray: () => TempMatArray,
    updateFlag: 0,
};
const TempVec4: IVector4Like = { w: 0, x: 0, y: 0, z: 0 };
//worldView cancels out
// worldviewprojectin, viewProjection
const MatSet = new Set(["world"]); // TODO: find all of the matrices that need to be updated
const Vect4Offset = new Set([""]); //"vLightData",
const Float3Offset = new Set([""]);
const Float4Offset = new Set([""]); //"vLightData",

const AlreadyLogged = new Set<string>();
const AlreadyLoggedUniform = new Set<string>();

function UniformOffsetVector4(uniformName: string, vector4: IVector4Like, offset: Vector3): IVector4Like {
    if (Vect4Offset.has(uniformName)) {
        TempVec4.w = vector4.w; // w?
        TempVec4.x = vector4.x - offset.x;
        TempVec4.y = vector4.y - offset.y;
        TempVec4.z = vector4.z - offset.z;
        if (!AlreadyLoggedUniform.has(uniformName)) {
            global.console.log(`vector4 uniform ${uniformName} pre ${vector4} post ${TempVec4}`);
            AlreadyLoggedUniform.add(uniformName);
        }
        return TempVec4;
    }
    return vector4;
}
function OffsetVector4(uniformName: string, vector4: IVector4Like, offset: Vector3): IVector4Like {
    // if (uniformName == "vEyePosition") {
    //     TempVec4.w = vector4.w; // w?
    //     TempVec4.x = 0;
    //     TempVec4.y = 0;
    //     TempVec4.z = 0;
    // } else
    if (Vect4Offset.has(uniformName)) {
        TempVec4.w = vector4.w; // w?
        TempVec4.x = vector4.x - offset.x;
        TempVec4.y = vector4.y - offset.y;
        TempVec4.z = vector4.z - offset.z;
        if (!AlreadyLogged.has(uniformName)) {
            global.console.log(`vector4 ${uniformName} pre ${vector4} post ${TempVec4}`);
            AlreadyLogged.add(uniformName);
        }
        return TempVec4;
    }
    return vector4;
}

function OffsetMatrix(uniformName: string, matrix: IMatrixLike, offset: Vector3): IMatrixLike {
    if (MatSet.has(uniformName)) {
        ApplyMatOffsetToRef(uniformName == "view" ? offset.negate() : offset, matrix.asArray(), TempMatArray);
        TempMat.updateFlag = matrix.updateFlag;
        if (!AlreadyLogged.has(uniformName)) {
            global.console.log(`matrix ${uniformName} pre ${matrix.asArray()} post ${TempMat.asArray()} tempmatarray ${TempMatArray}`);
            AlreadyLogged.add(uniformName);
        }
        return TempMat;
    }
    return matrix;
}

function UniformOffsetMatrix(uniformName: string, matrix: IMatrixLike, offset: Vector3): IMatrixLike {
    if (MatSet.has(uniformName)) {
        ApplyMatOffsetToRef(uniformName == "view" ? offset.negate() : offset, matrix.asArray(), TempMatArray);

        TempMat.updateFlag = matrix.updateFlag;
        if (!AlreadyLoggedUniform.has(uniformName)) {
            global.console.log(`matrix uniform ${uniformName} pre ${matrix.asArray()} post ${TempMat.asArray()} tempmatarray ${TempMatArray}`);
            AlreadyLoggedUniform.add(uniformName);
        }
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

export function SetFloatingOriginOffsets(scene: Scene) {
    Effect.prototype.setMatrix = function (uniformName: string, matrix: IMatrixLike) {
        this._pipelineContext!.setMatrix(uniformName, OffsetMatrix(uniformName, matrix, scene.floatingOriginOffset));
        return this;
    };

    Effect.prototype.setVector4 = function (uniformName: string, vector4: IVector4Like) {
        this._pipelineContext!.setVector4(uniformName, OffsetVector4(uniformName, vector4, scene.floatingOriginOffset));
        return this;
    };

    Effect.prototype.setFloat3 = function (uniformName: string, x: number, y: number, z: number) {
        // if (uniformName == "vEyePosition") {
        //     this._pipelineContext!.setFloat3(uniformName, 0, 0, 0);
        //     return this;
        // } else
        if (Float3Offset.has(uniformName)) {
            if (!AlreadyLogged.has(uniformName)) {
                global.console.log(
                    `Float3 ${uniformName} pre ${x},${y},${z} post ${x - scene.floatingOriginOffset.x},${y - scene.floatingOriginOffset.y},${z - scene.floatingOriginOffset.z}`
                );
                AlreadyLogged.add(uniformName);
            }
            this._pipelineContext!.setFloat3(uniformName, x - scene.floatingOriginOffset.x, y - scene.floatingOriginOffset.y, z - scene.floatingOriginOffset.z);
            return this;
        }
        this._pipelineContext!.setFloat3(uniformName, x, y, z);
        return this;
    };

    Effect.prototype.setFloat4 = function (uniformName: string, x: number, y: number, z: number, w: number) {
        // if (uniformName == "vEyePosition") {
        //     this._pipelineContext!.setFloat4(uniformName, 0, 0, 0, w);
        //     return this;
        // } else
        if (Float4Offset.has(uniformName)) {
            if (!AlreadyLogged.has(uniformName)) {
                global.console.log(
                    `Float4 ${uniformName} pre ${x},${y},${z},${w} post ${x - scene.floatingOriginOffset.x},${y - scene.floatingOriginOffset.y},${z - scene.floatingOriginOffset.z},${w}`
                );
                AlreadyLogged.add(uniformName);
            }
            this._pipelineContext!.setFloat4(uniformName, x - scene.floatingOriginOffset.x, y - scene.floatingOriginOffset.y, z - scene.floatingOriginOffset.z, w);
            return this;
        }
        this._pipelineContext!.setFloat4(uniformName, x, y, z, w);
        return this;
    };

    UniformBufferInternal.prototype._updateMatrixForUniform = function (name: string, mat: IMatrixLike) {
        // really slow, dont' do it, array function instead
        OriginalUpdateMatrixForUniform.call(this, name, UniformOffsetMatrix(name, mat, scene.floatingOriginOffset)); // keeps cache/update logic intact
        // const temp = OffsetMatrix(name, mat, scene.floatingOriginOffset);
        // if (this._cacheMatrix(name, temp)) {
        //     this.updateUniform(name, temp.asArray(), 16);
        // }
    };

    UniformBufferInternal.prototype._updateFloat4ForUniform = function (name: string, x: number, y: number, z: number, w: number) {
        if (Float4Offset.has(name)) {
            if (!AlreadyLoggedUniform.has(name)) {
                global.console.log(
                    `Float4 uniform${name} pre ${x},${y},${z},${w} post ${x - scene.floatingOriginOffset.x},${y - scene.floatingOriginOffset.y},${z - scene.floatingOriginOffset.z},${w}`
                );
                AlreadyLoggedUniform.add(name);
            }
        }
        const offset = Float4Offset.has(name) ? scene.floatingOriginOffset : Vector3.Zero();
        const ox = x - offset.x;
        const oy = y - offset.y;
        const oz = z - offset.z;
        return OriginalUpdateFloat4ForUniform.call(this, name, ox, oy, oz, w);
    };

    UniformBufferInternal.prototype._updateVector4ForUniform = function (name: string, vector: IVector4Like) {
        return OriginalUpdateVector4ForUniform.call(this, name, UniformOffsetVector4(name, vector, scene.floatingOriginOffset));
    };

    UniformBufferInternal.prototype._updateFloat3ForUniform = function (name: string, x: number, y: number, z: number) {
        if (Float3Offset.has(name)) {
            if (!AlreadyLoggedUniform.has(name)) {
                global.console.log(
                    `Float3 uniform ${name} pre ${x},${y},${z} post ${x - scene.floatingOriginOffset.x},${y - scene.floatingOriginOffset.y},${z - scene.floatingOriginOffset.z}`
                );
                AlreadyLoggedUniform.add(name);
            }
        }
        const offset = Float3Offset.has(name) ? scene.floatingOriginOffset : Vector3.Zero();
        return OriginalUpdateFloat3ForUniform.call(this, name, x - offset.x, y - offset.y, z - offset.z);
    };

    // UniformBuffer.prototype.updateMatrix = function (name: string, mat: IMatrixLike) {
    //     (this as any)._setPublicMethods();
    //     if (!(this as any)._noUBO) {
    //         OriginalUpdateMatrixForUniform.call(this, name, UniformOffsetMatrix(name, mat, scene.floatingOriginOffset)); // keeps cache/update logic intact
    //     } else {
    //         OriginalUpdateMatrix.call(this, name, mat);
    //     }
    //     // (this as any)._setPublicMethods();
    //     // OriginalUpdateMatrix.call(this, name, mat);
    // };

    // UniformBuffer.prototype.updateFloat3 = function (name: string, x: number, y: number, z: number) {
    //     // (this as any)._setPublicMethods();
    //     // OriginalUpdateFloat3.call(this, name, x, y, z);
    //     if (!(this as any)._noUBO) {
    //         if (Float3Offset.has(name)) {
    //             if (!AlreadyLoggedUniform.has(name)) {
    //                 global.console.log(
    //                     `Float3 uniform${name} pre ${x},${y},${z} post ${x - scene.floatingOriginOffset.x},${y - scene.floatingOriginOffset.y},${z - scene.floatingOriginOffset.z}`
    //                 );
    //                 AlreadyLoggedUniform.add(name);
    //             }
    //         }
    //         const offset = Float3Offset.has(name) ? scene.floatingOriginOffset : Vector3.Zero();
    //         const ox = x - offset.x;
    //         const oy = y - offset.y;
    //         const oz = z - offset.z;
    //         OriginalUpdateFloat3ForUniform.call(this, name, ox, oy, oz);
    //     } else {
    //         OriginalUpdateFloat3.call(this, name, x, y, z);
    //     }
    // };

    // UniformBuffer.prototype.updateFloat4 = function (name: string, x: number, y: number, z: number, w: number) {
    //     if (!(this as any)._noUBO) {
    //         if (Float4Offset.has(name)) {
    //             if (!AlreadyLoggedUniform.has(name)) {
    //                 global.console.log(
    //                     `Float4 uniform${name} pre ${x},${y},${z},${w} post ${x - scene.floatingOriginOffset.x},${y - scene.floatingOriginOffset.y},${z - scene.floatingOriginOffset.z},${w}`
    //                 );
    //                 AlreadyLoggedUniform.add(name);
    //             }
    //         }
    //         const offset = Float4Offset.has(name) ? scene.floatingOriginOffset : Vector3.Zero();
    //         const ox = x - offset.x;
    //         const oy = y - offset.y;
    //         const oz = z - offset.z;
    //         OriginalUpdateFloat4ForUniform.call(this, name, ox, oy, oz, w);
    //     } else {
    //         OriginalUpdateFloat4.call(this, name, x, y, z, w);
    //     }
    //     // (this as any)._setPublicMethods();
    //     // OriginalUpdateFloat4.call(this, name, x, y, z, w);
    // };

    // UniformBuffer.prototype.updateVector4 = function (name: string, vector: IVector4Like) {
    //     (this as any)._setPublicMethods();
    //     OriginalUpdateVector4.call(this, name, vector);
    //     if (!(this as any)._noUBO) {
    //         OriginalUpdateVector4ForUniform.call(this, name, UniformOffsetVector4(name, vector, scene.floatingOriginOffset)); // keeps cache/update logic intact
    //     } else {
    //         OriginalUpdateVector4.call(this, name, vector);
    //     }
    // };
    // UniformBufferInternal.prototype._updateFloat4ForUniform = function (name: string, x: number, y: number, z: number, w: number) {
    // const offset = Float4Offset.has(name) ? scene.floatingOriginOffset : Vector3.Zero();
    // TempBuffer[0] = x - offset.x;
    // TempBuffer[1] = y - offset.y;
    // TempBuffer[2] = z - offset.z;
    // TempBuffer[3] = w;
    // this.updateUniform(name, TempBuffer, 4);
    // };

    // UniformBufferInternal.prototype._updateVector4ForUniform = function (name: string, x: number, y: number, z: number, w: number) {
    // const offset = Vect4Offset.has(name) ? scene.floatingOriginOffset : Vector3.Zero();
    // TempBuffer[0] = x - offset.x;
    // TempBuffer[1] = y - offset.y;
    // TempBuffer[2] = z - offset.z;
    // TempBuffer[3] = w;
    // this.updateUniform(name, TempBuffer, 4);
    // };

    // UniformBufferInternal.prototype._updateFloat3ForUniform = function (name: string, x: number, y: number, z: number, w: number) {
    // const offset = Float3Offset.has(name) ? scene.floatingOriginOffset : Vector3.Zero();
    // TempBuffer[0] = x - offset.x;
    // TempBuffer[1] = y - offset.y;
    // TempBuffer[2] = z - offset.z;
    // this.updateUniform(name, TempBuffer, 3);
    // };
}
