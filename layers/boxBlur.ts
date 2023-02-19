import { LayerShader } from "../core";

export const boxBlur: LayerShader = {
  type: "shader",
  name: "box blur",
  id: "box blur",
  visible: true,
  code: `
// This is quite a naive box blur and should eventually be rewritten
// as a separate blur / multi-pass, and utilize down-sampling too

uniform int sampleRadius; // default: 1, min: 1, max: 10

vec4 render() {
  vec4 color = vec4(0);
  vec2 texel = 1.0 / vec2(textureSize(gPreviousLayer, 0));
  for (int y = -sampleRadius; y <= sampleRadius; ++y) {
    for (int x = -sampleRadius; x <= sampleRadius; ++x) {
      color += texture(gPreviousLayer, gUV + (vec2(x, y) - vec2(0.5)) * texel);
    }
  }
  int sampleDiameter = sampleRadius * 2 + 1;
  color /= float(sampleDiameter * sampleDiameter);
  return color;
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
