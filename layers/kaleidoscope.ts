import { LayerShader } from "../core";

export const kaleidoscopeLayer: LayerShader = {
  type: "shader",
  id: "kaleidoscope",
  name: "kaleidoscope",
  visible: true,
  code: `
uniform vec2 position; // type: "position"
uniform int divisions; // default: 10, min: 3, max: 50
// Speed of the rotation where 1 is an entire rotation per second
uniform float rotationsPerSecond; // default: 0.1, min: -2, max: 2
uniform vec2 scrollSpeed; // default: [0.05, 0.05], min: [-1, -1], max: [1, 1]

vec4 render() {
  vec2 uv = gPosition - vec2(position);
  uv.y *= gResolution.y / gResolution.x;
  uv *= 0.5;

  float radiansPerDivision = gPI2 / float(divisions);
  float radians = atan(uv.x, uv.y);
  int division = int(floor(radians / radiansPerDivision));
  float rotateRadians = radiansPerDivision * (float(division) - 0.5 * float(divisions) + 0.5);

  uv *= gRotateMatrix2D(-rotateRadians);
  uv.x = abs(uv.x);

  uv *= gRotateMatrix2D(-gTime * rotationsPerSecond);
  uv -= scrollSpeed * gTime;
  uv.y *= gResolution.x / gResolution.y;

  return texture(gPreviousLayer, uv);
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
