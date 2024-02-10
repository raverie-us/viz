import React from "react";
import {
  addLayer,
  blendModeDisplay,
  blendModeDisplayGroup,
  CompiledLayer,
  defaultEmptyLayerGroup,
  Layer,
  LayerCode,
  LayerGroup,
  LayerBlendMode,
  removeLayer,
  defaultEmptyLayerShader,
  CompiledLayerCode,
  CompiledLayerWithChildren,
  CompiledLayerRoot,
  LayerShader,
  canParentLayer
} from "../core/core";
import {featuredLayers} from "../core/featuredLayers";
import {TreeView, TreeItem} from "@mui/x-tree-view";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import {LAYER_PREVIEW_SIZE, VisualizerShaderLayer} from "./visualizerShaderLayer";
import {useStyles} from "./style";
import {TooltipIconButton} from "./tooltipIconButton";
import Box from "@mui/material/Box";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBoxIcon from "@mui/icons-material/AddBox";
import FolderIcon from "@mui/icons-material/Folder";
import {v4 as uuidv4} from "uuid";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { capCase } from "./textTransforms";
import Select from "@mui/material/Select";
import Divider from "@mui/material/Divider";
import {NumberInput} from "./numberInput";
import Popover from "@mui/material/Popover";
import Slider from "@mui/material/Slider";
import {useDrag, useDrop} from "react-dnd";
import {RaverieVisualizerCustom} from "./visualizerCustom";
import {modalPropertyGrid} from "./modalPropertyGrid";
import {generateGLSL, generateImage} from "./aiGeneration";
import {spinner} from "./spinner";
import {textureLayer} from "../core/layers/texture";

export interface VisualizerLayersProps {
  visualizer: RaverieVisualizerCustom;
  compiledLayerRoot: CompiledLayerRoot;
  selectedLayer: CompiledLayer | null;
  onChangedRefresh: () => void;
  onChangedRecompile: () => void;
  onLayerSelected: (id: string, editCode: boolean) => void;
  onEditCode: (layerShader: CompiledLayerCode) => void;
}

type LayerDropDirection = "above" | "into" | "below" | "invalid";

interface VisualizerTreeItemProps {
  compiledLayer: CompiledLayer;
  parentVisible: boolean;
  onChangedRefresh: () => void;
  onToggleExpand: () => void;
  onEditCode: (layerShader: CompiledLayerCode) => void;
  onOtherLayerDropped: (target: CompiledLayer, sourceToBeMoved: CompiledLayer, direction: LayerDropDirection) => void;
  onPreviewCreated: (id: string, context: CanvasRenderingContext2D) => void;
  onPreviewDestroyed: (id: string) => void;
}

