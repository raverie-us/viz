import React from "react";
import { Meta, MetaContext, MetaFileLoader } from "../meta";
import { convertImageToLayers, convertPSDToLayers } from "../visualizerImport";
import { CompiledLayerRoot, LayerRoot, RenderTargets, defaultEmptyCompiledLayerRoot } from "../../core/core";
import { RaverieVisualizerCustom } from "../visualizerCustom";
import { VisualGenerator } from "../../core/generate";
import { RaverieAudioAnalyserLive } from "../../core/browser";
import { VisualizerCanvas } from "../visualizerCanvas";

export class VisualizerMetaContext extends MetaContext {
  public visualizer: RaverieVisualizerCustom;
  public generator: VisualGenerator;
  public audioAnalyser: RaverieAudioAnalyserLive;
  public canvas: HTMLCanvasElement;
  public gl: WebGL2RenderingContext;
  public renderTargets: RenderTargets;
  public compiledLayerRoot: CompiledLayerRoot = defaultEmptyCompiledLayerRoot();

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
  setCompiledLayerRoot: (compiledLayerRoot: CompiledLayerRoot) => {
    root = compiledLayerRoot;
  },
  cancelRendering: () => {
    cancelAnimationFrame(animationFrame);
  }
  */

  public constructor() {
    super([]);
    this.canvas = document.createElement("canvas");
    this.visualizer = new RaverieVisualizerCustom(this.canvas);
    this.gl = this.visualizer.gl;
    this.generator = new VisualGenerator(this.visualizer);
    this.audioAnalyser = new RaverieAudioAnalyserLive();
    this.renderTargets = this.visualizer.createRenderTargets(this.canvas.width, this.canvas.height);
    //canvas.className = classes.focusOutline;
    this.canvas.style.backgroundColor = "#333";

    this.createMainTab("Canvas", <VisualizerCanvas context={this} />);
  }
}

const fileLoader: MetaFileLoader<VisualizerMetaContext> = async (file, importContext?: VisualizerMetaContext) => {
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
    //compiledLayerRoot.layer.layers.push(...newRoot.layers);
    //recompile();
    return importContext;
  } else {
    //compileLayerGroup(visualizer, newRoot);
    return new VisualizerMetaContext();
  }
};

Meta.instance.registerFileType("image/*", fileLoader);
Meta.instance.registerFileExtension("viz", fileLoader);
Meta.instance.registerFileExtension("rvis", fileLoader);
