import type { IVector2Like } from "core/Maths/math.like";
import { ThinSprite } from "core/Sprites/thinSprite";

import type {
    LottieLayer,
    LottieGroupShape,
    LottieAnimation,
    LottieTransform,
    LottieGraphicElement,
    LottieVectorProperty,
    LottieRectangleShape,
    LottiePathShape,
    LottieFillShape,
    LottieGradientFillShape,
    LottieVectorKeyframe,
    LottieScalarProperty,
} from "./descriptiveTypes";
import type { AnimationInfo, ScalarKeyframe, ScalarProperty, Transform, Vector2Keyframe, Vector2Property } from "./parsedTypes";

import type { SpritePacker } from "../sprites/spritePacker";
import { SpriteNode } from "../sprites/spriteNode";

import { BezierCurve } from "../maths/bezier";

import type { RenderingManager } from "../rendering/renderingManager";
import { Node } from "../rendering/node";
import { ControlNode } from "../rendering/controlNode";

import type { AnimationConfiguration } from "../lottiePlayer";

/**
 * Type of the vector properties in the Lottie animation. It determines how the vector values are interpreted in Babylon.js.
 */
type VectorType = "Scale" | "Position" | "AnchorPoint";
/**
 * Type of the scalar properties in the Lottie animation. It determines how the scalar values are interpreted in Babylon.js.
 */
type ScalarType = "Rotation" | "Opacity";

/**
 * Default scale value for the scale property of a Lottie transform.
 */
const DefaultScale: IVector2Like = { x: 1, y: 1 };

/**
 * Default position value for the position property of a Lottie transform.
 */
const DefaultPosition: IVector2Like = { x: 0, y: 0 };

/**
 * Parses a lottie animation file and converts it into a format that can be rendered by Babylon.js
 * Important: not all lottie features are supported, you can call .debug() after parsing an animation to see what features were not supported.
 */
export class AnimationParser {
    private _packer: SpritePacker;
    private readonly _renderingManager: RenderingManager;
    private readonly _configuration: AnimationConfiguration;
    private readonly _animationInfo: AnimationInfo;

    private _unsupportedFeatures: string[];

    private _parentNodes: Map<number, Node>; // Map of nodes to build the scenegraph from the animation layers
    private _rootNodes: Node[]; // Array of root-level nodes in the animation, in top-down z order

    // Loop variables to save allocations
    private _shape: LottieGraphicElement | undefined = undefined;

    /**
     * Get the animation information parsed from the Lottie file.
     */
    public get animationInfo(): AnimationInfo {
        return this._animationInfo;
    }

    /**
     * Creates a new instance of the Lottie animations parser.
     * @param packer Object that packs the sprites from the animation into a texture atlas.
     * @param fileContentAsJsonString The content of the lottie file as a JSON string.
     * @param configuration Configuration options for the animation parser.
     * @param renderingManager Object that manages the rendering of the sprites in the animation.
     */
    public constructor(packer: SpritePacker, fileContentAsJsonString: string, configuration: AnimationConfiguration, renderingManager: RenderingManager) {
        this._packer = packer;
        this._renderingManager = renderingManager;
        this._configuration = configuration;

        this._unsupportedFeatures = [];

        this._parentNodes = new Map<number, Node>();
        this._rootNodes = [];

        this._animationInfo = this._loadFromData(fileContentAsJsonString);
    }

    /**
     * Logs to the console all issues that were encountered during parsing the file.
     */
    public debug() {
        for (let i = 0; i < this._unsupportedFeatures.length; i++) {
            // eslint-disable-next-line no-console
            console.log(this._unsupportedFeatures[i]);
        }
    }

    private _loadFromData(fileContentAsJsonString: string): AnimationInfo {
        this._unsupportedFeatures.length = 0; // Clear previous errors
        const lottieData = JSON.parse(fileContentAsJsonString) as LottieAnimation;

        for (let i = 0; i < lottieData.layers.length; i++) {
            this._parseLayer(lottieData.layers[i]);
        }

        // Update the atlas texture after creating all sprites from the animation
        this._packer.updateAtlasTexture();

        // Reorder the sprites from back to front
        this._renderingManager.ready();

        // Release the canvas to avoid memory leaks
        this._packer.releaseCanvas();
        this._packer = undefined as any; // Clear the reference to the sprite packer to allow garbage collection

        return {
            startFrame: lottieData.inPoint,
            endFrame: lottieData.outPoint,
            frameRate: lottieData.frameRate,
            widthPx: lottieData.width,
            heightPx: lottieData.height,
            nodes: this._rootNodes,
        };
    }

