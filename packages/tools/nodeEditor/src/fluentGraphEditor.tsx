import { useState, useRef, useEffect, useCallback } from "react";
import type { FunctionComponent } from "react";
import { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import { NodeListComponent } from "./components/nodeList/nodeListComponent";
import { PropertyTabComponent } from "./components/propertyTab/propertyTabComponent";
import { LogComponent, LogEntry } from "./components/log/logComponent";
import type { NodeMaterialBlockConnectionPointTypes } from "core/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes";
import { CustomBlock } from "core/Materials/Node/Blocks/customBlock";
import { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { BlockTools } from "./blockTools";
import { SerializationTools } from "./serializationTools";
import { FluentDialog } from "./fluentDialog";
import { GraphCanvasComponent } from "shared-ui-components/nodeGraphSystem/graphCanvas";
import type { GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import { TypeLedger } from "shared-ui-components/nodeGraphSystem/typeLedger";
import { FluentSplitContainer, ResizablePanel } from "./fluentSplit";
import type { IEditorData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeLocationInfo";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";
import type { GlobalState } from "./globalState";
import { GlobalStateContext } from "./globalState";
import { HistoryStack } from "shared-ui-components/historyStack";
import { NodeEditorPreview } from "./components/preview/nodeEditorPreview";

interface IFluentGraphEditorProps {
    globalState: GlobalState;
}

/**
 * Fluent UI-based Graph Editor component for Node Material Editor
 * @param props - Component props
 * @returns Functional component
 */
export const FluentGraphEditor: FunctionComponent<IFluentGraphEditorProps> = ({ globalState }) => {
    const [errorMessage, setErrorMessage] = useState("");
    const [, forceUpdate] = useState(0);

    const showError = useCallback((msg: string) => {
        setErrorMessage(msg);
    }, []);

    const graphCanvasRef = useRef<GraphCanvasComponent>(null);
    const diagramContainerRef = useRef<HTMLDivElement>(null);
    const historyStackRef = useRef<HistoryStack | null>(null);
    const mouseLocationRef = useRef({ x: 0, y: 0 });

    const appendBlock = useCallback(
        (dataToAppend: NodeMaterialBlock | INodeData, recursion = true) => {
            if (!graphCanvasRef.current) {
                return null;
            }

            return graphCanvasRef.current.createNodeFromObject(
                dataToAppend instanceof NodeMaterialBlock ? TypeLedger.NodeDataBuilder(dataToAppend, graphCanvasRef.current) : dataToAppend,
                (block: NodeMaterialBlock) => {
                    if (globalState.nodeMaterial.attachedBlocks.indexOf(block) === -1) {
                        globalState.nodeMaterial.attachedBlocks.push(block);
                    }

                    if (block.isFinalMerger) {
                        globalState.nodeMaterial.addOutputNode(block);
                    }
                },
                recursion
            );
        },
        [globalState]
    );

    const addValueNode = useCallback(
        (type: string) => {
            const nodeType: NodeMaterialBlockConnectionPointTypes = BlockTools.GetConnectionNodeTypeFromString(type);
            const newInputBlock = new InputBlock(type, undefined, nodeType);
            return appendBlock(newInputBlock);
        },
        [appendBlock]
    );

    const buildMaterial = useCallback(() => {
        if (!globalState.nodeMaterial) {
            return;
        }

        const material = globalState.nodeMaterial;
        try {
            material.options.emitComments = true;
            material.build(true);
        } catch (err) {
            globalState.onLogRequiredObservable.notifyObservers(new LogEntry(err, true));
        }
    }, [globalState]);

    const loadGraph = useCallback(() => {
        if (!graphCanvasRef.current) {
            return;
        }

        const material = globalState.nodeMaterial;
        for (const n of material._vertexOutputNodes) {
            appendBlock(n, true);
        }
        for (const n of material._fragmentOutputNodes) {
            appendBlock(n, true);
        }

        for (const n of material.attachedBlocks) {
            appendBlock(n, true);
        }

        // Links
        for (const n of material.attachedBlocks) {
            if (n.inputs.length) {
                const nodeData = graphCanvasRef.current.findNodeFromData(n);
                for (const input of nodeData.content.inputs) {
                    if (input.isConnected) {
                        graphCanvasRef.current.connectPorts(input.connectedPort!, input);
                    }
                }
            }
        }
    }, [globalState, appendBlock]);

    const reOrganize = useCallback(
        (editorData: IEditorData | null = null, isImportingAFrame = false) => {
            if (!graphCanvasRef.current) {
                globalState.hostDocument.querySelector(".wait-screen")?.classList.add("hidden");
                return;
            }

            globalState.hostDocument.querySelector(".wait-screen")?.classList.remove("hidden");
            graphCanvasRef.current._isLoading = true;

            // Use setTimeout to allow the wait screen to render before the heavy operation
            setTimeout(() => {
                try {
                    if (graphCanvasRef.current) {
                        graphCanvasRef.current.reOrganize(editorData, isImportingAFrame);
                    }
                } finally {
                    globalState.hostDocument.querySelector(".wait-screen")?.classList.add("hidden");
                }
            }, 10);
        },
        [globalState]
    );

    const build = useCallback(
        (ignoreEditorData = false) => {
            if (!graphCanvasRef.current) {
                return;
            }

            let editorData = ignoreEditorData ? null : globalState.nodeMaterial.editorData;
            graphCanvasRef.current._isLoading = true;

            if (editorData instanceof Array) {
                editorData = {
                    locations: editorData,
                };
            }

            graphCanvasRef.current.reset();

            if (globalState.nodeMaterial) {
                loadGraph();
            }

            reOrganize(editorData);
        },
        [globalState, loadGraph, reOrganize]
    );

    const emitNewBlock = useCallback(
        (blockType: string, targetX: number, targetY: number) => {
            if (!graphCanvasRef.current || !diagramContainerRef.current) {
                return;
            }

            let newNode: GraphNode;
            let customBlockData: any;

            if (blockType === "") {
                return;
            }

            if (blockType.indexOf("CustomBlock") > -1) {
                const storageData = localStorage.getItem(blockType);
                if (!storageData) {
                    showError(`Error loading custom block`);
                    return;
                }

                customBlockData = JSON.parse(storageData);
                if (!customBlockData) {
                    showError(`Error parsing custom block`);
                    return;
                }
            } else if (blockType.indexOf("Custom") > -1) {
                const storageData = localStorage.getItem(blockType);
                if (storageData) {
                    const frameData = JSON.parse(storageData);

                    const newX = (targetX - graphCanvasRef.current.x - GraphCanvasComponent.NodeWidth) / graphCanvasRef.current.zoom;
                    const newY = (targetY - graphCanvasRef.current.y - 20) / graphCanvasRef.current.zoom;
                    const oldX = frameData.editorData.frames[0].x;
                    const oldY = frameData.editorData.frames[0].y;
                    frameData.editorData.frames[0].x = newX;
                    frameData.editorData.frames[0].y = newY;
                    for (const location of frameData.editorData.locations) {
                        location.x += newX - oldX;
                        location.y += newY - oldY;
                    }

                    SerializationTools.AddFrameToMaterial(frameData, globalState, globalState.nodeMaterial);
                    graphCanvasRef.current.frames[graphCanvasRef.current.frames.length - 1].cleanAccumulation();
                    forceUpdate((prev) => prev + 1);
                    return;
                }
            }

            if (blockType.indexOf("Block") === -1) {
                newNode = addValueNode(blockType)!;
            } else {
                let block: NodeMaterialBlock;
                if (customBlockData) {
                    block = new CustomBlock("");
                    (block as CustomBlock).options = customBlockData;
                } else {
                    block = BlockTools.GetBlockFromString(blockType, globalState.nodeMaterial.getScene(), globalState.nodeMaterial)!;
                }

                if (block.isUnique) {
                    const className = block.getClassName();
                    for (const other of graphCanvasRef.current.getCachedData()) {
                        if (other !== block && other.getClassName() === className) {
                            showError(`You can only have one ${className} per graph`);
                            return;
                        }
                    }
                }

                block.autoConfigure(
                    globalState.nodeMaterial,
                    (filterBlock: NodeMaterialBlock) =>
                        !graphCanvasRef.current!.nodes.some((node: any) => node.enclosingFrameId >= 0 && node.content.data.uniqueId === filterBlock.uniqueId)
                );
                newNode = appendBlock(block)!;
                newNode.addClassToVisual(block.getClassName());
            }

            let offsetX = GraphCanvasComponent.NodeWidth;
            let offsetY = 20;

            if (blockType === "ElbowBlock") {
                offsetX = 10;
                offsetY = 10;
            }

            graphCanvasRef.current.drop(newNode, targetX, targetY, offsetX, offsetY);
            forceUpdate((prev) => prev + 1);

            return newNode;
        },
        [globalState, addValueNode, appendBlock, showError]
    );

    const dropNewBlock = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            if (!diagramContainerRef.current) {
                return;
            }

            const data = event.dataTransfer.getData("babylonjs-material-node");
            const container = diagramContainerRef.current;
            emitNewBlock(data, event.clientX - container.offsetLeft, event.clientY - container.offsetTop);
        },
        [emitNewBlock]
    );

    const zoomToFit = useCallback(() => {
        if (graphCanvasRef.current) {
            graphCanvasRef.current.zoomToFit();
        }
    }, []);

    // Initialize history stack
    useEffect(() => {
        const material = globalState.nodeMaterial;

        const dataProvider = () => {
            SerializationTools.UpdateLocations(material, globalState);
            return material.serialize();
        };

        const applyUpdate = (data: any) => {
            globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
            material.parseSerializedObject(data);
            globalState.onResetRequiredObservable.notifyObservers(false);
        };

        historyStackRef.current = new HistoryStack(dataProvider, applyUpdate);
        globalState.stateManager.historyStack = historyStackRef.current;

        const updateObs = globalState.stateManager.onUpdateRequiredObservable.add(() => {
            void historyStackRef.current?.storeAsync();
        });
        const rebuildObs = globalState.stateManager.onRebuildRequiredObservable.add(() => {
            void historyStackRef.current?.storeAsync();
        });
        const nodeMovedObs = globalState.stateManager.onNodeMovedObservable.add(() => {
            void historyStackRef.current?.storeAsync();
        });
        const newNodeObs = globalState.stateManager.onNewNodeCreatedObservable.add(() => {
            void historyStackRef.current?.storeAsync();
        });
        const clearUndoObs = globalState.onClearUndoStack.add(() => {
            historyStackRef.current?.reset();
        });

        return () => {
            globalState.stateManager.onUpdateRequiredObservable.remove(updateObs);
            globalState.stateManager.onRebuildRequiredObservable.remove(rebuildObs);
            globalState.stateManager.onNodeMovedObservable.remove(nodeMovedObs);
            globalState.stateManager.onNewNodeCreatedObservable.remove(newNodeObs);
            globalState.onClearUndoStack.remove(clearUndoObs);
            historyStackRef.current?.dispose();
        };
    }, [globalState]);

    // Setup observables
    useEffect(() => {
        const newBlockObs = globalState.stateManager.onNewBlockRequiredObservable.add((eventData) => {
            if (!diagramContainerRef.current) {
                return;
            }

            let targetX = eventData.targetX;
            let targetY = eventData.targetY;

            if (eventData.needRepositioning) {
                const container = diagramContainerRef.current;
                targetX = targetX - container.offsetLeft;
                targetY = targetY - container.offsetTop;
            }

            const selectedLink = graphCanvasRef.current?.selectedLink;
            const selectedNode = graphCanvasRef.current?.selectedNodes.length ? graphCanvasRef.current.selectedNodes[0] : null;
            const newNode = emitNewBlock(eventData.type, targetX, targetY);

            if (newNode && eventData.smartAdd && graphCanvasRef.current) {
                if (selectedLink) {
                    graphCanvasRef.current.smartAddOverLink(newNode, selectedLink);
                } else if (selectedNode) {
                    graphCanvasRef.current.smartAddOverNode(newNode, selectedNode);
                }
            }
        });

        const rebuildObs = globalState.stateManager.onRebuildRequiredObservable.add(() => {
            if (globalState.nodeMaterial) {
                buildMaterial();
            }
        });

        const resetObs = globalState.onResetRequiredObservable.add((isDefault) => {
            if (isDefault) {
                if (globalState.nodeMaterial) {
                    buildMaterial();
                }
                build(true);
            } else {
                build();
                if (globalState.nodeMaterial) {
                    buildMaterial();
                }
            }
        });

        const importFrameObs = globalState.onImportFrameObservable.add((source: any) => {
            if (!graphCanvasRef.current) {
                return;
            }

            const frameData = source.editorData.frames[0];
            const blocks = globalState.nodeMaterial.attachedBlocks.slice(-frameData.blocks.length);

            for (const block of blocks) {
                appendBlock(block);
            }
            graphCanvasRef.current.addFrame(frameData);
            reOrganize(globalState.nodeMaterial.editorData, true);
        });

        const zoomObs = globalState.onZoomToFitRequiredObservable.add(() => {
            zoomToFit();
        });

        const reorganizeObs = globalState.onReOrganizedRequiredObservable.add(() => {
            reOrganize();
        });

        globalState.onGetNodeFromBlock = (block) => {
            return graphCanvasRef.current!.findNodeFromData(block);
        };

        const handleKeyDown = (evt: KeyboardEvent) => {
            if (!graphCanvasRef.current) {
                return;
            }

            if (historyStackRef.current?.processKeyEvent(evt)) {
                return;
            }

            void graphCanvasRef.current.handleKeyDownAsync(
                evt,
                (nodeData) => {
                    globalState.nodeMaterial.removeBlock(nodeData.data as NodeMaterialBlock);
                },
                mouseLocationRef.current.x,
                mouseLocationRef.current.y,
                async (nodeData) => {
                    const block = nodeData.data as NodeMaterialBlock;
                    const clone = block.clone(globalState.nodeMaterial.getScene());

                    if (!clone) {
                        return null;
                    }

                    return appendBlock(clone, false);
                },
                globalState.hostDocument.querySelector(".diagram-container") as HTMLDivElement
            );
        };

        globalState.hostDocument.addEventListener("keydown", handleKeyDown);

        return () => {
            globalState.stateManager.onNewBlockRequiredObservable.remove(newBlockObs);
            globalState.stateManager.onRebuildRequiredObservable.remove(rebuildObs);
            globalState.onResetRequiredObservable.remove(resetObs);
            globalState.onImportFrameObservable.remove(importFrameObs);
            globalState.onZoomToFitRequiredObservable.remove(zoomObs);
            globalState.onReOrganizedRequiredObservable.remove(reorganizeObs);
            globalState.hostDocument.removeEventListener("keydown", handleKeyDown);
        };
    }, [globalState, emitNewBlock, buildMaterial, build, appendBlock, reOrganize, zoomToFit]);

    // Initial build
    useEffect(() => {
        build();
        globalState.onClearUndoStack.notifyObservers();
    }, [build, globalState]);

    // Wheel event handler
    useEffect(() => {
        const onWheel = (evt: WheelEvent) => {
            if (globalState.pointerOverCanvas) {
                return evt.preventDefault();
            }

            if (evt.ctrlKey) {
                return evt.preventDefault();
            }

            if (Math.abs(evt.deltaX) < Math.abs(evt.deltaY)) {
                return;
            }

            const targetElem = evt.currentTarget as HTMLElement;
            const scrollLeftMax = targetElem.scrollWidth - targetElem.offsetWidth;
            if (targetElem.scrollLeft + evt.deltaX < 0 || targetElem.scrollLeft + evt.deltaX > scrollLeftMax) {
                return evt.preventDefault();
            }
        };

        window.addEventListener("wheel", onWheel, { passive: false });

        return () => {
            window.removeEventListener("wheel", onWheel);
        };
    }, [globalState]);

    return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <GlobalStateContext.Provider value={globalState}>
                <FluentSplitContainer
                    onPointerMove={(evt) => {
                        mouseLocationRef.current.x = evt.pageX;
                        mouseLocationRef.current.y = evt.pageY;
                    }}
                    onPointerDown={(evt) => {
                        if ((evt.target as HTMLElement).nodeName === "INPUT") {
                            return;
                        }
                        globalState.lockObject.lock = false;
                    }}
                >
                    <ResizablePanel initialSize={200} minSize={180} maxSize={350} storageKey="graphEditor-leftPanel">
                        <NodeListComponent globalState={globalState} />
                    </ResizablePanel>

                    <ResizablePanel initialSize={800} minSize={400} maxSize={3000} storageKey="graphEditor-middlePanel" fillRemaining={true}>
                        <FluentSplitContainer
                            vertical={true}
                            containerRef={diagramContainerRef}
                            onDrop={(event) => {
                                dropNewBlock(event);
                            }}
                            onDragOver={(event) => {
                                event.preventDefault();
                            }}
                        >
                            <ResizablePanel initialSize={400} minSize={150} maxSize={1200} storageKey="graphEditor-canvasPanel" fillRemaining={true}>
                                <GraphCanvasComponent
                                    ref={graphCanvasRef}
                                    stateManager={globalState.stateManager}
                                    onEmitNewNode={(nodeData) => {
                                        return appendBlock(nodeData.data as NodeMaterialBlock)!;
                                    }}
                                />
                            </ResizablePanel>
                            <ResizablePanel initialSize={120} minSize={40} maxSize={500} storageKey="graphEditor-logPanel">
                                <LogComponent globalState={globalState} />
                            </ResizablePanel>
                        </FluentSplitContainer>
                    </ResizablePanel>

                    <ResizablePanel initialSize={300} minSize={250} maxSize={500} storageKey="graphEditor-rightPanel">
                        <FluentSplitContainer vertical={true}>
                            <ResizablePanel initialSize={300} minSize={150} maxSize={800} storageKey="graphEditor-propertyPanel">
                                <PropertyTabComponent lockObject={globalState.lockObject} globalState={globalState} />
                            </ResizablePanel>
                            <ResizablePanel initialSize={300} minSize={200} maxSize={500} storageKey="graphEditor-previewPanel" fillRemaining={true}>
                                <NodeEditorPreview onTogglePopout={() => {}} />
                            </ResizablePanel>
                        </FluentSplitContainer>
                    </ResizablePanel>
                </FluentSplitContainer>
                <FluentDialog open={!!errorMessage} message={errorMessage} isError={true} onClose={() => setErrorMessage("")} />
                <div className="blocker">Node Material Editor needs a horizontal resolution of at least 900px</div>
                <div className="wait-screen hidden">Processing...please wait</div>
            </GlobalStateContext.Provider>
        </div>
    );
};
