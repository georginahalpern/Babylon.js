// eslint-disable-next-line import/no-internal-modules
import { Camera, Matrix, Vector3, type AbstractMesh } from "core/index";

import type { FunctionComponent } from "react";
import { PropertyLine } from "shared-ui-components/fluent/propertyLine";
import { Text } from "shared-ui-components/fluent/primitives/text";
import { SyncedSliderInput } from "shared-ui-components/fluent/primitives/syncedSlider";
import { VectorPropertyLine } from "shared-ui-components/fluent/vectorPropertyLine";

export const MeshTransformProperties: FunctionComponent<{ entity: AbstractMesh }> = ({ entity: mesh }) => {
    return (
        <>
            <VectorPropertyLine vector={mesh.position} label="Position" centerAtZeroWithRange={getPositionRange(mesh)} />
            <VectorPropertyLine vector={mesh.rotation} label="Rotation" min={-Math.PI} max={Math.PI} />
        </>
    );
};

const getPositionRange = (mesh: AbstractMesh): number | undefined => {
    const camera = mesh.getScene().activeCamera;
    if (camera) {
        return getVisibleWorldBoundsAtZ(camera, mesh.position.x).maxY;
    }
    return undefined;
};

/**
 * Can clean this up later, meant to find the bounds for the position sliders
 * @param camera
 * @param z
 * @returns
 */
const getVisibleWorldBoundsAtZ = (camera: Camera, z: number) => {
    const engine = camera.getEngine();

    // Screen corners in pixel coordinates
    const width = engine.getRenderWidth();
    const height = engine.getRenderHeight();

    // Corners in screen space
    const corners = [
        new Vector3(0, 0, z), // Top-left
        new Vector3(width, 0, z), // Top-right
        new Vector3(0, height, z), // Bottom-left
        new Vector3(width, height, z), // Bottom-right
    ];

    // Convert screen space to world space
    const worldCorners = corners.map((screen) =>
        Vector3.Unproject(
            screen,
            width,
            height,
            Matrix.Identity(), // use identity if cameraView is already applied
            camera.getViewMatrix(),
            camera.getProjectionMatrix()
        )
    );

    // Determine bounds
    const xs = worldCorners.map((p) => p.x);
    const ys = worldCorners.map((p) => p.y);

    return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
    };
};
