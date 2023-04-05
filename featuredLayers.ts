import { LayerCode } from "./core";
import { connnectedPointsLayer } from "./layers/connectedPoints";
import { emptyShaderLayer } from "./layers/emptyShader";
import { emptyJavaScriptLayer } from "./layers/emptyJavaScript";
import { glitchLayer } from "./layers/glitch";
import { chromaticAberrationLayer } from "./layers/chromaticAberration";
import { boxBlurLayer } from "./layers/boxBlur";
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
import { infiniteCaveLayer } from "./layers/cave";
import { audioInputLayer } from "./layers/audioInput";
import { audioWaveformLayer } from "./layers/audioWaveform";
import { repeaterLayer } from "./layers/repeater";
import { fractalFlowLayer } from "./layers/fractalFlow";
import { fractalCircuitLayer } from "./layers/fractalCircuit";
import { fxaaLayer } from "./layers/fxaa";

export const featuredLayers: LayerCode[] = [
  connnectedPointsLayer,
  glitchLayer,
  chromaticAberrationLayer,
  boxBlurLayer,
  godRaysLayer,
  gradientLayer,
  gradientColorizeLayer,
  pixelatedPalette,
  kaleidoscopeLayer,
  fractalFlowLayer,
  fractalCircuitLayer,
  repeaterLayer,
  liquidLayer,
  spiralLayer,
  swirlLayer,
  tunnelLayer,
  infiniteCaveLayer,
  audioInputLayer,
  audioWaveformLayer,
  fxaaLayer,
  textureLayer,
  emptyJavaScriptLayer,
  emptyShaderLayer,
]

export const visualLayers: LayerCode[] = [
  connnectedPointsLayer,
  glitchLayer,
  chromaticAberrationLayer,
  boxBlurLayer,
  godRaysLayer,
  gradientLayer,
  gradientColorizeLayer,
  pixelatedPalette,
  kaleidoscopeLayer,
  fractalFlowLayer,
  fractalCircuitLayer,
  repeaterLayer,
  liquidLayer,
  spiralLayer,
  swirlLayer,
  tunnelLayer,
  infiniteCaveLayer,
  audioWaveformLayer,
  textureLayer,
]
