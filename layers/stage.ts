import { LayerShader } from "../core";

export const stageLayer: LayerShader = {
  type: "shader",
  name: "stage",
  id: "stage",
  visible: true,
  code: `
uniform gradient colorsBlue; // default: {stops:[{"t":0,"color":[1,1,1,1]},{"t":1,"color":[1,1,1,1]},{"t":0.3,"color":[0.1,0,0.725,1]},{"t":0.82,"color":[0,0.94,1,1]},{"t":0.2,"color":[1,0,0,1]},{"t":0.12,"color":[1,0.84,0,1]}]}
uniform gradient colorsYellow; // default: {stops:[{"t":0,"color":[0.96,0,0.5,1]},{"t":0.97,"color":[0.7,0.54,0,1]},{"t":0.5,"color":[0.89,0.73,0.14,1]},{"t":0.21,"color":[0.46,0.12,0.56,1]},{"t":0.75,"color":[1,0.1,0.9,1]},{"t":1,"color":[0.96,0,0.5,1]}]}
uniform gradient colorsGreen; // default: {stops:[{"t":0.09,"color":[1,0.98,0.38,1]},{"t":0.2,"color":[1,1,1,1]},{"t":0.45,"color":[0.6,0.19,0.87,1]},{"t":0.8,"color":[0.33,1,0.72,1]},{"t":1,"color":[1,0.98,0.38,1]},{"t":0.3,"color":[0.97,0.58,1,1]},{"t":0.59,"color":[0.44,0.1,0.81,1]},{"t":0.71,"color":[0.22,1,0.47,1]}]}
uniform gradient colorsRed; // default: {stops:[{"t":0,"color":[1,0.8,0,1]},{"t":0.66,"color":[0.35,0.22,0.67,1]},{"t":0.3,"color":[1,0,0.17,1]},{"t":0.14,"color":[0.98,0.39,0.18,1]},{"t":0.44,"color":[0.5,0.08,0.49,1]},{"t":0.53,"color":[0.31,0,0.39,1]},{"t":0.91,"color":[1,0.68,0,1]},{"t":0.8,"color":[0.93,0.07,0.43,1]},{"t":1,"color":[1,1,0.63,1]}]}
uniform button buttonBlue; // default: {"gamepad": 2}
uniform button buttonYellow; // default: {"gamepad": 3}
uniform button buttonGreen; // default: {"gamepad": 0}
uniform button buttonRed; // default: {"gamepad": 1}

uniform button buttonRotateLeft; // default: {"gamepad": 6}
uniform button buttonRotateRight; // default: {"gamepad": 7}
uniform float rotationDegrees; // default: 10, min: 0, max: 90

uniform float colorCycleRate; // default: 0.2, min: 0, max: 1

uniform button strobe8th; // default: {"gamepad": 11}
uniform button strobe16th; // default: {"gamepad": 10}
uniform button blackout; // default: {"gamepad": 9}
uniform button invert; // default: {"gamepad": 8}

uniform button moveLeft; // default: {"gamepad": 14}
uniform button moveRight; // default: {"gamepad": 15}
uniform button moveUp; // default: {"gamepad": 12}
uniform button moveDown; // default: {"gamepad": 13}
uniform axis moveX; // default: {"gamepad": 0}
uniform axis moveY; // default: {"gamepad": 1}
uniform float moveButtonOffset; // default: 0.1, min: 0, max: 0.5
uniform float moveAxisOffset; // default: 0.1, min: 0, max: 0.5

uniform button scanlineLeft; // default: {"gamepad": 4}
uniform button scanlineRight; // default: {"gamepad": 5}
uniform float scanlineAmount; // default: 0.15, min: 0, max: 0.5
uniform float scanlineSize; // default: 0.03, min: 0, max: 0.2
uniform float scanlineNoise; // default: 0.5, min: 0, max: 1

uniform axis stretchX; // default: {"gamepad": 2}
uniform axis stretchY; // default: {"gamepad": 3}
uniform float stretchAmount; // default: 0.15, min: 0, max: 0.5

uniform button zoomButton; // default: {"gamepad": 16}
uniform float zoomAmount; // default: 0.2, min: 0, max: 1

vec4 render() {
  vec2 buttonMovement = vec2(0);
  buttonMovement.x -= moveLeft.value;
  buttonMovement.x += moveRight.value;
  buttonMovement.y -= moveDown.value;
  buttonMovement.y += moveUp.value;

  vec2 axisMovement = vec2(moveX.value, -moveY.value);

  vec2 movement = buttonMovement * moveButtonOffset + axisMovement * moveAxisOffset;
  
  float rotationRadians = gDegreesToRadians((buttonRotateLeft.value - buttonRotateRight.value) * 0.5 * rotationDegrees);
  vec2 uv = gPosition;

  float halfScanlineSize = 0.5 * scanlineSize;
  float scanlineNoise = gNoise2D(uv + vec2(gTime)) * scanlineNoise * halfScanlineSize;
  uv.x += mod(uv.y + scanlineNoise, scanlineSize) < halfScanlineSize ? scanlineLeft.value * scanlineAmount : 0.0;
  uv.x += mod(uv.y + scanlineNoise + halfScanlineSize * 0.5, scanlineSize) < halfScanlineSize ? scanlineRight.value * -scanlineAmount : 0.0;
  
  float aspect = gResolution.y / gResolution.x;
  uv.y *= aspect;
  uv *= gRotateMatrix2D(rotationRadians);
  uv -= movement;

  uv /= vec2(1) + vec2(abs(stretchX.value), abs(stretchY.value)) * stretchAmount;
  uv /= 1.0 + zoomButton.value * zoomAmount;
  
  uv.y /= aspect;
  uv = uv * 0.5 + vec2(0.5);
  
  vec4 color = texture(gPreviousLayer, uv);
  vec4 invertedColor = vec4(vec3(1) - color.rgb, color.a);
  float t = gLuminance(color.rgb) + gTime * colorCycleRate;
  t += gUV.y * 0.1;
  vec4 sampled = color;
  if (invert.buttonHeld) {
    t = 1.0 - mod(t, 1.0);
    sampled = invertedColor;
  }
  if (buttonBlue.buttonHeld) {
    sampled = gSampleGradient(colorsBlue, t);
  }
  if (buttonYellow.buttonHeld) {
    sampled = gSampleGradient(colorsYellow, t);
  }
  if (buttonGreen.buttonHeld) {
    sampled = gSampleGradient(colorsGreen, t);
  }
  if (buttonRed.buttonHeld) {
    sampled = gSampleGradient(colorsRed, t);
  }

  sampled.a *= color.a;

  if (strobe16th.buttonHeld) {
    sampled.rgb = mod(gTime, (1.0 / 16.0)) < 1.0 / 32.0 ? sampled.rgb : vec3(1);
  } else if (strobe8th.buttonHeld) {
    sampled.rgb = mod(gTime, (1.0 / 8.0)) < 1.0 / 16.0 ? sampled.rgb : vec3(1);
  }

  if (blackout.buttonHeld) {
    sampled.rgb = vec3(0);
  }
  
  return sampled;
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  values: []
};
