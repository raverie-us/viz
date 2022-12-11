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

  return new RaverieVisualizer(gl, loadTexture, canvas.width, canvas.height);
};