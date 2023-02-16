import { LayerShader } from "../core";

export const textureLayer: LayerShader = {
  type: "shader",
  id: "texture",
  name: "texture",
  visible: true,
  code: `
uniform sampler2D textureInput;

// TODO(trevor): Mark that these are extra modes for textureInput wrap
// This is sort of a neat idea, we can basically extend enums and other uniforms
uniform bool horizontalBackground; // default: true
uniform bool verticalBackground; // default: true
uniform vec4 backgroundColor; // type: "color"

uniform vec2 position; // type: "position"
uniform vec2 scale; // default: [1,1]
uniform float rotationDegrees; // min: -360, max: 360
uniform vec2 center; // min: [-1,-1], max: [1,1]

float aspect(vec2 dimensions) {
  return dimensions.x / dimensions.y;
}

vec4 render() {
  ivec2 texSize = textureSize(textureInput, 0);
  float resAspect = aspect(gResolution);
  float texAspect = aspect(vec2(texSize));

  vec2 uv = gUV;
  vec2 pos = gPosition - position;

  // TODO(trevor): Switch on object-fit modes
  // object-fit: cover
  if (true) {
    pos /= scale;
    mat2 rotation = gRotateMatrix2D(gDegreesToRadians(-rotationDegrees));
    if (texAspect > resAspect) {
      pos.y /= resAspect;
      pos *= rotation;
      pos.y *= texAspect;
    } else {
      pos.x *= resAspect;
      pos *= rotation;
      pos.x /= texAspect;
    }
    pos += center;
    uv = pos * 0.5 + 0.5;
  }

  if (horizontalBackground && (uv.x < 0.0 || uv.x > 1.0)) {
    return backgroundColor;
  }
  if (verticalBackground && (uv.y < 0.0 || uv.y > 1.0)) {
    return backgroundColor;
  }
  
  return texture(textureInput, uv);
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
