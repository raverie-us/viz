import { LayerCode } from "./core";
import { connnectedPointsLayer } from "./layers/connectedPoints";
import { emptyShaderLayer } from "./layers/emptyShader";
import { emptyJavaScriptLayer } from "./layers/emptyJavaScript";
import { glitchLayer } from "./layers/glitch";
import { chromaticAberrationLayer } from "./layers/chromaticAberration";
import { boxBlur } from "./layers/boxBlur";
import { godRaysLayer } from "./layers/godRays";
import { gradientLayer } from "./layers/gradient";
import { gradientColorizeLayer } from "./layers/gradientColorize";
import { pixelatedPalette } from "./layers/pixelatedPalette";
import { kaleidoscopeLayer } from "./layers/kaleidoscope";
import { liquidLayer } from "./layers/liquid";
import { spiralLayer } from "./layers/spiral";
import { swirlLayer } from "./layers/swirl";
import { textureLayer } from "./layers/texture";
import { tunnelLayer } from "./layers/tunnel";
import { audioInputLayer } from "./layers/audioInput";
import { audioWaveformLayer } from "./layers/audioWaveform";
import { repeaterLayer } from "./layers/repeater";
import { fractalLayer } from "./layers/fractal";

export const featuredLayers: LayerCode[] = [
  connnectedPointsLayer,
  glitchLayer,
  chromaticAberrationLayer,
  boxBlur,
  godRaysLayer,
  gradientLayer,
  gradientColorizeLayer,
  pixelatedPalette,
  kaleidoscopeLayer,
  fractalLayer,
  repeaterLayer,
  liquidLayer,
  spiralLayer,
  swirlLayer,
  tunnelLayer,
  audioInputLayer,
  audioWaveformLayer,
  textureLayer,
  emptyJavaScriptLayer,
  emptyShaderLayer,
]

export const visualLayers: LayerCode[] = [
  connnectedPointsLayer,
  glitchLayer,
  chromaticAberrationLayer,
  boxBlur,
  godRaysLayer,
  gradientLayer,
  gradientColorizeLayer,
  pixelatedPalette,
  kaleidoscopeLayer,
  fractalLayer,
  repeaterLayer,
  liquidLayer,
  spiralLayer,
  swirlLayer,
  tunnelLayer,
  audioWaveformLayer,
  textureLayer,
]
