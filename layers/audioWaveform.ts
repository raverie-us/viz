import { LayerShader } from "../core";

export const audioWaveformLayer: LayerShader = {
  type: "shader",
  name: "audio waveform",
  id: "audio waveform",
  visible: true,
  code: `
uniform vec2 position; // type: "position"
uniform float rotationDegrees; // min: -360, max: 360, randomize: false
uniform vec2 scale; // default: [1,1]

uniform gradient colors;
uniform float thickness; // default: 0.02, min: 0.01, max: 1.0
uniform bool symetric;

vec4 render() {
  vec2 posAspect = gPosition;
  posAspect.y *= gResolution.y / gResolution.x;
  vec2 pos = (posAspect - position) * gRotateMatrix2D(gDegreesToRadians(rotationDegrees)) / scale;

  float value = abs(texture(gAudioSamples, vec2(pos.x, 0)).r * 2.0 - 1.0) + thickness * 0.5;
  float t = clamp((pos.y - -value) / (value * 2.0), 0.0, 1.0);

  if (symetric) {
    t = abs(t - 0.5) * 2.0;
  }

  return gSampleGradient(colors, t);
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
