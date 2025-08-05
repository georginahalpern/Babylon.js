import { RegisterClass } from "core/Misc";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports, @typescript-eslint/consistent-type-imports
import { Vector3, Scene, GeospatialArcRotateCamera } from "core/index";
import { CreateSphere } from "core/Meshes/Builders/sphereBuilder";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Color3 } from "core/Maths/math.color";
import { SceneLoader } from "core/Loading";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { DirectionalLight } from "core/Lights/directionalLight";
import { Texture } from "core/Materials/Textures/texture";
const RADIUS = 50;
export class TestApp {
    constructor() {}

    public async render3DTiles(scene: Scene, canvas: HTMLCanvasElement) {
        // Create a simple UniversalCamera - no floating origin complexity
        // const camera = new FreeCamera("camera", new Vector3(0, 0, -100), scene);

        // const camera = new ArcRotateCamera("camera", 0, 1, 10, Vector3.Zero(), scene);
        // const camera = new UniversalCamera("geo", new Vector3(0, 0, -RADIUS * 2), scene);
        const camera = new GeospatialArcRotateCamera("geo", scene, true);

        camera.attachControl(canvas, true);

        // Add lighting
        const ambientLight = new HemisphericLight("ambientLight", new Vector3(0, 1, 0), scene);
        ambientLight.intensity = 0.8;

        const directionalLight = new DirectionalLight("dirLight", new Vector3(-1, -1, -1), scene);
        directionalLight.intensity = 0.5;

        // Create a textured sphere at the origin
        const referenceSphere = CreateSphere("referenceSphere", { diameter: RADIUS * 2 }, scene);
        referenceSphere.position = Vector3.Zero(); // Simple positioning at origin

        // Apply the world texture from the 3dTile directory
        const sphereMaterial = new StandardMaterial("sphereMaterial", scene);

        // Load texture from the same server as the tileset and GLTF files
        const textureUrl = "http://localhost:8003/world.topo.bathy.200412.3x21600x10800.png";

        // const textureUrl = "http://localhost:8003/3_no_ice_clouds_16k.jpg";
        sphereMaterial.diffuseTexture = new Texture(textureUrl, scene);
        sphereMaterial.emissiveColor = new Color3(0.1, 0.1, 0.1); // Slight glow to enhance visibility
        referenceSphere.material = sphereMaterial;

        // Load GLTF models positioned on the sphere surface
        const loader = new TileLoader(scene);
        await loader.loadModelAsync();

        global.console.log("Simple 3D tiles scene created with blue sphere and GLTF boxes on surface");
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
