import type { Scene } from "../scene";
import { Effect } from "../Materials/effect";
import type { IMatrixLike, IVector3Like, IVector4Like, Matrix } from "../Maths";
import { TmpVectors } from "../Maths";
import { UniformBuffer } from "./uniformBuffer";

const UniformBufferInternal = UniformBuffer as any;

// Store original methods we'll be wrapping
const OriginalSetMatrix = Effect.prototype.setMatrix;
const OriginalSetVector4 = Effect.prototype.setVector4;
const OriginalSetFloat3 = Effect.prototype.setFloat3;
const OriginalSetFloat4 = Effect.prototype.setFloat4;

const OriginalUpdateMatrixForUniform = UniformBufferInternal.prototype._updateMatrixForUniform;
const OriginalUpdateFloat3ForUniform = UniformBufferInternal.prototype._updateFloat3ForUniform;
const OriginalUpdateFloat4ForUniform = UniformBufferInternal.prototype._updateFloat4ForUniform;
const OriginalUpdateVector4ForUniform = UniformBufferInternal.prototype._updateVector4ForUniform;

const OriginalUpdateMatrixForEffect = UniformBufferInternal.prototype._updateMatrixForEffect;
const OriginalUpdateFloat3ForEffect = UniformBufferInternal.prototype._updateFloat3ForEffect;
const OriginalUpdateFloat4ForEffect = UniformBufferInternal.prototype._updateFloat4ForEffect;
const OriginalUpdateVector4ForEffect = UniformBufferInternal.prototype._updateVector4ForEffect;

export function ResetOriginalEffectMethods() {
    Effect.prototype.setMatrix = OriginalSetMatrix;
    Effect.prototype.setVector4 = OriginalSetVector4;
    Effect.prototype.setFloat3 = OriginalSetFloat3;
    Effect.prototype.setFloat4 = OriginalSetFloat4;

    UniformBufferInternal.prototype._updateMatrixForUniformOffset = OriginalUpdateMatrixForUniform;
    UniformBufferInternal.prototype._updateFloat3ForUniformOffset = OriginalUpdateFloat3ForUniform;
    UniformBufferInternal.prototype._updateFloat4ForUniformOffset = OriginalUpdateFloat4ForUniform;
    UniformBufferInternal.prototype._updateVector4ForUniformOffset = OriginalUpdateVector4ForUniform;

    UniformBufferInternal.prototype._updateMatrixForEffectOffset = OriginalUpdateMatrixForEffect;
    UniformBufferInternal.prototype._updateFloat3ForEffectOffset = OriginalUpdateFloat3ForEffect;
    UniformBufferInternal.prototype._updateFloat4ForEffectOffset = OriginalUpdateFloat4ForEffect;
    UniformBufferInternal.prototype._updateVector4ForEffectOffset = OriginalUpdateVector4ForEffect;
}

const TempVec4: IVector4Like = { w: 0, x: 0, y: 0, z: 0 };

function OffsetVectorLike(vector4: IVector4Like, offset: IVector3Like): IVector4Like {
    TempVec4.w = vector4.w;
    TempVec4.x = vector4.x - offset.x;
    TempVec4.y = vector4.y - offset.y;
    TempVec4.z = vector4.z - offset.z;

    return TempVec4;
}

