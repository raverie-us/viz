import { LayerShader } from "../core";

export const chromaticAberrationLayer: LayerShader = {
  type: "shader",
  name: "chromatic aberration",
  id: "chromatic aberration",
  visible: true,
  code: `
uniform float rotationDegrees; // min: -360, max: 360
uniform float scale; // default: 5.0, min: 1, max: 20

vec4 render() {
  mat2 rotation = gRotateMatrix2D(gDegreesToRadians(-rotationDegrees));
  float texel = 1.0 / max(gResolution.x, gResolution.y);
  vec2 offset = rotation * vec2(texel * scale, 0);
  vec2 ra = texture(gPreviousLayer, gUV - offset).ra;
  vec2 ga = texture(gPreviousLayer, gUV).ga;
  vec2 ba = texture(gPreviousLayer, gUV + offset).ba;
  return vec4(ra.x, ga.x, ba.x, (ra.y + ga.y + ba.y) / 3.0);
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
