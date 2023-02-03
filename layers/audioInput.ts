import { LayerShader } from "../core";

export const audioInputLayer: LayerShader = {
  type: "shader",
  name: "audio input",
  id: "audio input",
  visible: true,
  code: `
vec4 render() {
  if (abs(gAudioVolume - gUV.y) < 0.01) {
    return vec4(0, 1, 1, 1);
  }
  if (abs(gAudioVolumeAverage - gUV.y) < 0.01) {
    return vec4(1, 0, 1, 1);
  }
  if (abs(gAudioVolumePeak - gUV.y) < 0.01) {
    return vec4(1, 1, 1, 1);
  }
  if (abs(gAudioVolumeTrough - gUV.y) < 0.01) {
    return vec4(0, 0, 1, 1);
  }
  
  float audioFrequency = texture(gAudioFrequencies, vec2(gUV.x, 0)).r;
  float audioSample = texture(gAudioSamples, vec2(gUV.x, 0)).r;
  return vec4(audioFrequency > gUV.y, audioSample > gUV.y, gAudioReactiveScalar, 1);
}`,
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