const VisualizerTreeItem: React.FC<VisualizerTreeItemProps> = (props) => {
  const [dropDirection, setDropDirection] = React.useState<LayerDropDirection>("invalid");
  const ref = React.useRef<HTMLLIElement>(null);
  const [{opacity}, dragRef] = useDrag(() => ({
    type: "layer",
    item: props.compiledLayer,
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.5 : 1
    })
  }), [props.compiledLayer]);
  dragRef(ref);

  const [{isOver}, dropRef] = useDrop(() => ({
    accept: "layer",
    drop: (item: CompiledLayer, monitor) => {
      if (monitor.isOver({shallow: true})) {
        props.onOtherLayerDropped(props.compiledLayer, item, dropDirection);
      }
    },
    hover: (item, monitor) => {
      // We use first element because the ref is an `li` which contains all its children, but we
      // only want to measure the element itself so we grab the first child div (tree element content)
      const boundingRect = ref.current!.firstElementChild!.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset()!;
      const hoverClientY = clientOffset.y - boundingRect.top;
      const height = boundingRect.height;

      const canDropInto = Boolean(canParentLayer(props.compiledLayer.layer, item.layer));
      const canDropAboveBelow = Boolean(props.compiledLayer.parent &&
        canParentLayer(props.compiledLayer.parent?.layer, item.layer));

      // If it's a group, we allow dropping into it meaning we support 3 drop directions instead of 2
      if (canDropInto && canDropAboveBelow) {
        const hoverTopMiddleY = height * (1 / 3);
        const hoverBottomMiddleY = height * (2 / 3);

        if (hoverClientY < hoverTopMiddleY) {
          setDropDirection("above");
        } else if (hoverClientY < hoverBottomMiddleY) {
          setDropDirection("into");
        } else {
          setDropDirection("below");
        }
      } else if (canDropInto) {
        setDropDirection("into");
      } else if (canDropAboveBelow) {
        const hoverMiddleY = height * (1 / 2);
        setDropDirection(
          hoverClientY < hoverMiddleY
            ? "above"
            : "below"
        );
      } else {
        setDropDirection("invalid");
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({shallow: true})
    })
  }), [dropDirection, props.compiledLayer, ref.current]);
  dropRef(ref);

  const classes = useStyles();

  const compiledLayer = props.compiledLayer;
  const id = compiledLayer.layer.id;
  const parentVisibleOpacity = props.parentVisible ? 1.0 : 0.5;

  const visibilityIcon =
  <TooltipIconButton
    tooltip="Toggle Visiblity"
    size="small"
    tooltipPlacement="left"
    onClick={(e) => {
      e.stopPropagation();
      compiledLayer.layer.visible = !compiledLayer.layer.visible;
      props.onChangedRefresh();
    }}>
    {
      compiledLayer.layer.visible
        ? <VisibilityIcon opacity={parentVisibleOpacity}/>
        : <CheckBoxOutlineBlankIcon opacity={parentVisibleOpacity}/>
    }
  </TooltipIconButton>;

  let boxShadow: string | null = null;
  if (isOver) {
    switch (dropDirection) {
      case "above":
        boxShadow = "inset 0px 3px 0px 0px black";
        break;
      case "into":
        boxShadow = "inset 0px 0px 3px 3px black";
        break;
      case "below":
        boxShadow = "inset 0px -3px 0px 0px black";
        break;
    }
  }

  const treeItemProps = {
    nodeId: id,
    ref,
    sx: {opacity, boxShadow},
    // MUI sets tabIndex to -1 which breaks drag and drop, so override it with undefined / default
    tabIndex: undefined
  };

  switch (compiledLayer.type) {
    case "group":
      return <TreeItem
        {...treeItemProps}
        icon={compiledLayer.layers.length === 0
          ? <>{visibilityIcon}<FolderIcon opacity={0.54}/></>
          : null}
        collapseIcon={<>{visibilityIcon}<ExpandMoreIcon opacity={0.54} onClick={props.onToggleExpand}/></>}
        expandIcon={<>{visibilityIcon}<ChevronRightIcon opacity={0.54} onClick={props.onToggleExpand}/></>}
        classes={{iconContainer: classes.visualizerGroupTreeItem}}
        label={compiledLayer.layer.name}>
        {props.children}
      </TreeItem>;
    default:
      return <TreeItem
        {...treeItemProps}
        icon={visibilityIcon}
        classes={{iconContainer: classes.visualizerShaderLayerTreeItem}}
        label={<VisualizerShaderLayer
          compiledLayerShader={compiledLayer}
          onPreviewCreated={props.onPreviewCreated}
          onPreviewDestroyed={props.onPreviewDestroyed}
          onChangedRefresh={props.onChangedRefresh}
          onEditCode={() => {
            props.onEditCode(compiledLayer);
          }}/>}>
        {props.children}
      </TreeItem>;
  }
};
let hasPrinted = false;
export const VisualizerLayers: React.FC<VisualizerLayersProps> = (props) => {
  const [previewContexts] = React.useState<Record<string, CanvasRenderingContext2D>>({});
  const [addLayerMenuAnchor, setAddLayerMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [expandedIds, setExpandedIds] = React.useState<Record<string, boolean>>({});
  const [opacitySliderAnchor, setOpacitySliderAnchor] = React.useState<null | HTMLElement>(null);

  // Must be a layout effect or the animation frame could happen before the root is updated (using a bad deleted root)
  React.useLayoutEffect(() => {
    const visualizer = props.visualizer;
    if (visualizer) {
      const renderTargets = visualizer.createRenderTargets(LAYER_PREVIEW_SIZE, LAYER_PREVIEW_SIZE);

      const pixels = new Uint8Array(LAYER_PREVIEW_SIZE * LAYER_PREVIEW_SIZE * 4);
      let animationFrame = -1;
      const onUpdate = (time: DOMHighResTimeStamp) => {
        animationFrame = requestAnimationFrame(onUpdate);
        if (visualizer.autoRender) {
          if (!("idToLayer" in props.compiledLayerRoot) && !hasPrinted) {
            hasPrinted = true;
          }
          visualizer.renderLayerShaderPreviews(
            props.compiledLayerRoot,
            time,
            renderTargets,
            (compiledLayerShader, gl) => {
              const context = previewContexts[compiledLayerShader.layer.id];
              if (context) {
                gl.readPixels(0, 0, LAYER_PREVIEW_SIZE, LAYER_PREVIEW_SIZE, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                context.putImageData(new ImageData(new Uint8ClampedArray(pixels.buffer), LAYER_PREVIEW_SIZE, LAYER_PREVIEW_SIZE), 0, 0);
              }
            },
            true,
            4);
        }
      };
      animationFrame = requestAnimationFrame(onUpdate);

      return () => {
        visualizer.deleteRenderTargets(renderTargets);
        cancelAnimationFrame(animationFrame);
      };
    }
    return undefined;
  }, [props.visualizer, previewContexts, props.compiledLayerRoot]);

  React.useEffect(() => {
    let newlyExpandedNodes = false;
    for (const id of Object.keys(props.compiledLayerRoot.idToLayer)) {
      if (expandedIds[id] === undefined) {
        // By default we expand all new ids
        newlyExpandedNodes = true;
        expandedIds[id] = true;
      }
    }
    if (newlyExpandedNodes) {
      setExpandedIds({...expandedIds});
    }
  }, [props.compiledLayerRoot]);

  const closeAddLayerMenu = () => {
    setAddLayerMenuAnchor(null);
  };

  const closeOpacitySlider = () => {
    setOpacitySliderAnchor(null);
  };

  const classes = useStyles();
  const createLayerNodes = (parent: CompiledLayerWithChildren, parentVisible: boolean): React.ReactNode[] => {
    const childLayers: React.ReactNode[] = [];
    for (const compiledLayer of parent.layers) {
      const id = compiledLayer.layer.id;

      const toggleExpand = () => {
        expandedIds[id] = !expandedIds[id];
        setExpandedIds({...expandedIds});
      };

      childLayers.push(<VisualizerTreeItem
        key={id}
        compiledLayer={compiledLayer}
        parentVisible={parentVisible}
        onPreviewCreated={(id, context) => {
          previewContexts[id] = context;
        }}
        onPreviewDestroyed={(id) => {
          delete previewContexts[id];
        }}
        onToggleExpand={toggleExpand}
        onChangedRefresh={props.onChangedRefresh}
        onEditCode={props.onEditCode}
        onOtherLayerDropped={(target, sourceToBeMoved, direction) => {
          // Don't allow moving over itself or invalid moves
          if (target === sourceToBeMoved || direction === "invalid") {
            return;
          }
          const sourceParentLayers = sourceToBeMoved.parent!.layer.layers!;
          const sourceIndex = sourceParentLayers.indexOf(sourceToBeMoved.layer as any);
          if (sourceIndex === -1) {
            throw new Error("Cannot find layer within it's parent");
          }

          const targetParent = target.parent!;
          if (!targetParent.layer.layers) {
            targetParent.layer.layers = [];
          }

          const targetParentLayers = targetParent.layer.layers;
          const targetIndex = targetParentLayers.indexOf(target.layer as any);

          if (direction === "into") {
            const validParent = canParentLayer(target.layer, sourceToBeMoved.layer);
            if (!validParent) {
              throw new Error("Attempting to drop into a layer into an invalid parent");
            }

            // Remove the source from whatever parent layer it was in
            sourceParentLayers.splice(sourceIndex, 1);

            if (!validParent.layers) {
              validParent.layers = [];
            }
            validParent.layers.push(sourceToBeMoved.layer as any);
          } else {
            const validParent = canParentLayer(targetParent.layer, sourceToBeMoved.layer);
            if (!validParent) {
              throw new Error("Attempting to drop into a layer into an invalid parent");
            }

            // Remove the source from whatever parent layer it was in
            sourceParentLayers.splice(sourceIndex, 1);

            const insertIndex = targetIndex + (direction === "above" ? 0 : 1);

            // Insert the layer either above or below the target
            targetParentLayers.splice(insertIndex, 0, sourceToBeMoved.layer as any);
          }
          props.onChangedRecompile();
        }}
      >
        { compiledLayer.type === "group" || compiledLayer.type === "shader" || compiledLayer.type === "sdf"
          ? createLayerNodes(compiledLayer, parentVisible && compiledLayer.layer.visible)
          : null
        }
      </VisualizerTreeItem>);
    }
    return childLayers;
  };

  const layerNodes = createLayerNodes(props.compiledLayerRoot, true);
  const rootGroup = props.compiledLayerRoot.layer;

  const addNewLayer = (layerToAdd: Layer, editCode: boolean) => {
    if (addLayer(rootGroup, layerToAdd, props.selectedLayer?.layer.id)) {
      props.onLayerSelected(layerToAdd.id, editCode);
      props.onChangedRecompile();
    }
  };

  const blendMode: LayerBlendMode = props.selectedLayer && "blendMode" in props.selectedLayer.layer
    ? props.selectedLayer.layer.blendMode
    : "normal";

  const opacityPercent = props.selectedLayer && "opacity" in props.selectedLayer.layer
    ? Math.floor(props.selectedLayer.layer.opacity * 100)
    : 100;

  const updateOpacity = (newOpacityPercent: number) => {
    if (props.selectedLayer && "opacity" in props.selectedLayer.layer) {
      props.selectedLayer.layer.opacity = Math.min(Math.max(newOpacityPercent / 100, 0), 1);
      props.onChangedRefresh();
    }
  };

  const blendModeOptions = props.selectedLayer?.type === "group"
    ? blendModeDisplayGroup
    : blendModeDisplay;

  return <>
    <Box display="flex" flexDirection="column" height="100%" p={1}>
      <Box width="100%" display="flex" flexDirection="row" alignItems="center">
        <Select
          size="small"
          value={blendMode}
          onChange={(e) => {
            if (props.selectedLayer && "blendMode" in props.selectedLayer.layer) {
              const layer = props.selectedLayer.layer;
              layer.blendMode = e.target.value as LayerBlendMode;
              props.onChangedRefresh();
            }
          }}
        >
          {blendModeOptions.map((blendMode, index) => blendMode === null
            ? <Divider key={index}/>
            : <MenuItem key={index} value={blendMode}>{capCase(blendMode)}</MenuItem>)}
        </Select>
        <Box ml={1} mr="2px">Opacity:</Box>
        <NumberInput
          sx={{width: "70px"}}
          value={opacityPercent}
          postfix="%"
          onChange={updateOpacity}
        />
        <TooltipIconButton
          size="small"
          tooltipPlacement="top"
          tooltip="Change Layer Opacity / Transparency"
          onClick={(e) => {
            setOpacitySliderAnchor(e.target as HTMLElement);
          }}>
          <ExpandMoreIcon/>
        </TooltipIconButton>
        <Popover
          sx={{overflow: "hidden"}}
          open={Boolean(opacitySliderAnchor)}
          anchorEl={opacitySliderAnchor}
          onClose={closeOpacitySlider}
          anchorOrigin={{vertical: "bottom", horizontal: "right"}}
          transformOrigin={{vertical: "top", horizontal: "right"}}
        >
          <Box width="100px" height="35px" ml={1.5} mr={1.5} mt={0.5} mb={0}>
            <Slider size="small" value={opacityPercent} min={0} max={100} onChange={(e, newValue) => {
              updateOpacity(newValue as number);
            }}
            />
          </Box>
        </Popover>
      </Box>
      <Box flexGrow={1} overflow="auto">
        <TreeView
          selected={props.selectedLayer?.layer.id || ""}
          onNodeSelect={(e: any, id: string) => {
            props.onLayerSelected(id, false);
          }}
          expanded={Object.keys(expandedIds).filter((id) => expandedIds[id])}>
          {layerNodes}
        </TreeView>
      </Box>
      <Box width="100%" display="flex" flexDirection="row-reverse">
        <TooltipIconButton tooltip="Delete" size="small" onClick={() => {
          if (props.selectedLayer) {
            removeLayer(rootGroup, props.selectedLayer.layer.id);
            props.onChangedRecompile();
          }
        }}>
          <DeleteIcon/>
        </TooltipIconButton>
        <TooltipIconButton tooltip="New Layer" size="small" onClick={(e) => {
          setAddLayerMenuAnchor(e.target as HTMLElement);
        }}>
          <AddBoxIcon/>
        </TooltipIconButton>
        <TooltipIconButton tooltip="New Folder" size="small" onClick={() => {
          const emptyLayer: LayerGroup = {
            ...defaultEmptyLayerGroup(),
            id: uuidv4(),
            name: "Folder"
          };
          addNewLayer(emptyLayer, false);
        }}>
          <FolderIcon/>
        </TooltipIconButton>
        <Box flexGrow={1}/>
      </Box>
    </Box>
    <Menu
      anchorEl={addLayerMenuAnchor}
      open={Boolean(addLayerMenuAnchor)}
      onClose={closeAddLayerMenu}
      anchorOrigin={{vertical: "top", horizontal: "right"}}
      transformOrigin={{vertical: "bottom", horizontal: "right"}}
    >
      <MenuItem key="ai_shader" onClick={async () => {
        closeAddLayerMenu();

        const result = await modalPropertyGrid({
          name: "Generate Shader From AI",
          object: {
            prompt: ""
          }
        });

        if (result.success) {
          spinner.show("AI Generating GLSL Shader...");
          try {
            const newLayer: LayerShader = {
              ...defaultEmptyLayerShader(),
              id: uuidv4(),
              name: "AI Generated Shader",
              code: await generateGLSL(result.value.prompt)
            };
            addNewLayer(newLayer, true);
          } finally {
            spinner.hide();
          }
        }
      }}>
        AI Generated Shader
      </MenuItem>
      <MenuItem key="ai_image" onClick={async () => {
        closeAddLayerMenu();

        const result = await modalPropertyGrid({
          name: "Generate Image From AI",
          object: {
            prompt: ""
          }
        });

        if (result.success) {
          spinner.show("AI Generating Image...");
          try {
            const newLayer: LayerShader = {
              ...textureLayer,
              id: uuidv4(),
              name: "AI Generated Image",
              values: [
                {
                  name: "textureInput",
                  type: "sampler2D",
                  value: {
                    url: await generateImage(result.value.prompt),
                    wrapHorizontal: "mirrored",
                    wrapVertical: "mirrored",
                    filter: "mipmap"
                  }
                },
                {
                  name: "verticalBackground",
                  type: "bool",
                  value: false
                },
                {
                  name: "horizontalBackground",
                  type: "bool",
                  value: false
                }
              ]
            };
            addNewLayer(newLayer, false);
          } finally {
            spinner.hide();
          }
        }
      }}>
        AI Generated Image
      </MenuItem>
      {
        featuredLayers.map((layer, index) =>
          <MenuItem key={index} onClick={() => {
            const newLayer: LayerCode = {
              ...layer,
              id: uuidv4(),
              name: `${capitalCase(layer.type)} (${capitalCase(layer.name)})`
            };
            addNewLayer(newLayer, layer.name === "empty shader code" || layer.name === "empty javascript code");
            closeAddLayerMenu();
          }}>
            {capitalCase(layer.name)}
          </MenuItem>)
      }
    </Menu>
  </>;
};
