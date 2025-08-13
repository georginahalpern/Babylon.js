import type { FunctionComponent } from "react";

import type { GeospatialCamera } from "core/index";
import type { ISettingsContext } from "../../../services/settingsContext";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { RotationVectorPropertyLine, Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { BoundProperty } from "../boundProperty";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";

export const GeospatialCameraTransformProperties: FunctionComponent<{ camera: GeospatialCamera; settings: ISettingsContext }> = (props) => {
    const { camera, settings } = props;

    const useDegrees = useObservableState(() => settings.useDegrees, settings.settingsChangedObservable);

    const position = useProperty(camera, "position");
    const rotation = useProperty(camera, "rotation");

    const globalPosition = useProperty(camera, "globalPosition");
    const cameraRotation = useProperty(camera, "cameraRotation");
    const cameraDirection = useProperty(camera, "cameraDirection");

    const cameraWorldPosition = useProperty(camera, "_worldPosition");

    const cameraLocalDirection = useProperty(camera, "_localDirection");
    const cameraTransformedDirection = useProperty(camera, "_transformedDirection");

    const activeMeshes = useProperty(camera, "_activeMeshes");

    // // World tracking
    // public _worldPosition: Vector3;
    // private _worldTarget: Vector3;
    // private _viewMatrix = Matrix.Zero();

    // public _localDirection: Vector3;
    // public _transformedDirection: Vector3;

    return (
        <>
            <Vector3PropertyLine label="Position" value={position} onChange={(value) => (camera.position = value)} />
            <Vector3PropertyLine label="GlobalPosition" value={globalPosition} onChange={(value) => ((camera.globalPosition as any) = value)} />
            <Vector3PropertyLine label="WorldPosition" value={cameraWorldPosition} onChange={(value) => ((camera._worldPosition as any) = value)} />

            <Vector3PropertyLine label="CameraDirection" value={cameraDirection} onChange={(value) => ((camera.cameraDirection as any) = value)} />
            <Vector3PropertyLine label="CameraLocalDirection" value={cameraLocalDirection} onChange={(value) => ((camera._localDirection as any) = value)} />
            <Vector3PropertyLine label="CameraTransformedDirection" value={cameraTransformedDirection} onChange={(value) => ((camera._transformedDirection as any) = value)} />

            <BoundProperty component={NumberInputPropertyLine} target={camera} propertyKey="speed" label="Speed" step={0.1} />
            <BoundProperty component={NumberInputPropertyLine} target={camera} propertyKey="inertia" label="Inertia" step={0.1} />

            <PropertyLine
                label="ActiveMeshes"
                expandByDefault
                expandedContent={
                    <>
                        {activeMeshes.forEach((mesh: any) => (
                            <>
                                <Vector3PropertyLine key={mesh.id} label={`Mesh ${mesh.name} Position`} value={mesh.position} onChange={(value) => (mesh.position = value)} />
                                {mesh._globalPosition ? (
                                    <Vector3PropertyLine
                                        key={mesh.id}
                                        label={`Mesh ${mesh.name} GlobalPosition`}
                                        value={mesh._globalPosition}
                                        onChange={(value) => (mesh._globalPosition = value)}
                                    />
                                ) : null}
                            </>
                        ))}
                    </>
                }
            />

            {/* {quatRotation ? (
                <QuaternionPropertyLine
                    key="QuaternionRotationTransform"
                    label="Rotation (Quaternion)"
                    value={quatRotation}
                    onChange={(val) => (camera.rotationQuaternion = val)}
                    useDegrees={useDegrees}
                />
            ) : (
            )} */}
            <RotationVectorPropertyLine label="Rotation" value={rotation} onChange={(val) => (camera.rotation = val)} useDegrees={useDegrees} />
            <RotationVectorPropertyLine label="CameraRotation" value={cameraRotation} onChange={(val) => (camera.cameraRotation = val)} useDegrees={useDegrees} />
        </>
    );
};
