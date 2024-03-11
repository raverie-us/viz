import React from "react";
import { Meta, MetaContext, MetaFileLoader, MetaType } from "../meta";
import { convertImageToLayers, convertPSDToLayers } from "./visualizerImport";
import { CompiledLayer, CompiledLayerRoot, Layer, LayerRoot, RenderTargets, defaultEmptyCompiledLayerRoot, defaultHeight, defaultWidth } from "../../core/core";
import { VisualGenerator } from "../../core/generate";
import { RaverieAudioAnalyserLive, RaverieAudioAnalyserOffline, RaverieVisualizerBrowser } from "../../core/browser";
import { VisualizerCanvas, VisualizerCanvasInterations, VisualizerCanvasInterationsRef } from "./visualizerCanvas";
import { TimePoint, cloneObject, computeTimePointNow, saveFile, saveFileUrl, sleep } from "../utility";
import { VisualizerLayers } from "./visualizerLayers";
import { propertiesFromCompiledLayer } from "./visualizerLayerProperties";
import { Modal } from "../modal";
import { spinner } from "../spinner";
import { VisualizerExportVideo, VisualizerExportVideoSettings } from "./visualizerExportVideo";
import { VisualizerExportImage, VisualizerExportImageSettings } from "./visualizerExportImage";
import { h264Mp4EncoderPromise } from "../videoEncode";
import { modalPropertyGrid } from "../modalPropertyGrid";
import { v4 as uuidv4 } from "uuid";

export class CompiledLayerType {
};

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


export class VisualizerMetaContext extends MetaContext {
  public visualizer: RaverieVisualizerBrowser;
  public generator: VisualGenerator;
  public audioAnalyser: RaverieAudioAnalyserLive;
  public canvas: HTMLCanvasElement;
  public gl: WebGL2RenderingContext;
  public renderTargets: RenderTargets;
  public compiledLayerRoot: CompiledLayerRoot;
  private animationFrame = -1;

  public autoRender = true;

  public timePoint: TimePoint = {
    isFixed: false,
    baseTimeMs: performance.now(),
    offsetTimeMs: 0
  };

  public createMetaType(compiledLayer: CompiledLayer): MetaType {
    return {
      classType: CompiledLayerType,
      properties: propertiesFromCompiledLayer(compiledLayer),
      resolveHandle: (handle: any) => {
        // Since the core of viz clears out any previously compiled layers that are no longer used
        // we can rely on the fact that the "type" field no longer exists
        if ("type" in handle) {
          return handle;
        }
        return null;
      }
    };
  }

  public override structureChanged() {
    this.compiledLayerRoot = this.visualizer.compile(this.compiledLayerRoot.layer, "modifyInPlace", this.compiledLayerRoot);
    super.structureChanged();
  }

  protected override onCloseContext(): void {
    cancelAnimationFrame(this.animationFrame);
  }

  public override get objectsView(): React.ReactElement | null {
    return <VisualizerLayers context={this} />;
  }

  public get layerSelection(): CompiledLayer | null {
    return Meta.instance.selectionDynamicCast<CompiledLayerType, CompiledLayer>(CompiledLayerType);
  }

  public set layerSelection(compiledLayer: CompiledLayer | string | null) {
    if (typeof compiledLayer === "string") {
      compiledLayer = this.queryLayer(compiledLayer);
    }

    Meta.instance.selection = compiledLayer
      ? {
        context: this,
        handle: compiledLayer,
        type: this.createMetaType(compiledLayer)
      }
      : null;
  }

  /*
  setPointerEvents: (onPosition: PositionCallback) => {
    const onPointer = (e: PointerEvent) => {
      if (e.button === 0 && e.type === "pointerdown") {
        canvas.setPointerCapture(e.pointerId);
      } else if (!canvas.hasPointerCapture(e.pointerId)) {
        return;
      }

      if (e.buttons & 1) {
        const rect = canvas.getBoundingClientRect();
        const xNormalized = (e.clientX - rect.x) / rect.width * 2.0 - 1.0;
        const yNormalized = -((e.clientY - rect.y) / rect.height * 2.0 - 1.0);
        onPosition(xNormalized, yNormalized);
      }
    };

    canvas.onpointerdown = onPointer;
    canvas.onpointermove = onPointer;
    canvas.onpointerup = onPointer;
  },
  */

