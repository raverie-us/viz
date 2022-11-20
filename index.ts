import { RaverieVisualizer, Group } from "./core.js";

const canvas = document.getElementsByTagName("canvas")[0];
const gl = canvas.getContext("webgl2");
if (!gl) {
  throw new Error("Unable to initialze WebGl");
}

const textureCache: Record<string, WebGLTexture> = {};
const getTexture = (url: string, gl: WebGL2RenderingContext): WebGLTexture => {
  const foundTexture = textureCache[url];
  if (foundTexture) {
    return foundTexture;
  }

  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("Unable to create RenderTarget WebGLTexture");
  }
  textureCache[url] = texture;

  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  (async () => {
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
  })();

  return texture;
}

const textarea = document.getElementsByTagName("textarea")[0];

const visualizer = new RaverieVisualizer(gl, getTexture, canvas.width, canvas.height);

const onJsonChanged = () => {
  const json = eval(`(${textarea.value})`);
  console.log(json);
  visualizer.compile(json);
}
textarea.oninput = onJsonChanged;
setTimeout(onJsonChanged);

const onUpdate = () => {
  requestAnimationFrame(onUpdate);
  visualizer.render();
};

onUpdate();

