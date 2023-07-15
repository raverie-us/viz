import { LayerShader } from "../core";

export const sdfRayMarchingLayer: LayerShader = {
  type: "shader",
  name: "sdf ray marching",
  id: "sdf ray marching",
  visible: true,
  code: `
const int MAX_MARCHING_STEPS = 64;
const float MAX_MARCHING_DISTANCE = 10000.0;
const float HIT_PRECISION = 0.001;
const float NEAR_PRECISION = 0.01;

uniform vec3 cameraWorldPosition; // default: [0, 0, -1]
uniform vec3 cameraWorldDirection; // default: [0, 0, 1]

// TODO(trevor): Move these into built-ins
uniform bool shouldRenderIds;
uniform int highlightId; // default: -1
uniform int zero;

vec3 calcNormal(vec3 p) {
  const float epsilon = 0.0001;
  vec3 n = vec3(0.0);
  gSdfContext context = gSdfContextNull;
  for(int i = zero; i < 4; ++i) {
    vec3 e = 0.5773 * (2.0 * vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
    context.point = p + e * epsilon;
    n += e * gSdfScene(context).distance;
  }
  return normalize(n);
}

gSdfResult rayMarch(inout gSdfContext context, vec3 ro, vec3 rd) {
  gSdfResult result = gSdfResult(0.0, gSdfNoHitId);
  gSdfResult query = gSdfResult(MAX_MARCHING_DISTANCE, gSdfNoHitId);

  for (int i = 0; i < MAX_MARCHING_STEPS; ++i) {
    context.point = ro + result.distance * rd;
    query = gSdfScene(context);
    result.distance += query.distance;
    // We do this to avoid hitting INF or other bad
    // number cases when the ray shoots off to infinity
    if (result.distance >= MAX_MARCHING_DISTANCE) {
      return result;
    }
    if (query.distance < HIT_PRECISION) {
      result.id = query.id;
      return result;
    }
  }
  // If we missed everything above, improve the result by just 
  // using whatever was closest (misses usually go very far)
  if (query.distance < NEAR_PRECISION) {
    result.id = query.id;
  }
  return result;
}

mat3 camera(vec3 cameraPos, vec3 cameraDirection) {
  vec3 cd = normalize(cameraDirection);
  vec3 cr = normalize(cross(vec3(0, 1, 0), cd));
  vec3 cu = normalize(cross(cd, cr));
  
  return mat3(-cr, cu, -cd);
}

vec4 render() {
  vec3 ro = cameraWorldPosition;
  vec2 coord = gPosition;
  coord.y *= gResolution.y / gResolution.x;
  vec3 rd = camera(ro, cameraWorldDirection) * normalize(vec3(coord, -1)); // ray direction
  gSdfContext context = gSdfContextNull;
  gSdfResult result = rayMarch(context, ro, rd);

  if (shouldRenderIds) {
    uint id = uint(result.id);
    uint ru = (id & 0x000000FFu) >> 0;
    uint gu = (id & 0x0000FF00u) >> 8;
    uint bu = (id & 0x00FF0000u) >> 16;
    uint au = (id & 0xFF000000u) >> 24;
    float r = float(ru) / 255.0;
    float g = float(gu) / 255.0;
    float b = float(bu) / 255.0;
    float a = float(au) / 255.0;
    return vec4(r, g, b, a);
  } else {
    vec4 finalColor = vec4(0.0, 0.0, 0.0, 1.0);
    if (result.id != gSdfNoHitId) {
      vec3 p = ro + rd * result.distance;
      vec3 normal = calcNormal(p);
      finalColor = vec4(normal * 0.5 + vec3(0.5), 1.0);

      // test ids
      //vec3 color = result.id == 1 ? vec3(1, 0, 0) : vec3(0, 0, 1);
      //return vec4(color, 1.0);
    }

    if (highlightId != gSdfHighlightNone) {
      gSdfResult highlightResult = context.results[highlightId];
      if (highlightResult.id != gSdfNoHitId && result.id != gSdfNoHitId) {
        bool isOccluded = result.id != highlightResult.id;
        finalColor.rgb += vec3(isOccluded ? 0.15 : 0.35);
      }
    }
    return finalColor;
  }
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  values: []
};
