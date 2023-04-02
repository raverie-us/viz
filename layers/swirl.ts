import { LayerShader } from "../core";

export const swirlLayer: LayerShader = {
  type: "shader",
  name: "swirl",
  id: "swirl",
  visible: true,
  code: `
uniform vec2 position; // type: "position"
uniform float intensity; // default: 1, min: -2, max: 2
uniform float radius; // default: 1, min: 0.1, max: 1
uniform float edge; // default: 0.1, min: 0, max: 0.5
uniform float speed; // default: 0.5, min: -1, max: 1

vec4 render() {
  vec2 center = position * 0.5 + vec2(0.5);

  vec2 offset = gUV - center;
  offset.y *= gResolution.y / gResolution.x;
  float dist = length(offset);

  float angle = intensity * (radius - dist) * gPI;
  vec2 swirlUv = center + gRotateMatrix2D(angle + gTime * speed) * offset;

  float edge = max(edge, 1.0 / max(gResolution.x, gResolution.y));
  float interpolant = clamp((dist - radius) / edge, 0.0, 1.0);
  return mix(texture(gPreviousLayer, swirlUv), texture(gPreviousLayer, gUV), interpolant);
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
