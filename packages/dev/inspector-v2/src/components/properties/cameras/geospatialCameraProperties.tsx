import type { FunctionComponent } from "react";

import type { GeospatialCamera } from "core/index";
import type { ISettingsContext } from "../../../services/settingsContext";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { RotationVectorPropertyLine, Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useVector3Property } from "../../../hooks/compoundPropertyHooks";
import { useObservableState } from "../../../hooks/observableHooks";
import { BoundProperty } from "../boundProperty";

export const GeospatialCameraTransformProperties: FunctionComponent<{ camera: GeospatialCamera; settings: ISettingsContext }> = (props) => {
    const { camera, settings } = props;

    const useDegrees = useObservableState(() => settings.useDegrees, settings.settingsChangedObservable);

    const position = useVector3Property(camera, "position");
    const rotation = useVector3Property(camera, "rotation");

    const globalPosition = useVector3Property(camera as any, "_globalPosition");
    const cameraRotation = useVector3Property(camera, "cameraRotation");
    const cameraDirection = useVector3Property(camera, "cameraDirection");

    const cameraWorldPosition = useVector3Property(camera, "_worldPosition");

    const cameraLocalDirection = useVector3Property(camera, "_localDirection");
    const cameraTransformedDirection = useVector3Property(camera, "_transformedDirection");

    const cameraTarget = useVector3Property(camera as any, "_worldTarget");
    const cameraRelativeTarget = useVector3Property(camera as any, "_relativeTarget");

    // const activeMeshes = useProperty(camera as any, "_activeMeshes");

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} target={camera} propertyKey="speed" label="Speed" step={0.1} />

            <Vector3PropertyLine label="Position" value={position} onChange={(value) => (camera.position = value)} />
            <Vector3PropertyLine label="_globalPosition" value={globalPosition} onChange={(value) => (((camera as any)._globalPosition as any) = value)} />
            <Vector3PropertyLine label="_worldPosition" value={cameraWorldPosition} onChange={(value) => ((camera._worldPosition as any) = value)} />

            <Vector3PropertyLine label="CameraDirection" value={cameraDirection} onChange={(value) => ((camera.cameraDirection as any) = value)} />
            <Vector3PropertyLine label="_localDirection" value={cameraLocalDirection} onChange={(value) => ((camera._localDirection as any) = value)} />
            <Vector3PropertyLine label="_transformedDirection" value={cameraTransformedDirection} onChange={(value) => ((camera._transformedDirection as any) = value)} />

            <Vector3PropertyLine label="_worldTarget" value={cameraTarget} onChange={(value) => ((camera as any)._worldTarget = value)} />
            <Vector3PropertyLine label="_relativeTarget" value={cameraRelativeTarget} onChange={(value) => ((camera as any)._relativeTarget = value)} />

            <RotationVectorPropertyLine label="Rotation" value={rotation} onChange={(val) => (camera.rotation = val)} useDegrees={useDegrees} />
            <RotationVectorPropertyLine label="CameraRotation" value={cameraRotation} onChange={(val) => (camera.cameraRotation = val)} useDegrees={useDegrees} />
            {/* 
            <>
                {camera.getActiveMeshes().forEach((mesh: any) => {
                    const meshPos = useVector3Property(mesh, "position");
                    const meshGlobalPos = useVector3Property(mesh, "globalPosition");
                    return (
                        <div id={mesh.id}>
                            <Vector3PropertyLine key={mesh.id} label={`Mesh ${mesh.name} Position`} value={meshPos} onChange={(value) => (mesh.position = value)} />
                            {mesh._globalPosition ? (
                                <Vector3PropertyLine
                                    key={mesh.id}
                                    label={`Mesh ${mesh.name} GlobalPosition`}
                                    value={meshGlobalPos}
                                    onChange={(value) => (mesh._globalPosition = value)}
                                />
                            ) : null}
                        </div>
                    );
                })}
            </> */}
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
        </>
    );
};
