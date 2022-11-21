import { RaverieVisualizer, CompiledGroup, CompiledShaderLayer, ShaderValue, CompiledUniform } from "./core.js";

// Note: This must be a 'function' https://github.com/microsoft/TypeScript/issues/34523
function assert(value: unknown): asserts value {
  if (!value) {
    throw new Error("Assert failed");
  }
}

const singleLayerTest = (compiledGroup: CompiledGroup): CompiledShaderLayer => {
  assert(compiledGroup.type === "group");
  assert(compiledGroup.layers.length === 1);
  assert(compiledGroup.group.type === "group");
  assert(compiledGroup.group.layers.length === 1);
  const firstLayer = compiledGroup.layers[0];
  assert(firstLayer.type === "shader");
  assert(firstLayer.shaderLayer.type === "shader");
  return firstLayer;
}

const compileTestGroup = (visualizer: RaverieVisualizer, code: string, values: ShaderValue[]) => {
  return visualizer.compile({
    type: "group",
    layers: [
      {
        type: "shader",
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
  const compiledGroup = compileTestGroup(visualizer, `
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

  const firstLayer = singleLayerTest(compiledGroup);
  assert(firstLayer.uniforms.length === 1);
  assert(firstLayer.shaderLayer.values.length === 1);
  validateUniform(firstLayer.uniforms[0], "float", "a", 123, 987);
};

const runUniformReorderTest = (visualizer: RaverieVisualizer) => {
  const compiledGroup = compileTestGroup(visualizer, `
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

  const firstLayer = singleLayerTest(compiledGroup);
  assert(firstLayer.uniforms.length === 2);
  assert(firstLayer.shaderLayer.values.length === 2);
  validateUniform(firstLayer.uniforms[0], "float", "a", 123, 987);
  validateUniform(firstLayer.uniforms[1], "float", "b", 456, 654);
};

export const runTests = (visualizer: RaverieVisualizer) => {
  runUniformRenameTest(visualizer);
  runUniformReorderTest(visualizer);
};
