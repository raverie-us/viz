import { LayerShader } from "../core";

export const pixelatedPalette: LayerShader = {
  type: "shader",
  name: "pixelated palette",
  id: "pixelated palette",
  visible: true,
  code: `
uniform sampler2D bayer; // default: {filter: "nearest", wrapHorizontal: "repeat", wrapVertical: "repeat", url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAAAAADhZOFXAAAACXBIWXMAAAsTAAALEwEAmpwYAAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAAZ0lEQVR42mJgaFBbINChuwIggBj2Oz1IOOH1MgMggBiMN4j3W+2QmwEQQAwf8y8E/iy/EQEQQEzKMvFRgryB3gABxHDG9232EbenKQABxGC/R3G2+WbpyQABxPCv+k7M15IroQABBgAZ8B60eaEoLgAAAABJRU5ErkJggg=="}
uniform gradient palette;
uniform int paletteSize; // default: 8, min: 2, max: 20
uniform int pixelate; // default: 2, min: 1, max: 4

vec4 dither(vec2 pixelPos, float value) {
  float paletteIndex = value * float(paletteSize);
  float t0 = floor(paletteIndex) / float(paletteSize);
  float t1 = t0 + 1.0 / float(paletteSize);

  vec4 s0 = gSampleGradient(palette, t0);
  vec4 s1 = gSampleGradient(palette, t1);

  float bayerSample = texture(bayer, pixelPos / vec2(textureSize(bayer, 0))).r;
  float fractional = float(fract(paletteIndex) > bayerSample);

  return mix(s0, s1, fractional);
}

vec4 render() {
  vec2 pixelatedResolution = gResolution / float(pixelate);
  vec2 pixelPos = floor(gUV * pixelatedResolution);
  vec2 uv = pixelPos / pixelatedResolution;
  
  vec4 color = texture(gPreviousLayer, uv);
  float luminance = gLuminance(color.rgb);

  return dither(pixelPos, luminance);
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
