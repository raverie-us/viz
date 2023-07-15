import { LayerCode, LayerSDF } from "./core";
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
import { sdfRayMarchingLayer } from "./layers/sdfRayMarching";
import {
  boxSdf,
  bumpSdf,
  cylinderSdf,
  fastIntersectionSdf,
  fastSubtractionSdf,
  fastUnionSdf,
  infiniteCylinderSdf,
  inflateSdf,
  intersectionSdf,
  invertSdf,
  repeatSdf,
  sphereSdf,
  subtractionSdf,
  torusSdf,
  twistSdf,
  unionSdf
} from "./sdfs/sdfs";

export const featuredSdfs: LayerSDF[] = [
  sphereSdf,
  boxSdf,
  cylinderSdf,
  infiniteCylinderSdf,
  torusSdf,
  unionSdf,
  subtractionSdf,
  intersectionSdf,
  invertSdf,
  bumpSdf,
  inflateSdf,
  twistSdf,
  repeatSdf,
  fastUnionSdf,
  fastSubtractionSdf,
  fastIntersectionSdf
];

export const featuredLayers: LayerCode[] = [
  ...featuredSdfs,
  sdfRayMarchingLayer,
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
