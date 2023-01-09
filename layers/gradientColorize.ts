import { LayerShader } from "../core";

export const gradientColorizeLayer: LayerShader = {
  type: "shader",
  name: "gradient colorize",
  id: "gradient colorize",
  visible: true,
  code: `
uniform gradient colors; // default: {0:[1,1,1,1], 0.5:[0,0,0,1], 1:[1,1,1,1]}
uniform float colorCycleRate; // default: 0.2, min: 0, max: 1
vec4 render() {
  vec4 color = texture(gPreviousLayer, gUV);
  float t = gLuminance(color.rgb) + gTime * colorCycleRate;
  vec4 sampled = gSampleGradient(colors, t);
  sampled.a *= color.a;
  return sampled;
}`,
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
