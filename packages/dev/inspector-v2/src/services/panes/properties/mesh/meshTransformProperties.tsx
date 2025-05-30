// eslint-disable-next-line import/no-internal-modules
import { Camera, Matrix, Vector3, type AbstractMesh } from "core/index";

import type { FunctionComponent } from "react";
import { PropertyLine } from "shared-ui-components/fluent/propertyLine";
import { Text } from "shared-ui-components/fluent/primitives/text";
import { SyncedSliderInput } from "shared-ui-components/fluent/primitives/syncedSlider";

export const MeshTransformProperties: FunctionComponent<{ entity: AbstractMesh }> = ({ entity: mesh }) => {
    const renderXYZ = () => {
        const camera = mesh.getScene().activeCamera;
        const range = camera !== null ? getVisibleWorldBoundsAtZ(camera, mesh.position.x) : undefined;
        return (
            <>
                <PropertyLine label="X">
                    <SyncedSliderInput value={mesh.position.x} onChange={(val) => (mesh.position.x = val)} centerAtZeroWithRange={range?.maxY} />
                </PropertyLine>
                <PropertyLine label="Y">
                    <SyncedSliderInput value={mesh.position.y} onChange={(val) => (mesh.position.y = val)} centerAtZeroWithRange={range?.maxY} />
                </PropertyLine>
                <PropertyLine label="Z">
                    <SyncedSliderInput value={mesh.position.z} onChange={(val) => (mesh.position.z = val)} centerAtZeroWithRange={range?.maxY} />
                </PropertyLine>
            </>
        );
    };
    return (
        <>
            <PropertyLine label="Position" renderExpandedContent={renderXYZ}>
                <Text>{mesh.position.toString()}</Text>
            </PropertyLine>
        </>
    );
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
