import { LayerShader } from "../core";

export const fractalCircuitLayer: LayerShader = {
  type: "shader",
  name: "fractal circuit",
  id: "fractal circuit",
  visible: true,
  code: `
// This content is under the MIT License.
// Original shader by Kali: https://www.shadertoy.com/view/XlX3Rj#

uniform gradient colors;
uniform float intensity; // default: 1, min: 0.5, max: 2
uniform float speed; // default: 1, min: 0, max: 1
uniform float audioReactivity; // default: 1, min: 0, max: 1
uniform float warping; // default: 0, min: 0, max: 1
uniform float rotation; // default: 0, min: -180, max: 180
uniform float rotationSpeed; // default: 5, min: -10, max: 10
uniform int iterations; // default: 7, min: 4, max: 12
uniform float thickness; // default: 0.5, min: 0.1, max: 2

uniform float fractal; // default: 0.5, min: 0, max: 1
uniform float zoom; // default: 0.85, min: 0.01, max: 1

float shape=0.;
vec3 color=vec3(0.),randcol;

void formula(vec2 z, float c) {
	float minit=0.;
	float o,ot2,ot=ot2=1000.;
	for (int i=0; i<iterations; i++) {
		z=abs(z)/clamp(dot(z,z),.1,.5 + warping * 0.5)-c;
        z = gRotateMatrix2D((rotation + rotationSpeed * gTime) * gPI / 180.0) * z;
		float l=length(z);
		o=min(max(abs(min(z.x,z.y)),-l+.25),abs(l-.25));
		ot=min(ot,o);
		ot2=min(l*.1,ot2);
		minit=max(minit,float(i)*(1.-abs(sign(ot-o))));
	}
	minit+=1.;
	float w=0.04 * thickness * minit*2.;
	float circ=pow(max(0.,w-ot2)/w,6.);
	shape+=max(pow(max(0.,w-ot)/w,.25),circ);
	vec3 col=gSampleGradient(colors,minit*.1).rgb;
	color+=col*(.4+mod(minit / 9. - (gTime * speed) * 0.1 +ot2*2.,1.)*1.6);
	color+=col*circ*(10.-minit)*3.*smoothstep(0.,.5,.15+gAudioReactiveScalar * audioReactivity -.5);
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 pos = fragCoord.xy / gResolution.xy - .5;
    if (gResolution.y < gResolution.x) {
    	pos.x*=gResolution.x/gResolution.y;
    } else {
    	pos.y*=gResolution.y/gResolution.x;
    }
	vec2 uv=pos;
	vec2 luv=uv;
    float invZoom = 2.0 - zoom * 2.0;
	uv*=invZoom;
	vec2 pix=(1.0/6.0)/gResolution*invZoom;
	for (int aa=0; aa<36; aa++) {
		vec2 aauv=floor(vec2(float(aa)/6.,mod(float(aa),6.)));
		formula(uv+aauv*pix,pow(fractal, 4.0) * 40.0);
	}
	shape/=36.; color/=36.;
	vec3 colo=color* intensity;
	fragColor = vec4(colo,shape);
}

vec4 render() {
  vec4 color = vec4(0);
  mainImage(color, gUV * gResolution);
  return color;
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  timeMode: "normal",
  timeScale: 1,
  values: []
};
