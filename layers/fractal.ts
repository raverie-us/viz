import { LayerShader } from "../core";

export const fractalLayer: LayerShader = {
  type: "shader",
  name: "fractal",
  id: "fractal",
  visible: true,
  code: `
uniform gradient colors; // default: {0:[1,1,1,1], 0.5:[0,0,0,1], 1:[1,1,1,1]}
uniform vec4 backgroundColor; // type: "color", default: [0,0,0,0]
uniform float intensity; // default: 1, min: 1, max: 1.5
uniform float speed; // default: 0.2, min: 0, max: 1
uniform bool bleedThrough;
uniform float bleedSharpness; // default: 0.5, min: 0, max: 1
uniform int iterations; // default: 6, min: 1, max: 7
uniform float zoom; // default: 1, min: 0.5, max: 2
uniform vec2 colorScale; // default: [0.5, 0.5], min: [0,0], max: [1,1]
uniform float warping; // default: 0, min: 0, max: 1

vec4 render() {
  vec2 pos = gPosition * 0.5;
  pos.y *= gResolution.y / gResolution.x;
  pos /= zoom;

  float bleedThroughExponent = mix(4.0, 20.0, bleedSharpness);
  vec4 accumulate = vec4(0);
  for (float i = 0.0 ; i < float(iterations); ++i) {
    pos = abs((fract(pos - 0.5) - 0.5) * 2.0) * gRotateMatrix2D(gTime * speed * cos(i * 0.2));
    pos.x += cos(sin(pos.y * 10.0)) * warping * 0.25;
    pos.y += cos(sin(pos.x * 10.0)) * warping * 0.25;
    vec4 color = gSampleGradient(colors, dot(pos, colorScale) +  + gTime * speed);
    float bleed = bleedThrough
      ? pow(2.0, -abs(pos.y - pos.x) * bleedThroughExponent)
      : 1.0;
    accumulate += bleed * color;
  }
  accumulate /= float(iterations);
  accumulate *= bleedThrough ? mix(2.5, 6.0, bleedSharpness) : 1.0;
  accumulate *= intensity;
  accumulate *= 1.5;
  accumulate.a = clamp(accumulate.a, 0.0, 1.0);

  vec4 backgroundColorPremul = backgroundColor * backgroundColor.a;
  return accumulate + backgroundColorPremul * (1.0 - accumulate.a);
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
