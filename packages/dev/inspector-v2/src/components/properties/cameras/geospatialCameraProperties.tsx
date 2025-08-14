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
    const globalPosition = useVector3Property(camera as any, "_globalPosition");

    const cameralocalRotation = useVector3Property(camera, "_localRotation");
    const cameraLocalTranslation = useVector3Property(camera, "_localTranslation");

    const cameraWorldPosition = useVector3Property(camera, "_worldPosition");
    const cameraTarget = useVector3Property(camera, "_worldTarget");

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} target={camera} propertyKey="speed" label="Speed" step={0.1} />

            <Vector3PropertyLine label="Position" value={position} onChange={(value) => (camera.position = value)} />
            <Vector3PropertyLine label="_globalPosition" value={globalPosition} onChange={(value) => ((camera as any)._globalPosition = value)} />

            <Vector3PropertyLine label="_worldPosition" value={cameraWorldPosition} onChange={(value) => (camera._worldPosition = value)} />
            <Vector3PropertyLine label="_worldTarget" value={cameraTarget} onChange={(value) => (camera._worldTarget = value)} />

            <Vector3PropertyLine label="_localTranslation" value={cameraLocalTranslation} onChange={(value) => (camera._localTranslation = value)} />
            <RotationVectorPropertyLine label="_localRotation" value={cameralocalRotation} onChange={(val) => (camera._localRotation = val)} useDegrees={useDegrees} />
        </>
    );
};
