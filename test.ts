import { RaverieVisualizer, Group } from "./core.js";

// Note: This must be a 'function' https://github.com/microsoft/TypeScript/issues/34523
function assert(value: unknown, message: string): asserts value {
  if (!value) {
    throw new Error(message);
  }
}

export const runTests = (visualizer: RaverieVisualizer) => {
  const compiledGroup = visualizer.compile({
    type: "group",
    layers: [
      {
        type: "shader",
        blendMode: "effect",
        opacity: 1.0,
        timeMode: "normal",
        timeScale: 1.0,
        code: `
          uniform float blue;
          void main() {
            gFragColor = vec4(gUV, blue, 1.0);
          }`,
        values: [{
          name: "notblue",
          type: "float",
          value: 123
        }]
      }
    ]
  });

  assert(compiledGroup.type === "group", 'compiledGroup.type === "group"');
  assert(compiledGroup.layers.length === 1, 'compiledGroup.layers.length === 1');
  const firstLayer = compiledGroup.layers[0];
  assert(firstLayer.type === "shader", 'firstLayer.type === "shader"');
  assert(firstLayer.type === "shader", 'firstLayer.type === "shader"');
  assert(firstLayer.uniforms.length === 1, 'firstLayer.uniforms.length === 1');
  const firstUniform = firstLayer.uniforms[0];
  assert(firstUniform.type === "float", 'firstUniform.type === "float"');
  assert(firstUniform.shaderValue.value === 123, 'firstUniform.shaderValue.value === 123');
};