    private _parseLayer(layer: LottieLayer): void {
        if (layer.hidden === true) {
            return; // Ignore hidden layers
        }

        if (layer.type !== 3 && layer.type !== 4) {
            this._unsupportedFeatures.push(`UnsupportedLayerType - Index: ${layer.index} Name: ${layer.name} Type: ${layer.type}`);
            return;
        }

        if (layer.index === undefined || layer.inPoint === undefined || layer.outPoint === undefined || layer.startTime === undefined) {
            this._unsupportedFeatures.push(`Layer without required values - Name: ${layer.name}`);
            return;
        }

        let parentNode: Node | undefined = undefined;
        if (layer.parent) {
            parentNode = this._parentNodes.get(layer.parent);
            if (parentNode === undefined) {
                this._unsupportedFeatures.push(`Parent node with index ${layer.parent} not found for layer ${layer.name}`);
            }
        }

        const transform = this._parseTransform(layer.transform);

        const controlNode = new ControlNode(
            parentNode ? `${parentNode.id} - ${layer.name} - ControlNode (TRS)` : `${layer.name} - ControlNode (TRS)`,
            this._configuration.ignoreOpacityAnimations,
            layer.inPoint,
            layer.outPoint,
            transform.position,
            transform.rotation,
            transform.scale,
            transform.opacity,
            parentNode
        );

        // Nodes without a parent are top-level nodes in the scenegraph
        if (!parentNode) {
            this._rootNodes.push(controlNode);
        }

        const anchorNode = new Node(
            parentNode ? `${parentNode.id} - ${layer.name} - Node (Anchor)` : `${layer.name} - Node (Anchor)`,
            this._configuration.ignoreOpacityAnimations,
            transform.anchorPoint,
            undefined, // Rotation is not used for anchor point
            undefined, // Scale is not used for anchor point
            undefined, // Opacity is not used for anchor point
            controlNode
        );

        // Anchor nodes are always the parent of the control node of a child layer, build a map to build the scenegraph
        this._parentNodes.set(layer.index, anchorNode);

        // Create the sprites for the layer if it has shapes
        if (layer.shapes && layer.shapes.length > 0) {
            const scalingFactor = this._getScaleFactor(anchorNode);
            this._parseShapes(anchorNode, layer.shapes, scalingFactor);
        }
    }

    private _parseShapes(parent: Node, shapes: LottieGraphicElement[], scalingFactor: IVector2Like): void {
        for (let i = 0; i < shapes.length; i++) {
            if (shapes[i].hidden === true) {
                continue; // Ignore hidden shapes
            }

            if (shapes[i].type === "gr") {
                this._parseGroupShape(parent, shapes[i], scalingFactor);
            } else {
                this._unsupportedFeatures.push(`Only group shapes are supported as children of layers - Name: ${shapes[i].name} Type: ${shapes[i].type}`);
                continue;
            }
        }
    }

