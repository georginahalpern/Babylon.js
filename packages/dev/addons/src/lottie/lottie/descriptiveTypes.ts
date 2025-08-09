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

// Helper type for converting specific property types using both property name AND type
type ConvertPropertyType<K, T> =
    // First handle nested object types by property name
    K extends "layers"
        ? T extends RawLottieLayer[]
            ? LottieLayer[]
            : T
        : K extends "shapes" | "items" | "it"
          ? T extends RawGraphicElement[]
              ? LottieGraphicElement[]
              : T
          : // Handle different 'ks' properties based on their actual type
            K extends "ks"
            ? T extends RawTransform
                ? LottieTransform
                : T extends RawBezierShapeProperty
                  ? LottieBezierShapeProperty
                  : T
            : // Handle easing properties using RAW property names (i, o) - must come before scalar 'o'
              K extends "i" | "o"
              ? T extends RawKeyFrameEasing
                  ? LottieKeyFrameEasing
                  : T extends RawScalarProperty
                    ? LottieScalarProperty
                    : T
              : // Handle position properties using RAW property names (a, p)
                K extends "a" | "p"
                ? T extends RawPositionProperty
                    ? LottiePositionProperty
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
                          ? LottieColorProperty
                          : T
                      : // Handle gradient properties using RAW property names
                        K extends "g"
                        ? T extends RawGradientsProperty
                            ? LottieGradientsProperty
                            : T
                        : // Handle keyframes arrays using RAW property names
                          K extends "k" // keyframes
                          ? T extends RawVectorKeyframe[]
                              ? LottieVectorKeyframe[]
                              : T extends RawPositionKeyframe[]
                                ? LottiePositionKeyframe[]
                                : T extends RawColorKeyframe[]
                                  ? LottieColorKeyframe[]
                                  : T extends RawBezierShapeKeyframe[]
                                    ? LottieBezierShapeKeyframe[]
                                    : T extends number | RawVectorKeyframe[]
                                      ? number | LottieVectorKeyframe[]
                                      : T extends number[] | RawVectorKeyframe[]
                                        ? number[] | LottieVectorKeyframe[]
                                        : T extends RawGradientProperty
                                          ? LottieGradientProperty
                                          : T extends RawBezier | RawBezierShapeKeyframe[]
                                            ? LottieBezier | LottieBezierShapeKeyframe[]
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

// Utility type to rename properties and convert nested types
type RenameProperties<T, M extends Record<string, string>> = {
    [K in keyof T as K extends keyof M ? M[K] : K]: ConvertPropertyType<K, T[K]>;
};

// Descriptive types using context-specific mappings
export type LottieAnimation = RenameProperties<RawLottieAnimation, AnimationPropertyMap>;
export type LottieLayer = RenameProperties<RawLottieLayer, LayerPropertyMap>;
export type LottieGraphicElement = RenameProperties<RawGraphicElement, GraphicElementPropertyMap>;
export type LottieGroupShape = RenameProperties<RawGroupShape, GroupShapePropertyMap>;
export type LottieRectangleShape = RenameProperties<RawRectangleShape, RectangleShapePropertyMap>;
export type LottiePathShape = RenameProperties<RawPathShape, PathShapePropertyMap>;
export type LottieFillShape = RenameProperties<RawFillShape, FillShapePropertyMap>;
export type LottieGradientFillShape = RenameProperties<RawGradientFillShape, GradientFillShapePropertyMap>;
export type LottieTransformShape = RenameProperties<RawTransformShape, TransformShapePropertyMap>;
export type LottieTransform = RenameProperties<RawTransform, TransformPropertyMap>;
export type LottieScalarProperty = RenameProperties<RawScalarProperty, PropertyPropertyMap>;
export type LottieVectorProperty = RenameProperties<RawVectorProperty, PropertyPropertyMap>;
export type LottieVectorKeyframe = RenameProperties<RawVectorKeyframe, KeyframePropertyMap>;
export type LottiePositionProperty = RenameProperties<RawPositionProperty, PropertyPropertyMap>;
export type LottiePositionKeyframe = RenameProperties<RawPositionKeyframe, PositionKeyframePropertyMap>;
export type LottieBezierShapeProperty = RenameProperties<RawBezierShapeProperty, BezierShapePropertyMap>;
export type LottieBezierShapeKeyframe = RenameProperties<RawBezierShapeKeyframe, BezierShapeKeyframePropertyMap>;
export type LottieColorProperty = RenameProperties<RawColorProperty, ColorPropertyMap>;
export type LottieColorKeyframe = RenameProperties<RawColorKeyframe, KeyframePropertyMap>;
export type LottieGradientsProperty = RenameProperties<RawGradientsProperty, GradientsPropertyMap>;
export type LottieGradientProperty = RenameProperties<RawGradientProperty, GradientPropertyMap>;
export type LottieKeyFrameEasing = RenameProperties<RawKeyFrameEasing, KeyFrameEasingPropertyMap>;
export type LottieBezier = RenameProperties<RawBezier, BezierPropertyMap>;

// Re-export the simple types
export type NumberBoolean = RawNumberBoolean;
export type LayerType = RawLayerType;
export type ShapeType = RawShapeType;
export type ShapeDirection = RawShapeDirection;
export type FillRule = RawFillRule;
export type GradientType = RawGradientType;
