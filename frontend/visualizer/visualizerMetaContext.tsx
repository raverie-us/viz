import React from "react";
import { Meta, MetaContext, MetaFileLoader } from "../meta";
import { convertImageToLayers, convertPSDToLayers } from "./visualizerImport";
import { CompiledLayerRoot, LayerRoot, RenderTargets, defaultEmptyCompiledLayerRoot } from "../../core/core";
import { VisualGenerator } from "../../core/generate";
import { RaverieAudioAnalyserLive, RaverieVisualizerBrowser } from "../../core/browser";
import { VisualizerCanvas } from "./visualizerCanvas";
import { TimePoint, computeTimePointNow } from "../utility";

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

  protected onCloseContext(): void {
    cancelAnimationFrame(this.animationFrame);
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
  setCompiledLayerRoot: (compiledLayerRoot: CompiledLayerRoot) => {
    root = compiledLayerRoot;
  },
  cancelRendering: () => {
    cancelAnimationFrame(animationFrame);
  }
  */

  public constructor(layerRoot: LayerRoot) {
    super([]);
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


    this.openMainTab("Canvas", <VisualizerCanvas context={this} />);
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
    //TODO(trevor): Tell the meta context to recompile, but I kinda want to do it in a minimal way
    // Like maybe we say "insert these layers" on the meta context object, and it handles events/recompile
    // Maybe a structure changed event?
    //recompile();
    return importContext;
  } else {
    return new VisualizerMetaContext(newRoot);
  }
};

Meta.instance.registerFileType("image/*", fileLoader);
Meta.instance.registerFileExtension("viz", fileLoader);
Meta.instance.registerFileExtension("rvis", fileLoader);
