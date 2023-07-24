import { LayerSDF } from "../core";

export const sphereSdf: LayerSDF = {
  type: "sdf",
  name: "sphere",
  id: "sphere",
  visible: true,
  values: [],
  layers: [],
  code: `
uniform float radius; // default: 0.5, min: 0, max: 5
gSdfResult map(inout gSdfContext context) {
  return gSdfResult(length(context.point) - radius, context.id);
}`.trim(),
};

export const boxSdf: LayerSDF = {
  type: "sdf",
  name: "box",
  id: "box",
  visible: true,
  values: [],
  layers: [],
  code: `
uniform vec3 bounds; // default: [1,1,1], min: [0,0,0], max: [5,5,5]
gSdfResult map(inout gSdfContext context) {
  vec3 q = abs(context.point) - bounds / 2.0;
  return gSdfResult(length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0), context.id);
}`.trim(),
};

export const cylinderSdf: LayerSDF = {
  type: "sdf",
  name: "cylinder",
  id: "cylinder",
  visible: true,
  values: [],
  layers: [],
  code: `
uniform float height; // default: 1, min: 0, max: 5
uniform float radius; // default: 0.5, min: 0, max: 5
uniform float roundingRadius; // default: 0, min: 0, max: 1
gSdfResult map(inout gSdfContext context) {
  float rr = min(min(roundingRadius, height / 2.0), radius);
  vec2 d = vec2(length(context.point.xz) - radius + rr, abs(context.point.y) - height / 2.0 + rr);
  return gSdfResult(min(max(d.x, d.y),0.0) + length(max(d, 0.0)) - rr, context.id);
}`.trim(),
};

export const infiniteCylinderSdf: LayerSDF = {
  type: "sdf",
  name: "infinite cylinder",
  id: "infinite cylinder",
  visible: true,
  values: [],
  layers: [],
  code: `
uniform float radius; // default: 0.5, min: 0, max: 5
gSdfResult map(inout gSdfContext context) {
  return gSdfResult(length(context.point.xz) - radius, context.id);
}`.trim(),
};

export const coneSdf: LayerSDF = {
  type: "sdf",
  name: "cone",
  id: "cone",
  visible: true,
  values: [],
  layers: [],
  code: `
uniform float angleDegrees; // default: 53.14, min: 0, max: 90
uniform float height; // default: 1, min: 0, max: 5
gSdfResult map(inout gSdfContext context) {
  float radians = gDegreesToRadians(angleDegrees / 2.0);
  vec2 c = vec2(sin(radians), cos(radians));

  // c is the sin/cos of the angle, h is height
  // Alternatively pass q instead of (c,h),
  // which is the point at the base in 2D
  vec2 q = height * vec2(c.x/c.y,-1.0);
  vec3 p = context.point - vec3(0,height/2.0,0);
  vec2 w = vec2( length(p.xz), p.y );
  vec2 a = w - q*clamp( dot(w,q)/dot(q,q), 0.0, 1.0 );
  vec2 b = w - q*vec2( clamp( w.x/q.x, 0.0, 1.0 ), 1.0 );
  float k = sign( q.y );
  float d = min(dot( a, a ),dot(b, b));
  float s = max( k*(w.x*q.y-w.y*q.x),k*(w.y-q.y)  );

  return gSdfResult(sqrt(d)*sign(s), context.id);
}`.trim(),
};

export const torusSdf: LayerSDF = {
  type: "sdf",
  name: "torus",
  id: "torus",
  visible: true,
  values: [],
  layers: [],
  code: `
uniform float circleRadius; // default: 0.4, min: 0, max: 1
uniform float thicknessRadius; // default: 0.1, min: 0, max: 1
gSdfResult map(inout gSdfContext context) {
  vec2 q = vec2(length(context.point.xz) - circleRadius, context.point.y);
  return gSdfResult(length(q) - thicknessRadius, context.id);
}`.trim(),
};

export const caveSdf: LayerSDF = {
  type: "sdf",
  name: "cave",
  id: "cave",
  visible: true,
  values: [],
  layers: [],
  code: `
uniform float thickness; // default: 0.5, min: 0, max: 1

gSdfResult map(inout gSdfContext context) {
  vec3 p = context.point;
  p.z = mod(p.z, 40.0) - 20.0;
  p.y += 2.0;
  float cut = dot(cos(p * 3.14159265 / 4.0), sin(p.yzx * 3.14159265 / 4.0)) + 2.2 - mix(0.8, 1.0, thickness);
  return gSdfResult(cut, context.id);
}`.trim(),
};

