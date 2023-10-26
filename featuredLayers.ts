import { LayerCode, LayerSDF, LayerShader } from "./core";
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
import { stageLayer } from "./layers/stage";
import { perspective3DLayer } from "./layers/perspective3d";
import {
  boxSdf,
  bumpSdf,
  caveSdf,
  coneSdf,
  cylinderSdf,
  dripSdf,
  fastIntersectionSdf,
  fastSubtractionSdf,
  fastUnionSdf,
  infiniteCylinderSdf,
  inflateSdf,
  intersectionSdf,
  invertSdf,
  repeatSdf,
  sphereSdf,
  stageSdf,
  subtractionSdf,
  torusSdf,
  transformSdf,
  twistSdf,
  unionSdf
} from "./sdfs/sdfs";

export const featuredSdfs: LayerSDF[] = [
  sphereSdf,
  boxSdf,
  cylinderSdf,
  infiniteCylinderSdf,
  coneSdf,
  torusSdf,
  caveSdf,
  unionSdf,
  subtractionSdf,
  intersectionSdf,
  invertSdf,
  bumpSdf,
  inflateSdf,
  dripSdf,
  twistSdf,
  repeatSdf,
  transformSdf,
  fastUnionSdf,
  fastSubtractionSdf,
  fastIntersectionSdf,
  stageSdf
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
  perspective3DLayer,
  stageLayer,
  textureLayer,
  emptyJavaScriptLayer,
  emptyShaderLayer,
]

export const visualLayers: LayerShader[] = [
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