export function OverrideOffsetableEffectMethods(scene: Scene) {
    Effect.prototype.setOffsetMatrix = function (uniformName: string, matrix: IMatrixLike, _offset: () => IMatrixLike) {
        this._pipelineContext!.setMatrix(uniformName, _offset());
        return this;
    };

    Effect.prototype.setOffsettableVector4 = function (uniformName: string, vector4: IVector4Like, _o: IVector3Like) {
        const offset = scene.floatingOriginOffset;
        this._pipelineContext!.setVector4(uniformName, OffsetVectorLike(vector4, offset));
        return this;
    };

    Effect.prototype.setOffsettableFloat3 = function (uniformName: string, x: number, y: number, z: number, _o: IVector3Like) {
        const offset = scene.floatingOriginOffset;
        this._pipelineContext!.setFloat3(uniformName, x - offset.x, y - offset.y, z - offset.z);
        return this;
    };

    Effect.prototype.setOffsettableFloat4 = function (uniformName: string, x: number, y: number, z: number, w: number, _o: IVector3Like) {
        const offset = scene.floatingOriginOffset;
        this._pipelineContext!.setFloat4(uniformName, x - offset.x, y - offset.y, z - offset.z, w);
        return this;
    };

    UniformBufferInternal.prototype._updateFloat3ForUniformOffset = function (name: string, x: number, y: number, z: number, suffix: string | undefined, _o: IVector3Like) {
        const offset = scene.floatingOriginOffset;

        OriginalUpdateFloat3ForUniform.call(this, name, x - offset.x, y - offset.y, z - offset.z, suffix);
    };

    UniformBufferInternal.prototype._updateMatrixForUniformOffset = function (name: string, mat: IMatrixLike, _offset: () => IMatrixLike) {
        OriginalUpdateMatrixForUniform.call(this, name, _offset());
    };

    UniformBufferInternal.prototype._updateFloat4ForUniformOffset = function (
        name: string,
        x: number,
        y: number,
        z: number,
        w: number,
        suffix: string | undefined,
        _o: IVector3Like
    ) {
        const offset = scene.floatingOriginOffset;
        OriginalUpdateFloat4ForUniform.call(this, name, x - offset.x, y - offset.y, z - offset.z, w, suffix);
    };

    UniformBufferInternal.prototype._updateVector4ForUniformOffset = function (name: string, vector: IVector4Like, _o: IVector3Like) {
        const offset = scene.floatingOriginOffset;
        OriginalUpdateVector4ForUniform.call(this, name, OffsetVectorLike(vector, offset));
    };

    UniformBufferInternal.prototype._updateFloat3ForEffectOffset = function (name: string, x: number, y: number, z: number, suffix: string | undefined, _o: IVector3Like) {
        const offset = scene.floatingOriginOffset;
        OriginalUpdateFloat3ForEffect.call(this, name, x - offset.x, y - offset.y, z - offset.z, suffix);
    };

    UniformBufferInternal.prototype._updateFloat4ForEffectOffset = function (
        name: string,
        x: number,
        y: number,
        z: number,
        w: number,
        suffix: string | undefined,
        _offset: IVector3Like
    ) {
        const offset = scene.floatingOriginOffset;
        OriginalUpdateFloat4ForEffect.call(this, name, x - offset.x, y - offset.y, z - offset.z, w, suffix);
    };

    UniformBufferInternal.prototype._updateVector4ForEffectOffset = function (name: string, vector: IVector4Like, _o: IVector3Like) {
        OriginalUpdateVector4ForEffect.call(this, name, OffsetVectorLike(vector, scene.floatingOriginOffset));
    };

    UniformBufferInternal.prototype._updateMatrixForEffectOffset = function (name: string, mat: IMatrixLike, _offset: () => IMatrixLike) {
        OriginalUpdateMatrixForEffect.call(this, name, _offset());
    };
}

const Ref = TmpVectors.Matrix[4];

export const WorldOffset = (world: Matrix, scene: Scene) =>
    Ref.copyFrom(world).addTranslationFromFloats(-scene.floatingOriginOffset.x, -scene.floatingOriginOffset.y, -scene.floatingOriginOffset.z);

export const ViewOffset = (scene: Scene) => Ref.copyFrom(scene.getViewMatrix()).setTranslationFromFloats(0, 0, 0);

export const WorldViewOffset = (scene: Scene) =>
    Ref.copyFrom(scene.getTransformMatrix()).addTranslationFromFloats(-scene.floatingOriginOffset.x, -scene.floatingOriginOffset.y, -scene.floatingOriginOffset.z);

export const ViewProjectionOffset = (scene: Scene) => ViewOffset(scene).multiplyToRef(scene.getProjectionMatrix(), Ref);

export const WorldViewProjectionOffset = (scene: Scene) => WorldViewOffset(scene).multiplyToRef(scene.getProjectionMatrix(), Ref);

export const WorldOffset2 = (world: Matrix, offset: IVector3Like) => Ref.copyFrom(world).addTranslationFromFloats(-offset.x, -offset.y, -offset.z);
export const ViewOffset2 = (view: Matrix) => Ref.copyFrom(view).setTranslationFromFloats(0, 0, 0);
export const WorldViewOffset2 = (worldView: Matrix, offset: IVector3Like) => Ref.copyFrom(worldView).addTranslationFromFloats(-offset.x, -offset.y, -offset.z);
export const ViewProjectionOffset2 = (view: Matrix, projection: Matrix) => ViewOffset2(view).multiplyToRef(projection, Ref);
export const WorldViewProjectionOffset2 = (worldView: Matrix, projection: Matrix, offset: IVector3Like) =>
    WorldViewOffset2(worldView, offset).multiplyToRef(projection, TmpVectors.Matrix[5]);
