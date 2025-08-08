/* eslint-disable @typescript-eslint/naming-convention */
import type {
    RawLottieAnimation,
    RawLottieLayer,
    RawGraphicElement,
    RawGroupShape,
    RawRectangleShape,
    RawPathShape,
    RawFillShape,
    RawGradientFillShape,
    RawTransformShape,
    RawTransform,
    RawScalarProperty,
    RawVectorProperty,
    RawVectorKeyframe,
    RawPositionProperty,
    RawPositionKeyframe,
    RawBezierShapeProperty,
    RawBezierShapeKeyframe,
    RawColorProperty,
    RawColorKeyframe,
    RawGradientsProperty,
    RawGradientProperty,
    RawKeyFrameEasing,
    RawBezier,
    RawNumberBoolean,
    RawLayerType,
    RawShapeType,
    RawShapeDirection,
    RawFillRule,
    RawGradientType,
} from "./rawTypes";

// Context-specific property mappings for semantic correctness
type AnimationPropertyMap = {
    v: "version";
    fr: "frameRate";
    ip: "inPoint";
    op: "outPoint";
    w: "width";
    h: "height";
    nm: "name";
    layers: "layers";
};

type LayerPropertyMap = {
    ind: "index";
    ty: "type";
    nm: "name";
    parent: "parent";
    hd: "hidden";
    sr: "stretch";
    ao: "autoOrient";
    ip: "inPoint";
    op: "outPoint";
    st: "startTime";
    ct: "collapseTransform";
    ks: "transform";
    shapes: "shapes";
};

type GraphicElementPropertyMap = {
    nm: "name";
    hd: "hidden";
    ty: "type";
    bm: "blendMode";
    ix: "index";
};

type GroupShapePropertyMap = GraphicElementPropertyMap & {
    it: "items";
};

type RectangleShapePropertyMap = GraphicElementPropertyMap & {
    d: "direction";
    p: "position";
    s: "size";
    r: "roundness";
};

type PathShapePropertyMap = GraphicElementPropertyMap & {
    d: "direction";
    ks: "shape";
};

type FillShapePropertyMap = GraphicElementPropertyMap & {
    o: "opacity";
    c: "color";
    r: "fillRule";
};

type GradientFillShapePropertyMap = GraphicElementPropertyMap & {
    o: "opacity";
    g: "gradient";
    s: "startPoint";
    e: "endPoint";
    t: "type";
    h: "highlightLength";
    a: "highlightAngle";
    r: "fillRule";
};

type TransformShapePropertyMap = GraphicElementPropertyMap & {
    a: "anchorPoint";
    p: "position";
    r: "rotation";
    s: "scale";
    o: "opacity";
    sk: "skew";
    sa: "skewAxis";
};

type TransformPropertyMap = {
    a: "anchorPoint";
    p: "position";
    r: "rotation";
    s: "scale";
    o: "opacity";
};

type PropertyPropertyMap = {
    a: "animated";
    k: "keyframes";
    l: "length";
};

type KeyframePropertyMap = {
    t: "time";
    s: "value";
    h: "holdFlag";
    i: "inTangent";
    o: "outTangent";
};

type PositionKeyframePropertyMap = KeyframePropertyMap & {
    ti: "valueInTangent";
    to: "valueOutTangent";
};

type BezierShapePropertyMap = {
    a: "animated";
    k: "keyframes";
};

type BezierShapeKeyframePropertyMap = KeyframePropertyMap & {
    s: "value";
};

type ColorPropertyMap = PropertyPropertyMap;

type GradientsPropertyMap = {
    p: "colorStopCount";
    k: "gradientProperty";
};

type GradientPropertyMap = {
    a: "animated";
    k: "keyframes";
};

type KeyFrameEasingPropertyMap = {
    x: "timeComponent";
    y: "valueComponent";
};

type BezierPropertyMap = {
    c: "closed";
    i: "inTangents";
    o: "outTangents";
    v: "vertices";
};
// ...existing code...

// ...existing code...