    private _parseGroupShape(parent: Node, group: LottieGroupShape, scalingFactor: IVector2Like): void {
        if (!group.items || group.items.length === 0) {
            return;
        }

        let transform: Transform | undefined = undefined;
        for (let i = 0; i < group.items.length; i++) {
            this._shape = group.items[i];
            if (this._shape?.type === "gr") {
                this._unsupportedFeatures.push(`Nested group shapes are not supported. - Group ${group.name} - Nested Group ${this._shape.name}`);
            } else if (this._shape?.type === "tr") {
                transform = this._parseTransform(this._shape as LottieTransform);
            } else if (this._shape?.type === "sh") {
                this._validatePathShape(this._shape as LottiePathShape);
            } else if (this._shape?.type === "rc") {
                this._validateRectangleShape(this._shape as LottieRectangleShape);
            } else if (this._shape?.type === "fl") {
                this._validateFillShape(this._shape as LottieFillShape);
            } else if (this._shape?.type === "gf") {
                this._validateGradientFillShape(this._shape as LottieGradientFillShape);
            } else if (this._shape) {
                this._unsupportedFeatures.push(`Unsupported shape type - Name: ${this._shape.name} Type: ${this._shape.type}`);
            }
        }

        if (transform === undefined) {
            this._unsupportedFeatures.push(`Group ${group.name} does not have a transform which is not supported`);
            return;
        }

        const trsNode = new Node(
            `${parent.id} - ${group.name} - ControlNode (TRS)`,
            this._configuration.ignoreOpacityAnimations,
            transform.position,
            transform.rotation,
            transform.scale,
            transform.opacity,
            parent
        );

        const spriteInfo = this._packer.addLottieShape(group, scalingFactor);

        const sprite = new ThinSprite();

        // Set sprite UV coordinates
        sprite._xOffset = spriteInfo.uOffset;
        sprite._yOffset = spriteInfo.vOffset;
        sprite._xSize = spriteInfo.cellWidth;
        sprite._ySize = spriteInfo.cellHeight;

        // Set sprite dimensions for rendering
        sprite.width = spriteInfo.widthPx;
        sprite.height = spriteInfo.heightPx;
        sprite.invertV = true;

        this._renderingManager.addSprite(sprite);

        transform.anchorPoint.startValue.x += spriteInfo.centerX || 0;
        transform.anchorPoint.startValue.y -= spriteInfo.centerY || 0;

        new SpriteNode(
            `${parent.id} - ${group.name} - SpriteNode (Anchor)`,
            this._configuration.ignoreOpacityAnimations,
            sprite,
            transform.anchorPoint,
            undefined, // Rotation is not used for anchor point
            undefined, // Scale is not used for anchor point
            undefined, // Opacity is not used for anchor point
            trsNode
        );
    }

    private _parseTransform(transform: LottieTransform): Transform {
        // Access using raw properties with descriptive names as fallback
        return {
            opacity: this._fromLottieScalarToBabylonScalar(transform.opacity, "Opacity", 1),
            rotation: this._fromLottieScalarToBabylonScalar(transform.rotation, "Rotation", 0),
            scale: this._fromLottieVector2ToBabylonVector2(transform.scale, "Scale", DefaultScale),
            position: this._fromLottieVector2ToBabylonVector2(transform.position, "Position", DefaultPosition),
            anchorPoint: this._fromLottieVector2ToBabylonVector2(transform.anchorPoint, "AnchorPoint", DefaultPosition),
        };
    }

    private _fromLottieScalarToBabylonScalar(property: LottieScalarProperty | undefined, scalarType: ScalarType, defaultValue: number): ScalarProperty {
        if (!property) {
            return {
                startValue: defaultValue,
                currentValue: defaultValue,
                currentKeyframeIndex: 0,
            };
        }

        if (property.animated === 0) {
            return {
                startValue: property.keyframes as number,
                currentValue: property.keyframes as number,
                currentKeyframeIndex: 0,
            };
        }

        const keyframes: ScalarKeyframe[] = [];
        const rawKeyFrames = property.keyframes;
        if (!Array.isArray(rawKeyFrames)) {
            throw new Error("parsing error");
        }
        let i = 0;
        for (i = 0; i < rawKeyFrames.length; i++) {
            const kf = rawKeyFrames[i];
            let easeFunction: BezierCurve | undefined = undefined;
            if (!IsCompleteLottieKeyFrame(kf)) {
                throw new Error("Incomplete Lottie KeyFrame");
            }
            if (AreArrayTangents(kf)) {
                // Value is an array
                easeFunction = new BezierCurve(
                    kf.outTangent.timeComponent[0],
                    kf.outTangent.valueComponent[0],
                    kf.inTangent.timeComponent[0],
                    kf.inTangent.valueComponent[0],
                    this._configuration.easingSteps
                );
            } else {
                // Value is a number
                easeFunction = new BezierCurve(
                    kf.outTangent.timeComponent as number,
                    kf.outTangent.valueComponent as number,
                    kf.inTangent.timeComponent as number,
                    kf.inTangent.valueComponent as number,
                    this._configuration.easingSteps
                );
            }

            let value = kf.value[0];
            if (scalarType === "Rotation") {
                value = (value * Math.PI) / 180; // Lottie uses degrees for rotation, convert to radians
            }

            keyframes.push({
                value: value,
                time: kf.time,
                easeFunction, // We assume that the ease function is always defined if we have keyframes
            });
        }

        let startValue = rawKeyFrames[0].value[0];
        if (scalarType === "Rotation") {
            startValue = (startValue * Math.PI) / 180; // Lottie uses degrees for rotation, convert to radians
        }

        return {
            startValue: startValue,
            currentValue: startValue,
            keyframes: keyframes,
            currentKeyframeIndex: 0,
        };
    }

