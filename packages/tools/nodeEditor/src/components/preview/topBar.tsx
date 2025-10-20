import { useContext, useEffect, useRef, useState } from "react";
import type { FunctionComponent } from "react";
import type { Color3 } from "core/Maths/math.color";
import { Color4 } from "core/Maths/math.color";
import { PreviewType } from "./previewType";
import { DataStorage } from "core/Misc/dataStorage";
import { NodeMaterialModes } from "core/Materials/Node/Enums/nodeMaterialModes";
// import popUpIcon from "./svgs/popOut.svg";
// import colorPicker from "./svgs/colorPicker.svg";
// import envPicker from "./svgs/envPicker.svg";
// import pauseIcon from "./svgs/pauseIcon.svg";
// import playIcon from "./svgs/playIcon.svg";
import { makeStyles } from "@fluentui/react-components";
import { PauseRegular, PlayRegular, WeatherSunnyLowRegular } from "@fluentui/react-icons";
import { NumberDropdown } from "shared-ui-components/fluent/primitives/dropdown";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";
import { ColorPickerPopup } from "shared-ui-components/fluent/primitives/colorPicker";
import { BoundProperty } from "shared-ui-components/fluent/hooks/boundProperty";
import { GlobalStateContext } from "../../globalState";

const useStyles = makeStyles({
    hiddenInput: {
        display: "none",
    },
});

// Options
const MeshTypeOptions = [
    { label: "Cube", value: PreviewType.Box },
    { label: "Cylinder", value: PreviewType.Cylinder },
    { label: "Plane", value: PreviewType.Plane },
    { label: "Shader ball", value: PreviewType.ShaderBall },
    { label: "Sphere", value: PreviewType.Sphere },
    { label: "Load...", value: PreviewType.Custom + 1 },
];
const ParticleTypeOptions = [
    { label: "Default", value: PreviewType.DefaultParticleSystem },
    { label: "Bubbles", value: PreviewType.Bubbles },
    { label: "Explosion", value: PreviewType.Explosion },
    { label: "Fire", value: PreviewType.Fire },
    { label: "Rain", value: PreviewType.Rain },
    { label: "Smoke", value: PreviewType.Smoke },
    { label: "Load...", value: PreviewType.Custom + 1 },
];
const GaussianSplattingTypeOptions = [
    { label: "Default", value: PreviewType.Parrot },
    { label: "Bricks Skull", value: PreviewType.BricksSkull },
    { label: "Plants", value: PreviewType.Plants },
    { label: "Load...", value: PreviewType.Custom + 1 },
];

export const TopBar: FunctionComponent<{}> = () => {
    const classes = useStyles();
    const globalState = useContext(GlobalStateContext);

    const filePickerRef = useRef<HTMLInputElement>(null);
    const envPickerRef = useRef<HTMLInputElement>(null);
    const [_, forceUpdate] = useState(0);
    // Observers
    useEffect(() => {
        const resetObs = globalState.onResetRequiredObservable.add(() => {
            forceUpdate((prev) => prev + 1);
        });
        const dropObs = globalState.onDropEventReceivedObservable.add((event) => {
            useCustomMesh(event);
        });
        const refreshObs = globalState.onRefreshPreviewMeshControlComponentRequiredObservable.add(() => {
            forceUpdate((prev) => prev + 1);
        });
        return () => {
            globalState.onResetRequiredObservable.remove(resetObs);
            globalState.onDropEventReceivedObservable.remove(dropObs);
            globalState.onRefreshPreviewMeshControlComponentRequiredObservable.remove(refreshObs);
        };
    }, []);

    // Logic
    const useCustomMesh = (evt: any) => {
        const files: File[] = evt.target?.files || evt.dataTransfer?.files;
        if (files && files.length) {
            const file = files[0];
            globalState.previewFile = file;
            globalState.previewType = PreviewType.Custom;
            globalState.listOfCustomPreviewFiles = [...files];
            globalState.stateManager.onPreviewCommandActivated.notifyObservers(false);
        }
        if (filePickerRef.current) {
            filePickerRef.current.value = "";
        }
    };

    const useCustomEnv = (evt: any) => {
        const files: File[] = evt.target?.files || evt.dataTransfer?.files;
        if (files && files.length) {
            const file = files[0];
            globalState.envFile = file;
            globalState.envType = PreviewType.Custom;
            globalState.stateManager.onPreviewCommandActivated.notifyObservers(false);
            forceUpdate((prev) => prev + 1);
        }
        if (envPickerRef.current) {
            envPickerRef.current.value = "";
        }
    };

    const changeBackground = (newColor: Color3 | Color4) => {
        DataStorage.WriteNumber("BackgroundColorR", newColor.r);
        DataStorage.WriteNumber("BackgroundColorG", newColor.g);
        DataStorage.WriteNumber("BackgroundColorB", newColor.b);
        const newBackgroundColor = Color4.FromColor3(newColor, 1.0);
        globalState.backgroundColor = newBackgroundColor;
        globalState.onPreviewBackgroundChanged.notifyObservers();
    };

    if (globalState.listOfCustomPreviewFiles.length > 0) {
        MeshTypeOptions.splice(0, 0, { label: "Custom", value: PreviewType.Custom });
        ParticleTypeOptions.splice(0, 0, { label: "Custom", value: PreviewType.Custom });
        GaussianSplattingTypeOptions.splice(0, 0, { label: "Custom", value: PreviewType.Custom });
    }
    const options =
        globalState.mode === NodeMaterialModes.Particle
            ? ParticleTypeOptions
            : globalState.mode === NodeMaterialModes.GaussianSplatting
              ? GaussianSplattingTypeOptions
              : MeshTypeOptions;
    const accept = globalState.mode === NodeMaterialModes.Particle ? ".json" : ".*";

    return (
        <>
            {(globalState.mode === NodeMaterialModes.Material || globalState.mode === NodeMaterialModes.Particle || globalState.mode === NodeMaterialModes.GaussianSplatting) && (
                <>
                    <BoundProperty
                        component={NumberDropdown}
                        options={options}
                        target={globalState}
                        propertyKey="previewType"
                        customChange={(value: number) => {
                            if (value !== PreviewType.Custom + 1) {
                                globalState.stateManager.onPreviewCommandActivated.notifyObservers(false);
                                DataStorage.WriteNumber("PreviewType", value);
                            } else {
                                filePickerRef.current?.click();
                            }
                        }}
                    />

                    <div className={classes.hiddenInput} title="Preview with a custom mesh">
                        <input ref={filePickerRef} multiple id="file-picker" type="file" onChange={useCustomMesh} accept={accept} />
                        <input ref={envPickerRef} id="env-picker" accept=".env" type="file" onChange={useCustomEnv} />
                    </div>
                </>
            )}
            {globalState.mode === NodeMaterialModes.Material && (
                <>
                    <Button icon={WeatherSunnyLowRegular} title="Environment image" onClick={() => envPickerRef.current?.click()} />
                    <BoundProperty
                        component={ToggleButton}
                        target={globalState}
                        propertyKey="rotatePreview"
                        title="Rotate Preview"
                        checkedIcon={PlayRegular}
                        uncheckedIcon={PauseRegular}
                        customChange={() => globalState.onAnimationCommandActivated.notifyObservers()}
                    />
                    <ColorPickerPopup value={globalState.backgroundColor} onChange={changeBackground} title="BackgroundColor" />
                </>
            )}
        </>
    );
};
