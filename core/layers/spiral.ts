import { LayerShader } from "../core";

export const spiralLayer: LayerShader = {
  type: "shader",
  name: "spiral",
  id: "spiral",
  visible: true,
  code: `
uniform vec2 position; // type: "position"
uniform gradient colors; // default: {0.47:[0,0,0,1], 0.50:[1,1,1,1], 0.97:[1,1,1,1], 1.00:[0,0,0,1]}
uniform int spirals; // default: 1, min: 0, max: 15
uniform float warpExponent; // default: 0.4, min: 0, max: 1.5
uniform float warpFactor; // default: 7.0, min: -4, max: 4
uniform float speed; // default: 1, min: 0, max: 2

vec4 render() {
  vec2 pos = gPosition - position;
  vec2 uv = vec2(pos.x, pos.y * gResolution.y / gResolution.x);
  float radius = length(uv);
  float radians = atan(uv.y, uv.x);
  vec4 prev = texture(gPreviousLayer, gUV);
  float t = fract(float(spirals) / 2.0 * radians / gPI + warpFactor * pow(radius, warpExponent) - gTime * speed);
  return gSampleGradient(colors, t);
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  values: []
};
