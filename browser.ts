import {
  CompactUniforms,
  CompiledLayerJavaScript,
  defaultAudioSampleCount,
  defaultMinDecibels,
  DeviceIdentifier,
  InputIdentifier,
  JavaScriptGlobals,
  LayerJavaScript,
  LoadTextureFunction,
  UserTexture,
  RaverieVisualizer,
  UpdateTextureFunction
} from "./core";

interface RenderMessage {
  type: "render";
  requestId: number;
  layer: LayerJavaScript;
  globals: JavaScriptGlobals,
  uniforms: CompactUniforms
}

interface RenderMessageResult {
  type: "renderResult";
  image: ImageBitmap | null;
  requestId: number;
}

const iframePreCode = (origin: string) => `
window.addEventListener("message", async (e) => {
  if (e.origin === "${origin}" && e.data.type === "render" && window.render) {
    const image = await window.render(e.data.layer, e.data.globals, e.data.uniforms);
    parent.postMessage({
      type: "renderResult",
      image,
      requestId: e.data.requestId
    }, "${origin}");
  }
});`;

export const deviceKeyboard = "keyboard";
export const devicePointer = "pointer";
export const deviceGamepad = "gamepad";

export type InputTriggeredCallback = (type: "axis" | "button", deviceId: DeviceIdentifier, inputId: InputIdentifier) => void;

export const listenForInput = (element: HTMLElement, onInputTriggered: InputTriggeredCallback) => {
  element.tabIndex = 1;
  element.focus();

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    element.focus();
    onInputTriggered("button", devicePointer, e.button);
  }
  element.addEventListener("pointerdown", onPointerDown);

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };
  element.addEventListener("contextmenu", onContextMenu);

  const POINTER_MOVEMENT_MIN = 5;
  const onPointerMove = (e: PointerEvent) => {
    e.preventDefault();
    if (e.movementX > e.movementY) {
      if (Math.abs(e.movementX) > POINTER_MOVEMENT_MIN) {
        onInputTriggered("axis", devicePointer, "x");
      }
    } else if (e.movementY > e.movementX) {
      if (Math.abs(e.movementY) > POINTER_MOVEMENT_MIN) {
        onInputTriggered("axis", devicePointer, "y");
      }
    }
  }
  element.addEventListener("pointermove", onPointerMove);

  const onKeyDown = (e: KeyboardEvent) => {
    e.preventDefault();
    onInputTriggered("button", deviceKeyboard, e.key);
  }
  element.addEventListener("keydown", onKeyDown);

  let prevGamepad: Gamepad | null = null;
  const gamepadInterval = setInterval(() => {
    const gamepad = navigator.getGamepads()[0];

    if (prevGamepad && gamepad && prevGamepad.buttons.length === gamepad.buttons.length && prevGamepad.axes.length === gamepad.axes.length) {
      let axisMostMovement = -1;
      let axisMovementAmount = 0.15;
      for (let i = 0; i < gamepad.axes.length; ++i) {
        const movement = Math.abs(prevGamepad.axes[i] - gamepad.axes[i]);
        if (movement > axisMovementAmount) {
          axisMostMovement = i;
          axisMovementAmount = movement;
        }
      }

      if (axisMostMovement !== -1) {
        onInputTriggered("axis", deviceGamepad, axisMostMovement);
      }

      for (let i = 0; i < gamepad.buttons.length; ++i) {
        // If we triggered the gamepad button
        if (!prevGamepad.buttons[i].pressed && gamepad.buttons[i].pressed) {
          onInputTriggered("button", deviceGamepad, i);
        }
      }
    }

    prevGamepad = gamepad;
  }, 0);

  return () => {
    element.removeEventListener("pointerdown", onPointerDown);
    element.removeEventListener("contextmenu", onContextMenu);
    element.removeEventListener("pointermove", onPointerMove);
    element.removeEventListener("keydown", onKeyDown);
    clearInterval(gamepadInterval);
  };
};

const glFromCanvas = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: true,
    depth: false,
    stencil: false,
    // TODO(trevor): Premultiplied alpha
    premultipliedAlpha: false,
    powerPreference: "high-performance"
  });
  if (!gl) {
    throw new Error("Unable to initialze WebGl");
  }
  return gl;
};

