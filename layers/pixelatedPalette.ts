import { LayerShader } from "../core";

export const pixelatedPalette: LayerShader = {
  type: "shader",
  name: "pixelated palette",
  id: "pixelated palette",
  visible: true,
  code: `
uniform gradient palette;
uniform bool useLuminanceForPaletteValue; // default: false
uniform int paletteSize; // default: 8, min: 2, max: 20
uniform int pixelate; // default: 2, min: 1, max: 4
uniform sampler2D bayer; // default: {filter: "nearest", wrapHorizontal: "repeat", wrapVertical: "repeat", url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAAAAADhZOFXAAAACXBIWXMAAAsTAAALEwEAmpwYAAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAAZ0lEQVR42mJgaFBbINChuwIggBj2Oz1IOOH1MgMggBiMN4j3W+2QmwEQQAwf8y8E/iy/EQEQQEzKMvFRgryB3gABxHDG9232EbenKQABxGC/R3G2+WbpyQABxPCv+k7M15IroQABBgAZ8B60eaEoLgAAAABJRU5ErkJggg=="}, randomize: false

vec4 ditherLerp(vec2 pixelPos, vec4 color1, vec4 color2, float interpolant) {
  float bayerSample = texture(bayer, pixelPos / vec2(textureSize(bayer, 0))).r;
  float fractional = float(interpolant > bayerSample);
  return mix(color1, color2, fractional);
}

vec4 dither(vec2 pixelPos, float value) {
  float paletteIndex = value * float(paletteSize);
  float t0 = floor(paletteIndex) / float(paletteSize);
  float t1 = t0 + 1.0 / float(paletteSize);

  vec4 color0 = gSampleGradient(palette, t0);
  vec4 color1 = gSampleGradient(palette, t1);

  return ditherLerp(pixelPos, color0, color1, fract(paletteIndex));
}

vec4 render() {
  vec2 pixelatedResolution = gResolution / float(pixelate);
  vec2 pixelPos = floor(gUV * pixelatedResolution);
  vec2 uv = pixelPos / pixelatedResolution;
  
  vec4 color = texture(gPreviousLayer, uv);
  if (useLuminanceForPaletteValue) {
    float luminance = gLuminance(color.rgb);
    return dither(pixelPos, luminance);
  } else {
    float closestDistance = 1.0;
    vec4 closestColor0 = gSampleGradient(palette, 0.0);
    vec4 closestColor1 = closestColor0;
    for (int i = 0; i <= paletteSize; ++i) {
      float value = float(i) / float(paletteSize);
      vec4 paletteColor = gSampleGradient(palette, value);
      float colorDistance = distance(color, paletteColor) / distance(vec4(1), vec4(0));
      if (colorDistance < closestDistance) {
        closestDistance = colorDistance;
        closestColor1 = closestColor0;
        closestColor0 = paletteColor;
      }
    }

    vec4 diff = normalize(closestColor1 - closestColor0);
    float interpolant = dot(diff, color - closestColor0);

    return ditherLerp(pixelPos, closestColor0, closestColor1, interpolant);
  }
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
