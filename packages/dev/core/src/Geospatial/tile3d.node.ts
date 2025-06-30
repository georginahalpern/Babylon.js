// export var SubdivisionScheme;
// (function (SubdivisionScheme) {
//     SubdivisionScheme[SubdivisionScheme["QUADTREE"] = 0] = "QUADTREE";
//     SubdivisionScheme[SubdivisionScheme["OCTREE"] = 1] = "OCTREE";
// })(SubdivisionScheme || (SubdivisionScheme = {}));

// import { RefinementStrategy } from "./tile3d.interfaces";
// import { Bounds } from "core/geometry";
// export class Tile3DNode {
//     static Split(node, sub, refinement, constructor, error) {
//         if (node.boundingBox) {
//             const buildChild = (bounds, error) => {
//                 const n = constructor ? new constructor(bounds, error) : new Tile3DNode(bounds);
//                 if (n) {
//                     n.refinementStrategy = refinement ?? node.refinementStrategy;
//                 }
//                 return n;
//             };
//             const { xmin, ymin, zmin, width, height, depth } = node.boundingBox;
//             const halfWidth = width / 2;
//             const halfHeight = height / 2;
//             const halfDepth = depth / 2;
//             const midX = xmin + halfWidth;
//             const midY = ymin + halfHeight;
//             const midZ = zmin + halfDepth;
//             const d = error ? error(node.geometricError) : node.geometricError / 2;
//             switch (sub) {
//                 case SubdivisionScheme.QUADTREE: {
//                     return [
//                         buildChild(new Bounds(xmin, ymin, halfWidth, halfHeight, zmin, 0), d),
//                         buildChild(new Bounds(xmin, midY, halfWidth, halfHeight, zmin, 0), d),
//                         buildChild(new Bounds(midX, ymin, halfWidth, halfHeight, zmin, 0), d),
//                         buildChild(new Bounds(midX, midY, halfWidth, halfHeight, zmin, 0), d),
//                     ];
//                 }
//                 case SubdivisionScheme.OCTREE: {
//                     return [
//                         buildChild(new Bounds(xmin, ymin, halfWidth, halfHeight, zmin, halfDepth), d),
//                         buildChild(new Bounds(xmin, midY, halfWidth, halfHeight, zmin, halfDepth), d),
//                         buildChild(new Bounds(midX, ymin, halfWidth, halfHeight, zmin, halfDepth), d),
//                         buildChild(new Bounds(midX, midY, halfWidth, halfHeight, zmin, halfDepth), d),
//                         buildChild(new Bounds(xmin, ymin, halfWidth, halfHeight, midZ, halfDepth), d),
//                         buildChild(new Bounds(xmin, midY, halfWidth, halfHeight, midZ, halfDepth), d),
//                         buildChild(new Bounds(midX, ymin, halfWidth, halfHeight, midZ, halfDepth), d),
//                         buildChild(new Bounds(midX, midY, halfWidth, halfHeight, midZ, halfDepth), d),
//                     ];
//                 }
//             }
//         }
//         return [];
//     }
//     constructor(bounds, error = 0) {
//         this._refinementStrategy = RefinementStrategy.REPLACEMENT;
//         this._geometricError = error;
//         this._bounds = bounds;
//     }
//     get isLeaf() {
//         return (this.children?.length ?? 0) != 0;
//     }
//     get children() {
//         return this._children;
//     }
//     get boundingBox() {
//         return this._bounds;
//     }
//     get refinementStrategy() {
//         return RefinementStrategy.ADDITIVE;
//     }
//     set refinementStrategy(v) {
//         if (v !== this._refinementStrategy) {
//             this._refinementStrategy = v;
//         }
//     }
//     get geometricError() {
//         return this._geometricError;
//     }
//     set geometricError(v) {
//         if (v !== this._geometricError) {
//             this._geometricError = v;
//         }
//     }
//     *[Symbol.iterator](predicate) {
//         if (this._children) {
//             if (predicate) {
//                 for (const t of this._children) {
//                     if (predicate(t)) {
//                         yield t;
//                     }
//                 }
//             }
//             return this._children;
//         }
//         return null;
//     }
//     split(sub = SubdivisionScheme.QUADTREE, refinementStrategy) {
//         this._children = Tile3DNode.Split(this, sub, refinementStrategy ?? this.refinementStrategy, this._constructor() ?? Tile3DNode);
//     }
//     _constructor() {
//         return Tile3DNode;
//     }
// }
