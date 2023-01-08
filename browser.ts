import { CompiledLayerJavaScript, LayerJavaScript, RaverieVisualizer } from "./core";

interface RenderMessage {
  type: "render";
  layer: LayerJavaScript;
  requestId: number;
  globals: {
    gOpacity: number,
    gResolution: [number, number],
    gTime: number,
    gPreviousLayer: null,
    gBlendMode: number
  }
}

interface RenderMessageResult {
  type: "renderResult";
  image: ImageBitmap | null;
  requestId: number;
}

const iframePreCode = `
window.addEventListener("message", async (e) => {
  if (e.data.type === "render" && window.render) {
    const image = await window.render(e.data.layer, e.data.globals);
    parent.postMessage({
      type: "renderResult",
      image,
      requestId: e.data.requestId
    }, "*");
  }
});`;

export const makeRaverieVisualizerForCanvas = (canvas: HTMLCanvasElement): RaverieVisualizer => {
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    throw new Error("Unable to initialze WebGl");
  }

  const loadTexture = (url: string, texture: WebGLTexture, gl: WebGL2RenderingContext) => {
    const img = document.createElement("img");
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
    };
    img.src = url;
  }

  const visualizer = new RaverieVisualizer(gl, loadTexture);

  visualizer.onCompileJavaScriptLayer = (layer) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    const src = `<script>${iframePreCode}</script><script>${layer.code}</script>`;
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

  const requestIdToCompiledJsLayer: Record<number, CompiledLayerJavaScript> = {};

  visualizer.onRenderJavaScriptLayer = (requestId, compiledLayer, globals): void => {
    const iframe = compiledLayer.handle as HTMLIFrameElement;
    if (iframe.dataset.loaded && iframe.contentWindow) {
      requestIdToCompiledJsLayer[requestId] = compiledLayer;

      const toSend: RenderMessage = {
        type: "render",
        layer: compiledLayer.layer,
        requestId,
        globals
      };
      iframe.contentWindow.postMessage(toSend, "*");
    } else {
      visualizer.renderCompletedForJavaScriptLayer(requestId, compiledLayer, null);
    }
  };

  window.addEventListener("message", (e: MessageEvent) => {
    const message = e.data as RenderMessageResult;
    const isValidMessage =
      typeof message === "object" &&
      message &&
      message.type === "renderResult" &&
      typeof message.requestId === "number" &&
      (message.image === null || message.image instanceof ImageBitmap);

    if (isValidMessage) {
      const compiledLayer = requestIdToCompiledJsLayer[message.requestId];
      delete requestIdToCompiledJsLayer[message.requestId];

      if (compiledLayer) {
        visualizer.renderCompletedForJavaScriptLayer(message.requestId, compiledLayer, message.image);
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

  visualizer.onBeforeControlsUpdate = () => {
    updateGamepads();
  };

  visualizer.onSampleButton = (device, inputId) => {
    if (device === "keyboard") {
      const state = Boolean(keyStates[inputId]);
      return { value: Number(state), buttonHeld: state, touchHeld: state };
    }

    if (device === "pointer" && pointerIsOverCanvas) {
      const state = Boolean(pointerStates[inputId]);
      return { value: Number(state), buttonHeld: state, touchHeld: state };
    }

    if (device === "gamepad") {
      if (gamepad && typeof inputId === "number") {
        const button = gamepad.buttons[inputId];
        if (button !== undefined) {
          return { buttonHeld: button.pressed, touchHeld: button.touched, value: button.value };
        }
      }
    }
    return null;
  };

  visualizer.onSampleAxis = (device, inputId) => {
    if (device === "pointer" && pointerIsOverCanvas) {
      if (inputId === 0 || inputId === "x") {
        return { value: pointerX };
      }
      if (inputId === 1 || inputId === "y") {
        return { value: pointerY };
      }
    }

    if (device === "gamepad") {
      if (gamepad && typeof inputId === "number") {
        const axis = gamepad.axes[inputId];
        if (axis !== undefined) {
          return { value: axis };
        }
      }
    }
    return null;
  };

  return visualizer;
};