export const unionSdf: LayerSDF = {
  type: "sdf",
  name: "union",
  id: "union",
  visible: true,
  values: [],
  layers: [],
  code: `
uniform float smoothing; // min: 0, max: 1
gSdfResult map(inout gSdfContext context, gSdfVariadic variadic) {
  gSdfResult r1 = gSdfMap(context, variadic.sdfs[0]);
  for (int i = 1; i < variadic.count; ++i) {
    gSdfResult r2 = gSdfMap(context, variadic.sdfs[i]);
    float h = clamp(0.5 + 0.5 * (r1.distance - r2.distance) / smoothing, 0.0, 1.0);
    float distance = mix(r1.distance, r2.distance, h) - smoothing * h * (1.0 - h);
    r1 = gSdfResult(distance, h >= 0.5 ? r2.id : r1.id);
  }
  return r1;
}`.trim(),
};

export const subtractionSdf: LayerSDF = {
  type: "sdf",
  name: "subtraction",
  id: "subtraction",
  visible: true,
  values: [],
  layers: [],
  code: `
uniform float smoothing; // min: 0, max: 1
gSdfResult map(inout gSdfContext context, gSdfVariadic variadic) {
  gSdfResult r1 = gSdfMap(context, variadic.sdfs[0]);
  for (int i = 1; i < variadic.count; ++i) {
    gSdfResult r2 = gSdfMap(context, variadic.sdfs[i]);
    float h = clamp(0.5 - 0.5 * (r1.distance + r2.distance) / smoothing, 0.0, 1.0);
    float distance = mix(r1.distance, -r2.distance, h) + smoothing * h * (1.0 - h);
    r1 = gSdfResult(distance, h >= 0.5 ? r2.id : r1.id);
  }
  return r1;
}`.trim(),
};

export const intersectionSdf: LayerSDF = {
  type: "sdf",
  name: "intersection",
  id: "intersection",
  visible: true,
  values: [],
  layers: [],
  code: `
uniform float smoothing; // min: 0, max: 1
gSdfResult map(inout gSdfContext context, gSdfVariadic variadic) {
  gSdfResult r1 = gSdfMap(context, variadic.sdfs[0]);
  for (int i = 1; i < variadic.count; ++i) {
    gSdfResult r2 = gSdfMap(context, variadic.sdfs[i]);
    float h = clamp(0.5 - 0.5 * (r1.distance - r2.distance) / smoothing, 0.0, 1.0);
    float distance = mix(r1.distance, r2.distance, h) + smoothing * h * (1.0 - h);
    r1 = gSdfResult(distance, h >= 0.5 ? r2.id : r1.id);
  }
  return r1;
}`.trim(),
};

export const invertSdf: LayerSDF = {
  type: "sdf",
  name: "invert",
  id: "invert",
  visible: true,
  values: [],
  layers: [],
  code: `
gSdfResult map(inout gSdfContext context, gSdf arg) {
  gSdfResult result = gSdfMap(context, arg);
  result.distance = -result.distance;
  return result;
}`.trim(),
};

