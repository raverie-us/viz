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