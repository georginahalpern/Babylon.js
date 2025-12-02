import { useContext } from "react";
import type { FunctionComponent } from "react";
import { DataStorage } from "core/Misc/dataStorage";
import { NodeMaterialModes } from "core/Materials/Node/Enums/nodeMaterialModes";
import { BlendModeOptions } from "shared-ui-components/constToOptionsMaps";
import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";
import { ArrowAutofitContentRegular, LightbulbFilamentRegular, StackRegular } from "@fluentui/react-icons";
import { NumberDropdown } from "shared-ui-components/fluent/primitives/dropdown";
import { BoundProperty } from "shared-ui-components/fluent/hooks/boundProperty";
import type { Observable } from "core/Misc";
import { GlobalStateContext } from "../../globalState";

export const BottomBar: FunctionComponent<{}> = () => {
    const globalState = useContext(GlobalStateContext);

    const onChange = (value: string | number | boolean, storageName: string, observable: Observable<any>) => {
        switch (typeof value) {
            case "boolean":
                DataStorage.WriteBoolean(storageName, value);
                break;
            case "number":
                DataStorage.WriteNumber(storageName, value);
                break;
            case "string":
                DataStorage.WriteString(storageName, value);
                break;
        }
        observable.notifyObservers(value);
    };

    return (
        <>
            {globalState.mode === NodeMaterialModes.Particle && (
                <BoundProperty
                    component={NumberDropdown}
                    title="BlendMode"
                    options={BlendModeOptions}
                    target={globalState}
                    propertyKey="particleSystemBlendMode"
                    customChange={(val: number) => onChange(val, "DefaultParticleSystemBlendMode", globalState.stateManager.onUpdateRequiredObservable)}
                />
            )}
            {globalState.mode === NodeMaterialModes.Material && (
                <>
                    <BoundProperty
                        component={ToggleButton}
                        title="Turn on/off direction light #0"
                        target={globalState}
                        propertyKey="directionalLight0"
                        appearance="transparent"
                        checkedIcon={LightbulbFilamentRegular}
                        customChange={(val: boolean) => onChange(val, "DirectionalLight0", globalState.onLightUpdated)}
                    />
                    <BoundProperty
                        component={ToggleButton}
                        title="Turn on/off direction light #1"
                        target={globalState}
                        propertyKey="directionalLight1"
                        appearance="transparent"
                        checkedIcon={LightbulbFilamentRegular}
                        customChange={(val: boolean) => onChange(val, "DirectionalLight1", globalState.onLightUpdated)}
                    />
                    <BoundProperty
                        component={ToggleButton}
                        title="Turn on/off hemispheric light"
                        target={globalState}
                        propertyKey="hemisphericLight"
                        appearance="transparent"
                        checkedIcon={LightbulbFilamentRegular}
                        customChange={(val: boolean) => onChange(val, "HemisphericLight", globalState.onLightUpdated)}
                    />
                    <BoundProperty
                        component={ToggleButton}
                        title="Turn on/off environment"
                        target={globalState}
                        propertyKey="backgroundHDR"
                        appearance="transparent"
                        checkedIcon={LightbulbFilamentRegular}
                        customChange={(val: boolean) => onChange(val, "BackgroundHDR", globalState.onBackgroundHDRUpdated)}
                    />

                    <BoundProperty
                        component={ToggleButton}
                        title="Render with depth pre-pass"
                        target={globalState}
                        propertyKey="depthPrePass"
                        appearance="transparent"
                        checkedIcon={StackRegular}
                        customChange={(val: boolean) => onChange(val, "DepthPrePass", globalState.onDepthPrePassChanged)}
                    />
                    <BoundProperty
                        component={ToggleButton}
                        title="Render without back face culling"
                        target={globalState}
                        propertyKey="backFaceCulling"
                        appearance="transparent"
                        checkedIcon={ArrowAutofitContentRegular}
                        customChange={(val: boolean) => onChange(val, "BackFaceCulling", globalState.onBackFaceCullingChanged)}
                    />
                </>
            )}
        </>
    );
};
