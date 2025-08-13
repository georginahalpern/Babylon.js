import type { FunctionComponent } from "react";

import { useMemo } from "react";

import { NumberInputPropertyLine, TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { useProperty, useVector3Property } from "../../hooks/compoundPropertyHooks";
import { GetPropertyDescriptor, IsPropertyReadonly } from "../../instrumentation/propertyInstrumentation";
import type { GeospatialCamera } from "core/Cameras";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { Vector3PropertyLine, RotationVectorPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { BoundProperty } from "./boundProperty";

type CommonEntity = {
    readonly id?: number;
    readonly uniqueId?: number;
    name?: string;
    getClassName?: () => string;
};

export const CommonGeneralProperties: FunctionComponent<{ commonEntity: CommonEntity }> = (props) => {
    const { commonEntity } = props;

    const name = useProperty(commonEntity, "name");
    const namePropertyDescriptor = useMemo(() => GetPropertyDescriptor(commonEntity, "name")?.[1], [commonEntity]);
    const isNameReadonly = !namePropertyDescriptor || IsPropertyReadonly(namePropertyDescriptor);

    const className = commonEntity.constructor?.name || commonEntity.getClassName?.();
    let component = <></>;
    if (commonEntity.constructor?.name === "GeospatialCamera") {
        const camera = commonEntity as unknown as GeospatialCamera;

        const position = useVector3Property(camera, "position");
        const rotation = useVector3Property(camera, "rotation");

        const globalPosition = useVector3Property(camera as any, "_globalPosition");
        const cameraRotation = useVector3Property(camera, "cameraRotation");
        const cameraDirection = useVector3Property(camera, "cameraDirection");

        const cameraWorldPosition = useVector3Property(camera, "_worldPosition");

        const cameraLocalDirection = useVector3Property(camera, "_localDirection");
        const cameraTransformedDirection = useVector3Property(camera, "_transformedDirection");

        const activeMeshes = useProperty(camera as any, "_activeMeshes");

        component = (
            <>
                <Vector3PropertyLine label="Position" value={position} onChange={(value) => (camera.position = value)} />
                <Vector3PropertyLine label="GlobalPosition" value={globalPosition} onChange={(value) => (((camera as any)._globalPosition as any) = value)} />
                <Vector3PropertyLine label="WorldPosition" value={cameraWorldPosition} onChange={(value) => ((camera._worldPosition as any) = value)} />

                <Vector3PropertyLine label="CameraDirection" value={cameraDirection} onChange={(value) => ((camera.cameraDirection as any) = value)} />
                <Vector3PropertyLine label="CameraLocalDirection" value={cameraLocalDirection} onChange={(value) => ((camera._localDirection as any) = value)} />
                <Vector3PropertyLine label="CameraTransformedDirection" value={cameraTransformedDirection} onChange={(value) => ((camera._transformedDirection as any) = value)} />

                <BoundProperty component={NumberInputPropertyLine} target={camera} propertyKey="speed" label="Speed" step={0.1} />
                <BoundProperty component={NumberInputPropertyLine} target={camera} propertyKey="inertia" label="Inertia" step={0.1} />

                <RotationVectorPropertyLine label="Rotation" value={rotation} onChange={(val) => (camera.rotation = val)} useDegrees={true} />
                <RotationVectorPropertyLine label="CameraRotation" value={cameraRotation} onChange={(val) => (camera.cameraRotation = val)} useDegrees={true} />

                <PropertyLine
                    label="ActiveMeshes"
                    expandByDefault
                    expandedContent={
                        <>
                            {activeMeshes.data.forEach((mesh: any) => {
                                const meshPos = useVector3Property(mesh, "position");
                                const meshGlobalPos = useVector3Property(mesh, "globalPosition");
                                return (
                                    <>
                                        <Vector3PropertyLine key={mesh.id} label={`Mesh ${mesh.name} Position`} value={meshPos} onChange={(value) => (mesh.position = value)} />
                                        {mesh._globalPosition ? (
                                            <Vector3PropertyLine
                                                key={mesh.id}
                                                label={`Mesh ${mesh.name} GlobalPosition`}
                                                value={meshGlobalPos}
                                                onChange={(value) => (mesh._globalPosition = value)}
                                            />
                                        ) : null}
                                    </>
                                );
                            })}
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
            </>
        );
    }

    return (
        <>
            {commonEntity.id !== undefined && <StringifiedPropertyLine key="EntityId" label="ID" description="The id of the node." value={commonEntity.id} />}
            {name !== undefined &&
                (isNameReadonly ? (
                    <TextPropertyLine key="EntityName" label="Name" description="The name of the node." value={name} />
                ) : (
                    <TextInputPropertyLine key="EntityName" label="Name" description="The name of the node." value={name} onChange={(newName) => (commonEntity.name = newName)} />
                ))}
            {commonEntity.uniqueId !== undefined && (
                <StringifiedPropertyLine key="EntityUniqueId" label="Unique ID" description="The unique id of the node." value={commonEntity.uniqueId} />
            )}
            {className !== undefined && <TextPropertyLine key="EntityClassName" label="Class" description="The class of the node." value={className} />}
            {component}
        </>
    );
};
