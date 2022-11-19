
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
export type TSType = number | ShaderTexture;

export interface ShaderLayer {
    type: "shader";
    code: string;
    values: Record<string, TSType>;
    blendMode: ShaderLayerBlendMode;
    opacity: number;
    timeScale: number;
    timeMode: ShaderLayerTimeMode;
}