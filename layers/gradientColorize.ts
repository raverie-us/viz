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
  return gSampleGradient(colors, t);
}`,
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