// Helper type for converting specific property types using both property name AND type
type ConvertPropertyType<K, T> =
    // First handle nested object types by property name
    K extends "layers"
        ? T extends RawLottieLayer[]
            ? LottieLayer[]
            : T
        : K extends "shapes" | "items" | "it"
          ? T extends RawGraphicElement[]
              ? GraphicElement[]
              : T
          : // Handle different 'ks' properties based on their actual type
            K extends "ks"
            ? T extends RawTransform
                ? LottieTransform
                : T extends RawBezierShapeProperty
                  ? BezierShapeProperty
                  : T
            : // Handle easing properties using RAW property names (i, o) - must come before scalar 'o'
              K extends "i" | "o"
              ? T extends RawKeyFrameEasing
                  ? KeyFrameEasing
                  : T extends RawScalarProperty
                    ? LottieScalarProperty
                    : T
              : // Handle position properties using RAW property names (a, p)
                K extends "a" | "p"
                ? T extends RawPositionProperty
                    ? PositionProperty
                    : T extends RawVectorProperty
                      ? LottieVectorProperty
                      : T
                : // Handle scalar properties using RAW property names (r, sk, sa, h, o)
                  K extends "r" | "sk" | "sa" | "h"
                  ? T extends RawScalarProperty
                      ? LottieScalarProperty
                      : T
                  : // Handle vector properties using RAW property names (s, e)
                    K extends "s" | "e"
                    ? T extends RawVectorProperty
                        ? LottieVectorProperty
                        : T
                    : // Handle color properties using RAW property names
                      K extends "c"
                      ? T extends RawColorProperty
                          ? ColorProperty
                          : T
                      : // Handle gradient properties using RAW property names
                        K extends "g"
                        ? T extends RawGradientsProperty
                            ? GradientsProperty
                            : T
                        : // Handle keyframes arrays using RAW property names
                          K extends "k" // keyframes
                          ? T extends RawVectorKeyframe[]
                              ? LottieVectorKeyframe[]
                              : T extends RawPositionKeyframe[]
                                ? PositionKeyframe[]
                                : T extends RawColorKeyframe[]
                                  ? ColorKeyframe[]
                                  : T extends RawBezierShapeKeyframe[]
                                    ? BezierShapeKeyframe[]
                                    : T extends number | RawVectorKeyframe[]
                                      ? number | LottieVectorKeyframe[]
                                      : T extends number[] | RawVectorKeyframe[]
                                        ? number[] | LottieVectorKeyframe[]
                                        : T extends RawGradientProperty
                                          ? GradientProperty
                                          : T extends RawBezier | RawBezierShapeKeyframe[]
                                            ? LottieBezier | BezierShapeKeyframe[]
                                            : T extends RawBezier
                                              ? LottieBezier
                                              : T
                          : // Handle bezier value arrays using RAW property names
                            K extends "s" // value in keyframes (might conflict with scale, but scale is handled above)
                            ? T extends RawBezier[]
                                ? LottieBezier[]
                                : T
                            : // Handle arrays of objects
                              T extends object
                              ? T extends any[]
                                  ? T extends (infer U)[]
                                      ? U extends object
                                          ? ConvertPropertyType<any, U>[]
                                          : T
                                      : T
                                  : T
                              : T;
// ...rest of the code remains the same...

// ...rest of the code remains the same...

// ...rest of the code remains the same...

// Utility type to rename properties and convert nested types
type RenameProperties<T, M extends Record<string, string>> = {
    [K in keyof T as K extends keyof M ? M[K] : K]: ConvertPropertyType<K, T[K]>;
};

