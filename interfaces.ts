export interface LayerBase {
  name: string;
  visible: boolean;
}

export type Layer = LayerShader | LayerGroup;

export interface LayerGroup extends LayerBase {
  type: "group";
  layers: Layer[];
}

export type LayerShaderBlendMode =
  "effect" |
  "normal" |
  "darken" |
  "multiply" |
  "lighten" |
  "screen";

export type LayerShaderTimeMode =
  "normal" |
  "pingpong";

export interface ShaderValueBase {
  name: string;
}

export interface ShaderValueNumber extends ShaderValueBase {
  type: "int" | "float";
  value: number;
}

export interface ShaderTexture {
  url: string;
};

export interface ShaderValueSampler2D extends ShaderValueBase {
  type: "sampler2D";
  value: ShaderTexture;
}

// tags: <types>
export type ShaderValue = ShaderValueNumber | ShaderValueSampler2D;

export interface LayerShader extends LayerBase {
  type: "shader";
  code: string;
  values: ShaderValue[];
  blendMode: LayerShaderBlendMode;
  opacity: number;
  timeScale: number;
  timeMode: LayerShaderTimeMode;
}

export interface CompiledUniformBase {
  name: string;
  parsedComment: Record<string, any>;
}

export interface CompiledUniformNumber extends CompiledUniformBase {
  type: "int" | "float";
  shaderValue: ShaderValueNumber;
  defaultValue: number;
  minValue?: number;
  maxValue?: number;
}

export interface CompiledUniformSampler2D extends CompiledUniformBase {
  type: "sampler2D";
  shaderValue: ShaderValueSampler2D;
  defaultValue: ShaderTexture;
}

// tags: <types>
export type CompiledUniform = CompiledUniformNumber | CompiledUniformSampler2D;

export interface CompiledLayerShader {
  type: "shader";
  layer: LayerShader;
  uniforms: CompiledUniform[];
  compileErrors?: string;
  linkErrors?: string;
}

export type CompiledLayer = CompiledLayerShader | CompiledLayerGroup;

export interface CompiledLayerGroup {
  type: "group";
  layer: LayerGroup;
  layers: CompiledLayer[];
}