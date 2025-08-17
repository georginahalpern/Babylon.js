import type { FunctionComponent } from "react";

import type { GeospatialCamera } from "core/index";
import type { ISettingsContext } from "../../../services/settingsContext";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { RotationVectorPropertyLine, Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { useVector3Property } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";
import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { Vector3 } from "core/Maths/math.vector";
import { useObservableState } from "../../../hooks/observableHooks";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { useAngleConverters } from "../../../hooks/settingsHooks";

export const GeospatialCameraTransformProperties: FunctionComponent<{ camera: GeospatialCamera; settings: ISettingsContext }> = (props) => {
    const { camera, settings } = props;
    const cameraRotation = useVector3Property(camera, "rotation");
    const [toDisplayAngle, fromDisplayAngle] = useAngleConverters(settings);

    const useDegrees = useObservableState(() => settings.useDegrees, settings.settingsChangedObservable);

    return (
        <>
            <BoundProperty component={NumberInputPropertyLine} target={camera} propertyKey="speed" label="Speed" step={0.1} />
            <BoundProperty
                label="(Internal _position)"
                component={Vector3PropertyLine}
                target={camera as any}
                propertyKey="_globalPosition"
                ignoreNullable
                defaultValue={Vector3.Zero()}
            />
            <BoundProperty label="Position" component={Vector3PropertyLine} target={camera} propertyKey="_worldPosition" />
            <BoundProperty label="Target" component={Vector3PropertyLine} target={camera} propertyKey="_worldTarget" />
            <BoundProperty label="Rotation" component={RotationVectorPropertyLine} target={camera} propertyKey="rotation" useDegrees={useDegrees} />
            <BoundProperty label="_localTranslation" component={Vector3PropertyLine} target={camera} propertyKey="_localTranslation" />
            <BoundProperty label="_localRotation" component={Vector3PropertyLine} target={camera} propertyKey="_localRotation" />

            <BoundProperty
                ignoreNullable
                defaultValue={false}
                component={BooleanBadgePropertyLine}
                label="_rotationChanged"
                target={camera}
                propertyKey={"_rotationChanged" as any}
            />
            <BoundProperty
                ignoreNullable
                defaultValue={false}
                component={BooleanBadgePropertyLine}
                label="_positionChanged"
                target={camera}
                propertyKey={"_positionChanged" as any}
            />

            <ButtonLine label="Look Nadir (at earth surface)" onClick={() => camera.lookNadir()} />
            <SyncedSliderPropertyLine
                label={`Set tilt (pitch, rotation along X) `}
                value={toDisplayAngle(cameraRotation.x, true)}
                onChange={(val) => camera.setTilt(fromDisplayAngle(val, true))}
                min={toDisplayAngle(-Math.PI)}
                max={toDisplayAngle(Math.PI)}
                step={toDisplayAngle(0.01)}
                unit={useDegrees ? "deg" : "rad"} // TODO, also make sure that the camera is resilient to updating camera rotation vector directly make sure converting okay
            />
            <SyncedSliderPropertyLine
                label="Set heading (yaw, rotation along Y)"
                value={toDisplayAngle(cameraRotation.y, true)}
                min={toDisplayAngle(-Math.PI)}
                max={toDisplayAngle(Math.PI)}
                step={toDisplayAngle(0.01)}
                onChange={(val) => camera.setHeading(fromDisplayAngle(val, true))}
                unit={useDegrees ? "deg" : "rad"}
            />
        </>
    );
};
