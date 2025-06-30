// import { Observable } from "../../events";
// import { TilePipelineLink } from "./tiles.pipeline.link";
// export class SourceBlock {
//     constructor() {
//         this._links = [];
//     }
//     dispose() {
//         for (const l of this._links) {
//             l.dispose();
//         }
//         this._links = [];
//     }
//     get addedObservable() {
//         this._addedObservable = this._addedObservable || new Observable();
//         return this._addedObservable;
//     }
//     get removedObservable() {
//         this._removedObservable = this._removedObservable || new Observable();
//         return this._removedObservable;
//     }
//     get updatedObservable() {
//         this._updatedObservable = this._updatedObservable || new Observable();
//         return this._updatedObservable;
//     }
//     linkTo(target, options) {
//         if (this._links.findIndex((l) => l.target === target) === -1) {
//             const link = new TilePipelineLink(this, target, options);
//             this._links.push(link);
//         }
//     }
//     unlinkFrom(target) {
//         const i = this._links.findIndex((l) => l.target === target);
//         if (i !== -1) {
//             const l = this._links.splice(i)[0];
//             l.dispose();
//             return l;
//         }
//         return undefined;
//     }
// }
// //# sourceMappingURL=tiles.pipeline.sourceblock.js.map
