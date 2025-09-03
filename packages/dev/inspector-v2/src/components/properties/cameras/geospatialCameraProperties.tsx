import type { FunctionComponent } from "react";

import type { GeospatialCamera } from "core/index";
import type { ISettingsContext } from "../../../services/settingsContext";

import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { BoundProperty } from "../boundProperty";
import { Vector3 } from "core/Maths/math.vector";

export const GeospatialCameraTransformProperties: FunctionComponent<{ camera: GeospatialCamera; settings: ISettingsContext }> = (props) => {
    const { camera } = props;
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
            <BoundProperty label="Position" component={Vector3PropertyLine} target={camera} propertyKey="position" step={0.001} />
            <BoundProperty label="Up Vector" component={Vector3PropertyLine} target={camera} propertyKey="upVector" step={0.001} />
            <BoundProperty label="Pitch Point" component={Vector3PropertyLine} target={camera} propertyKey="pitchPoint" step={0.001} />
        </>
    );
};
