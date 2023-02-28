import { LayerShader } from "../core";

export const repeaterLayer: LayerShader = {
  type: "shader",
  name: "repeater",
  id: "repeater",
  visible: true,
  code: `
uniform float rotationDegrees; // default: -90, min: -360, max: 360
uniform float speed; // default: 0.2, min: 0, max: 2
uniform float scaleStart; // default: 1, min: 0.1, max: 5
uniform float scaleEnd; // default: 2, min: 0.1, max: 5
uniform int iterations; // default: 10, min: 1, max: 40
uniform gradient colors; // default: [[0.5, 0.5, 0.5, 1.0, 0], [0.5, 0.5, 0.5, 1.0, 1]]
uniform int colorsBlendMode; // enum: "blendMode", default: "overlay"
uniform float colorsOpacity; // default: 1.0, min: 0, max: 1
uniform int sampleBlendMode; // enum: "blendMode", default: "normal"
uniform float sampleOpacity; // default: 0.25, min: 0, max: 1

vec4 sampleLayer(float value, float sampleOpacityAmount, float fadeInOut, vec4 previousColor) {
  float reverseValue = 1.0 - value;

  mat2 rotation = gRotateMatrix2D(reverseValue * gDegreesToRadians(-rotationDegrees));
  vec2 pos = gPosition;
  pos.y *= gResolution.y / gResolution.x;
  pos *= rotation;
  pos.y *= gResolution.x / gResolution.y;

  float scaleValue = scaleStart + reverseValue * (scaleEnd - scaleStart);
  
  vec2 uv = pos * vec2(1.0 / scaleValue) * 0.5 + 0.5;
  vec4 color = texture(gPreviousLayer, uv);
  vec4 gradientColor = gSampleGradient(colors, value);
  gradientColor.a = min(color.a, gradientColor.a);
  color = gApplyBlendMode(colorsBlendMode, colorsOpacity, gradientColor, color);
  color.a *= fadeInOut;
  return gApplyBlendMode(sampleBlendMode, sampleOpacityAmount * fadeInOut, color, previousColor);
}

vec4 render() {
  vec4 finalColor = sampleLayer(1.0, 1.0, 1.0, vec4(0));
  float invIterations = 1.0 / float(iterations);
  for (int i = iterations - 1; i >= 0; --i) {
    float value = 1.0 - (float(i) * invIterations) - mod(gTime * speed * float(iterations), 1.0) * invIterations;
    float fadeInOut = 1.0 - pow(1.0 - (cos(value * gPI * 2.0 - gPI) * 0.5 + 0.5), 10.0);
    finalColor = sampleLayer(value, sampleOpacity, fadeInOut, finalColor);
  }
  return finalColor;
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
