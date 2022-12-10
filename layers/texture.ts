import { LayerShader } from "../core";

export const textureLayer: LayerShader = {
  type: "shader",
  id: "texture",
  name: "texture",
  visible: true,
  code: `
uniform sampler2D textureInput;

// TODO(trevor): Support bool values, or mark that these are extra modes for textureInput wrap
// This is sort of a neat idea, we can basically extend enums and other uniforms
uniform int horizontalBackground; // default: 1, min: 0, max: 1
uniform int verticalBackground; // default: 1, min: 0, max: 1
uniform vec4 background; // type: "color"

uniform vec2 position; // type: "position"
uniform vec2 scale; // default: [1,1]
uniform float rotationDegrees; // min: -360, max: 360
uniform vec2 center; // min: [-1,-1], max: [1,1]

float aspect(vec2 dimensions) {
  return dimensions.x / dimensions.y;
}

mat2 rotate(float degrees) {
  float radians = degrees / 180.0 * gPI;
  float c = cos(radians);
  float s = sin(radians);
  return mat2(c, s, -s, c);
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
    if (texAspect > resAspect) {
      pos.y /= resAspect;
      pos *= rotate(-rotationDegrees);
      pos.y *= texAspect;
      pos += center;
      uv = pos * 0.5 + 0.5;
    } else {
      pos.x *= resAspect;
      pos *= rotate(-rotationDegrees);
      pos.x /= texAspect;
      pos += center;
      uv = pos * 0.5 + 0.5;
    }
  }

  if (horizontalBackground == 1 && (uv.x < 0.0 || uv.x > 1.0)) {
    return background;
  }
  if (verticalBackground == 1 && (uv.y < 0.0 || uv.y > 1.0)) {
    return background;
  }
  
  return texture(textureInput, uv);
}`,
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
