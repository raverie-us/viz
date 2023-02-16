import { LayerShader } from "../core";

export const connnectedPointsLayer: LayerShader = {
  type: "shader",
  name: "connected points",
  id: "connected points",
  visible: true,
  authorName: "mrange",
  authorUrl: "https://www.shadertoy.com/view/NldSzr",
  code: `
// License: CC0, author: Mårten Rånge
//  Inspired by: https://www.twitch.tv/thindal
//  Net of stars very obviously inspired by BigWings - The Universe Within:
//   https://www.shadertoy.com/view/lscczl
uniform gradient colors; // default: {0: [0,0,0,1], 0.5: [1,1,1,1]}
uniform float thickness; // default: 0.1, min: 0, max: 1
uniform float zoom; //default: 1, min: 0.1, max: 2
uniform float flySpeed; //default: 1, min: 0, max: 5
uniform float warpingSpeed; //default: 1, min: 0, max: 5
uniform float rotateSpeed; // default: 0, min: -1, max: 1
uniform float maxTilt; //default: 1, min: 0, max: 5
uniform float randomness; //default: 1, min: 0, max: 1

#define PI              3.141592654
#define TAU             (2.0*PI)
#define RESOLUTION      gResolution
#define TIME            gTime
#define TTIME           (TAU*TIME)
#define ROT(a)          mat2(cos(a), sin(a), -sin(a), cos(a))
#define PCOS(x)         (0.5+0.5*cos(x))
#define LINECOL(x,y)    lineCol(aa, z, np, cp, cps[x], cps[y]);


const vec4 hsv2rgb_K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + hsv2rgb_K.xyz) * 6.0 - hsv2rgb_K.www);
  return c.z * mix(hsv2rgb_K.xxx, clamp(p - hsv2rgb_K.xxx, 0.0, 1.0), c.y);
}
// License: WTFPL, author: sam hocevar, found: https://stackoverflow.com/a/17897228/418488
//  Macro version of above to enable compile-time constants
#define HSV2RGB(c)  (c.z * mix(hsv2rgb_K.xxx, clamp(abs(fract(c.xxx + hsv2rgb_K.xyz) * 6.0 - hsv2rgb_K.www) - hsv2rgb_K.xxx, 0.0, 1.0), c.y))

// License: Unknown, author: Unknown, found: don't remember
vec4 alphaBlend(vec4 back, vec4 front) {
  float w = front.w + back.w*(1.0-front.w);
  vec3 xyz = (front.xyz*front.w + back.xyz*back.w*(1.0-front.w))/w;
  return w > 0.0 ? vec4(xyz, w) : vec4(0.0);
}

// License: Unknown, author: Unknown, found: don't remember
vec3 alphaBlend(vec3 back, vec4 front) {
  return mix(back, front.xyz, front.w);
}

// License: Unknown, author: Unknown, found: don't remember
float hash(float co) {
  return fract(sin(co*12.9898) * 13758.5453);
}

// License: Unknown, author: Unknown, found: don't remember
vec2 hash(vec2 p) {
  p = vec2(dot (p, vec2 (127.1, 311.7)), dot (p, vec2 (269.5, 183.3)));
  return -1. + 2.*fract (sin (p)*43758.5453123);
}

// License: MIT OR CC-BY-NC-4.0, author: mercury, found: https://mercury.sexy/hg_sdf/
float mod1(inout float p, float size) {
  float halfsize = size*0.5;
  float c = floor((p + halfsize)/size);
  p = mod(p + halfsize, size) - halfsize;
  return c;
}

// License: MIT, author: Inigo Quilez, found: https://iquilezles.org/articles/distfunctions2d
float segment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p-a, ba = b-a;
  float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0);
  return length(pa - ba*h);
}

// License: Unknown, author: Unknown, found: don't remember
float tanh_approx(float x) {
  //  Found this somewhere on the interwebs
  //  return tanh(x);
  float x2 = x*x;
  return clamp(x*(27.0 + x2)/(27.0+9.0*x2), -1.0, 1.0);
}

vec2 cellPos(vec2 np) {
  vec2 hp = hash(np);
  return randomness * 0.3*vec2(sin(hp*TIME*warpingSpeed + hp));   
}

vec3 lineCol(float aa, float z, vec2 np, vec2 cp, vec2 p0, vec2 p1) {
  float l = length(p0 - p1);
  float d = segment(cp, p0, p1)-thickness*aa/z;

  float cd = min(length(cp-p0), length(cp-p1));

  float v = 2.0*exp(-1.75*l)*exp(-15.*max(d, 0.0));
  float s = 1.0-tanh_approx(v);
  vec3 hsv = vec3(0.715, s, v);

  return hsv2rgb(hsv);
}

float plane(vec2 p, vec2 n, float m) {
  return dot(p, n) + m;
}

// License: MIT, author: Inigo Quilez, found: https://iquilezles.org/articles/distfunctions2d
float polygon4(vec2[4] v, vec2 p) {
  const int N = 4;
  float d = dot(p-v[0],p-v[0]);
  float s = 1.0;
  for( int i=0, j=N-1; i<N; j=i, ++i) {
    vec2 e = v[j] - v[i];
    vec2 w =    p - v[i];
    vec2 b = w - e*clamp( dot(w,e)/dot(e,e), 0.0, 1.0 );
    d = min( d, dot(b,b) );
    bvec3 c = bvec3(p.y>=v[i].y,p.y<v[j].y,e.x*w.y>e.y*w.x);
    if( all(c) || all(not(c)) ) s*=-1.0;  
  }
  return s*sqrt(d);
}

// License: MIT, author: Inigo Quilez, found: https://iquilezles.org/articles/distfunctions2d
float isosceles(vec2 p, vec2 q) {
  p.x = abs(p.x);
  vec2 a = p - q*clamp( dot(p,q)/dot(q,q), 0.0, 1.0 );
  vec2 b = p - q*vec2( clamp( p.x/q.x, 0.0, 1.0 ), 1.0 );
  float s = -sign( q.y );
  vec2 d = min( vec2( dot(a,a), s*(p.x*q.y-p.y*q.x) ),
               vec2( dot(b,b), s*(p.y-q.y)  ));
  return -sqrt(d.x)*sign(d.y);
}

vec4 gridColor(vec2 p) {
  float z = 0.2 * zoom;
  float aa = 2.0/RESOLUTION.y;

  vec3 col = vec3(0.0);
  p /= z;
  vec2 cp = fract(p) - 0.5;
  vec2 np = floor(p);

  vec2 cps[9];
  int idx = 0;

  for (float y = -1.0; y <= 1.0; ++y) {
    for (float x = -1.0; x <= 1.0; ++x) {
      vec2 off = vec2(x, y);
      cps[idx++] = cellPos(np+off) + off;
    }
  }

  col += LINECOL(4, 0);
  col += LINECOL(4, 1);
  col += LINECOL(4, 2);
  col += LINECOL(4, 3);

  col += LINECOL(4, 5);
  col += LINECOL(4, 6);
  col += LINECOL(4, 7);
  col += LINECOL(4, 8);

  col += LINECOL(1, 3);
  col += LINECOL(1, 5);
  col += LINECOL(7, 3);
  col += LINECOL(7, 5);

  float i = col.x+col.y+col.z;

  return vec4(col, tanh_approx(i));
}

// The path function
vec3 offset(float z) {
  float a = z;
  vec2 p = maxTilt*-0.075*(vec2(cos(a), sin(a*sqrt(2.0))) + vec2(cos(a*sqrt(0.75)), sin(a*sqrt(0.5))));
  return vec3(p, z);
}

// The derivate of the path function
//  Used to generate where we are looking
vec3 doffset(float z) {
  float eps = 0.1;
  return 0.5*(offset(z + eps) - offset(z - eps))/eps;
}

// The second derivate of the path function
//  Used to generate tilt
vec3 ddoffset(float z) {
  float eps = 0.1;
  return 0.125*(doffset(z + eps) - doffset(z - eps))/eps;
}

vec4 plane(vec3 ro, vec3 rd, vec3 pp, vec3 off, float aa, float n) {
  float h = hash(n);
  float s = mix(0.05, 0.25, h);

  vec3 hn;
  vec2 p = (pp-off*vec3(1.0, 1.0, 0.0)).xy;
  p *= ROT(TAU*h);

  return gridColor(p);
}

vec3 skyColor(vec3 ro, vec3 rd) {
  return vec3(0.0);
}

vec3 color(vec3 ww, vec3 uu, vec3 vv, vec3 ro, vec2 p) {
  float lp = length(p);
  vec2 np = p + 1.0/RESOLUTION.xy;
  float rdd = (2.0+1.0*tanh_approx(lp));  // Playing around with rdd can give interesting distortions
  vec3 rd = normalize(p.x*uu + p.y*vv + rdd*ww);
  vec3 nrd = normalize(np.x*uu + np.y*vv + rdd*ww);

  const float planeDist = 1.0-0.;
  const int furthest = 4;
  const int fadeFrom = max(furthest-3, 0);

  const float fadeDist = planeDist*float(furthest - fadeFrom);
  float nz = floor(ro.z / planeDist);

  vec3 skyCol = skyColor(ro, rd);


  vec4 acol = vec4(0.0);
  const float cutOff = 0.95;
  bool cutOut = false;

  // Steps from nearest to furthest plane and accumulates the color 
  for (int i = 1; i <= furthest; ++i) {
    float pz = planeDist*nz + planeDist*float(i);

    float pd = (pz - ro.z)/rd.z;

    if (pd > 0.0 && acol.w < cutOff) {
      vec3 pp = ro + rd*pd;
      vec3 npp = ro + nrd*pd;

      float aa = 3.0*length(pp - npp);

      vec3 off = offset(pp.z);

      vec4 pcol = plane(ro, rd, pp, off, aa, nz+float(i));

      float nz = pp.z-ro.z;
      float fadeIn = smoothstep(planeDist*float(furthest), planeDist*float(fadeFrom), nz);
      float fadeOut = smoothstep(0.0, planeDist*0.1, nz);
      pcol.xyz = mix(skyCol, pcol.xyz, fadeIn);
      pcol.w *= fadeOut;
      pcol = clamp(pcol, 0.0, 1.0);

      acol = alphaBlend(pcol, acol);
    } else {
      cutOut = true;
      break;
    }

  }

  vec3 col = alphaBlend(skyCol, acol);
// To debug cutouts due to transparency  
//  col += cutOut ? vec3(1.0, -1.0, 0.0) : vec3(0.0);
  return col;
}

vec3 effect(vec2 p, vec2 q) {
  float tm  = TIME*0.3*flySpeed;
  vec3 ro   = offset(tm);
  vec3 dro  = doffset(tm);
  vec3 ddro = ddoffset(tm);

  vec3 ww = normalize(dro);
  vec3 uu = normalize(cross(normalize(vec3(0.0,1.0,0.0)+ddro), ww));
  vec3 vv = normalize(cross(ww, uu));

  vec3 col = color(ww, uu, vv, ro, p);
  
  return col;
}

vec4 render() {
  vec2 q = gUV;
  vec2 p = -1. + 2. * q;
  p.x *= RESOLUTION.x/RESOLUTION.y;
  float t = gLuminance(effect(ROT(TIME * rotateSpeed) * p, q));
  return gSampleGradient(colors, t);
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
