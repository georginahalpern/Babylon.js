// export class TilePipelineLink {
//     constructor(source, target, options) {
//         this._source = source;
//         this._target = target;
//         this._options = options;
//         this._addedObserver = source.addedObservable.add(this.forwardAdded.bind(this));
//         this._removedObserver = source.removedObservable.add(this.forwardRemoved.bind(this));
//         this._updatedObserver = source.updatedObservable.add(this.forwardUpdated.bind(this));
//     }
//     get source() {
//         return this._source;
//     }
//     get target() {
//         return this._target;
//     }
//     get options() {
//         return this._options;
//     }
//     dispose() {
//         this._addedObserver?.disconnect();
//         this._removedObserver?.disconnect();
//         this._updatedObserver?.disconnect();
//         this._addedObserver = null;
//         this._removedObserver = null;
//         this._updatedObserver = null;
//     }
//     forwardAdded(eventData, eventState) {
//         if (this._target && this._target.added) {
//             const filter = this._options?.acceptAdded ?? this.options?.accept;
//             eventData = filter ? this._filter(eventData, filter) : eventData;
//             this._target.added(eventData, eventState);
//         }
//     }
//     forwardRemoved(eventData, eventState) {
//         if (this._target && this._target.removed) {
//             const filter = this._options?.acceptRemoved ?? this.options?.accept;
//             eventData = filter ? this._filter(eventData, filter) : eventData;
//             this._target.removed(eventData, eventState);
//         }
//     }
//     forwardUpdated(eventData, eventState) {
//         if (this._target && this._target.updated) {
//             const filter = this._options?.acceptUpdated ?? this.options?.accept;
//             eventData = filter ? this._filter(eventData, filter) : eventData;
//             this._target.updated(eventData, eventState);
//         }
//     }
//     _filter(eventData, filter) {
//         const filtered = [];
//         for (let i = 0; i != eventData.length; i++) {
//             const d = eventData[i];
//             if (filter(d)) {
//                 filtered.push(d);
//             }
//         }
//         return filtered;
//     }
// }
