import { LayerShader } from "../core";

export const liquidLayer: LayerShader = {
  type: "shader",
  name: "liquid",
  id: "liquid",
  visible: true,
  authorName: "mrange",
  authorUrl: "https://www.shadertoy.com/view/wtBcRW",
  code: `
// Licence CC0: Liquid Metal
// Some experimenting with warped FBM and very very fake lighting turned out ok 

uniform float distortion; // default: 0.05, min: 0, max: 0.2
uniform float scale; // default: 1, min: 0.1, max: 2
uniform float lighting; //default: 0.5, min: 0, max: 1
uniform float flowSpeed; //default: 1, min: 0, max: 2
uniform float warpingSpeed; // default: 1, min: 0.0, max: 2

#define PI  3.141592654
#define TAU (2.0*PI)

void rot(inout vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  p = vec2(c*p.x + s*p.y, -s*p.x + c*p.y);
}

float hash(in vec2 co) {
  return fract(sin(dot(co.xy ,vec2(12.9898,58.233))) * 13758.5453);
}

vec2 hash2(vec2 p) {
  p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
  return fract(sin(p)*18.5453);
}

float psin(float a) {
  return 0.5 + 0.5*sin(a);
}

float tanh_approx(float x) {
  float x2 = x*x;
  return clamp(x*(27.0 + x2)/(27.0+9.0*x2), -1.0, 1.0);
}

float onoise(vec2 x) {
  x *= 0.5 * scale;
  float a = sin(x.x);
  float b = sin(x.y);
  float c = mix(a, b, psin(TAU*tanh_approx(a*b+a+b)));
  
  return c;
}

float vnoise(vec2 x) {
  vec2 i = floor(x);
  vec2 w = fract(x);
    
#if 1
  // quintic interpolation
  vec2 u = w*w*w*(w*(w*6.0-15.0)+10.0);
#else
  // cubic interpolation
  vec2 u = w*w*(3.0-2.0*w);
#endif    

  float a = hash(i+vec2(0.0,0.0));
  float b = hash(i+vec2(1.0,0.0));
  float c = hash(i+vec2(0.0,1.0));
  float d = hash(i+vec2(1.0,1.0));
    
  float k0 =   a;
  float k1 =   b - a;
  float k2 =   c - a;
  float k3 =   d - c + a - b;

  float aa = mix(a, b, u.x);
  float bb = mix(c, d, u.x);
  float cc = mix(aa, bb, u.y);
  
  return k0 + k1*u.x + k2*u.y + k3*u.x*u.y;
}

float fbm1(vec2 p) {
  vec2 op = p;
  const float aa = 0.45;
  const float pp = 2.03;
  const vec2 oo = -vec2(1.23, 1.5);
  const float rr = 1.2;
  
  float h = 0.0;
  float d = 0.0;
  float a = 1.0;
  
  for (int i = 0; i < 5; ++i) {
    h += a*onoise(p);
    d += (a);
    a *= aa;
    p += oo;
    p *= pp;
    rot(p, rr);
  }
  
  return mix((h/d), -0.5*(h/d), pow(vnoise(0.9*op), 0.25));
}

float fbm2(vec2 p) {
  vec2 op = p;
  const float aa = 0.45;
  const float pp = 2.03;
  const vec2 oo = -vec2(1.23, 1.5);
  const float rr = 1.2;
  
  float h = 0.0;
  float d = 0.0;
  float a = 1.0;
  
  for (int i = 0; i < 7; ++i) {
    h += a*onoise(p);
    d += (a);
    a *= aa;
    p += oo;
    p *= pp;
    rot(p, rr);
  }
  
  return mix((h/d), -0.5*(h/d), pow(vnoise(0.9*op), 0.25));
}

float fbm3(vec2 p) {
  vec2 op = p;
  const float aa = 0.45;
  const float pp = 2.03;
  const vec2 oo = -vec2(1.23, 1.5);
  const float rr = 1.2;
  
  float h = 0.0;
  float d = 0.0;
  float a = 1.0;
  
  for (int i = 0; i < 3; ++i) {
    h += a*onoise(p);
    d += (a);
    a *= aa;
    p += oo;
    p *= pp;
    rot(p, rr);
  }
  
  return mix((h/d), -0.5*(h/d), pow(vnoise(0.9*op), 0.25));
}


float warp(vec2 p) {
  vec2 v = vec2(fbm1(p), fbm1(p+0.7*vec2(1.0, 1.0)));
  
  rot(v, 1.0+gTime*1.8*warpingSpeed);
  
  vec2 vv = vec2(fbm2(p + 3.7*v), fbm2(p + -2.7*v.yx+0.7*vec2(1.0, 1.0)));

  rot(vv, -1.0+gTime*0.8);
    
  return fbm3(p + 9.0*vv);
}

float height(vec2 p) {
  float a = 0.045*gTime*flowSpeed;
  p += 9.0*vec2(cos(a), sin(a));
  p *= 2.0;
  p += 13.0;
  float h = warp(p);
  float rs = 3.0;
  return 0.35*tanh_approx(rs*h)/rs;
}

vec3 normal(vec2 p) {
  // As suggested by IQ, thanks!
  vec2 eps = -vec2(2.0/gResolution.y, 0.0);
  
  vec3 n;
  
  n.x = height(p + eps.xy) - height(p - eps.xy);
  n.y = 2.0*eps.x;
  n.z = height(p + eps.yx) - height(p - eps.yx);
  
  return normalize(n);
}

vec4 render() {
  vec2 q = gUV;
  vec2 p = -1. + 2. * q;
  p.x*=gResolution.x/gResolution.y;
 //lights positions
  const vec3 lp1 = vec3(2.1, -0.5, -0.1);
  const vec3 lp2 = vec3(-2.1, -0.5, -0.1);

  float h = height(p);
  vec3 pp = vec3(p.x, h, p.y);
  float ll1 = length(lp1.xz - pp.xz);
  vec3 ld1 = normalize(lp1 - pp);
  vec3 ld2 = normalize(lp2 - pp);
 
  vec3 n = normal(p);
  float diff1 = max(dot(ld1, n), 0.0);
  float diff2 = max(dot(ld2, n), 0.0);
  //lights colors
  vec4 sampleCol = texture(gPreviousLayer, q + n.xz * distortion);
  vec4 baseCol1 = sampleCol;
  vec4 baseCol2 = texture(gPreviousLayer, q - n.zx * distortion);
  baseCol1.rgb *= 1.2;
  baseCol2.rgb *= 1.0/1.2;

  float oh = height(p + ll1*0.05*normalize(ld1.xz));
  const float level0 = 0.0;
  const float level1 = 0.125;
  // VERY VERY fake shadows + hilight
  vec3 scol1 = baseCol1.rgb*(smoothstep(level0, level1, h) - smoothstep(level0, level1, oh));
  vec3 scol2 = baseCol2.rgb*(smoothstep(level0, level1, h) - smoothstep(level0, level1, oh));
  // specular and diffuse strenght
  vec3 col = vec3(0.0);
  col += 0.55*baseCol1.rgb*pow(diff1, 0.5);
  col += 0.55*baseCol1.rgb*pow(diff1, 0.5);
  col += 0.55*baseCol2.rgb*pow(diff2, 0.5);
  col += 0.55*baseCol2.rgb*pow(diff2, 0.5);
  col += scol1*0.5;
  col += scol2*0.5;

  col = mix(sampleCol.rgb, col, lighting);
  
  return vec4(col, (baseCol1.a + baseCol2.a) / 2.0);
}`,
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
