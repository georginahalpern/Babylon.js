import { useContext, useEffect, useRef, useState } from "react";
import type { FunctionComponent } from "react";
import { makeStyles } from "@fluentui/react-components";
import { GlobalStateContext } from "../../globalState";

const useCanvasStyles = makeStyles({
    container: {
        position: "relative",
        width: "100%",
        height: "100%",
    },
    canvas: {
        width: "100%",
        height: "100%",
        display: "block",
    },
    hidden: {
        visibility: "hidden",
    },
    loading: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(32,32,32,0.5)", // semi-transparent overlay
        color: "#fff",
        zIndex: 2,
        fontSize: "1.2em",
        pointerEvents: "none", // allows pointer events to pass through
    },
});

type CanvasComponentProps = {
    canvasId?: string;
};

export const CanvasComponent: FunctionComponent<CanvasComponentProps> = ({ canvasId = "preview-canvas" }) => {
    const classes = useCanvasStyles();
    const globalState = useContext(GlobalStateContext);
    const [isLoading, setIsLoading] = useState(true);
    const consoleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const isLoadingObs = globalState.onIsLoadingChanged.add((state) => {
            setIsLoading(state);
        });
        return () => {
            globalState.onIsLoadingChanged.remove(isLoadingObs);
        };
    }, []);

    const onPointerOverCanvas = () => {
        globalState.pointerOverCanvas = true;
    };
    const onPointerOutCanvas = () => {
        globalState.pointerOverCanvas = false;
    };

    const onKeyUp = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
        consoleRef.current && (consoleRef.current.innerText = "");
        e.preventDefault();
    };

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const processPointerMoveAsync = async (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!e.ctrlKey || !globalState.pickingTexture) {
            consoleRef.current && (consoleRef.current.innerText = "");
            return;
        }

        const data = (await globalState.pickingTexture.readPixels()!) as Float32Array;
        const size = globalState.pickingTexture.getSize();
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();

        const x = (((e.clientX - rect.left) / rect.width) * size.width) | 0;
        const y = (size.height - 1 - ((e.clientY - rect.top) / rect.height) * size.height) | 0;

        if ((x > 0 && y > 0 && x < size.width && y < size.height, rect.top)) {
            const pixelLocation = (y * size.width + x) * 4;
            consoleRef.current!.innerText = `R:${data[pixelLocation].toFixed(2)}, G:${data[pixelLocation + 1].toFixed(2)}, B:${data[pixelLocation + 2].toFixed(2)}, A:${data[pixelLocation + 3].toFixed(2)}`;
        }

        e.preventDefault();
    };

    // IMPORTANT: preview-canvas id is used to pass canvas to previewManager
    return (
        <div className={classes.container}>
            <canvas
                className={classes.canvas}
                id={canvasId}
                onPointerOver={onPointerOverCanvas}
                onPointerOut={onPointerOutCanvas}
                onKeyUp={onKeyUp}
                onPointerMove={processPointerMoveAsync}
            />
            <div className={isLoading ? classes.loading : classes.hidden}>Please wait, loading...</div>
            <div ref={consoleRef} />
        </div>
    );
};
