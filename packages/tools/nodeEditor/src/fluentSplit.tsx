import type { FunctionComponent } from "react";
import { useEffect, useRef, useState, Children, isValidElement } from "react";

import { makeStyles, mergeClasses } from "@fluentui/react-components";

type ResizablePanelProps = {
    /** Initial size in pixels */
    initialSize?: number;
    /** Minimum size in pixels */
    minSize?: number;
    /** Maximum size in pixels */
    maxSize?: number;
    /** Children to render inside the panel */
    children: React.ReactNode;
    /** Storage key for persisting size */
    storageKey?: string;
    /** Whether this panel should fill remaining space */
    fillRemaining?: boolean;
};

type SplitContainerProps = {
    /** ID for the container */
    id?: string;
    /** Whether to split horizontally (default) or vertically */
    vertical?: boolean;
    /** Children - should be ResizablePanel components */
    children: React.ReactNode;
    /** Ref to the container element */
    containerRef?: React.RefObject<HTMLDivElement>;
    /** Event handlers */
    onPointerMove?: (evt: React.PointerEvent) => void;
    onPointerDown?: (evt: React.PointerEvent) => void;
    onDrop?: (evt: React.DragEvent<HTMLDivElement>) => void;
    onDragOver?: (evt: React.DragEvent<HTMLDivElement>) => void;
};

const useStyles = makeStyles({
    container: {
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
    },
    vertical: {
        flexDirection: "column",
    },
    horizontal: {
        flexDirection: "row",
    },
    panel: {
        overflow: "auto",
        position: "relative",
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
    },
    resizer: {
        flexShrink: 0,
        backgroundColor: "#444",
        userSelect: "none",
        transition: "background-color 0.2s ease",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ":hover": {
            backgroundColor: "#888",
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ":active": {
            backgroundColor: "#aaa",
        },
    },
    resizerHorizontal: {
        width: "8px",
        cursor: "col-resize",
    },
    resizerVertical: {
        height: "8px",
        cursor: "row-resize",
    },
});

export const ResizablePanel: React.FC<ResizablePanelProps> = ({ initialSize = 300, minSize = 100, maxSize = 1000, children, storageKey, fillRemaining = false }) => {
    const classes = useStyles();
    const panelRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState(() => {
        if (storageKey) {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                return Math.max(minSize, Math.min(maxSize, parseInt(stored)));
            }
        }
        return initialSize;
    });

    // Store the setter function on the element so Resizer can access it
    useEffect(() => {
        if (panelRef.current) {
            (panelRef.current as any)._setSize = (newSize: number) => {
                setSize(newSize);
                if (storageKey) {
                    localStorage.setItem(storageKey, newSize.toString());
                }
            };
        }
    }, [storageKey]);

    return (
        <div
            ref={panelRef}
            className={classes.panel}
            style={
                fillRemaining
                    ? {
                          flex: "1 1 auto",
                          minWidth: `${minSize}px`,
                          minHeight: `${minSize}px`,
                      }
                    : {
                          flexGrow: 0,
                          flexShrink: 0,
                          flexBasis: `${size}px`,
                      }
            }
            data-min-size={minSize}
            data-max-size={maxSize}
            data-fill-remaining={fillRemaining ? "true" : undefined}
        >
            {children}
        </div>
    );
};

export const FluentSplitContainer: FunctionComponent<SplitContainerProps> = ({
    id,
    vertical = false,
    children,
    containerRef,
    onPointerMove,
    onPointerDown,
    onDrop,
    onDragOver,
}) => {
    const classes = useStyles();
    const localRef = useRef<HTMLDivElement>(null);
    const ref = containerRef || localRef;

    const childArray = Children.toArray(children);

    return (
        <div
            id={id}
            ref={ref}
            className={mergeClasses(classes.container, vertical ? classes.vertical : classes.horizontal)}
            onPointerMove={onPointerMove}
            onPointerDown={onPointerDown}
            onDrop={onDrop}
            onDragOver={onDragOver}
        >
            {childArray.flatMap((child, index) => {
                const isLastChild = index === childArray.length - 1;
                const isResizablePanel = isValidElement(child) && child.type === ResizablePanel;

                const elements = [];

                if (isResizablePanel) {
                    elements.push(child);
                } else {
                    elements.push(
                        <div key={`content-${index}`} className={classes.panel} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            {child}
                        </div>
                    );
                }

                if (!isLastChild) {
                    elements.push(<Resizer key={`resizer-${index}`} vertical={vertical} index={index} />);
                }

                return elements;
            })}
        </div>
    );
};

const Resizer: React.FC<{ vertical: boolean; index: number }> = ({ vertical, index }) => {
    const classes = useStyles();
    const resizerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const resizer = resizerRef.current;
        if (!resizer) {
            return;
        }

        let targetPanel = resizer.previousElementSibling as HTMLElement;
        if (!targetPanel) {
            return;
        }

        // If the previous panel fills remaining space, resize the next panel instead
        if (targetPanel.dataset.fillRemaining === "true") {
            targetPanel = resizer.nextElementSibling as HTMLElement;
            if (!targetPanel) {
                return;
            }
        }

        // Check if this element has the data attributes - if not, it's not resizable
        if (!targetPanel.dataset.minSize) {
            return;
        }

        const minSize = parseInt(targetPanel.dataset.minSize || "100");
        const maxSize = parseInt(targetPanel.dataset.maxSize || "1000");
        const isResizingNext = targetPanel.dataset.fillRemaining !== "true" && targetPanel === resizer.nextElementSibling;
        let startSize = 0;
        let startPos = 0;

        const onPointerMove = (e: PointerEvent) => {
            e.preventDefault();
            e.stopPropagation();
            let delta = vertical ? e.clientY - startPos : e.clientX - startPos;
            // If resizing next panel, invert the delta
            if (isResizingNext) {
                delta = -delta;
            }
            const newSize = Math.max(minSize, Math.min(maxSize, startSize + delta));

            // Call the setter function stored on the element
            const setSizeFunc = (targetPanel as any)._setSize;
            if (setSizeFunc) {
                setSizeFunc(newSize);
            }
        };

        const onPointerDown = (e: PointerEvent) => {
            e.preventDefault();
            e.stopPropagation();
            startPos = vertical ? e.clientY : e.clientX;
            startSize = vertical ? targetPanel.offsetHeight : targetPanel.offsetWidth;

            resizer.setPointerCapture(e.pointerId);
            document.addEventListener("pointermove", onPointerMove);
        };

        const onPointerUp = (e: PointerEvent) => {
            e.preventDefault();
            e.stopPropagation();
            resizer.releasePointerCapture(e.pointerId);
            document.removeEventListener("pointermove", onPointerMove);
        };

        resizer.addEventListener("pointerdown", onPointerDown);
        resizer.addEventListener("pointerup", onPointerUp);

        return () => {
            resizer.removeEventListener("pointerdown", onPointerDown);
            resizer.removeEventListener("pointerup", onPointerUp);
            document.removeEventListener("pointermove", onPointerMove);
        };
    }, [vertical]);

    return <div ref={resizerRef} className={mergeClasses(classes.resizer, vertical ? classes.resizerVertical : classes.resizerHorizontal)} />;
};
