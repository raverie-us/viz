
export interface Group {
  type: "group";
  layers: (ShaderLayer | Group)[];
}

export type ShaderLayerBlendMode =
  "effect" |
  "normal" |
  "darken" |
  "multiply" |
  "lighten" |
  "screen";

export type ShaderLayerTimeMode =
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

export interface ShaderLayer {
  type: "shader";
  code: string;
  values: ShaderValue[];
  blendMode: ShaderLayerBlendMode;
  opacity: number;
  timeScale: number;
  timeMode: ShaderLayerTimeMode;
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

export interface CompiledShaderLayer {
  type: "shader";
  shaderLayer: ShaderLayer;
  uniforms: CompiledUniform[];
  compileErrors?: string;
  linkErrors?: string;
}

export interface CompiledGroup {
  type: "group";
  group: Group;
  layers: (CompiledShaderLayer | CompiledGroup)[];
}