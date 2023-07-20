import { LayerShader } from "../core";

export const perspective3DLayer: LayerShader = {
  type: "shader",
  name: "perspective 3d",
  id: "perspective 3d",
  visible: true,
  code: `
uniform axis xAxis;
uniform axis yAxis;

uniform float minHeight; // default: 0.05, min: 0, max: 1
uniform float maxHeight; // default: 0.2, min: 0, max: 1

vec4 fx(vec2 coord) {
  return texture(gPreviousLayer, coord * vec2(1, -1) + vec2(0.5, 0.5));
}

float f(vec2 coord) {
  vec4 color = fx(coord);
  return gLuminance(color.rgb) * color.a * mix(minHeight, maxHeight, gAudioReactiveScalar);
}

float castRay(vec3 ro, vec3 rd) {
  float dt = 0.1;
  const float mint = 0.01;
  const float maxt = 1.0;
  float lh = 0.0;
  float ly = 0.0;
  for(float t = mint; t < maxt; t += dt) {
    vec3 p = ro + rd * t;
    float h = f(p.xz);
    if(p.y < h) {
      return t - dt + dt * (lh - ly) / (p.y - ly - h + lh);
    }
    // allow the error to be proportinal to the distance
    dt = 0.002 * t;
    lh = h;
    ly = p.y;
  }
  return -1.0;
}

vec3 getNormal(vec3 p) {
  vec2 texel = 1.0 / gResolution;
  return normalize(vec3(
    f(vec2(p.x - texel.x, p.z)) - f(vec2(p.x + texel.x, p.z)),
    2.0 * max(texel.x, texel.y),
    f(vec2(p.x, p.z - texel.y)) - f(vec2(p.x, p.z + texel.y))));
}

vec4 render() {
  vec3 ro = vec3(xAxis.value * -0.05, 0.5, yAxis.value * -0.05);
  vec3 rd = normalize(vec3(gPosition, -1.0)) * gRotateMatrix3D(-gPI / 2.0, vec3(1, 0, 0));

  mat3 rotate = gRotateMatrix3D(-yAxis.value * 0.1, vec3(1, 0, 0));
  rotate *= gRotateMatrix3D(xAxis.value * 0.1, vec3(0, 0, 1));
  ro *= rotate;
  rd *= rotate;

  float t = castRay(ro, rd);

  if(t > 0.0) {
    vec3 p = ro + rd * t;
    return fx(p.xz);

    vec3 normal = getNormal(p);
    return vec4(getNormal(p), 1);
  }
  return vec4(0, 0, 0, 1);
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  values: []
};
