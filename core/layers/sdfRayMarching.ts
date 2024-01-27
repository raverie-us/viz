import { LayerShader } from "../core";

export const sdfRayMarchingLayer: LayerShader = {
  type: "shader",
  name: "sdf ray marching",
  id: "sdf ray marching",
  visible: true,
  code: `
const int MAX_MARCHING_STEPS = 100;
const float MAX_MARCHING_DISTANCE = 100.0;
const float HIT_PRECISION = 0.002;
const float NEAR_PRECISION = 0.5;
const float MIN_MARCHING_DISTANCE_NEAR = 0.001;
const float MIN_MARCHING_DISTANCE_FAR = 0.1;

uniform vec3 cameraPosition; // default: [0, 0, 2], min: [-10,-10,-10], max: [10,10,10]
uniform vec3 cameraRotationDegrees; // default: [0, 0, 0], min: [-180,-180,-180], max: [180,180,180]
uniform float cameraFovDegrees; // default: 80, min: 60, max: 100

uniform int cameraMode; // default: "firstPerson", enum: ["firstPerson", "orbit"]
const int CAMERA_MODE_FIRST_PERSON = 0;
const int CAMERA_MODE_ORBIT = 1;
uniform axis cameraXAxis; // default: {"gamepad": 0}
uniform axis cameraYAxis; // default: {"gamepad": 1}
uniform float cameraXAxisDegrees; // default: 45, min: 0, max: 90
uniform float cameraYAxisDegrees; // default: 45, min: 0, max: 90

uniform bool enableHighlighting; // default: true
uniform vec4 highlightColor; // default: [0.3, 1, 0.3, 0.5], type: "color"
uniform vec4 highlightBorderColor; // default: [0,0,0,1], type: "color"

// TODO(trevor): Move these into built-ins
uniform bool shouldRenderIds;

vec3 calcNormal(inout gSdfContext context, vec3 p) {
  const float epsilon = 0.001;
  vec3 n = vec3(0.0);
  for(int i = gZero; i < 4; ++i) {
    vec3 e = 0.5773 * (2.0 * vec3((((i+3)>>1)&1),((i>>1)&1),(i&1))-1.0);
    context.point = p + e * epsilon;
    n += e * gSdfScene(context).distance;
  }
  return normalize(n);
}

gSdfResult rayMarch(inout gSdfContext context, vec3 ro, vec3 rd) {
  float distance = 0.0;
  gSdfResult query;

  for (int i = 0; i < MAX_MARCHING_STEPS; ++i) {
    context.point = ro + distance * rd;
    query = gSdfScene(context);

    float z = distance / MAX_MARCHING_DISTANCE;
    float minMarchingDistance = mix(MIN_MARCHING_DISTANCE_NEAR, MIN_MARCHING_DISTANCE_FAR, z);
    distance += max(query.distance, minMarchingDistance);
    // We do this to avoid hitting INF or other bad
    // number cases when the ray shoots off to infinity
    if (distance >= MAX_MARCHING_DISTANCE) {
      return gSdfResultNull;
    }
    if (query.distance < HIT_PRECISION) {
      return gSdfResult(distance, query.id);
    }
  }
  // If we missed everything above, improve the result by just 
  // using whatever was closest (misses usually go very far)
  if (query.distance < NEAR_PRECISION) {
    return gSdfResult(distance, query.id);
  }
  return gSdfResultNull;
}

mat3 cameraRotationMatrix() {
  return gRotateEulerMatrix3D(gDegreesToRadians(cameraRotationDegrees +
    vec3(cameraYAxis.value * cameraYAxisDegrees, cameraXAxis.value * cameraXAxisDegrees, 0)));
}

vec3 cameraRayDirection(vec2 offset) {
  vec2 coord = gPosition + offset * (1.0 / gResolution);
  coord.y *= gResolution.y / gResolution.x;
  vec3 ray = normalize(vec3(coord, -1.0 / tan(gDegreesToRadians(cameraFovDegrees / 2.0))));
  mat3 cameraRotation = cameraRotationMatrix();
  return cameraRotation * ray;
}

vec4 render() {
  vec3 ro = cameraPosition;
  if (cameraMode == CAMERA_MODE_ORBIT) {
    ro = cameraRotationMatrix() * ro;
  }
  
  vec3 rd = cameraRayDirection(vec2(0));
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
    vec4 finalColor = vec4(0.0, 0.0, 0.0, 0.0);
    if (result.id != gSdfNoHitId) {
      vec3 p = ro + rd * result.distance;
      vec3 normal = calcNormal(context, p);
      finalColor = vec4(normal * 0.5 + vec3(0.5), 1.0);

      // test ids
      //vec3 color = result.id == 1 ? vec3(1, 0, 0) : vec3(0, 0, 1);
      //return vec4(color, 1.0);
    }

    if (enableHighlighting && gSdfHighlightId != gSdfHighlightNone) {
      gSdfContext highlightContext = gSdfContextNull;
      highlightContext.renderId = gSdfHighlightId;
      gSdfResult highlightResult = rayMarch(highlightContext, ro, rd);
      int differentIdCount = 0;
      differentIdCount += int(highlightResult.id != rayMarch(highlightContext, ro, cameraRayDirection(vec2(-1, +0))).id);
      differentIdCount += int(highlightResult.id != rayMarch(highlightContext, ro, cameraRayDirection(vec2(+1, +0))).id);
      differentIdCount += int(highlightResult.id != rayMarch(highlightContext, ro, cameraRayDirection(vec2(+0, -1))).id);
      differentIdCount += int(highlightResult.id != rayMarch(highlightContext, ro, cameraRayDirection(vec2(+0, +1))).id);
      float border = float(differentIdCount) / 4.0;

      if (highlightResult.id != gSdfNoHitId) {
        vec3 highlightPoint = ro + rd * highlightResult.distance;
        vec3 highlightNormal = calcNormal(highlightContext, highlightPoint);
        vec4 highlight = vec4(highlightColor.rgb, max(finalColor.a, highlightColor.a)) + vec4(highlightNormal * 0.5, 0);
        if (result.id == gSdfNoHitId) {
          finalColor = highlight;
        } else if (highlightResult.id == gSdfHighlightId) {
          finalColor = mix(finalColor, highlight, 0.35);
        } else if (result.id == highlightResult.id) {
          finalColor = mix(finalColor, highlight, 0.15);
        } else {
          finalColor = mix(finalColor, highlight, 0.15);
        }
      }

      finalColor = mix(finalColor, highlightBorderColor, border);
    }
    return finalColor;
  }
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  values: []
};
