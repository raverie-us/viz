import { LayerShader } from "../core";

export const spiralLayer: LayerShader = {
  type: "shader",
  name: "spiral",
  id: "spiral",
  visible: true,
  code: `
uniform vec2 position; // type: "position"
uniform gradient colors; // default: {0.47:[0,0,0,1], 0.50:[1,1,1,1], 0.97:[1,1,1,1], 1.00:[0,0,0,1]}
uniform bool warpPreviousLayer; // default: false
uniform int spirals; // default: 1, min: 0, max: 20
uniform float warpExponent; // default: 0.4, min: -0.2, max: 2
uniform float warpFactor; // default: 7.0, min: -10, max: 10
uniform float speed; // default: 1, min: 0, max: 2

vec4 render() {
  vec2 pos = gPosition - position;
  vec2 uv = vec2(pos.x, pos.y * gResolution.y / gResolution.x);
  float radius = length(uv);
  float radians = atan(uv.y, uv.x);
  vec4 prev = texture(gPreviousLayer, gUV);
  float t = fract(float(spirals) / 2.0 * radians / gPI + warpFactor * pow(radius, warpExponent) - gTime * speed);

  vec2 sampleUv = vec2(t, length(uv) + 0.5);
  if (warpPreviousLayer) {
    return texture(gPreviousLayer, sampleUv);
  }

  return gSampleGradient(colors, t);
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
