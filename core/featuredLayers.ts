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

export const sdfShapes: LayerSDF[] = [
  sphereSdf,
  boxSdf,
  cylinderSdf,
  infiniteCylinderSdf,
  coneSdf,
  torusSdf,
  caveSdf
];

export const sdfModifiers: LayerSDF[] = [
  transformSdf,
  invertSdf,
  bumpSdf,
  inflateSdf,
  dripSdf,
  twistSdf,
  repeatSdf,
  stageSdf
];

export const sdfBooleanOperations: LayerSDF[] = [
  unionSdf,
  subtractionSdf,
  intersectionSdf,
  fastUnionSdf,
  fastSubtractionSdf,
  fastIntersectionSdf,
];

export const generatorLayers: LayerCode[] = [
  textureLayer,
  connnectedPointsLayer,
  gradientLayer,
  fractalFlowLayer,
  fractalCircuitLayer,
  spiralLayer,
  infiniteCaveLayer,
  audioInputLayer,
  audioWaveformLayer,
];

export const effectLayers: LayerCode[] = [
  glitchLayer,
  chromaticAberrationLayer,
  boxBlurLayer,
  godRaysLayer,
  gradientColorizeLayer,
  pixelatedPalette,
  kaleidoscopeLayer,
  repeaterLayer,
  liquidLayer,
  swirlLayer,
  tunnelLayer,
  fxaaLayer,
  perspective3DLayer,
  stageLayer,
];

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
  perspective3DLayer,
  stageLayer,
  textureLayer,
];

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
