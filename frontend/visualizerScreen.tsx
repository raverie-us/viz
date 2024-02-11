import {
  CompiledLayer,
  CompiledLayerCode,
  CompiledLayerRoot,
  defaultHeight,
  defaultWidth,
  Layer,
  LayerRoot,
  RaverieVisualizer
} from "../core/core";
import React from "react";
import Box from "@mui/material/Box";
import {useThrottleCallback} from "@react-hook/throttle";
import {VisualizerLayers} from "./visualizerLayers";
import {VisualizerLayerProperties} from "./visualizerLayerProperties";
import {VisualizerCodeEditor} from "./visualizerCodeEditor";
import {LayoutBase, DockLayout, TabData} from "rc-dock";
import "./visualizerDockPanelTheme.less";
import {useVisualizer, VisualizerCanvas, VisualizerCanvasInterations} from "./visualizerCanvas";
import {AppMenu} from "./appMenu";
import useSize from "@react-hook/size";
import {modalPropertyGrid} from "./modalPropertyGrid";
import {spinner} from "./spinner";
import {openFile, saveFile, saveFileUrl, cloneObject, sleep} from "./utility";
import {Modal} from "./modal";
import {VisualizerExportVideo, VisualizerExportVideoSettings} from "./visualizerExportVideo";
import {VisualizerExportImage, VisualizerExportImageSettings} from "./visualizerExportImage";
import {convertImageToLayers, convertPSDToLayers} from "./visualizerImport";
import {RaverieAudioAnalyserOffline} from "../core/browser";
import {v4 as uuidv4} from "uuid";
import {setHasUnsavedChanges} from "./unload";
import {h264Mp4EncoderPromise} from "./videoEncode";

const TAB_ID_LAYERS = "layers";
const TAB_ID_PROPERTIES = "properties";
const TAB_ID_CANVAS = "canvas";

const APP_BAR_HEIGHT = "30px";

const exportVideoSettings: VisualizerExportVideoSettings = {
  width: defaultWidth,
  height: defaultHeight,
  lengthSeconds: 15,
  startTimeSeconds: 0,
  framesPerSecond: 30,
  antiAliasLevel: 2,

  kbps: 0,
  quantizationParameter: 28,
  speed: 5,
  groupOfPictures: 30,
  temporalDenoise: false
};

const exportImageSettings: VisualizerExportImageSettings = {
  width: defaultWidth,
  height: defaultHeight,
  startTimeSeconds: 0,
  antiAliasLevel: 2
};