    private _fromLottieVector2ToBabylonVector2(property: LottieVectorProperty | undefined, vectorType: VectorType, defaultValue: IVector2Like): Vector2Property {
        if (!property) {
            return {
                startValue: defaultValue,
                currentValue: defaultValue,
                currentKeyframeIndex: 0,
            };
        }

        if (property.length !== undefined && property.length !== 2) {
            this._unsupportedFeatures.push(`Invalid Vector2 Length - Length: ${property.length}`);
            return {
                startValue: defaultValue,
                currentValue: defaultValue,
                currentKeyframeIndex: 0,
            };
        }

        if (property.animated === 0) {
            const values = property.keyframes as number[];
            const value = this._calculateFinalVector(values[0], values[1], vectorType);
            return {
                startValue: value,
                currentValue: value,
                currentKeyframeIndex: 0,
            };
        }

        const keyframes: Vector2Keyframe[] = [];
        const rawKeyFrames = property.keyframes as LottieVectorKeyframe[];
        let i = 0;
        for (i = 0; i < rawKeyFrames.length; i++) {
            let easeFunction1: BezierCurve | undefined = undefined;
            const kf = rawKeyFrames[i];
            if (!IsCompleteLottieKeyFrame(kf)) {
                throw new Error("Incomplete Lottie KeyFrame");
            }
            if (AreArrayTangents(kf)) {
                // Value is an array
                easeFunction1 = new BezierCurve(
                    kf.outTangent.timeComponent[0],
                    kf.outTangent.valueComponent[0],
                    kf.inTangent.timeComponent[0],
                    kf.inTangent.valueComponent[0],
                    this._configuration.easingSteps
                );
            } else {
                // Value is a number
                easeFunction1 = new BezierCurve(
                    kf.outTangent.timeComponent as number,
                    kf.outTangent.valueComponent as number,
                    kf.inTangent.timeComponent as number,
                    kf.inTangent.valueComponent as number,
                    this._configuration.easingSteps
                );
            }
            let easeFunction2: BezierCurve | undefined = undefined;
            if (AreArrayTangents(kf)) {
                // Value is an array
                easeFunction2 = new BezierCurve(
                    kf.outTangent.timeComponent[1],
                    kf.outTangent.valueComponent[1],
                    kf.inTangent.timeComponent[1],
                    kf.inTangent.valueComponent[1],
                    this._configuration.easingSteps
                );
            } else {
                // Value is a number
                easeFunction2 = new BezierCurve(
                    kf.outTangent.timeComponent as number,
                    kf.outTangent.valueComponent as number,
                    kf.inTangent.timeComponent as number,
                    kf.inTangent.valueComponent as number,
                    this._configuration.easingSteps
                );
            }
            keyframes.push({
                value: this._calculateFinalVector(kf.value[0], kf.value[1], vectorType),
                time: kf.time,
                easeFunction1: easeFunction1!, // We assume that the ease function is always defined if we have keyframes
                easeFunction2: easeFunction2!, // We assume that the ease function is always defined if we have keyframes
            });
        }

        const startValue = this._calculateFinalVector(rawKeyFrames[0].value[0], rawKeyFrames[0].value[1], vectorType);
        return {
            startValue: startValue,
            currentValue: { x: startValue.x, y: startValue.y }, // All vectors are passed by reference, so we need to create a copy to avoid modifying the start value
            keyframes: keyframes,
            currentKeyframeIndex: 0,
        };
    }

