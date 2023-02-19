import { LayerCode } from "./core";
import { connnectedPointsLayer } from "./layers/connectedPoints";
import { emptyShaderLayer } from "./layers/emptyShader";
import { emptyJavaScriptLayer } from "./layers/emptyJavaScript";
import { glitchLayer } from "./layers/glitch";
import { boxBlur } from "./layers/boxBlur";
import { godRaysLayer } from "./layers/godRays";
import { gradientLayer } from "./layers/gradient";
import { gradientColorizeLayer } from "./layers/gradientColorize";
import { kaleidoscopeLayer } from "./layers/kaleidoscope";
import { liquidLayer } from "./layers/liquid";
import { spiralLayer } from "./layers/spiral";
import { textureLayer } from "./layers/texture";
import { tunnelLayer } from "./layers/tunnel";
import { audioInputLayer } from "./layers/audioInput";

export const featuredLayers: LayerCode[] = [
  connnectedPointsLayer,
  glitchLayer,
  boxBlur,
  godRaysLayer,
  gradientLayer,
  gradientColorizeLayer,
  kaleidoscopeLayer,
  liquidLayer,
  spiralLayer,
  tunnelLayer,
  audioInputLayer,
  textureLayer,
  emptyJavaScriptLayer,
  emptyShaderLayer,
]

export const visualLayers: LayerCode[] = [
  connnectedPointsLayer,
  glitchLayer,
  boxBlur,
  godRaysLayer,
  gradientLayer,
  gradientColorizeLayer,
  kaleidoscopeLayer,
  liquidLayer,
  spiralLayer,
  tunnelLayer,
  textureLayer,
]
