import { LayerShader } from "../core";

export const infiniteCaveLayer: LayerShader = {
  type: "shader",
  name: "infinite cave",
  id: "infinite cave",
  visible: true,
  code: `
uniform float speed; // default: 5, min: 0, max: 10
uniform float backgroundStrength; // default: 1, min: 1, max: 1.5
uniform float bumpiness; // default: 0.5, min: 0, max: 1
uniform float thickness; // default: 0.5, min: 0, max: 1
uniform float warping; // default: 0.5, min: 0, max: 1
uniform float stepScale; // default: 1, min: 0.1, max: 1
uniform float cameraRocking; // default: 0.5, min: 0, max: 1
uniform float audioReactivity; // default: 0.5, min: 0, max: 1
uniform vec4 caveColor; // type: "color", default: [1,1,1,1]
uniform float lighting; // default: 1, min: 0, max: 1

float smoothedAudioReactive = 0.0;

float n3D(in vec3 p) {
  const vec3 s = vec3(7, 157, 113);
  vec3 ip = floor(p);
  p -= ip;
  vec4 h = vec4(0., s.yz, s.y + s.z) + dot(ip, s);
  p = p * p * (3. - 2. * p);
  h = mix(fract(sin(h) * 43758.5453), fract(sin(h + s.x) * 43758.5453), p.x);
  h.xy = mix(h.xz, h.yw, p.y);
  return mix(h.x, h.y, p.z);
}

float cave(vec3 p) {
  p.z = mod(p.z, 80.) - 40.;
  float n = n3D(p * 3.) * 0.1 * bumpiness;
  float cut = dot(cos(p * 3.14159265 / 8.), sin(p.yzx * 3.14159265 / 8.)) + 2.2 - mix(0.7, 1.0, thickness);
  cut += sin(p.z * (0.5 + smoothedAudioReactive * 0.05) + smoothedAudioReactive * 0.5 + gTime + dot(abs(gPosition), vec2(1))) * warping * 0.5;
  return cut - n;
}

vec4 map(vec3 p) {
  vec3 cavp = p;
  float an = sin(gTime) * cameraRocking;
  float c = cos(an);
  float s = sin(an);
  cavp.xy *= mat2(c, s, -s, c);
  cavp.z += mod(gTime * speed, 80.);

  float cav = cave(cavp);

  return vec4(cav, 0.0, cavp.xy);
}

vec4 ray(vec3 ro, vec3 rd) {
  float t = 0.0;
  vec4 rt;
  for (int i = 0; i < 120; i++) {
    vec3 p = ro + rd * t;
    rt = map(p);
    float h = rt.x;
    if (h < 0.0001)
      break;
    t += h * stepScale;
    if (t > 50.)
      break;
  }
  if (t > 50.)
    t = -1.;
  return vec4(t, rt.y, rt.zw);
}

vec3 calculate_normal(vec3 pos) {
  const float eps = 0.001;
  vec4 n = vec4(0.0);
  for (int i = min(gFrame, 0); i < 4; i++) {
    vec4 s = vec4(pos, 0.0);
    s[i] += eps;
    n[i] = map(s.xyz).x;
  }
  return normalize(n.xyz - n.w);
}

vec4 render(vec3 ro, vec3 rd) {
  vec4 t = ray(ro, rd);

  vec4 sk = texture(gPreviousLayer, gUV) * backgroundStrength;

  vec3 skyPosition = vec3(-0.6, 0.7, -1.);

  // if ray is inside the scene objects
  if (t.x > 0.) {
    vec3 p = ro + rd * t.x;
    vec3 n = calculate_normal(p);

    vec3 lightDir = skyPosition;
    float att = 1.;
    float diff = max(dot(n, lightDir), 0.0);

    vec4 col = caveColor * (diff * att + 0.3);

    float fresnel = dot(rd, n) * lighting;

    col += max(fresnel + 0.5, 0.);
    float mixfac = 1. - pow(t.x / 50., 4.0);
    col *= 0.5;
    // fog scene to background sky color//////////////////////
    col = mix(sk, col, mixfac);
    col.a = 1.0;
    return col;
  } else {
    return sk;
  }
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  smoothedAudioReactive = (-cos(gAudioReactiveScalar * gPI) * 0.5 + 0.5) * audioReactivity;

  float an_x = 0.0;
  float an_y = 0.0;
  an_x = 3.1415;
  an_x += sin(gTime * 1.) * 0.3 * cameraRocking;

  vec3 ta = vec3(0.0, 2, 0.0);

  float off = 15.2; // offset,i.e how far is camera from target position
  off -= smoothedAudioReactive * 3.0;
  // camera zoom is controlled by audio frequency if lower frequency of audio is
  // higher(like bass boosted)

  // Final ray origin
  vec3 ro = ta + vec3(sin(an_x) * off, 1., cos(an_x) * off);

  // All right,up,z vectors for camera
  vec3 ww = normalize(ta - ro);

  vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));

  vec3 vv = normalize(cross(uu, ww));

  vec2 uv = (2. * (fragCoord.xy) - gResolution.xy) / gResolution.y;
  // final ray direction
  vec3 rd = normalize(uv.x * uu + uv.y * vv + 2. * ww);

  vec4 col = render(ro, rd);
  // final output of color
  fragColor = vec4(col);
}

vec4 render() {
  vec4 color = vec4(1, 0, 0, 1);
  mainImage(color, gUV * gResolution);
  return color;
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