export const bumpSdf: LayerSDF = {
  type: "sdf",
  name: "bump",
  id: "bump",
  visible: true,
  values: [],
  layers: [],
  code: `
uniform float amount; // default: 0.1, min: 0, max: 0.2
uniform float scale; // default: 5, min: 0.1, max: 10
uniform vec3 direction; // default: [0,1,0]
uniform float warpingAmount; // default: 1, min: 0, max: 2
uniform float warpingSpeed; // default: 2, min: 0, max: 5

// CC0 license https://creativecommons.org/share-your-work/public-domain/cc0/

/////////////// K.jpg's Simplex-like Re-oriented 4-Point BCC Noise ///////////////
//////////////////// Output: vec4(dF/dx, dF/dy, dF/dz, value) ////////////////////

// Inspired by Stefan Gustavson's noise
vec4 permute(vec4 t) {
    return t * (t * 34.0 + 133.0);
}

// Gradient set is a normalized expanded rhombic dodecahedron
vec3 grad(float hash) {
    // Random vertex of a cube, +/- 1 each
    vec3 cube = mod(floor(hash / vec3(1.0, 2.0, 4.0)), 2.0) * 2.0 - 1.0;
    
    // Random edge of the three edges connected to that vertex
    // Also a cuboctahedral vertex
    // And corresponds to the face of its dual, the rhombic dodecahedron
    vec3 cuboct = cube;
    cuboct[int(hash / 16.0)] = cos(gTime * warpingSpeed + hash) * warpingAmount * 0.5;
    
    // In a funky way, pick one of the four points on the rhombic face
    float type = mod(floor(hash / 8.0), 2.0);
    vec3 rhomb = (1.0 - type) * cube + type * (cuboct + cross(cube, cuboct));
    
    // Expand it so that the new edges are the same length
    // as the existing ones
    vec3 grad = cuboct * 1.22474487139 + rhomb + sin(gTime * warpingSpeed + hash) * warpingAmount;
    
    // To make all gradients the same length, we only need to shorten the
    // second type of vector. We also put in the whole noise scale constant.
    // The compiler should reduce it into the existing floats. I think.
    grad *= (1.0 - 0.042942436724648037 * type) * 32.80201376986577;
    
    return grad;
}

// BCC lattice split up into 2 cube lattices
vec4 bccNoiseBase(vec3 X) {
    
    // First half-lattice, closest edge
    vec3 v1 = round(X);
    vec3 d1 = X - v1;
    vec3 score1 = abs(d1);
    vec3 dir1 = step(max(score1.yzx, score1.zxy), score1);
    vec3 v2 = v1 + dir1 * sign(d1);
    vec3 d2 = X - v2;
    
    // Second half-lattice, closest edge
    vec3 X2 = X + 144.5;
    vec3 v3 = round(X2);
    vec3 d3 = X2 - v3;
    vec3 score2 = abs(d3);
    vec3 dir2 = step(max(score2.yzx, score2.zxy), score2);
    vec3 v4 = v3 + dir2 * sign(d3);
    vec3 d4 = X2 - v4;
    
    // Gradient hashes for the four points, two from each half-lattice
    vec4 hashes = permute(mod(vec4(v1.x, v2.x, v3.x, v4.x), 289.0));
    hashes = permute(mod(hashes + vec4(v1.y, v2.y, v3.y, v4.y), 289.0));
    hashes = mod(permute(mod(hashes + vec4(v1.z, v2.z, v3.z, v4.z), 289.0)), 48.0);
    
    // Gradient extrapolations & kernel function
    vec4 a = max(0.5 - vec4(dot(d1, d1), dot(d2, d2), dot(d3, d3), dot(d4, d4)), 0.0);
    vec4 aa = a * a; vec4 aaaa = aa * aa;
    vec3 g1 = grad(hashes.x); vec3 g2 = grad(hashes.y);
    vec3 g3 = grad(hashes.z); vec3 g4 = grad(hashes.w);
    vec4 extrapolations = vec4(dot(d1, g1), dot(d2, g2), dot(d3, g3), dot(d4, g4));
    
    // Derivatives of the noise
    vec3 derivative = -8.0 * mat4x3(d1, d2, d3, d4) * (aa * a * extrapolations)
        + mat4x3(g1, g2, g3, g4) * aaaa;
    
    // Return it all as a vec4
    return vec4(derivative, dot(aaaa, extrapolations));
}

// Use this if you don't want Z to look different from X and Y
vec4 bccNoiseClassic(vec3 X) {
    
    // Rotate around the main diagonal. Not a skew transform.
    vec4 result = bccNoiseBase(dot(X, vec3(2.0/3.0)) - X);
    return vec4(dot(result.xyz, vec3(2.0/3.0)) - result.xyz, result.w);
}

//////////////////////////////// End noise code ////////////////////////////////


gSdfResult map(inout gSdfContext context, gSdf arg) {
  gSdfResult result = gSdfMap(context, arg);
  vec3 p = context.point * scale;
  float value = bccNoiseClassic(p - direction * gTime).w;
  result.distance -= value * amount / scale;
  return result;
}`.trim(),
};

export const inflateSdf: LayerSDF = {
  type: "sdf",
  name: "inflate",
  id: "inflate",
  visible: true,
  values: [],
  layers: [],
  code: `
uniform float radius; // default: 0.1, min: -1, max: 1
gSdfResult map(inout gSdfContext context, gSdf arg) {
  gSdfResult result = gSdfMap(context, arg);
  result.distance -= radius;
  return result;
}`.trim(),
};

