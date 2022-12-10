import { LayerShader } from "./core";
import { connnectedPointsLayer } from "./layers/connectedPoints";
import { emptyLayer } from "./layers/empty";
import { glitchLayer } from "./layers/glitch";
import { godRaysLayer } from "./layers/godRays";
import { gradientLayer } from "./layers/gradient";
import { gradientColorizeLayer } from "./layers/gradientColorize";
import { kaleidoscopeLayer } from "./layers/kaleidoscope";
import { liquidLayer } from "./layers/liquid";
import { spiralLayer } from "./layers/spiral";
import { textureLayer } from "./layers/texture";
import { tunnelLayer } from "./layers/tunnel";

const untrimmedLayers: LayerShader[] = [
  connnectedPointsLayer,
  emptyLayer,
  glitchLayer,
  godRaysLayer,
  gradientLayer,
  gradientColorizeLayer,
  kaleidoscopeLayer,
  liquidLayer,
  spiralLayer,
  textureLayer,
  tunnelLayer,
]

export const featuredLayers: LayerShader[] = untrimmedLayers.map((layer) => ({
  ...layer,
  code: layer.code.trim()
}));
