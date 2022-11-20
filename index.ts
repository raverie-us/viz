import { RaverieVisualizer, Group } from "./core.js";

const canvas = document.getElementsByTagName("canvas")[0];
const gl = canvas.getContext("webgl2");
if (!gl) {
  throw new Error("Unable to initialze WebGl");
}

const loadTexture = async (url: string, texture: WebGLTexture, gl: WebGL2RenderingContext) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const img = document.createElement("img");
  img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    URL.revokeObjectURL(objectUrl);
  };
  img.src = objectUrl;
}

const textarea = document.getElementsByTagName("textarea")[0];

const visualizer = new RaverieVisualizer(gl, loadTexture, canvas.width, canvas.height);

const onJsonChanged = () => {
  const json = eval(`(${textarea.value})`);
  visualizer.compile(json);
}
textarea.oninput = onJsonChanged;
setTimeout(onJsonChanged);

const onUpdate = () => {
  requestAnimationFrame(onUpdate);
  visualizer.render();
};

onUpdate();