export const twistSdf: LayerSDF = {
  type: "sdf",
  name: "twist",
  id: "twist",
  visible: true,
  values: [],
  layers: [],
  code: `
uniform float twistDegrees; // default: 1, min: -10, max: 10
gSdfResult map(inout gSdfContext context, gSdf arg) {
  float radians = gDegreesToRadians(twistDegrees);
  float c = cos(radians * context.point.z);
  float s = sin(radians * context.point.z);
  mat2  m = mat2(c, -s, s, c);
  context.point = vec3(m * context.point.xy, context.point.z);
  return gSdfMap(context, arg);
}`.trim(),
};

export const repeatSdf: LayerSDF = {
  type: "sdf",
  name: "repeat",
  id: "repeat",
  visible: true,
  values: [],
  layers: [],
  code: `
uniform vec3 repeat; // default: [2,2,2], min: [0.1,0.1,0.1], max: [5,5,5]
uniform ivec3 limits; // default: [10,10,10], min: [1,1,1], max: [100, 100, 100]
gSdfResult map(inout gSdfContext context, gSdf arg) {
  vec3 limit = vec3(limits);
  vec3 offset = repeat * clamp(round(context.point / repeat), -limit, limit);
  context.point -= offset;
  return gSdfMap(context, arg);
}`.trim(),
};

export const transformSdf: LayerSDF = {
  type: "sdf",
  name: "transform",
  id: "transform",
  visible: true,
  values: [],
  layers: [],
  code: `
uniform vec3 translation; // min: [-10,-10,-10], max: [10,10,10]
uniform vec3 rotationDegrees; // min: [-180,-180,-180], max: [180,180,180]
uniform float scale; // default: 1, min: 0, max: 2
uniform vec3 translationSpeed; // min: [-1,-1,-1], max: [1,1,1]
uniform vec3 translationSine; // min: [-1,-1,-1], max: [1,1,1]
uniform vec3 translationSineSpeed; // default: [5,5,5], min: [0,0,0], max: [10,10,10]
uniform vec3 rotationSpeedDegrees; // min: [-180,-180,-180], max: [180,180,180]
uniform vec3 rotationSineDegrees; // min: [-180,-180,-180], max: [180,180,180]
uniform vec3 rotationSineSpeed; // default: [5,5,5], min: [0,0,0], max: [10,10,10]

gSdfResult map(inout gSdfContext context, gSdf arg) {
  if (scale == 0.0) {
    return gSdfResultNull;
  }
  context.point -= translation + translationSpeed * gTime + sin(translationSineSpeed * gTime) * translationSine;

  vec3 rot = rotationDegrees + rotationSpeedDegrees * gTime + sin(rotationSineSpeed * gTime) * rotationSineDegrees;
  context.point *= gRotateEulerMatrix3D(gDegreesToRadians(rot));

  context.point /= scale;
  gSdfResult result = gSdfMap(context, arg);
  result.distance *= scale;
  return result;
}`.trim(),
};

export const fastUnionSdf: LayerSDF = {
  type: "sdf",
  name: "fast union",
  id: "fast union",
  visible: true,
  values: [],
  layers: [],
  code: `
gSdfResult map(inout gSdfContext context, gSdfVariadic variadic) {
  gSdfResult result = gSdfMap(context, variadic.sdfs[0]);
  for (int i = 1; i < variadic.count; ++i) {
    gSdfResult next = gSdfMap(context, variadic.sdfs[i]);
    if (next.distance < result.distance) {
      result = next;
    }
  }
  return result;
}`.trim(),
};

export const fastSubtractionSdf: LayerSDF = {
  type: "sdf",
  name: "fast subtraction",
  id: "fast subtraction",
  visible: true,
  values: [],
  layers: [],
  code: `
gSdfResult map(inout gSdfContext context, gSdf d1, gSdf d2) {
  gSdfResult r1 = gSdfMap(context, d1);
  gSdfResult r2 = gSdfMap(context, d2);
  float distance = max(r1.distance, -r2.distance);
  return gSdfResult(distance, r1.distance > -r2.distance ? r1.id : r2.id);
}`.trim(),
};

export const fastIntersectionSdf: LayerSDF = {
  type: "sdf",
  name: "fast intersection",
  id: "fast intersection",
  visible: true,
  values: [],
  layers: [],
  code: `
gSdfResult map(inout gSdfContext context, gSdfVariadic variadic) {
  gSdfResult result = gSdfMap(context, variadic.sdfs[0]);
  for (int i = 1; i < variadic.count; ++i) {
    gSdfResult next = gSdfMap(context, variadic.sdfs[i]);
    if (next.distance > result.distance) {
      result = next;
    }
  }
  return result;
}`.trim(),
};
