import { CameraInputsManager } from "./cameraInputsManager";
import type { GeospatialCamera } from "./geospatialCamera";
import { GeospatialCameraKeyboardInput } from "./Inputs/geospatialCameraKeyboardInput";
import { GeospatialCameraMouseInput } from "./Inputs/geospatialCameraMouseInput";

/**
 * Default Inputs manager for the GeospatialCamera.
 * It groups all the default supported inputs for ease of use.
 */
export class GeospatialCameraInputsManager extends CameraInputsManager<GeospatialCamera> {
    /**
     * Instantiates a new GeospatialCameraInputsManager.
     * @param camera Defines the camera the inputs belong to
     */
    constructor(camera: GeospatialCamera) {
        super(camera);
    }

    /**
     * Add keyboard input support to the input manager
     * @returns the current input manager
     */
    public addKeyboard(): GeospatialCameraInputsManager {
        this.add(new GeospatialCameraKeyboardInput());
        return this;
    }

    /**
     * Add mouse input support to the input manager
     * @returns the current input manager
     */
    public addMouse(): GeospatialCameraInputsManager {
        this.add(new GeospatialCameraMouseInput());
        return this;
    }
}
