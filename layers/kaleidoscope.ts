import { LayerShader } from "../core";

export const kaleidoscopeLayer: LayerShader = {
  type: "shader",
  id: "kaleidoscope",
  name: "kaleidoscope",
  visible: true,
  code: `
uniform vec2 position; // type: "position"
uniform int divisions; // default: 10, min: 1, max: 50
// Speed of the rotation where 1 is an entire rotation per second
uniform float rotationsPerSecond; // default: 0.1, min: -2, max: 2
uniform vec2 scrollSpeed; // default: [0.05, 0.05], min: [-1, -1], max: [1, 1]

vec2 angleMod(vec2 pos, float divisions) {
  float radiansPerDivision = gPI2 / divisions;
  float radians = atan(pos.x, pos.y) + radiansPerDivision;
  radians = floor(radians / radiansPerDivision) * radiansPerDivision;
  return pos * gRotateMatrix2D(-radians);
}

vec4 render() {
  vec2 pos = gPosition - vec2(position);
  pos.y *= gResolution.y / gResolution.x;
  vec2 uv = angleMod(pos, float(divisions)) * 0.5;
  uv = uv * gRotateMatrix2D(gTime * rotationsPerSecond);
  uv += scrollSpeed * gTime;
  return texture(gPreviousLayer, uv);
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