interface TextureHandle {
  img: HTMLImageElement;
  video: HTMLVideoElement;
};

const loadTexture: LoadTextureFunction = (userTexture: UserTexture) => {
  const img = document.createElement("img");
  img.src = userTexture.url;

  const video = document.createElement("video");
  video.muted = true;
  video.autoplay = true;
  video.loop = true;
  video.controls = false;
  video.playsInline = true;
  video.src = userTexture.url;

  const handle: TextureHandle = { img, video };
  userTexture.handle = handle;
}

const updateTexture: UpdateTextureFunction = (userTexture: UserTexture) => {
  // We support static images by clearing then handle out after the texture is loaded
  if (!userTexture.handle) {
    return;
  }

  const gl = userTexture.gl;
  const handle: TextureHandle = userTexture.handle;

  if (handle.img.complete && handle.img.naturalHeight !== 0) {
    gl.bindTexture(gl.TEXTURE_2D, userTexture.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, handle.img);
    gl.generateMipmap(gl.TEXTURE_2D);
    userTexture.handle = null;
  } else if (handle.video.readyState === 4) {
    if (handle.video.paused) {
      handle.video.play().catch(() => { });
    }
    gl.bindTexture(gl.TEXTURE_2D, userTexture.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, handle.video);
    gl.generateMipmap(gl.TEXTURE_2D);
  }
}

type AudioInputType = AudioNode | MediaStream | AudioBuffer | null;

// We intentionally use 40kHz and cut in in half for human audible range, see below
const SAMPLE_RATE = 40000;

// We separate this out because browsers often do not allow creation of AudioContexts
// until the user has interacted with the page (or dependent upon security settings)
class RaverieAudioAnalyserCore {
  public audioContextBase: BaseAudioContext;

  public frequencyAnalyser: AnalyserNode;
  public samplesAnalyser: AnalyserNode;

  public constructor(audioContext: BaseAudioContext) {
    this.audioContextBase = audioContext;

    this.frequencyAnalyser = audioContext.createAnalyser();
    // Normally the fftSize should be double of whatever we want for the frequencyBinCount.
    // The human audible range is from 20hz to 20kHz. We intentially set SAMPLE_RATE to 40kHz
    // and then cut the output frequency buffer in half to remove non-human audible frequencies.
    // Hence, the fftSize is x2 for frequencyBinCount and x2 again for human audible cut (x4)
    this.frequencyAnalyser.fftSize = defaultAudioSampleCount * 4;
    this.frequencyAnalyser.smoothingTimeConstant = 0.8;

    // We don't want to cut the samples in half like the above frequency
    // buffer, so we create a separate AnalyserNode just for samples
    this.samplesAnalyser = audioContext.createAnalyser();
    this.samplesAnalyser.fftSize = defaultAudioSampleCount * 2;
    this.samplesAnalyser.smoothingTimeConstant = 1.0;

    if (this.frequencyAnalyser.frequencyBinCount !== defaultAudioSampleCount * 2) {
      throw new Error(`Mismatched frequencyBinCount, got ${this.frequencyAnalyser.frequencyBinCount}, expected ${defaultAudioSampleCount * 2}`);
    }
    if (this.samplesAnalyser.frequencyBinCount !== defaultAudioSampleCount) {
      throw new Error(`Mismatched frequencyBinCount, got ${this.frequencyAnalyser.frequencyBinCount}, expected ${defaultAudioSampleCount}`);
    }
  }
}

export abstract class RaverieAudioAnalyserBase {
  protected core: RaverieAudioAnalyserCore | null = null;

  protected frequencies = new Float32Array(defaultAudioSampleCount);
  protected samples = new Float32Array(defaultAudioSampleCount);

  protected abstract initialize(): void;

  protected initializeInternal(audioContext: BaseAudioContext) {
    this.core = new RaverieAudioAnalyserCore(audioContext);
  }

  protected getCore(): RaverieAudioAnalyserCore {
    if (!this.core) {
      this.initialize();

      if (!this.core) {
        throw new Error("Bad initialize implementation, it should have ensured this.core existed");
      }
    }
    return this.core;
  }