// Descriptive types using context-specific mappings
export type LottieAnimation = RenameProperties<RawLottieAnimation, AnimationPropertyMap>;
export type LottieLayer = RenameProperties<RawLottieLayer, LayerPropertyMap>;
export type GraphicElement = RenameProperties<RawGraphicElement, GraphicElementPropertyMap>;
export type GroupShape = RenameProperties<RawGroupShape, GroupShapePropertyMap>;
export type RectangleShape = RenameProperties<RawRectangleShape, RectangleShapePropertyMap>;
export type PathShape = RenameProperties<RawPathShape, PathShapePropertyMap>;
export type FillShape = RenameProperties<RawFillShape, FillShapePropertyMap>;
export type GradientFillShape = RenameProperties<RawGradientFillShape, GradientFillShapePropertyMap>;
export type TransformShape = RenameProperties<RawTransformShape, TransformShapePropertyMap>;
export type LottieTransform = RenameProperties<RawTransform, TransformPropertyMap>;
export type LottieScalarProperty = RenameProperties<RawScalarProperty, PropertyPropertyMap>;
export type LottieVectorProperty = RenameProperties<RawVectorProperty, PropertyPropertyMap>;
export type LottieVectorKeyframe = RenameProperties<RawVectorKeyframe, KeyframePropertyMap>;
export type PositionProperty = RenameProperties<RawPositionProperty, PropertyPropertyMap>;
export type PositionKeyframe = RenameProperties<RawPositionKeyframe, PositionKeyframePropertyMap>;
export type BezierShapeProperty = RenameProperties<RawBezierShapeProperty, BezierShapePropertyMap>;
export type BezierShapeKeyframe = RenameProperties<RawBezierShapeKeyframe, BezierShapeKeyframePropertyMap>;
export type ColorProperty = RenameProperties<RawColorProperty, ColorPropertyMap>;
export type ColorKeyframe = RenameProperties<RawColorKeyframe, KeyframePropertyMap>;
export type GradientsProperty = RenameProperties<RawGradientsProperty, GradientsPropertyMap>;
export type GradientProperty = RenameProperties<RawGradientProperty, GradientPropertyMap>;
export type KeyFrameEasing = RenameProperties<RawKeyFrameEasing, KeyFrameEasingPropertyMap>;
export type LottieBezier = RenameProperties<RawBezier, BezierPropertyMap>;

// Re-export the simple types
export type NumberBoolean = RawNumberBoolean;
export type LayerType = RawLayerType;
export type ShapeType = RawShapeType;
export type ShapeDirection = RawShapeDirection;
export type FillRule = RawFillRule;
export type GradientType = RawGradientType;

/**
 * Converts a raw Lottie animation to one with descriptive property names.
 * This is a zero-cost operation at runtime.
 * @param raw - The raw Lottie animation data
 * @returns The same data but with TypeScript types that use descriptive property names
 */
export function asLottieAnimation(raw: RawLottieAnimation): LottieAnimation {
    return raw as any;
}

/**
 * Converts a raw Lottie layer to one with descriptive property names.
 * This is a zero-cost operation at runtime.
 * @param raw - The raw Lottie layer data
 * @returns The same data but with TypeScript types that use descriptive property names
 */
export function asLottieLayer(raw: RawLottieLayer): LottieLayer {
    return raw as any;
}

/**
 * Converts a raw graphic element to one with descriptive property names.
 * This is a zero-cost operation at runtime.
 * @param raw - The raw graphic element data
 * @returns The same data but with TypeScript types that use descriptive property names
 */
export function asGraphicElement(raw: RawGraphicElement): GraphicElement {
    return raw as any;
}

/**
 * Converts a raw transform to one with descriptive property names.
 * This is a zero-cost operation at runtime.
 * @param raw - The raw transform data
 * @returns The same data but with TypeScript types that use descriptive property names
 */
export function asTransform(raw: RawTransform): LottieTransform {
    return raw as any;
}

/**
 * Generic helper for converting any raw type to its descriptive counterpart.
 * This is a zero-cost operation at runtime.
 * @param raw - The raw data
 * @returns The same data but with TypeScript types that use descriptive property names
 */
export function asDescriptive<TRaw, TDescriptive>(raw: TRaw): TDescriptive {
    return raw as any;
}

/*
Usage examples:

// At the boundary where you receive raw data
const rawAnimation: RawLottieAnimation = JSON.parse(lottieJsonString);
const animation = asLottieAnimation(rawAnimation);

// Now you can use descriptive property names AND proper nested types
console.log(animation.version);     // instead of rawAnimation.v
console.log(animation.frameRate);   // instead of rawAnimation.fr
console.log(animation.width);       // instead of rawAnimation.w

// The layers property is now properly typed as LottieLayer[]
animation.layers.forEach(layer => {
    console.log(layer.name);        // instead of layer.nm
    console.log(layer.type);        // instead of layer.ty
    console.log(layer.hidden);      // instead of layer.hd
    
    // The shapes property is properly typed as GraphicElement[]
    if (layer.shapes) {
        layer.shapes.forEach(shape => {
            console.log(shape.name);    // instead of shape.nm
            console.log(shape.type);    // instead of shape.ty
        });
    }
});

// For transforms
const rawTransform: RawTransform = { a: {...}, p: {...}, r: {...} };
const transform = asTransform(rawTransform);
console.log(transform.anchorPoint); // instead of rawTransform.a
console.log(transform.position);    // instead of rawTransform.p
console.log(transform.rotation);    // instead of rawTransform.r
*/