export const VisualizerScreen: React.FC = () => {
  const canvasInteractions = React.useRef<VisualizerCanvasInterations>();
  const dockLayout = React.useRef<DockLayout>(null);
  const [layout, setLayout] = React.useState<LayoutBase>({
    dockbox: {
      id: "main",
      mode: "horizontal",
      children: [
        {
          id: "canvasBox",
          size: 500,
          mode: "vertical",
          children: [
            {
              id: "canvasPanel",
              tabs: [
                {
                  id: TAB_ID_CANVAS
                }
              ]
            }
          ]
        },
        {
          id: "layerAndPropertiesBox",
          size: 200,
          mode: "vertical",
          children: [
            {
              id: "propertiesBox",
              size: 200,
              tabs: [
                {
                  id: TAB_ID_PROPERTIES
                }
              ]
            },
            {
              id: "layersPanel",
              size: 200,
              tabs: [
                {
                  id: TAB_ID_LAYERS
                }
              ]
            }
          ]
        }
      ]
    }
  });

  const visualizerComponents = useVisualizer();
  const visualizer = visualizerComponents.visualizer;

  const [compiledLayerRoot, setCompiledLayerRootInternal] =
    React.useState<CompiledLayerRoot>(visualizerComponents.defaultCompiledLayerRoot);
  const [selectedLayerId, setSelectedLayerId] = React.useState<string | null>(null);
  const [editCodeForSelectedLayer, setEditCodeForSelectedLayer] = React.useState(false);
  const setCompiledLayerRoot = (newRoot: CompiledLayerRoot) => {
    setHasUnsavedChanges(true);
    setCompiledLayerRootInternal(newRoot);
    visualizerComponents.setCompiledLayerRoot(newRoot);
  };
  const setCompiledLayerGroupThrottled = useThrottleCallback(setCompiledLayerRoot, 30, true);

  const queryLayer = (id: string | null): CompiledLayer | null =>
    typeof id === "string"
      ? compiledLayerRoot.idToLayer[id] || null
      : null;

  const selectedLayer = queryLayer(selectedLayerId);
  const selectedCodeLayer = selectedLayer && "code" in selectedLayer ? selectedLayer : null;

  visualizer.highlightSdf(selectedLayer?.type === "sdf" ? selectedLayer : null);

  const onEditCode = (layerShader: CompiledLayerCode) => {
    const dock = dockLayout.current;
    if (!dock) {
      return;
    }
    const id = layerShader.layer.id;

    // If we don't already have a window for this id, then we need to open a temporary one
    const foundTab = dock.find(id) as TabData | null;
    if (foundTab) {
      dock.dockMove(foundTab, null, "front");
    } else {
      let foundTab: TabData | null = null;
      let foundHighestTabIndex = -1;

      // Walk all possible code tabs
      for (const id of Object.keys(compiledLayerRoot.idToLayer)) {
        const found = dock.find(id) as TabData | null;

        if (found && found.parent) {
          const tabIndex = found.parent.tabs.indexOf(found);
          if (tabIndex > foundHighestTabIndex) {
            foundTab = found;
            foundHighestTabIndex = tabIndex;
          }
        }
      }

      const newTab = {id} as TabData;

      if (foundTab) {
        dock.dockMove(newTab, foundTab, "after-tab");
      } else {
        const canvas = dock.find(TAB_ID_CANVAS);
        if (canvas && canvas.parent) {
          dock.dockMove(newTab, canvas.parent, "bottom");
        } else {
          dock.dockMove(newTab, TAB_ID_CANVAS, "bottom");
        }
      }
    }
  };

  React.useEffect(() => {
    if (editCodeForSelectedLayer && selectedLayer && (selectedLayer.type === "shader" || selectedLayer.type === "js")) {
      // We have to delay this by one frame because we update the
      // layout when the selected layer changes, and this will get overwritten
      const editCodeTimeout = setTimeout(() => {
        onEditCode(selectedLayer);
        setEditCodeForSelectedLayer(false);
      });

      return () => {
        clearInterval(editCodeTimeout);
      };
    }
    return undefined;
  }, [editCodeForSelectedLayer, selectedLayer]);

  React.useEffect(() => {
    visualizerComponents.setPointerEvents((xNormalized, yNormalized) => {
      if (selectedCodeLayer) {
        for (const uniform of selectedCodeLayer.uniforms) {
          if (uniform.type === "vec2" && uniform.parsedComment.type === "position") {
            uniform.shaderValue.value[0] = xNormalized;
            uniform.shaderValue.value[1] = yNormalized;
            refreshThrottled();
          }
        }
      }
    });
  }, [selectedCodeLayer]);

  // ** ALL props passed to any rendered component in loadTab MUST be added to deps here **
  // This effect forces the layout to update which re-renders components and paseses props
  React.useEffect(() => {
    if (dockLayout.current) {
      // Update the layout any time we recompile / compiled layer group changes
      setLayout({...dockLayout.current.getLayout()});
    }
  }, [selectedLayer, compiledLayerRoot, dockLayout.current, visualizer]);

  const refresh = () => {
    // We do a shallow copy of the root to force a refresh
    setCompiledLayerGroupThrottled({...compiledLayerRoot});
  };
  const refreshThrottled = useThrottleCallback(refresh, 10, true);

  const compileLayerGroup = (vis: RaverieVisualizer, layerRoot: LayerRoot) => {
    const compiled = vis.compile(layerRoot, "clone", compiledLayerRoot);
    setCompiledLayerRoot(compiled);

    // We must make sure we don't render another frame with the old compiled layers
    // since we use minimal rebuild and that deletes the previous layers or moves them
    if (dockLayout.current) {
      setLayout({...dockLayout.current.getLayout()});
    }
  };

  const recompile = () => {
    compileLayerGroup(visualizer, compiledLayerRoot.layer);
  };

  const fileTypeAccept = ".rvis, .viz, .psd, image/vnd.adobe.photoshop, image/*";
  const canImport = (file?: File | null | undefined) => {
    if (!file || file.size === 0) {
      return false;
    }
    return file.type === "image/vnd.adobe.photoshop" ||
      file.type.startsWith("image/") ||
      file.name.endsWith(".viz") || 
      file.name.endsWith(".rvis");
  }

  const doImport = async (file: File) => {
    if (file.type === "image/vnd.adobe.photoshop") {
      const newRoot = convertPSDToLayers(await file.arrayBuffer());
      compileLayerGroup(visualizer, newRoot);
    } else if (file.type.startsWith("image/")) {
      const newRoot = await convertImageToLayers(file);
      compileLayerGroup(visualizer, newRoot);
    } else {
      const json = await file.text();
      const newRoot = JSON.parse(json) as LayerRoot;
      compileLayerGroup(visualizer, newRoot);
    }
  };

  React.useEffect(() => {
    const onDrop = async (event: DragEvent) => {
      if (!event.dataTransfer) {
        return;
      }
      const files = [...event.dataTransfer.files].
        filter(canImport).
        sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: "base"}));

      if (files.length !== 0) {
        event.preventDefault();

        for (const file of files) {
          await doImport(file);
        }
      }
    };
    window.addEventListener("drop", onDrop, true);
    const onDragOver = (event: DragEvent) => {
      if (!event.dataTransfer) {
        return;
      }
      event.preventDefault();
    };
    window.addEventListener("dragover", onDragOver, true);

    return () => {
      window.removeEventListener("drop", onDrop, true);
      window.removeEventListener("dragover", onDragOver, true);
    };
  }, []);


  return <Box display="contents">
    <AppMenu sx={{height: APP_BAR_HEIGHT}} menuElements={[
      {
        name: "File",
        menuElements: [
          {
            name: "Open",
            onClick: async () => {
              const file = await openFile(fileTypeAccept);
              if (file) {
                await doImport(file);
              }
            }
          },
          {
            name: "Save",
            onClick: () => {
              const json = JSON.stringify(compiledLayerRoot.layer, null, 2);
              const encoder = new TextEncoder();
              const encoded = encoder.encode(json);
              const blob = new Blob([encoded]);
              saveFile(`visuals_${new Date().toISOString().replace(/T.*/u, "")}.viz`, blob);
              setHasUnsavedChanges(false);
            }
          },
          {
            name: "Export To Video",
            onClick: async () => {
              const result = await Modal.confirm("Export To Video", () =>
                <VisualizerExportVideo
                  width={compiledLayerRoot.layer.width}
                  height={compiledLayerRoot.layer.height}
                  settings={exportVideoSettings}/>);

              if (!result) {
                return;
              }
              spinner.show();

              // Give a frame to show the spinner
              await sleep();
              visualizer.autoRender = false;

              try {
                const HME = await h264Mp4EncoderPromise;
                const encoder = await HME.createH264MP4Encoder();

                encoder.quantizationParameter = exportVideoSettings.quantizationParameter;
                encoder.speed = exportVideoSettings.speed;
                encoder.groupOfPictures = exportVideoSettings.groupOfPictures;
                encoder.kbps = exportVideoSettings.kbps;
                encoder.temporalDenoise = exportVideoSettings.temporalDenoise;

                encoder.width = Math.floor(exportVideoSettings.width / 2) * 2;
                encoder.height = Math.floor(exportVideoSettings.height / 2) * 2;
                encoder.frameRate = exportVideoSettings.framesPerSecond;
                encoder.initialize();

                const renderTargets = visualizer.
                  createRenderTargets(encoder.width, encoder.height, exportVideoSettings.antiAliasLevel);

                const totalFrames = Math.ceil(exportVideoSettings.lengthSeconds * exportVideoSettings.framesPerSecond);
                const frameTimeMs = 1 / exportVideoSettings.framesPerSecond * 1000;

                const gl = visualizerComponents.gl;
                const canvas = visualizerComponents.canvas;
                canvas.width = encoder.width;
                canvas.height = encoder.height;

                const audioAnalyser = new RaverieAudioAnalyserOffline();
                const audioBuffer = exportVideoSettings.audioData
                  ? await audioAnalyser.decodeAudioData(exportVideoSettings.audioData.slice(0))
                  : null;

                const pixels = new Uint8Array(encoder.width * encoder.height * 4);
                let timeMs = exportVideoSettings.startTimeSeconds * 1000;
                let lastTimeMs = performance.now();
                for (let i = 0; i < totalFrames; ++i) {
                  if (audioBuffer) {
                    await audioAnalyser.updateVisualizerAudioSingleFrame(visualizer, audioBuffer, frameTimeMs, timeMs);
                  }
                  visualizer.render(compiledLayerRoot, timeMs, renderTargets, true, false);
                  gl.readPixels(0, 0, encoder.width, encoder.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

                  encoder.addFrameRgba(pixels);
                  timeMs += frameTimeMs;

                  // Only show the text updates every so many frames (for performance)
                  const nowMs = performance.now();
                  const deltaMs = nowMs - lastTimeMs;
                  if (deltaMs > 250) {
                    lastTimeMs = nowMs;
                    spinner.setText(`Encoding Video Frame ${i} / ${totalFrames} (${Math.floor(i / totalFrames * 100)}%)`);
                    await sleep();
                  }
                }

                encoder.finalize();
                const videoBuffer = encoder.FS.readFile(encoder.outputFilename);
                encoder.delete();

                visualizer.deleteRenderTargets(renderTargets);

                canvas.width = compiledLayerRoot.layer.width;
                canvas.height = compiledLayerRoot.layer.height;

                const blob = new Blob([videoBuffer], {type: "video/mp4"});
                saveFile(`visuals_${new Date().toISOString().replace(/T.*/u, "")}.mp4`, blob);
              } finally {
                visualizer.autoRender = true;
                spinner.hide();
              }
            }
          },
          {
            name: "Export To Image",
            onClick: async () => {
              const result = await Modal.confirm("Export To Image", () =>
                <VisualizerExportImage
                  width={compiledLayerRoot.layer.width}
                  height={compiledLayerRoot.layer.height}
                  settings={exportImageSettings}/>);

              if (!result) {
                return;
              }

              const {width, height} = exportImageSettings;

              const gl = visualizerComponents.gl;
              const canvas = visualizerComponents.canvas;
              canvas.width = width;
              canvas.height = height;

              const renderTargets = visualizer.createRenderTargets(
                width, height, exportImageSettings.antiAliasLevel);

              const pixels = new Uint8ClampedArray(width * height * 4);
              const timeMs = exportImageSettings.startTimeSeconds * 1000;

              visualizer.render(compiledLayerRoot, timeMs, renderTargets, true, false);
              gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

              visualizer.deleteRenderTargets(renderTargets);

              const imageData = new ImageData(pixels, width, height);
              const newCanvas = document.createElement("canvas");
              newCanvas.width = width;
              newCanvas.height = height;
              const ctx = newCanvas.getContext("2d")!;
              ctx.putImageData(imageData, 0, 0);
              const dataUrl = newCanvas.toDataURL();

              canvas.width = compiledLayerRoot.layer.width;
              canvas.height = compiledLayerRoot.layer.height;
              saveFileUrl(`visuals_${new Date().toISOString().replace(/T.*/u, "")}.png`, dataUrl);
            }
          }
        ]
      },
      {
        name: "Image",
        menuElements: [
          {
            name: "Canvas Size...",
            onClick: () => {
              modalPropertyGrid({
                name: "Canvas Size",
                object: {
                  width: compiledLayerRoot.layer.width,
                  height: compiledLayerRoot.layer.height
                },
                onChanged: (newCanvasSize) => {
                  compiledLayerRoot.layer.width = newCanvasSize.width;
                  compiledLayerRoot.layer.height = newCanvasSize.height;
                  exportVideoSettings.width = newCanvasSize.width;
                  exportVideoSettings.height = newCanvasSize.height;
                  exportImageSettings.width = newCanvasSize.width;
                  exportImageSettings.height = newCanvasSize.height;
                  refresh();
                }
              });
            }
          }
        ]
      },
      {
        name: "Layer",
        menuElements: [
          {
            name: "Duplicate Layer",
            onClick: () => {
              if (selectedLayer) {
                const toBeCloned = selectedLayer.layer;
                const parent = selectedLayer.parent!.layer;
                const index = parent.layers!.indexOf(toBeCloned as any);
                const clone = cloneObject(toBeCloned);

                const generateIds = (layer: Layer) => {
                  layer.id = uuidv4();
                  if ("layers" in layer && layer.layers) {
                    for (const childLayer of layer.layers) {
                      generateIds(childLayer);
                    }
                  }
                };

                generateIds(clone);
                setSelectedLayerId(clone.id);
                parent.layers!.splice(index, 0, clone as any);
                recompile();
              }
            }
          }
        ]
      },
      {
        name: "View",
        menuElements: [
          {
            name: "Zoom In",
            onClick: () => canvasInteractions.current?.zoomIn()
          },
          {
            name: "Zoom Out",
            onClick: () => canvasInteractions.current?.zoomOut()
          },
          {
            name: "Fit The Area",
            onClick: () => canvasInteractions.current?.fitTheArea()
          },
          {
            name: "Pixel to Pixel",
            onClick: () => canvasInteractions.current?.pixelToPixel()
          }
        ]
      }
    ]} />
    <DockLayout
      ref={dockLayout}
      onLayoutChange={(newLayout) => {
        setLayout(newLayout);
      }}
      loadTab={(tab) => {
        if (!tab.id) {
          throw new Error("Empty tab id");
        }

        if (tab.id === TAB_ID_CANVAS) {
          return {
            id: tab.id,
            title: "Canvas",
            content: <VisualizerCanvas
              layersUseAudioInput={compiledLayerRoot.usesAudioInput}
              refOut={canvasInteractions}
              width={compiledLayerRoot.layer.width}
              height={compiledLayerRoot.layer.height}
              visualizerComponents={visualizerComponents}
              onChangedTimePoint={(newTimePoint) => {
                if (newTimePoint.isFixed) {
                  const startTimeSeconds = newTimePoint.offsetTimeMs / 1000;
                  exportVideoSettings.startTimeSeconds = startTimeSeconds;
                  exportImageSettings.startTimeSeconds = startTimeSeconds;
                }
              }}/>
          };
        }

        if (tab.id === TAB_ID_LAYERS) {
          return {
            id: tab.id,
            title: "Layers",
            content: <VisualizerLayers
              compiledLayerRoot={compiledLayerRoot}
              selectedLayer={selectedLayer}
              visualizer={visualizer}
              onChangedRefresh={refresh}
              onChangedRecompile={recompile}
              onLayerSelected={(id, editCode) => {
                if (editCode) {
                  setEditCodeForSelectedLayer(true);
                }
                setSelectedLayerId(id);
              }}
              onEditCode={onEditCode}/>
          };
        }

        if (tab.id === TAB_ID_PROPERTIES) {
          return {
            id: tab.id,
            title: "Properties",
            content: <Box width="100%" height="100%" sx={{overflowX: "hidden", overflowY: "auto"}} mb={1}>
              <VisualizerLayerProperties
                compiledLayer={selectedLayer}
                onChanged={refresh}/>
            </Box>
          };
        }

        const layer = compiledLayerRoot.idToLayer[tab.id];
        if (!layer) {
          // Though the types don't support it, rc-dock apparently supports returning null here to close a tab
          return null as any as TabData;
        }

        if (layer.type !== "shader" && layer.type !== "js" && layer.type !== "sdf") {
          throw new Error("Loading tab for non-code layer");
        }

        return {
          id: tab.id,
          title: layer.layer.name,
          closable: true,
          content: <VisualizerCodeEditor compiledLayerCode={layer} onChanged={recompile}/>
        };
      }}
      layout={layout}
      style={{
        width: "100%",
        height: `calc(100% - ${APP_BAR_HEIGHT})`
      }}
    />
  </Box>;
};
