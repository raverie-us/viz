import { LayerShader } from "../core";

export const spiralLayer: LayerShader = {
  type: "shader",
  name: "spiral",
  id: "spiral",
  visible: true,
  code: `
uniform vec2 position; // type: "position"
uniform gradient colors; // default: {0.49:[0,0,0,1], 0.51:[1,1,1,1]}
uniform int spirals; // default: 1, min: 0, max: 20
uniform float warpExponent; // default: 0.4, min: -0.2, max: 2
uniform float warpFactor; // default: 7.0, min: -10, max: 10
uniform float speed; // default: 1, min: 0, max: 2

float sinInOut(float t) {
  return -cos(t * gPI) * 0.5 + 0.5;
}

vec4 render() {
  vec2 uv = vec2(gPosition.x, gPosition.y * gResolution.y / gResolution.x);
  uv -= position;
  float radius = length(uv);
  float radians = atan(uv.y, uv.x);
  vec4 prev = texture(gPreviousLayer, gUV);
  float t = fract(float(spirals) / 2.0 * radians / gPI + warpFactor * pow(radius, warpExponent) - gTime * speed);
  return gSampleGradient(colors, t);
}`,
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
