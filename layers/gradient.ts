import { LayerShader } from "../core";

export const gradientLayer: LayerShader = {
  type: "shader",
  name: "gradient",
  id: "gradient",
  visible: true,
  code: `
uniform gradient colors; // default: {0: [1,1,1,1], 0.5: [0,0,0,1], 1: [1,1,1,1]}
uniform float colorCycleRate; // default: 0.2, min: 0, max: 1
uniform float rotationDegrees; // min: -360, max: 360
uniform float rotationsPerSecond; // default: 0, min: -2, max: 2
uniform int repeat; // default: 1, min: 1, max: 10

vec4 render() {
  vec2 uv = gUV * gRotateMatrix2D(gDegreesToRadians(rotationDegrees));
  uv = uv * gRotateMatrix2D(gTime * rotationsPerSecond);
  return gSampleGradient(colors, uv.x * float(repeat) + colorCycleRate * gTime);
}`,
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
