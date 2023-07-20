import { LayerShader } from "../core";

export const perspective3DLayer: LayerShader = {
  type: "shader",
  name: "perspective 3d",
  id: "perspective 3d",
  visible: true,
  code: `
uniform float xRotation; // default: 0.05, min: 0, max: 0.1
uniform float yRotation; // default: 0.05, min: 0, max: 0.1
uniform float zoomOut; // default: 0.54, min: 0.4, max: 0.6
uniform float minHeight; // default: 0.05, min: 0, max: 0.2
uniform float maxHeight; // default: 0.1, min: 0, max: 0.2
uniform bool invert; // default: false

uniform axis xAxis; // default: {"gamepad": 0}
uniform axis yAxis; // default: {"gamepad": 1}

vec4 fx(vec2 coord) {
  return texture(gPreviousLayer, coord * vec2(1, -1) + 0.5);
}

float f(vec2 coord) {
  vec4 color = fx(coord);
  float luminance = gLuminance(color.rgb);
  if(invert) {
    luminance = 1.0 - luminance;
  }
  return luminance * color.a * mix(minHeight, maxHeight, gAudioReactiveScalar);
}

float castRay(vec3 ro, vec3 rd) {
  float dt = 0.1;
  const float mint = 0.01;
  const float maxt = 2.0;
  float lh = 0.0;
  float ly = 0.0;
  for(float t = mint; t < maxt; t += dt) {
    vec3 p = ro + rd * t;
    float h = f(p.xz);
    if(p.y < h) {
      return t - dt + dt * (lh - ly) / (p.y - ly - h + lh);
    }
    dt = 0.004 * t;
    lh = h;
    ly = p.y;
  }
  return -1.0;
}

vec4 render() {
  vec3 ro = vec3(xAxis.value * -xRotation, zoomOut, yAxis.value * -yRotation);
  vec3 rd = normalize(vec3(gPosition, -1.0)) * gRotateMatrix3D(-gPI / 2.0, vec3(1, 0, 0));

  mat3 rotate = gRotateMatrix3D(-yAxis.value * yRotation * 2.0, vec3(1, 0, 0));
  rotate *= gRotateMatrix3D(xAxis.value * xRotation * 2.0, vec3(0, 0, 1));
  ro *= rotate;
  rd *= rotate;

  float t = castRay(ro, rd);

  if(t > 0.0) {
    vec3 p = ro + rd * t;
    return fx(p.xz);
  }
  return texture(gPreviousLayer, gUV);
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  values: []
};
