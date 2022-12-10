import { LayerShader } from "../core";

export const gradientLayer: LayerShader = {
  type: "shader",
  name: "gradient",
  id: "gradient",
  visible: true,
  code: `
uniform gradient colors;
vec4 render() {
  return gSampleGradient(colors, gUV.x);
}`,
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
