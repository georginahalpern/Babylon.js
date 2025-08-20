import { RegisterClass } from "core/Misc";
import { CreateSphere } from "core/Meshes/Builders/sphereBuilder";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Color3 } from "core/Maths/math.color";
import { SceneLoader } from "core/Loading";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { DirectionalLight } from "core/Lights/directionalLight";
import { Vector3 } from "core/Maths/math.vector";
import type { Scene } from "core/index";
import { Texture } from "core/Materials/Textures";

import { GeospatialCamera } from "core/Cameras/geospatialCamera";
// Earth ellipsoid parameters (scaled down to radius ~50)
const EQUATORIAL_RADIUS = 50;
// const POLAR_RADIUS = EQUATORIAL_RADIUS * (6356.752 / 6378.137); // ~49.83
// const FLATTENING = 1 - POLAR_RADIUS / EQUATORIAL_RADIUS; // ~0.00335

export class TestApp {
    constructor() {}

    public async render3DTiles(scene: Scene, canvas: HTMLCanvasElement) {
        const camera = new GeospatialCamera("geo", scene);
        camera.attachControl();

        // Add lighting
        const ambientLight = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), scene);
        ambientLight.intensity = 0.8;

        const directionalLight = new DirectionalLight("dirLight", new Vector3(-1, -1, -1), scene);
        directionalLight.intensity = 0.5;

        // Create a textured sphere at the origin
        // const referenceSphere = CreateSphere("referenceSphere", { diameter: RADIUS * 2 }, scene);
        const referenceSphere = CreateSphere(
            "referenceSphere",
            {
                diameter: EQUATORIAL_RADIUS * 2,
                // diameterY: POLAR_RADIUS * 2, // This makes it an ellipsoid
                // segments: 64,
            },
            scene
        );

        referenceSphere.position = Vector3.Zero(); // Simple positioning at origin

        // Apply the world texture from the 3dTile directory
        const sphereMaterial = new StandardMaterial("sphereMaterial", scene);

        // Load texture from the same server as the tileset and GLTF files
        const textureUrl = "http://localhost:8003/3_no_ice_clouds_16k.jpg";
        sphereMaterial.diffuseTexture = new Texture(textureUrl, scene, undefined, false);
        sphereMaterial.emissiveColor = new Color3(0.1, 0.1, 0.1); // Slight glow to enhance visibility
        referenceSphere.material = sphereMaterial;

        // Load GLTF models positioned on the sphere surface
        // const loader = new TileLoader(scene);
        // await loader.loadModelAsync();
    }
}
export class TileLoader {
    private _scene: Scene;

    constructor(scene: Scene) {
        this._scene = scene;
    }

    public async loadModelAsync(tilesetUrl?: string) {
        let tilesetJson: any;
        let baseUrl: string;

        if (tilesetUrl) {
            // Load tileset.json as plain JSON
            const response = await fetch(tilesetUrl);
            if (!response.ok) {
                throw new Error(`Failed to load tileset: ${response.statusText}`);
            }
            tilesetJson = await response.json();
            baseUrl = tilesetUrl.substring(0, tilesetUrl.lastIndexOf("/") + 1);
        } else {
            //            http-server -a localhost -p 8003 --cors=http://localhost:8080/
            // Load the default sampleTileset.json
            const defaultTilesetUrl = "http://localhost:8003/tileset.json";

            const response = await fetch(defaultTilesetUrl);
            if (!response.ok) {
                throw new Error(`Failed to load tileset: ${response.statusText}`);
            }
            tilesetJson = await response.json();
            baseUrl = "http://localhost:8003/";
        }

        // Process tileset
        const processTilesAsync = async (tiles: any[]): Promise<void> => {
            if (!Array.isArray(tiles)) {
                return;
            }

            global.console.log("Processing tiles, count:", tiles.length);
            const promises: Promise<void>[] = [];

            for (const tile of tiles) {
                // Check for content in the tile
                let contentUrl = tile?.content?.uri;

                // Only resolve relative URIs against the base URL
                if (contentUrl && !contentUrl.startsWith("http")) {
                    contentUrl = new URL(contentUrl, baseUrl).href;
                }

                if (contentUrl) {
                    // Create a promise to load the GLTF model

                    const promise = (async () => {
                        try {
                            // Load GLTF file
                            await SceneLoader.ImportMeshAsync("", "", contentUrl, this._scene);
                        } catch (error) {
                            global.console.error("Failed to load GLTF file:", contentUrl, error);
                        }
                    })();

                    promises.push(promise);
                }

                // Process child tiles recursively
                if (Array.isArray(tile?.children)) {
                    promises.push(processTilesAsync(tile.children));
                }
            }
            await Promise.all(promises);
        };

        // Start processing from root tile and its children
        const rootTiles = tilesetJson.root?.children || [tilesetJson.root];
        await processTilesAsync(rootTiles);

        // Wait for scene to be ready
        await new Promise<void>((resolve) => {
            this._scene.executeWhenReady(() => {
                global.console.log("Scene is ready! All materials and shaders compiled.");
                global.console.log(`Total meshes in scene: ${this._scene.meshes.length}`);
                resolve();
            });
        });
    }
}
export default TestApp;
RegisterClass("ADDONS.TileLoader", TileLoader);
RegisterClass("ADDONS.TestApp", TestApp);
