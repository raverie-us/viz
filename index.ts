import { RaverieVisualizer, Group } from "./core.js";

const root: Group = {
  type: "group",
  layers: [
    {
      type: "shader",
      code: `
        uniform float centerWarp; // default: 0.4
        void main() {
          vec2 uv = vec2(v_pos.x, v_pos.y * iResolution.y / iResolution.x);
          float r = length(uv);
          float theta = atan(uv.y, uv.x);
          vec4 prev = texture2D(previousLayer, (v_pos.xy + vec2(1.0, 1.0)) * 0.5);
          gl_FragColor = fract(2.5 * theta / PI + 7.0 * pow(r, centerWarp) - iTime) < 0.5 ? vec4(1.0) : prev;
        }
      `,
      blendMode: "normal",
      opacity: 1,
      timeMode: "normal",
      timeScale: 1,
      values: {
        centerWarp: 0.4
      }
    },
    {
      type: "shader",
      code: `
        uniform float lines; // default: 3
        void main() {
          float radians = (v_pos.y * 0.5 + 0.5 + iTime) * (2.0 * 3.14159265359) * lines;
          float value = sin(radians);
          vec4 prev = texture2D(previousLayer, (v_pos.xy + vec2(1.0, 1.0)) * 0.5);
          gl_FragColor = vec4(vec3(value), 1.0) + prev;
        }
      `,
      blendMode: "normal",
      opacity: 1,
      timeMode: "normal",
      timeScale: 1,
      values: {
        lines: 3
      }
    },
    {
      type: "shader",
      code: `
        uniform sampler2D texture;
        void main() {
          vec2 uv = (v_pos * 0.5 + vec2(0.5)) * vec2(1, iResolution.y / iResolution.x);
          gl_FragColor = texture2D(texture, uv);
        }
      `,
      blendMode: "normal",
      opacity: 1,
      timeMode: "normal",
      timeScale: 1,
      values: {
        texture: {
          url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABABAMAAABYR2ztAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAC1QTFRFAAAA9KRazHn//Pez/97//v3m/8P//33//PFc/3T//vua/////7X//fWO99xVZpEWpAAAAA90Uk5TAP//////////////////5Y2epgAAAdBJREFUeJyl1D9qwzAUBnCrJ6jRBYrpBcrD4KUegijkAFoC2YpDaceC8ezFZPaiA2TJnKWkc6DQrbOPUJ+h+mtbqiVTqvX98n2K/ZIosg+6iYIH4VVYYCCrYACkjyQUgYAWQYBTWjyGOpYAb6BFqGMR8AYOAh1LQDRw4O/4PxBXEMB7iWUAYYBAg53nEgsgjrEB5WuSJM4wjkEcDUpCSDIiPQSop4BIJOdgTjZUEHMSebUA4NfFI4Bag3HOd/xPIJNgN2loOchqP2AcIGiaQRwkGOdMPFOcjWIjV06P10wEKNDUvwFjGogOI+iBg9MwZ+qtyQhVM4A1GwJMhBR0Q4vnk/64CRgieI0Get6azTIRDX+Sh+L8xpyAMaI5Unr+/HADRIQW+yN9N6CdLh7WJXu6HYD1Z4VUCaS0u2jQ2n93+o1MgLPZeq/SbXd5CYKuuxQhcC/AUwB8C7CbA2rx8gloV35QeUGvQOkDuQGVB/QK8N/mPMgDAIENKvd7ItXAwdeDAOUc4AF91wGRoJoBvQBwd0s8QAT0ANdXhJSywwVqHkdRIkU1B+TcCBfkw1yLygIYJnMlKutJcTCZK2FvNVhzKeyNwfZcCPtlIWfOhQ74AbgZq7L3W3rcAAAAAElFTkSuQmCC"
        }
      }
    },
    {
      type: "shader",
      code: `
        uniform float blue;
        void main() {
          gl_FragColor = vec4((v_pos + vec2(1.0, 1.0)) * 0.5, blue, 1.0);
        }
      `,
      blendMode: "normal",
      opacity: 1,
      timeMode: "normal",
      timeScale: 1,
      values: {
        blue: 0.5
      }
    }
  ]
};

const canvas = document.getElementsByTagName("canvas")[0];
const gl = canvas.getContext("webgl");
if (!gl) {
  throw new Error("Unable to initialze WebGl");
}

const textureCache: Record<string, WebGLTexture> = {};
const getTexture = (url: string, gl: WebGLRenderingContext): WebGLTexture => {
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

const visualizer = new RaverieVisualizer(gl, getTexture, canvas.width, canvas.height);
visualizer.compile(root);

const onUpdate = () => {
  requestAnimationFrame(onUpdate);
  visualizer.render();
};

onUpdate();

