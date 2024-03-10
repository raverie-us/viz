import React from "react";
import { Meta, MetaContext, MetaFileLoader } from "../meta";
import { convertImageToLayers, convertPSDToLayers } from "../visualizerImport";
import { CompiledLayerRoot, LayerRoot, RenderTargets, defaultEmptyCompiledLayerRoot } from "../../core/core";
import { RaverieVisualizerCustom } from "../visualizerCustom";
import { VisualGenerator } from "../../core/generate";
import { RaverieAudioAnalyserLive } from "../../core/browser";

class VisualizerMetaContext extends MetaContext {
  public visualizer: RaverieVisualizerCustom;
  public generator: VisualGenerator;
  public audioAnalyser: RaverieAudioAnalyserLive;
  public canvas: HTMLCanvasElement;
  public gl: WebGL2RenderingContext;
  public renderTargets: RenderTargets;
  public compiledLayerRoot: CompiledLayerRoot = defaultEmptyCompiledLayerRoot();

  public constructor() {
    const canvas = document.createElement("canvas");
    const visualizer = new RaverieVisualizerCustom(canvas);
    const generator = new VisualGenerator(visualizer);
    const audioAnalyser = new RaverieAudioAnalyserLive();
    const renderTargets = visualizer.createRenderTargets(canvas.width, canvas.height);
    //canvas.className = classes.focusOutline;
    canvas.style.backgroundColor = "#333";

    super("Canvas", <div>test</div>, []);

    this.canvas = canvas;
    this.visualizer = visualizer;
    this.generator = generator;
    this.audioAnalyser = audioAnalyser;
    this.gl = visualizer.gl;
    this.renderTargets = renderTargets;
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
