import { LayerShader } from "../core";

export const lensLayer: LayerShader = {
  type: "shader",
  name: "lens",
  id: "lens",
  visible: true,
  code: `
uniform float bend; // default: 0.5, min: -4, max: 4
uniform float lensSize; // default: 0.5, min: 0, max: 1

vec4 render() {
  vec2 p = gPosition.xy;
  float ratio = gResolution.y / gResolution.x;
  p.y *= ratio;

  float r = length(p) / lensSize;

  if (r > 1.0) {
    return texture(gPreviousLayer, gUV);
  }

  vec2 uv = mix(p, p * r, bend);
  uv.y /= ratio;
  uv /= vec2(2);
  uv -= vec2(0.5);
  
  return texture(gPreviousLayer, vec2(uv.x, 1.0 - uv.y));
}
`.trim(),
  blendMode: "normal",
  opacity: 1,
  values: []
};