  public constructor(layerRoot: LayerRoot) {
    super();
    this.canvas = document.createElement("canvas");
    this.visualizer = new RaverieVisualizerBrowser(this.canvas);
    this.compiledLayerRoot = this.visualizer.compile(layerRoot);
    this.gl = this.visualizer.gl;
    this.generator = new VisualGenerator(this.visualizer);
    this.audioAnalyser = new RaverieAudioAnalyserLive();
    this.renderTargets = this.visualizer.createRenderTargets(this.canvas.width, this.canvas.height);
    //canvas.className = classes.focusOutline;
    this.canvas.style.backgroundColor = "#333";

    const onUpdate = () => {
      this.animationFrame = requestAnimationFrame(onUpdate);
      if (this.autoRender) {
        const timeMs = computeTimePointNow(this.timePoint);
        this.audioAnalyser.updateVisualizerAudio(this.visualizer, timeMs);
        this.visualizer.render(this.compiledLayerRoot, timeMs, this.renderTargets);
      }
    };
    this.animationFrame = requestAnimationFrame(onUpdate);

    const canvasInteractions: VisualizerCanvasInterationsRef = {current: undefined};
    this.openMainTab("Canvas", <VisualizerCanvas context={this} canvasInteractionsOut={canvasInteractions} />);

    this.menuElements = [
      {
        name: "File",
        menuElements: [
          {
            name: "Export To Video",
            onClick: async () => {
              const result = await Modal.confirm("Export To Video", () =>
                <VisualizerExportVideo
                  width={this.compiledLayerRoot.layer.width}
                  height={this.compiledLayerRoot.layer.height}
                  settings={exportVideoSettings} />);

              if (!result) {
                return;
              }
              spinner.show();

              // Give a frame to show the spinner
              await sleep();
              this.autoRender = false;

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

                const renderTargets = this.visualizer.
                  createRenderTargets(encoder.width, encoder.height, exportVideoSettings.antiAliasLevel);

                const totalFrames = Math.ceil(exportVideoSettings.lengthSeconds * exportVideoSettings.framesPerSecond);
                const frameTimeMs = 1 / exportVideoSettings.framesPerSecond * 1000;

                const gl = this.gl;
                const canvas = this.canvas;
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
                    await audioAnalyser.updateVisualizerAudioSingleFrame(this.visualizer, audioBuffer, frameTimeMs, timeMs);
                  }
                  this.visualizer.render(this.compiledLayerRoot, timeMs, renderTargets, true, false);
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

                this.visualizer.deleteRenderTargets(renderTargets);

                canvas.width = this.compiledLayerRoot.layer.width;
                canvas.height = this.compiledLayerRoot.layer.height;

                const blob = new Blob([videoBuffer], { type: "video/mp4" });
                saveFile(`visuals_${new Date().toISOString().replace(/T.*/u, "")}.mp4`, blob);
              } finally {
                this.autoRender = true;
                spinner.hide();
              }
            }
          },
          {
            name: "Export To Image",
            onClick: async () => {
              const result = await Modal.confirm("Export To Image", () =>
                <VisualizerExportImage
                  width={this.compiledLayerRoot.layer.width}
                  height={this.compiledLayerRoot.layer.height}
                  settings={exportImageSettings} />);

              if (!result) {
                return;
              }

              const { width, height } = exportImageSettings;

              const gl = this.gl;
              const canvas = this.canvas;
              canvas.width = width;
              canvas.height = height;

              const renderTargets = this.visualizer.createRenderTargets(
                width, height, exportImageSettings.antiAliasLevel);

              const pixels = new Uint8ClampedArray(width * height * 4);
              const timeMs = exportImageSettings.startTimeSeconds * 1000;

              this.visualizer.render(this.compiledLayerRoot, timeMs, renderTargets, true, false);
              gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

              this.visualizer.deleteRenderTargets(renderTargets);

              const imageData = new ImageData(pixels, width, height);
              const newCanvas = document.createElement("canvas");
              newCanvas.width = width;
              newCanvas.height = height;
              const ctx = newCanvas.getContext("2d")!;
              ctx.putImageData(imageData, 0, 0);
              const dataUrl = newCanvas.toDataURL();

              canvas.width = this.compiledLayerRoot.layer.width;
              canvas.height = this.compiledLayerRoot.layer.height;
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
                  width: this.compiledLayerRoot.layer.width,
                  height: this.compiledLayerRoot.layer.height
                },
                onChanged: (newCanvasSize) => {
                  this.compiledLayerRoot.layer.width = newCanvasSize.width;
                  this.compiledLayerRoot.layer.height = newCanvasSize.height;
                  exportVideoSettings.width = newCanvasSize.width;
                  exportVideoSettings.height = newCanvasSize.height;
                  exportImageSettings.width = newCanvasSize.width;
                  exportImageSettings.height = newCanvasSize.height;
                  this.valuesChanged();
                }
              });
            }
          },
          {
            name: "Random",
            menuElements: [
              {
                name: "Generate Random",
                onClick: () => {
                  this.compiledLayerRoot.layer = this.generator.generateRandom().layer;
                  this.structureChanged();
                }
              },
              {
                name: "Randomize Layers",
                onClick: () => {
                  this.generator.randomizeCompiledLayers(this.compiledLayerRoot);
                  this.valuesChanged();
                }
              }
            ]
          },
        ]
      },
      {
        name: "Layer",
        menuElements: [
          {
            name: "Duplicate Layer",
            onClick: () => {
              const selectedLayer = this.layerSelection;
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
                parent.layers!.splice(index, 0, clone as any);

                // Recompile before we try and select
                this.structureChanged();
                this.layerSelection = clone.id;
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
    ];
  }

  public queryLayer(id: string | null): CompiledLayer | null {
    return typeof id === "string"
      ? this.compiledLayerRoot.idToLayer[id] || null
      : null;
  }
}

const fileLoader: MetaFileLoader<VisualizerMetaContext> = async (file, importContext?: VisualizerMetaContext | null) => {
  let newRoot: LayerRoot | null = null;

  if (file.type === "image/vnd.adobe.photoshop") {
    newRoot = convertPSDToLayers(await file.arrayBuffer());
  } else if (file.type.startsWith("image/")) {
    newRoot = await convertImageToLayers(file);
  } else {
    const json = await file.text();
    newRoot = JSON.parse(json) as LayerRoot;
  }

  if (importContext) {
    importContext.compiledLayerRoot.layer.layers.push(...newRoot.layers);
    importContext.structureChanged();
    return importContext;
  } else {
    return new VisualizerMetaContext(newRoot);
  }
};

Meta.instance.registerFileType("image/*", fileLoader);
Meta.instance.registerFileExtension("viz", fileLoader);
Meta.instance.registerFileExtension("rvis", fileLoader);
