import { LayerShader } from "../core";

export const boxBlurLayer: LayerShader = {
  type: "shader",
  name: "box blur",
  id: "box blur",
  visible: true,
  code: `
// This is quite a naive box blur and should eventually be rewritten
// as a separate blur / multi-pass, and utilize down-sampling too
uniform float sampleRadius; // default: 0.01, min: 0, max: 0.1

// This is just to prevent a webgl crash if it takes too long to render
const int MAX_SAMPLE_RADIUS_PIXELS = 100;

vec4 render() {
  vec4 color = vec4(0);
  vec2 texel = 1.0 / vec2(textureSize(gPreviousLayer, 0));
  int sampleRadiusInt = min(int(sampleRadius / min(texel.x, texel.y)), MAX_SAMPLE_RADIUS_PIXELS);
  
  for (int y = -sampleRadiusInt; y <= sampleRadiusInt; ++y) {
    for (int x = -sampleRadiusInt; x <= sampleRadiusInt; ++x) {
      color += texture(gPreviousLayer, gUV + (vec2(x, y) - vec2(0.5)) * texel);
    }
  }
  int sampleDiameter = sampleRadiusInt * 2 + 1;
  color /= float(sampleDiameter * sampleDiameter);
  return color;
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  values: []
};