  protected updateVisualizerAudioInternal(visualizer: RaverieVisualizer) {
    if (this.core) {
      this.core.frequencyAnalyser.getFloatFrequencyData(this.frequencies);
      this.core.samplesAnalyser.getFloatTimeDomainData(this.samples);
    } else {
      this.frequencies.fill(defaultMinDecibels);
      this.samples.fill(0);
    }

    visualizer.updateAudioSamples(this.frequencies, this.samples);
  }

  public async decodeAudioData(audioData: ArrayBuffer): Promise<AudioBuffer> {
    return this.getCore().audioContextBase.decodeAudioData(audioData);
  }
};

export class RaverieAudioAnalyserLive extends RaverieAudioAnalyserBase {
  protected inputNode: AudioNode | null = null;
  protected input: AudioInputType = null;

  public get source(): AudioInputType {
    return this.input;
  }

  public get audioContext(): AudioContext {
    return this.getCore().audioContextBase as AudioContext;
  }

  public initialize() {
    if (!this.core) {
      this.initializeInternal(new AudioContext({
        latencyHint: "interactive",
        sampleRate: SAMPLE_RATE
      }));
    }
  }

  public updateVisualizerAudio(visualizer: RaverieVisualizer) {
    this.updateVisualizerAudioInternal(visualizer);
  }

  public connectAudioSource(input: AudioInputType) {
    const core = this.getCore();

    if (this.inputNode) {
      this.inputNode.disconnect();
      this.inputNode.disconnect();
      this.inputNode = null;
    }

    if (input) {
      if (input instanceof MediaStream) {
        if (!(core.audioContextBase instanceof AudioContext)) {
          throw new Error("Cannot use a MediaStream with an OfflineAudioContext");
        }

        this.inputNode = core.audioContextBase.createMediaStreamSource(input);
      } else if (input instanceof AudioBuffer) {
        const bufferSource = core.audioContextBase.createBufferSource();
        bufferSource.buffer = input;
        bufferSource.start();
        this.inputNode = bufferSource;
      } else {
        this.inputNode = input;
      }

      this.inputNode.connect(core.frequencyAnalyser);
      this.inputNode.connect(core.samplesAnalyser);
    }

    this.input = input;
  }
}

export class RaverieAudioAnalyserOffline extends RaverieAudioAnalyserBase {
  public get audioContext(): OfflineAudioContext {
    return this.getCore().audioContextBase as OfflineAudioContext;
  }

  public initialize() {
    if (!this.core) {
      this.initializeContext(1000);
    }
  }

  private initializeContext(frameTimeMs: number) {
    super.initializeInternal(new OfflineAudioContext({
      numberOfChannels: 1,
      length: SAMPLE_RATE * (frameTimeMs / 1000),
      sampleRate: SAMPLE_RATE
    }));
  }

  public async updateVisualizerAudioSingleFrame(visualizer: RaverieVisualizer, input: AudioBuffer, frameTimeMs: number, timeMs: number) {
    this.initializeContext(frameTimeMs);

    const core = this.getCore();

    const bufferSource = core.audioContextBase.createBufferSource();
    bufferSource.buffer = input;
    bufferSource.start(0, timeMs / 1000);

    bufferSource.connect(core.frequencyAnalyser);
    bufferSource.connect(core.samplesAnalyser);

    await this.audioContext.startRendering();

    this.updateVisualizerAudioInternal(visualizer);
  }
}

