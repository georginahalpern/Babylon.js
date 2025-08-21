import type { FunctionComponent } from "react";

import type { GeospatialCamera } from "core/index";
import type { ISettingsContext } from "../../../services/settingsContext";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
// import { useVector3Property } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";
import { BooleanBadgePropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/booleanBadgePropertyLine";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { Vector3 } from "core/Maths/math.vector";
// import { useObservableState } from "../../../hooks/observableHooks";
// import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
// import { useAngleConverters } from "../../../hooks/settingsHooks";

export const GeospatialCameraTransformProperties: FunctionComponent<{ camera: GeospatialCamera; settings: ISettingsContext }> = (props) => {
    const { camera } = props;
    // const cameraRotation = useVector3Property(camera, "rotation");
    // const [toDisplayAngle, fromDisplayAngle] = useAngleConverters(settings);

    // const useDegrees = useObservableState(() => settings.useDegrees, settings.settingsChangedObservable);

    return (
        <>
            <BoundProperty
                label="(Internal _position)"
                component={Vector3PropertyLine}
                target={camera as any}
                propertyKey="_globalPosition"
                ignoreNullable
                defaultValue={Vector3.Zero()}
            />
            <BoundProperty label="position" component={Vector3PropertyLine} target={camera} propertyKey="position" step={0.001} />
            <BoundProperty label="geoworldOrigin" component={Vector3PropertyLine} target={camera} propertyKey="geoworldOrigin" step={0.001} />
            <BoundProperty label="geoworldHit" component={Vector3PropertyLine} target={camera} propertyKey="geoworldHitPoint" step={0.001} />
            <BoundProperty label="geocentricNormal" component={Vector3PropertyLine} target={camera} propertyKey="geocentricNormal" step={0.001} />

            {/* <BoundProperty label="Look At Vector" component={Vector3PropertyLine} target={camera} propertyKey="_lookAtVector" step={0.001} /> */}
            <BoundProperty label="Up vector" component={Vector3PropertyLine} target={camera} propertyKey="upVector" step={0.001} />

            {/* <BoundProperty label="Rotation" component={RotationVectorPropertyLine} target={camera} propertyKey="rotation" useDegrees={useDegrees} step={0.001} /> */}
            <BoundProperty label="Pitch Rotation Axis" component={Vector3PropertyLine} target={camera} propertyKey="pitchRotationAxis" step={0.001} />

            {/* <SyncedSliderPropertyLine
                label={`Alpha`}
                value={toDisplayAngle(camera.alpha, true)}
                onChange={(val) => (camera.alpha = fromDisplayAngle(val, true))}
                min={toDisplayAngle(0)}
                max={toDisplayAngle(2 * Math.PI)}
                step={toDisplayAngle(0.01)}
                unit={useDegrees ? "deg" : "rad"} // TODO, also make sure that the camera is resilient to updating camera rotation vector directly make sure converting okay
            />
            <SyncedSliderPropertyLine
                label={`Beta`}
                value={toDisplayAngle(camera.beta, true)}
                onChange={(val) => (camera.beta = fromDisplayAngle(val, true))}
                min={0}
                max={toDisplayAngle(Math.PI)}
                step={toDisplayAngle(0.01)}
                unit={useDegrees ? "deg" : "rad"} // TODO, also make sure that the camera is resilient to updating camera rotation vector directly make sure converting okay
            /> */}

            <BoundProperty label="Radius" component={NumberInputPropertyLine} target={camera} propertyKey="radius" />

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

            <ButtonLine label="Look Nadir (at earth surface)" onClick={() => camera.lookNadir()} />
            <ButtonLine label="Reset to default" onClick={() => camera.resetToDefault()} />
            {/* <SyncedSliderPropertyLine
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
            /> */}
        </>
    );
};
