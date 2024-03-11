import React from "react";
import { Meta, MetaContext, MetaFileLoader, MetaType } from "../meta";
import { convertImageToLayers, convertPSDToLayers } from "./visualizerImport";
import { CompiledLayer, CompiledLayerRoot, LayerRoot, RenderTargets, defaultEmptyCompiledLayerRoot } from "../../core/core";
import { VisualGenerator } from "../../core/generate";
import { RaverieAudioAnalyserLive, RaverieVisualizerBrowser } from "../../core/browser";
import { VisualizerCanvas } from "./visualizerCanvas";
import { TimePoint, computeTimePointNow } from "../utility";
import { VisualizerLayers } from "./visualizerLayers";
import { propertiesFromCompiledLayer } from "./visualizerLayerProperties";

export class CompiledLayerRootType {
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

  public static createMetaType(compiledLayer: CompiledLayer): MetaType {
    return {
      classType: CompiledLayerRootType,
      properties: propertiesFromCompiledLayer(compiledLayer)
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