export class RaverieVisualizerBrowser extends RaverieVisualizer {
  public constructor(canvas: HTMLCanvasElement) {
    super(glFromCanvas(canvas), loadTexture, updateTexture);

    this.onCompileJavaScriptLayer = (layer) => {
      const iframe = document.createElement("iframe");
      iframe.setAttribute("sandbox", "allow-scripts");
      const src = `<script>${iframePreCode(location.origin)}</script><script>${layer.code}</script>`;
      iframe.onload = () => {
        iframe.dataset.loaded = "1";
      };
      iframe.style.display = "none";
      iframe.src = `data:text/html;base64,${btoa(src)}`;
      document.body.append(iframe);

      return {
        handle: iframe,
        errors: []
      };
    };

    this.onDeleteJavaScriptLayer = (layer) => {
      const iframe = layer.handle as HTMLIFrameElement;
      iframe.remove();
    };

    const requestIdToCompiledJsLayer: Record<number, CompiledLayerJavaScript> = {};

    this.onRenderJavaScriptLayer = (requestId, compiledLayer, globals, uniforms): void => {
      const iframe = compiledLayer.handle as HTMLIFrameElement;
      if (iframe.dataset.loaded && iframe.contentWindow) {
        requestIdToCompiledJsLayer[requestId] = compiledLayer;

        const toSend: RenderMessage = {
          type: "render",
          layer: compiledLayer.layer,
          requestId,
          globals,
          uniforms
        };
        // The iframe always has the origin of "null" since it's sandboxed and loaded from a data-url
        // Unfortunately we cannot pass "null" here as it throws, so we must pass "*"
        iframe.contentWindow.postMessage(toSend, "*");
      } else {
        this.renderCompletedForJavaScriptLayer(requestId, compiledLayer, null);
      }
    };

    window.addEventListener("message", (e: MessageEvent) => {
      const message = e.data as RenderMessageResult;
      const isValidMessage =
        e.origin === "null" &&
        typeof message === "object" &&
        message &&
        message.type === "renderResult" &&
        typeof message.requestId === "number" &&
        (message.image === null || message.image instanceof ImageBitmap);

      if (isValidMessage) {
        const compiledLayer = requestIdToCompiledJsLayer[message.requestId];
        delete requestIdToCompiledJsLayer[message.requestId];

        if (compiledLayer) {
          this.renderCompletedForJavaScriptLayer(message.requestId, compiledLayer, message.image);
        } else {
          console.warn(`Got render message for requestId ${message.requestId} that does not exist or was already handled`);
        }
      }
    });

    // Allow the canvas to take focus
    canvas.tabIndex = 1;
    canvas.addEventListener("pointerdown", () => {
      canvas.focus();
    });

    const keyStates: Record<string | number, boolean> = {};
    canvas.addEventListener("keydown", (e) => {
      keyStates[e.key] = true;
      keyStates[e.which] = true;
    });
    canvas.addEventListener("keyup", (e) => {
      keyStates[e.key] = false;
      keyStates[e.which] = false;
    });

    let pointerStates: Record<string | number, boolean> = {};
    let pointerX = 0;
    let pointerY = 0;
    let pointerIsOverCanvas = false;
    canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
    canvas.addEventListener("pointerdown", (e) => {
      pointerStates[e.button] = true;
    });
    canvas.addEventListener("pointerup", (e) => {
      pointerStates[e.button] = false;
    });
    canvas.addEventListener("pointermove", (e) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    });
    canvas.addEventListener("pointerenter", (e) => {
      pointerIsOverCanvas = true;
    });
    canvas.addEventListener("pointerleave", (e) => {
      pointerIsOverCanvas = false;
      pointerStates = {};
    });

    let gamepad: Gamepad | null = null;

    const updateGamepads = () => {
      // TODO(trevor): For now we only grab the first gamepad until we get control indices working
      gamepad = navigator.getGamepads()[0];
    }

    updateGamepads();

    this.onBeforeControlsUpdate = () => {
      updateGamepads();
    };

    this.onSampleButton = (device, inputId) => {
      if (device === deviceKeyboard) {
        const state = Boolean(keyStates[inputId]);
        return { value: Number(state), buttonHeld: state, touchHeld: state };
      }

      if (device === devicePointer && pointerIsOverCanvas) {
        const state = Boolean(pointerStates[inputId]);
        return { value: Number(state), buttonHeld: state, touchHeld: state };
      }

      if (device === deviceGamepad) {
        if (gamepad && typeof inputId === "number") {
          const button = gamepad.buttons[inputId];
          if (button !== undefined) {
            return { buttonHeld: button.pressed, touchHeld: button.touched, value: button.value };
          }
        }
      }
      return null;
    };

    this.onSampleAxis = (device, inputId) => {
      if (device === devicePointer && pointerIsOverCanvas) {
        if (inputId === 0 || inputId === "x") {
          return { value: pointerX };
        }
        if (inputId === 1 || inputId === "y") {
          return { value: pointerY };
        }
      }

      if (device === deviceGamepad) {
        if (gamepad && typeof inputId === "number") {
          const axis = gamepad.axes[inputId];
          if (axis !== undefined) {
            return { value: axis };
          }
        }
      }
      return null;
    };
  }
}
