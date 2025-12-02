import { useContext, useEffect, useState } from "react";
import type { ComponentType, FunctionComponent, PropsWithChildren } from "react";
import { WindowNewRegular } from "@fluentui/react-icons";
import { tokens } from "@fluentui/tokens";
import { makeStyles, Toolbar } from "@fluentui/react-components";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";
import { TopBar } from "./topBar";
import { BottomBar } from "./bottomBar";
import { CanvasComponent } from "./canvas";
import { GlobalStateContext } from "../../globalState";

type PreviewAreaComponentProps = {
    onMounted?: () => void;
    onTogglePopout: () => void;
};

const usePreviewStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
    },
    toolbar: {
        padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalS}`,
        justifyContent: "space-between",
    },
    canvasContainer: {
        position: "relative",
        flex: 1,
        minHeight: 0,
    },
    waitPanel: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: tokens.colorNeutralBackground1,
        padding: tokens.spacingVerticalXL,
        borderRadius: tokens.borderRadiusMedium,
        boxShadow: tokens.shadow16,
    },
    hidden: {
        display: "none",
    },
});

type PreviewComponentProps = {
    topToolbar: ComponentType;
    bottomToolbar: ComponentType;
    onTogglePopout: () => void;
    onMounted?: () => void;
};

const PreviewComponent: FunctionComponent<PropsWithChildren<PreviewComponentProps>> = (props) => {
    const classes = usePreviewStyles();
    const { onMounted } = props;
    const globalState = useContext(GlobalStateContext);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        onMounted?.();
        const isLoadingObs = globalState?.onIsLoadingChanged.add((state) => {
            setIsLoading(state);
        });
        const resetObs = globalState?.onResetRequiredObservable.add(() => {
            setIsLoading(false);
        });
        return () => {
            isLoadingObs && globalState?.onIsLoadingChanged.remove(isLoadingObs);
            resetObs && globalState?.onResetRequiredObservable.remove(resetObs);
        };
    }, []);

    return (
        <div className={classes.container}>
            <Toolbar size="medium" className={classes.toolbar}>
                <props.topToolbar />
                <Button appearance="transparent" icon={WindowNewRegular} title="Open preview in new window" onClick={props.onTogglePopout ?? (() => {})} />
            </Toolbar>
            <div className={classes.canvasContainer}>
                <CanvasComponent />
                {isLoading && <div className={classes.waitPanel}>Please wait, loading...</div>}
            </div>
            <Toolbar size="medium" className={classes.toolbar}>
                <props.bottomToolbar />
            </Toolbar>
        </div>
    );
};

export const NodeEditorPreview: FunctionComponent<PreviewAreaComponentProps> = (props) => {
    return (
        <ToolContext.Provider value={{ useFluent: true, disableCopy: false, toolName: "", size: "medium" }}>
            <PreviewComponent topToolbar={TopBar} bottomToolbar={BottomBar} {...props} />
        </ToolContext.Provider>
    );
};
