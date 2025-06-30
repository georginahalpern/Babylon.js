// import { SourceBlock } from "./sourceBlock";
// import { TileNode } from "./tileNode";

// class TilesetCodec {
//     async decodeAsync(r) {
//         return r instanceof Response ? await r.json() : null;
//     }
// }
// class Tile3dStreamingEngineOptions {
//     public Default: { tilesetExtension: string };
// }
// Tile3dStreamingEngineOptions.Default = {
//     tilesetExtension: "json",
// };

// class TilesetCache {
//     private cache: Map<string, any>;
//     constructor() {
//         this.cache = new Map<string, Tileset>();
//     }
//     get(tilesetUri: string) {
//         return this.cache.get(tilesetUri) || null;
//     }
//     set(tilesetUri: string, tileset: Tileset) {
//         this.cache.set(tilesetUri, tileset);
//     }
//     has(tilesetUri: string) {
//         return this.cache.has(tilesetUri);
//     }
// }
// export class Tile3dStreamingEngine extends SourceBlock {
//     private _uri: string;
//     private _root: TileNode | null;
//     private _cache: TilesetCache;
//     private _client: _io_webClient__WEBPACK_IMPORTED_MODULE_1__.WebClient;
//     private _options: Tile3dStreamingEngineOptions;
//     constructor(uri: string, options: Tile3dStreamingEngineOptions) {
//         super();
//         this._uri = uri;
//         this._root = null;
//         this._cache = new TilesetCache();
//         this._client = new _io_webClient__WEBPACK_IMPORTED_MODULE_1__.WebClient(uri, new TilesetCodec());
//         this._options = { ...Tile3dStreamingEngineOptions.Default, ...options };
//     }
//     setContext(state, display) {
//         if (!state || !display) {
//             this._doClearContext();
//             return;
//         }
//         this._doValidateContext(state, display);
//     }
//     _doClearContext() {}
//     _doValidateContext(state, display) {
//         if (!state || !display) {
//             this._doClearContext();
//             return;
//         }
//         if (this._root === null) {
//             this._doFetchTilesetAsync(this._uri).then((tileset) => {
//                 if (tileset) {
//                     this._root = new TileNode(tileset.root, this._uri, null);
//                     this._doValidateContext(state, display);
//                 }
//             });
//             return;
//         }
//         this._browseTilesetHierarchy(this._root.tile, state, display, this._uri);
//     }
//     async _browseTilesetHierarchy(tile, state, display, baseUrl) {
//         if (!tile) return;
//         if (!this._isTileVisible(tile, state, display)) {
//             return;
//         }
//         const uri = tile.content?.uri;
//         const ext = uri ? _utils_text__WEBPACK_IMPORTED_MODULE_2__.TextUtils.GetUriExtension(uri)?.toLowerCase() : null;
//         if (uri && ext && ext === (this._options.tilesetExtension?.toLowerCase() ?? "json")) {
//             const contentUrl = new URL(uri, baseUrl).toString();
//             const tileset = await this._doFetchTilesetAsync(contentUrl);
//             if (tileset && tileset.root) {
//                 await this._browseTilesetHierarchy(tileset.root, state, display, contentUrl);
//             }
//         }
//         if (tile.children) {
//             for (const child of tile.children) {
//                 await this._browseTilesetHierarchy(child, state, display, baseUrl);
//             }
//         }
//     }
//     _isTileVisible(tile, state, display) {
//         return true;
//     }
//     async _doFetchTilesetAsync(uri) {
//         const result = await this._client.fetchAsync(this._uri);
//         return result.content;
//     }
// }
