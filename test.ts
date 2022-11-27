import { RaverieVisualizer, CompiledLayerGroup, CompiledLayerShader, ShaderValue, CompiledUniform } from "./core.js";

// Note: This must be a 'function' https://github.com/microsoft/TypeScript/issues/34523
function assert(value: unknown): asserts value {
  if (!value) {
    throw new Error("Assert failed");
  }
}

const singleLayerTest = (compiledLayerGroup: CompiledLayerGroup): CompiledLayerShader => {
  assert(compiledLayerGroup.type === "group");
  assert(compiledLayerGroup.layers.length === 1);
  assert(compiledLayerGroup.layer.type === "group");
  assert(compiledLayerGroup.layer.layers.length === 1);
  const firstLayer = compiledLayerGroup.layers[0];
  assert(firstLayer.type === "shader");
  assert(firstLayer.layer.type === "shader");
  return firstLayer;
}

const compileTestLayerGroup = (visualizer: RaverieVisualizer, code: string, values: ShaderValue[]) => {
  return visualizer.compile({
    type: "group",
    name: "root",
    visible: true,
    layers: [
      {
        type: "shader",
        name: "layer",
        visible: true,
        blendMode: "effect",
        opacity: 1.0,
        timeMode: "normal",
        timeScale: 1.0,
        code,
        values
      }
    ]
  });
};

const validateUniform = (uniform: CompiledUniform, type: string, name: string, value: any, defaultValue: any) => {
  assert(uniform.type === type);
  assert(uniform.name === name);
  assert(uniform.defaultValue === defaultValue);
  assert(uniform.shaderValue.type === type);
  assert(uniform.shaderValue.name === name);
  assert(uniform.shaderValue.value === value);
};

const runUniformRenameTest = (visualizer: RaverieVisualizer) => {
  const compiledLayerGroup = compileTestLayerGroup(visualizer, `
    uniform float a; // default: 987
    void main() {
      gFragColor = vec4(a, 0.0, 0.0, 1.0);
    }`,
    [{
      name: "b",
      type: "float",
      value: 123
    }]
  );

  const firstLayer = singleLayerTest(compiledLayerGroup);
  assert(firstLayer.uniforms.length === 1);
  assert(firstLayer.layer.values.length === 1);
  validateUniform(firstLayer.uniforms[0], "float", "a", 123, 987);
};

const runUniformReorderTest = (visualizer: RaverieVisualizer) => {
  const compiledLayerGroup = compileTestLayerGroup(visualizer, `
    uniform float a; // default: 987
    uniform float b; // default: 654
    void main() {
      gFragColor = vec4(a, b, 0.0, 1.0);
    }`,
    [
      {
        name: "b",
        type: "float",
        value: 456
      },
      {
        name: "a",
        type: "float",
        value: 123
      },
    ]
  );

  const firstLayer = singleLayerTest(compiledLayerGroup);
  assert(firstLayer.uniforms.length === 2);
  assert(firstLayer.layer.values.length === 2);
  validateUniform(firstLayer.uniforms[0], "float", "a", 123, 987);
  validateUniform(firstLayer.uniforms[1], "float", "b", 456, 654);
};

const runNestedGroupTest = (visualizer: RaverieVisualizer) => {
  const compiledLayerGroup = visualizer.compile({
    type: "group",
    name: "root",
    visible: true,
    layers: [
      {
        type: "group",
        name: "nested",
        visible: true,
        layers: []
      }
    ]
  });

  assert(compiledLayerGroup.layers.length === 1);
  const firstLayer = compiledLayerGroup.layers[0];
  assert(firstLayer.type === "group");
  assert(firstLayer.layer.name === "nested");
}

export const runTests = (visualizer: RaverieVisualizer) => {
  runUniformRenameTest(visualizer);
  runUniformReorderTest(visualizer);
  runNestedGroupTest(visualizer);
};