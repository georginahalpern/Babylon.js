import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IPropertiesService } from "./propertiesService";

// import { makeStyles, tokens } from "@fluentui/react-components";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import { BooleanProperty, SliderProperty, TextProperty } from "../../../components/booleanProperty";

import { AccordionStyled, LineContainerComponent2 } from "@dev/shared-ui-components/src/fluent/styledWrappers";
import { OptionsLine } from "@dev/shared-ui-components/src/lines/optionsLineComponent";
import { PropertiesServiceIdentity } from "./propertiesService";
import { Constants } from "core/Engines";
// import { makeStyles, tokens } from "@fluentui/react-components";

// eslint-disable-next-line @typescript-eslint/naming-convention
// const useStyles = makeStyles({
//     rootDiv: {
//         flex: 1,
//         overflow: "hidden",
//         display: "flex",
//         flexDirection: "column",
//     },
//     accordion: {
//         overflowY: "auto",
//         paddingBottom: tokens.spacingVerticalM,
//     },
//     panelDiv: {
//         display: "flex",
//         flexDirection: "column",
//         rowGap: tokens.spacingVerticalM,
//         overflow: "hidden",
//     },
// });

// const TEXT_SIZE = 500;
export const MeshPropertiesServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
    friendlyName: "Mesh Properties",
    consumes: [PropertiesServiceIdentity],
    factory: (propertiesService) => {
        const registration = propertiesService.addEntityType(
            (entity) => entity instanceof AbstractMesh,
            ({ entity: mesh }) => {
                mesh.isEnabled;
                // const mapHeadersToComponents = {
                //     General: {
                //         IsEnabled: {
                //             component: BooleanProperty,
                //             props: {
                //                 label: "Is enabled",
                //                 description: "Determines whether a mesh is enabled within the scene",
                //                 accessor: () => mesh.isEnabled(false),
                //                 mutator: (value) => mesh.setEnabled(value),
                //                 observable: mesh.onEnabledStateChangedObservable,
                //             },
                //         },
                //         Visibility: {
                //             component: SliderProperty,
                //             props: {
                //                 label: "Visibility",
                //                 description: "Controls the visibility of the mesh in the scene",
                //                 accessor: () => mesh.visibility,
                //                 mutator: (value) => (mesh.visibility = value),
                //                 minimum: 0,
                //                 maximum: 1,
                //                 step: 0.01,
                //             },
                //         },
                //     },
                // };

                return (
                    <AccordionStyled>
                        <LineContainerComponent2 title="General (using my new linecontainer)" value="1">
                            <TextProperty label="Unique ID" accessor={() => mesh.uniqueId.toString()} />
                            <TextProperty label="Class" accessor={() => mesh.getClassName()} />
                            <TextProperty label="Vertices" accessor={() => mesh.getTotalVertices().toString()} />
                            <TextProperty label="Faces" accessor={() => (mesh.getTotalIndices() / 3).toFixed(0)} />
                            <TextProperty label="Sub-meshes" accessor={() => (mesh.subMeshes ? mesh.subMeshes.length.toString() : "0")} />
                            <BooleanProperty
                                label="Is enabled (BooleanPropertyV2)"
                                description="Determines whether a mesh is enabled within the scene"
                                accessor={() => mesh.isEnabled(false)}
                                mutator={(value) => mesh.setEnabled(value)}
                                observable={mesh.onEnabledStateChangedObservable}
                            />
                            <SliderProperty
                                label="Visibility"
                                description="Controls the visibility of the mesh in the scene"
                                accessor={() => mesh.visibility}
                                mutator={(value) => (mesh.visibility = value)}
                                // observable={mesh.visibility}
                                minimum={0}
                                maximum={1}
                                step={0.01}
                            />
                            <OptionsLine
                                label="Orientation (OptionsLineV1)"
                                options={[
                                    { label: "Clockwise", value: Constants.MATERIAL_ClockWiseSideOrientation },
                                    { label: "Counterclockwise", value: Constants.MATERIAL_CounterClockWiseSideOrientation },
                                ]}
                                target={mesh}
                                propertyName="sideOrientation"
                                //onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        </LineContainerComponent2>
                    </AccordionStyled>

                    // <div className={classes.rootDiv}>
                    //     <Accordion className={classes.accordion} collapsible multiple defaultOpenItems={["General"]}>
                    //         <AccordionItem key="General" value="General">
                    //             <AccordionHeader expandIconPosition="end">
                    //                 <Text size={TEXT_SIZE}>General</Text>
                    //             </AccordionHeader>
                    //             <AccordionPanel>
                    //                 <div className={classes.panelDiv}>
                    // <TextProperty label="Unique ID" accessor={() => mesh.uniqueId.toString()} />
                    // <TextProperty label="Class" accessor={() => mesh.getClassName()} />
                    // <TextProperty label="Vertices" accessor={() => mesh.getTotalVertices().toString()} />
                    // <TextProperty label="Faces" accessor={() => (mesh.getTotalIndices() / 3).toFixed(0)} />
                    // <TextProperty label="Sub-meshes" accessor={() => (mesh.subMeshes ? mesh.subMeshes.length.toString() : "0")} />
                    // <BooleanProperty
                    //     label="Is enabled"
                    //     description="Determines whether a mesh is enabled within the scene"
                    //     accessor={() => mesh.isEnabled(false)}
                    //     mutator={(value) => mesh.setEnabled(value)}
                    //     observable={mesh.onEnabledStateChangedObservable}
                    // />
                    // <SliderProperty
                    //     label="Visibility"
                    //     description="Controls the visibility of the mesh in the scene"
                    //     accessor={() => mesh.visibility}
                    //     mutator={(value) => (mesh.visibility = value)}
                    //     // observable={mesh.visibility}
                    //     minimum={0}
                    //     maximum={1}
                    //     step={0.01}
                    // />
                    //                 </div>
                    //             </AccordionPanel>
                    //         </AccordionItem>
                    //         {/* <CustomPropertyGridComponent
                    //             globalState={this.props.globalState}
                    //             target={mesh}
                    //             lockObject={this.props.lockObject}
                    //             onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //         /> */}
                    //         {/* <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    //             <TextLineComponent label="ID" value={this._getIdForDisplay(mesh.id)} onCopy />
                    //             <TextInputLineComponent
                    //                 lockObject={this.props.lockObject}
                    //                 label="Name"
                    //                 target={mesh}
                    //                 propertyName="name"
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //             <TextLineComponent label="Unique ID" value={mesh.uniqueId.toString()} />
                    //             <TextLineComponent label="Class" value={mesh.getClassName()} />
                    //             <TextLineComponent label="Vertices" value={mesh.getTotalVertices().toString()} />
                    //             <TextLineComponent label="Faces" value={(mesh.getTotalIndices() / 3).toFixed(0)} />
                    //             <TextLineComponent label="Sub-meshes" value={mesh.subMeshes ? mesh.subMeshes.length.toString() : "0"} />
                    //             <ParentPropertyGridComponent
                    //                 globalState={this.props.globalState}
                    //                 node={mesh}
                    //                 lockObject={this.props.lockObject}
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //             {mesh.skeleton && <TextLineComponent label="Skeleton" value={mesh.skeleton.name} onLink={() => this.onSkeletonLink()} />}
                    //             <CheckBoxLineComponent
                    //                 label="Is enabled"
                    //                 isSelected={() => mesh.isEnabled()}
                    //                 onSelect={(value) => {
                    //                     const prevValue = mesh.isEnabled();
                    //                     mesh.setEnabled(value);
                    //                     this.props.onPropertyChangedObservable?.notifyObservers({
                    //                         object: mesh,
                    //                         property: "isEnabled",
                    //                         value,
                    //                         initialValue: prevValue,
                    //                     });
                    //                 }}
                    //             />
                    //             <CheckBoxLineComponent
                    //                 label="Is pickable"
                    //                 target={mesh}
                    //                 propertyName="isPickable"
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //             {mesh.material && (!mesh.material.reservedDataStore || !mesh.material.reservedDataStore.hidden) && (
                    //                 <TextLineComponent label="Link to material" value={mesh.material.name} onLink={() => this.onMaterialLink()} />
                    //             )}
                    //             {!mesh.isAnInstance && (
                    //                 <OptionsLine
                    //                     label="Active material"
                    //                     options={materialOptions}
                    //                     target={mesh}
                    //                     propertyName="material"
                    //                     noDirectUpdate={true}
                    //                     onSelect={(value) => {
                    //                         if ((value as number) < 0) {
                    //                             mesh.material = null;
                    //                         } else {
                    //                             mesh.material = sortedMaterials[value as number];
                    //                         }

                    //                         this.forceUpdate();
                    //                     }}
                    //                     extractValue={() => (mesh.material ? sortedMaterials.indexOf(mesh.material) : -1)}
                    //                     onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                 />
                    //             )}
                    //             {mesh.isAnInstance && <TextLineComponent label="Source" value={(mesh as any).sourceMesh.name} onLink={() => this.onSourceMeshLink()} />}
                    //             <ButtonLineComponent
                    //                 label="Dispose"
                    //                 onClick={() => {
                    //                     mesh.dispose();
                    //                     this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                    //                 }}
                    //             />
                    //         </LineContainerComponent>
                    //         <CommonPropertyGridComponent host={mesh} lockObject={this.props.lockObject} globalState={this.props.globalState} />
                    //         <VariantsPropertyGridComponent host={mesh} lockObject={this.props.lockObject} globalState={this.props.globalState} />
                    //         <LineContainerComponent title="TRANSFORMS" selection={this.props.globalState}>
                    //             <Vector3LineComponent
                    //                 lockObject={this.props.lockObject}
                    //                 label="Position"
                    //                 target={mesh}
                    //                 propertyName="position"
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //             {!mesh.rotationQuaternion && (
                    //                 <Vector3LineComponent
                    //                     lockObject={this.props.lockObject}
                    //                     label="Rotation"
                    //                     useEuler={this.props.globalState.onlyUseEulers}
                    //                     target={mesh}
                    //                     propertyName="rotation"
                    //                     step={0.01}
                    //                     onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                 />
                    //             )}
                    //             {mesh.rotationQuaternion && (
                    //                 <QuaternionLineComponent
                    //                     lockObject={this.props.lockObject}
                    //                     label="Rotation"
                    //                     useEuler={this.props.globalState.onlyUseEulers}
                    //                     target={mesh}
                    //                     propertyName="rotationQuaternion"
                    //                     onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                 />
                    //             )}
                    //             <Vector3LineComponent
                    //                 lockObject={this.props.lockObject}
                    //                 label="Scaling"
                    //                 target={mesh}
                    //                 propertyName="scaling"
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //         </LineContainerComponent>
                    //         {mesh._internalMetadata && mesh._internalMetadata.nodeGeometry && (
                    //             <LineContainerComponent title="NODE GEOMETRY" selection={this.props.globalState}>
                    //                 <ButtonLineComponent
                    //                     label="Edit"
                    //                     onClick={() => {
                    //                         mesh._internalMetadata.nodeGeometry.edit({
                    //                             nodeGeometryEditorConfig: {
                    //                                 backgroundColor: mesh.getScene().clearColor,
                    //                                 hostMesh: mesh,
                    //                                 hostScene: mesh.getScene(),
                    //                             },
                    //                         });
                    //                     }}
                    //                 />
                    //             </LineContainerComponent>
                    //         )}
                    //         <LineContainerComponent title="DISPLAY" closed={true} selection={this.props.globalState}>
                    //             {!mesh.isAnInstance && (
                    //                 <SliderLineComponent
                    //                     lockObject={this.props.lockObject}
                    //                     label="Visibility"
                    //                     target={mesh}
                    //                     propertyName="visibility"
                    //                     minimum={0}
                    //                     maximum={1}
                    //                     step={0.01}
                    //                     onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                 />
                    //             )}
                    //             <OptionsLine
                    //                 label="Orientation"
                    //                 options={orientationOptions}
                    //                 target={mesh}
                    //                 propertyName="sideOrientation"
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //             <FloatLineComponent
                    //                 lockObject={this.props.lockObject}
                    //                 label="Alpha index"
                    //                 target={mesh}
                    //                 propertyName="alphaIndex"
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //             <CheckBoxLineComponent
                    //                 label="Receive shadows"
                    //                 target={mesh}
                    //                 propertyName="receiveShadows"
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //             {mesh.isVerticesDataPresent(VertexBuffer.ColorKind) && (
                    //                 <CheckBoxLineComponent
                    //                     label="Use vertex colors"
                    //                     target={mesh}
                    //                     propertyName="useVertexColors"
                    //                     onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                 />
                    //             )}
                    //             {mesh.isVerticesDataPresent(VertexBuffer.ColorKind) && (
                    //                 <CheckBoxLineComponent
                    //                     label="Has vertex alpha"
                    //                     target={mesh}
                    //                     propertyName="hasVertexAlpha"
                    //                     onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                 />
                    //             )}
                    //             {scene.fogMode !== Scene.FOGMODE_NONE && (
                    //                 <CheckBoxLineComponent
                    //                     label="Apply fog"
                    //                     target={mesh}
                    //                     propertyName="applyFog"
                    //                     onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                 />
                    //             )}
                    //             {!mesh.parent && (
                    //                 <CheckBoxLineComponent
                    //                     label="Infinite distance"
                    //                     target={mesh}
                    //                     propertyName="infiniteDistance"
                    //                     onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                 />
                    //             )}
                    //             <SliderLineComponent
                    //                 lockObject={this.props.lockObject}
                    //                 label="Rendering group ID"
                    //                 decimalCount={0}
                    //                 target={mesh}
                    //                 propertyName="renderingGroupId"
                    //                 minimum={RenderingManager.MIN_RENDERINGGROUPS}
                    //                 maximum={RenderingManager.MAX_RENDERINGGROUPS - 1}
                    //                 step={1}
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //             <HexLineComponent
                    //                 isInteger
                    //                 lockObject={this.props.lockObject}
                    //                 label="Layer mask"
                    //                 target={mesh}
                    //                 propertyName="layerMask"
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //         </LineContainerComponent>
                    //         {mesh.morphTargetManager != null && (
                    //             <LineContainerComponent title="MORPH TARGETS" closed={true} selection={this.props.globalState}>
                    //                 {morphTargets.map((mt, i) => {
                    //                     return (
                    //                         <SliderLineComponent
                    //                             lockObject={this.props.lockObject}
                    //                             key={i}
                    //                             label={mt.name}
                    //                             target={mt}
                    //                             propertyName="influence"
                    //                             minimum={0}
                    //                             maximum={1}
                    //                             step={0.01}
                    //                             onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                         />
                    //                     );
                    //                 })}
                    //             </LineContainerComponent>
                    //         )}
                    //         <AnimationGridComponent globalState={this.props.globalState} animatable={mesh} scene={mesh.getScene()} lockObject={this.props.lockObject} />
                    //         <LineContainerComponent title="ADVANCED" closed={true} selection={this.props.globalState}>
                    //             {mesh.useBones && (
                    //                 <CheckBoxLineComponent
                    //                     label="Compute bones using shaders"
                    //                     target={mesh}
                    //                     propertyName="computeBonesUsingShaders"
                    //                     onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                 />
                    //             )}
                    //             <CheckBoxLineComponent
                    //                 label="Collisions"
                    //                 target={mesh}
                    //                 propertyName="checkCollisions"
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //             <TextLineComponent label="Geometry ID" value={mesh.geometry?.uniqueId.toString()} />
                    //             <TextLineComponent label="Has normals" value={mesh.isVerticesDataPresent(VertexBuffer.NormalKind) ? "Yes" : "No"} />
                    //             <TextLineComponent label="Has vertex colors" value={mesh.isVerticesDataPresent(VertexBuffer.ColorKind) ? "Yes" : "No"} />
                    //             <TextLineComponent label="Has UV set 0" value={mesh.isVerticesDataPresent(VertexBuffer.UVKind) ? "Yes" : "No"} />
                    //             <TextLineComponent label="Has UV set 1" value={mesh.isVerticesDataPresent(VertexBuffer.UV2Kind) ? "Yes" : "No"} />
                    //             <TextLineComponent label="Has UV set 2" value={mesh.isVerticesDataPresent(VertexBuffer.UV3Kind) ? "Yes" : "No"} />
                    //             <TextLineComponent label="Has UV set 3" value={mesh.isVerticesDataPresent(VertexBuffer.UV4Kind) ? "Yes" : "No"} />
                    //             <TextLineComponent label="Has tangents" value={mesh.isVerticesDataPresent(VertexBuffer.TangentKind) ? "Yes" : "No"} />
                    //             <TextLineComponent label="Has matrix weights" value={mesh.isVerticesDataPresent(VertexBuffer.MatricesWeightsKind) ? "Yes" : "No"} />
                    //             <TextLineComponent label="Has matrix indices" value={mesh.isVerticesDataPresent(VertexBuffer.MatricesIndicesKind) ? "Yes" : "No"} />
                    //         </LineContainerComponent>
                    //         {mesh.physicsImpostor != null && (
                    //             <LineContainerComponent title="PHYSICS" closed={true} selection={this.props.globalState}>
                    //                 <FloatLineComponent
                    //                     lockObject={this.props.lockObject}
                    //                     label="Mass"
                    //                     target={mesh.physicsImpostor}
                    //                     propertyName="mass"
                    //                     onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                 />
                    //                 <FloatLineComponent
                    //                     lockObject={this.props.lockObject}
                    //                     label="Friction"
                    //                     target={mesh.physicsImpostor}
                    //                     propertyName="friction"
                    //                     onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                 />
                    //                 <FloatLineComponent
                    //                     lockObject={this.props.lockObject}
                    //                     label="Restitution"
                    //                     target={mesh.physicsImpostor}
                    //                     propertyName="restitution"
                    //                     onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                 />
                    //                 <TextLineComponent label="Type" value={this.convertPhysicsTypeToString()} />
                    //             </LineContainerComponent>
                    //         )}
                    //         {mesh.physicsBody && (
                    //             <PhysicsBodyGridComponent
                    //                 lockObject={this.props.lockObject}
                    //                 globalState={this.props.globalState}
                    //                 body={mesh.physicsBody}
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //         )}
                    //         <LineContainerComponent title="OCCLUSIONS" closed={true} selection={this.props.globalState}>
                    //             <OptionsLine
                    //                 label="Type"
                    //                 options={occlusionTypeOptions}
                    //                 target={mesh}
                    //                 propertyName="occlusionType"
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //             <SliderLineComponent
                    //                 lockObject={this.props.lockObject}
                    //                 label="Retry count"
                    //                 minimum={-1}
                    //                 maximum={10}
                    //                 decimalCount={0}
                    //                 step={1}
                    //                 target={mesh}
                    //                 propertyName="occlusionRetryCount"
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //             <OptionsLine
                    //                 label="Algorithm"
                    //                 options={algorithmOptions}
                    //                 target={mesh}
                    //                 propertyName="occlusionQueryAlgorithmType"
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //         </LineContainerComponent>
                    //         <LineContainerComponent title="EDGE RENDERING" closed={true} selection={this.props.globalState}>
                    //             <CheckBoxLineComponent
                    //                 label="Enable"
                    //                 target={mesh}
                    //                 isSelected={() => mesh.edgesRenderer != null}
                    //                 onSelect={(value) => {
                    //                     if (value) {
                    //                         mesh.enableEdgesRendering();
                    //                     } else {
                    //                         mesh.disableEdgesRendering();
                    //                     }
                    //                 }}
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //             <SliderLineComponent
                    //                 lockObject={this.props.lockObject}
                    //                 label="Edge width"
                    //                 minimum={0}
                    //                 maximum={10}
                    //                 step={0.1}
                    //                 target={mesh}
                    //                 propertyName="edgesWidth"
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //             <Color4LineComponent
                    //                 lockObject={this.props.lockObject}
                    //                 label="Edge color"
                    //                 target={mesh}
                    //                 propertyName="edgesColor"
                    //                 onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //             />
                    //         </LineContainerComponent>
                    //         {!mesh.isAnInstance && (
                    //             <LineContainerComponent title="OUTLINE & OVERLAY" closed={true} selection={this.props.globalState}>
                    //                 <CheckBoxLineComponent
                    //                     label="Render overlay"
                    //                     target={mesh}
                    //                     propertyName="renderOverlay"
                    //                     onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                 />
                    //                 <Color3LineComponent
                    //                     lockObject={this.props.lockObject}
                    //                     label="Overlay color"
                    //                     target={mesh}
                    //                     propertyName="overlayColor"
                    //                     onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                 />
                    //                 <CheckBoxLineComponent
                    //                     label="Render outline"
                    //                     target={mesh}
                    //                     propertyName="renderOutline"
                    //                     onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                 />
                    //                 <Color3LineComponent
                    //                     lockObject={this.props.lockObject}
                    //                     label="Outline color"
                    //                     target={mesh}
                    //                     propertyName="outlineColor"
                    //                     onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                 />
                    //                 <FloatLineComponent
                    //                     lockObject={this.props.lockObject}
                    //                     label="Outline width"
                    //                     target={mesh}
                    //                     propertyName="outlineWidth"
                    //                     onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    //                 />
                    //             </LineContainerComponent>
                    //         )}
                    //         <LineContainerComponent title="DEBUG" closed={true} selection={this.props.globalState}>
                    //             {!mesh.isAnInstance && <CheckBoxLineComponent label="Display normals" isSelected={() => displayNormals} onSelect={() => this.displayNormals()} />}
                    //             {!mesh.isAnInstance && (
                    //                 <CheckBoxLineComponent label="Display vertex colors" isSelected={() => displayVertexColors} onSelect={() => this.displayVertexColors()} />
                    //             )}
                    //             {mesh.isVerticesDataPresent(VertexBuffer.NormalKind) && (
                    //                 <CheckBoxLineComponent label="Render vertex normals" isSelected={() => renderNormalVectors} onSelect={() => this.renderNormalVectors()} />
                    //             )}
                    //             {!mesh.isAnInstance && (
                    //                 <CheckBoxLineComponent label="Render wireframe over mesh" isSelected={() => renderWireframeOver} onSelect={() => this.renderWireframeOver()} />
                    //             )}
                    //             {!mesh.isAnInstance && mesh.skeleton && (
                    //                 <CheckBoxLineComponent label="Display BoneWeights" isSelected={() => displayBoneWeights} onSelect={() => this.displayBoneWeights()} />
                    //             )}
                    //             {!mesh.isAnInstance && this.state.displayBoneWeights && mesh.skeleton && (
                    //                 <OptionsLine
                    //                     label="Target Bone Name"
                    //                     options={targetBoneOptions}
                    //                     target={mesh.reservedDataStore}
                    //                     propertyName="displayBoneIndex"
                    //                     noDirectUpdate={true}
                    //                     onSelect={(value) => {
                    //                         this.onBoneDisplayIndexChange(value as number);
                    //                         this.forceUpdate();
                    //                     }}
                    //                 />
                    //             )}
                    //             {!mesh.isAnInstance && this.state.displayBoneWeights && mesh.skeleton && (
                    //                 <SliderLineComponent
                    //                     lockObject={this.props.lockObject}
                    //                     label="Target Bone"
                    //                     decimalCount={0}
                    //                     target={mesh.reservedDataStore}
                    //                     propertyName="displayBoneIndex"
                    //                     minimum={0}
                    //                     maximum={targetBoneOptions.length - 1 || 0}
                    //                     step={1}
                    //                     onChange={(value) => {
                    //                         this.onBoneDisplayIndexChange(value);
                    //                         this.forceUpdate();
                    //                     }}
                    //                 />
                    //             )}
                    //             {!mesh.isAnInstance && mesh.skeleton && (
                    //                 <CheckBoxLineComponent label="Display SkeletonMap" isSelected={() => displaySkeletonMap} onSelect={() => this.displaySkeletonMap()} />
                    //             )}
                    //         </LineContainerComponent> */}
                    //     </Accordion>
                    // </div>
                );
            }
        );

        return {
            dispose: () => registration.dispose(),
        };
    },
};
