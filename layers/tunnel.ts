import { LayerShader } from "../core";

export const tunnelLayer: LayerShader = {
  type: "shader",
  name: "tunnel",
  id: "tunnel",
  visible: true,
  authorName: "iq",
  authorUrl: "https://www.shadertoy.com/view/Ms2SWW",
  code: `
// The MIT License
// Copyright © 2013 Inigo Quilez
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// https://www.youtube.com/c/InigoQuilez
// https://iquilezles.org/
// https://iquilezles.org/articles/tunnel

uniform vec2 position; // type: "position"
uniform float squareness; // default: 0, min: 0, max: 1
uniform float scrollSpeed; // default: 0.2, min: -0.5, max: 0.5
uniform float rotateSpeed; // default: 0.1, min: -0.5, max: 0.5
uniform int rotateRepeat; // default: 2, min: 1, max: 6
uniform float zoom; // default: 0.5, min: 0, max: 1
uniform gradient depthGradient; // default: {0:[1,1,1,1], 1:[0,0,0,1]}
uniform int depthBlendMode; // enum: "blendMode", default: "multiply"

vec2 mirror(vec2 value) {
  vec2 modded = mod(abs(value), vec2(2));
  return modded + vec2(-2) * floor(modded) * modded + vec2(2);
}

vec4 render() {
  vec2 p = gPosition - position;
  p.y *= gResolution.y / gResolution.x;

  float cylindrical = length(p);
  float square = pow(pow(p.x * p.x, 4.0) + pow(p.y * p.y, 4.0), 1.0 / 8.0);

  float r = mix(cylindrical, square, pow(squareness, 4.0));

  // index texture by (animated inverse) radious and angle
  float angle = atan(p.y,p.x);
  vec2 uv = vec2(pow(1.0 - zoom, 2.0) / r + gTime * scrollSpeed, angle / gPI + gTime * rotateSpeed);

  vec4 color =  texture(gPreviousLayer, mirror(uv * float(rotateRepeat)));

  vec4 grad = gSampleGradient(depthGradient, 1.0 - min(r, 1.0));

  return gApplyBlendMode(depthBlendMode, 1.0, grad, color);
}`.trim(),
  blendMode: "normal",
  opacity: 1,
  values: []
};
