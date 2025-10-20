import { useContext, useEffect, useState } from "react";
import type { ComponentType, FunctionComponent, PropsWithChildren } from "react";
import { WindowNewRegular } from "@fluentui/react-icons";
import { tokens } from "@fluentui/tokens";
import { makeStyles, Toolbar } from "@fluentui/react-components";
import { Button } from "shared-ui-components/fluent/primitives/button";
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
    },
    toolbar: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: tokens.spacingHorizontalS,
        gap: tokens.spacingHorizontalS,
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

    const [, forceUpdate] = useState(0);

    useEffect(() => {
        onMounted?.();
        const isLoadingObs = globalState?.onIsLoadingChanged.add((state) => {
            forceUpdate((prev) => prev + 1);
        });
        const resetObs = globalState?.onResetRequiredObservable.add(() => {
            forceUpdate((prev) => prev + 1);
        });
        return () => {
            isLoadingObs && globalState?.onIsLoadingChanged.remove(isLoadingObs);
            resetObs && globalState?.onResetRequiredObservable.remove(resetObs);
        };
    }, []);

    return (
        <div className={classes.container}>
            <Toolbar>
                <props.topToolbar />
                <Button icon={WindowNewRegular} title="Open preview in new window" onClick={props.onTogglePopout ?? (() => {})} />
            </Toolbar>
            <CanvasComponent />
            <Toolbar>
                <props.bottomToolbar />
            </Toolbar>
        </div>
    );
};

export const NodeEditorPreview: FunctionComponent<PreviewAreaComponentProps> = (props) => {
    return <PreviewComponent topToolbar={TopBar} bottomToolbar={BottomBar} {...props} />;
};
