import { RaverieVisualizer } from "./core";

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

  const keyStates: Record<string | number, boolean> = {};

  // Allow the canvas to take focus
  canvas.tabIndex = 1;
  canvas.addEventListener("pointerdown", () => {
    canvas.focus();
  });

  canvas.addEventListener("keydown", (e) => {
    keyStates[e.key] = true;
    keyStates[e.which] = true;
  });
  canvas.addEventListener("keyup", (e) => {
    keyStates[e.key] = false;
    keyStates[e.which] = false;
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

    if (device === "gamepad") {
      if (gamepad && typeof inputId === "number") {
        const button = gamepad.buttons[inputId];
        if (button !== undefined) {
          return {buttonHeld: button.pressed, touchHeld: button.touched, value: button.value};
        }
      }
    }
    return null;
  };

  visualizer.onSampleAxis = (device, inputId) => {
    if (device === "gamepad") {
      if (gamepad && typeof inputId === "number") {
        const axis = gamepad.axes[inputId];
        if (axis !== undefined) {
          return {value: axis};
        }
      }
    }
    return null;
  };

  return visualizer;
};