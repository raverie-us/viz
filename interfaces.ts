
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

export interface ShaderTexture {
  url: string;
};

// tags: <types>
export type ShaderType = number | ShaderTexture;

export interface ShaderLayer {
  type: "shader";
  code: string;
  values: Record<string, ShaderType>;
  blendMode: ShaderLayerBlendMode;
  opacity: number;
  timeScale: number;
  timeMode: ShaderLayerTimeMode;
}

// tags: <types> (see below, the different uniform types)
export interface CompiledUniformBase {
  name: string;
}

export interface CompiledUniformNumber extends CompiledUniformBase {
  type: "int" | "float";
  defaultValue: number;
  minValue?: number;
  maxValue?: number;
}

export interface CompiledUniformSampler2D extends CompiledUniformBase {
  type: "sampler2D";
  defaultValue: ShaderTexture;
}

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