    private _calculateFinalVector(x: number, y: number, vectorType: VectorType): IVector2Like {
        const result = { x, y };

        if (vectorType === "Position") {
            // Lottie uses a different coordinate system for position, so we need to invert the Y value
            result.y = -result.y;
        } else if (vectorType === "AnchorPoint") {
            // Lottie uses a different coordinate system for anchor point, so we need to invert the X value
            result.x = -result.x;
        } else if (vectorType === "Scale") {
            // Lottie uses a different coordinate system for scale, so we need to divide by 100
            result.x = result.x / 100;
            result.y = result.y / 100;
        }

        return result;
    }

    private _getScaleFactor(node: Node): IVector2Like {
        const scale = { x: node.startScale.x, y: node.startScale.y };
        while (node.parent) {
            node = node.parent;
            scale.x *= node.startScale.x;
            scale.y *= node.startScale.y;
        }

        scale.x = scale.x * this._configuration.scaleMultiplier;
        scale.y = scale.y * this._configuration.scaleMultiplier;

        return scale;
    }

    private _validatePathShape(pathShape: LottiePathShape): void {
        if (pathShape.shape.animated === 1) {
            this._unsupportedFeatures.push(`Path ${pathShape.name} has animated properties which are not supported`);
        }
    }

    private _validateRectangleShape(rectShape: LottieRectangleShape): void {
        if (rectShape.position.animated === 1) {
            this._unsupportedFeatures.push(`Rectangle ${rectShape.name} has an position property that is animated which is not supported`);
        }

        if (rectShape.size.animated === 1) {
            this._unsupportedFeatures.push(`Rectangle ${rectShape.name} has a size property that is animated which is not supported`);
        }

        if (rectShape.roundness.animated === 1) {
            this._unsupportedFeatures.push(`Rectangle ${rectShape.name} has a rounded corners property that is animated which is not supported`);
        }
    }

    private _validateFillShape(fillShape: LottieFillShape): void {
        if (fillShape.opacity.animated === 1) {
            this._unsupportedFeatures.push(`Fill ${fillShape.name} has an opacity property that is animated which is not supported`);
        }

        if (fillShape.color?.animated === 1) {
            this._unsupportedFeatures.push(`Fill ${fillShape.name} has a color property that is animated which is not supported`);
        }
    }

    private _validateGradientFillShape(gradFillShape: LottieGradientFillShape): void {
        if (gradFillShape.opacity.animated === 1) {
            this._unsupportedFeatures.push(`Gradient fill ${gradFillShape.name} has an opacity property that is animated which is not supported`);
        }

        if (gradFillShape.startPoint.animated === 1) {
            this._unsupportedFeatures.push(`Gradient fill ${gradFillShape.name} has a start point property that is animated which is not supported`);
        }

        if (gradFillShape.endPoint.animated === 1) {
            this._unsupportedFeatures.push(`Gradient fill ${gradFillShape.name} has an end point property that is animated which is not supported`);
        }
    }
}

const IsCompleteLottieKeyFrame = (keyframe: LottieVectorKeyframe): keyframe is Required<LottieVectorKeyframe> => {
    return (
        keyframe.outTangent !== undefined &&
        keyframe.inTangent !== undefined &&
        keyframe.outTangent.timeComponent !== undefined &&
        keyframe.outTangent.valueComponent !== undefined &&
        keyframe.inTangent.timeComponent !== undefined &&
        keyframe.inTangent.valueComponent !== undefined
    );
};

const AreArrayTangents = (keyFrame: Required<LottieVectorKeyframe>): keyFrame is LottieVectorKeyframeWithArrayTangents => {
    return (
        Array.isArray(keyFrame.outTangent.timeComponent) &&
        Array.isArray(keyFrame.outTangent.valueComponent) &&
        Array.isArray(keyFrame.inTangent.timeComponent) &&
        Array.isArray(keyFrame.inTangent.valueComponent)
    );
};

type LottieVectorKeyframeWithArrayTangents = Required<LottieVectorKeyframe> & {
    outTangent: {
        timeComponent: number[];
        valueComponent: number[];
    };
    inTangent: {
        timeComponent: number[];
        valueComponent: number[];
    };
};
