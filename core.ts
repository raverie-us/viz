export interface LayerBase {
  name: string;
  id: string;
  visible: boolean;
  opacity: number;
  forkedFromId?: string;
  authorName?: string;
  authorUrl?: string;
}

export type Layer = LayerShader | LayerGroup;

export interface LayerGroup extends LayerBase {
  type: "group";
  layers: Layer[];
}

export type LayerShaderBlendMode =
  "overwrite" |

  "normal" |
  "dissolve" |

  "darken" |
  "multiply" |
  "colorBurn" |
  "linearBurn" |
  "darkerColor" |

  "lighten" |
  "screen" |
  "colorDodge" |
  "linearDodge" |
  "lighterColor" |

  "overlay" |
  "softLight" |
  "hardLight" |
  "vividLight" |
  "linearLight" |
  "pinLight" |
  "hardMix" |

  "difference" |
  "exclusion" |
  "subtract" |
  "divide";

export const blendModeList: LayerShaderBlendMode[] = [
  "overwrite",

  "normal",
  "dissolve",

  "darken",
  "multiply",
  "colorBurn",
  "linearBurn",
  "darkerColor",

  "lighten",
  "screen",
  "colorDodge",
  "linearDodge",
  "lighterColor",

  "overlay",
  "softLight",
  "hardLight",
  "vividLight",
  "linearLight",
  "pinLight",
  "hardMix",

  "difference",
  "exclusion",
  "subtract",
  "divide",
];

export const blendModeToIndex = (() => {
  const results: Record<string, number> = {};
  for (let i = 0; i < blendModeList.length; ++i) {
    results[blendModeList[i]] = i;
  }
  return results;
})();

export const blendModeDisplay: (LayerShaderBlendMode | null)[] = [
  "normal",
  "dissolve",
  null,
  "darken",
  "multiply",
  "colorBurn",
  "linearBurn",
  "darkerColor",
  null,
  "lighten",
  "screen",
  "colorDodge",
  "linearDodge",
  "lighterColor",
  null,
  "overlay",
  "softLight",
  "hardLight",
  "vividLight",
  "linearLight",
  "pinLight",
  "hardMix",
  null,
  "difference",
  "exclusion",
  "subtract",
  "divide"
];

export type LayerShaderTimeMode =
  "normal" |
  "pingpong";

export type NumberType = "int" | "float";
export type NumberVectorType = "vec2" | "vec3" | "vec4" | "ivec2" | "ivec3" | "ivec4";
export type BoolType = "bool";
export type BoolVectorType = "bvec2" | "bvec3" | "bvec4";
export type Sampler2DType = "sampler2D";
export type GradientType = "gradient";

export interface ShaderValueBase {
  name: string;
}

export interface ShaderValueNumber extends ShaderValueBase {
  type: NumberType;
  value: number;
}

export interface ShaderValueNumberVector extends ShaderValueBase {
  type: NumberVectorType;
  value: number[];
}

export interface ShaderValueBool extends ShaderValueBase {
  type: BoolType;
  value: boolean;
}

export interface ShaderValueBoolVector extends ShaderValueBase {
  type: BoolVectorType;
  value: boolean[];
}

export type FilterMode = "nearest" | "linear" | "mipmap";
export type WrapMode = "repeat" | "mirrored" | "clamp";

export interface ShaderTexture {
  url: string;

  /**
   * @default "mipmap"
   */
  filter?: FilterMode;

  /**
   * @default "repeat"
   */
  wrapHorizontal?: WrapMode;

  /**
   * @default "repeat"
   */
  wrapVertical?: WrapMode;
}

export interface ShaderValueSampler2D extends ShaderValueBase {
  type: Sampler2DType;
  value: ShaderTexture;
}

export interface ShaderGradientStop {
  t: number;
  color: number[];
}

export interface ShaderGradient {
  stops: ShaderGradientStop[];
}

export interface ShaderValueGradient extends ShaderValueBase {
  type: GradientType;
  value: ShaderGradient;
}

// tags: <types>
export type ShaderValue =
  ShaderValueNumber |
  ShaderValueNumberVector |
  ShaderValueBool |
  ShaderValueBoolVector |
  ShaderValueSampler2D |
  ShaderValueGradient;

export type ShaderType = number | number[] | ShaderTexture;

export interface LayerShader extends LayerBase {
  type: "shader";
  code: string;
  values: ShaderValue[];
  blendMode: LayerShaderBlendMode;
  timeScale: number;
  timeMode: LayerShaderTimeMode;
}

export interface CompiledUniformBase {
  name: string;
  parent: CompiledLayerShader;
  parsedComment: Record<string, any>;
}

export interface CompiledUniformNumber extends CompiledUniformBase {
  type: NumberType;
  shaderValue: ShaderValueNumber;
  defaultValue: number;
  minValue: number;
  maxValue: number;
  stepValue: number;
}

export interface CompiledUniformNumberVector extends CompiledUniformBase {
  type: NumberVectorType;
  shaderValue: ShaderValueNumberVector;
  defaultValue: number[];
  minValue: number[];
  maxValue: number[];
  stepValue: number[];
}

export interface CompiledUniformBool extends CompiledUniformBase {
  type: BoolType;
  shaderValue: ShaderValueBool;
  defaultValue: boolean;
}

export interface CompiledUniformBoolVector extends CompiledUniformBase {
  type: BoolVectorType;
  shaderValue: ShaderValueBoolVector;
  defaultValue: boolean[];
}

export interface CompiledUniformSampler2D extends CompiledUniformBase {
  type: Sampler2DType;
  shaderValue: ShaderValueSampler2D;
  defaultValue: ShaderTexture;
}

export interface CompiledUniformGradient extends CompiledUniformBase {
  type: GradientType;
  shaderValue: ShaderValueGradient;
  defaultValue: ShaderGradient;
}

// tags: <types>
export type CompiledUniform =
  CompiledUniformNumber |
  CompiledUniformNumberVector |
  CompiledUniformBool |
  CompiledUniformBoolVector |
  CompiledUniformSampler2D |
  CompiledUniformGradient;

export interface CompiledError {
  line: number;
  text: string;
}

export interface CompiledLayerBase {
  parent: CompiledLayerGroup | null;
}

export interface CompiledLayerShader extends CompiledLayerBase {
  type: "shader";
  layer: LayerShader;
  uniforms: CompiledUniform[];
  errors: CompiledError[];
}

export type CompiledLayer = CompiledLayerShader | CompiledLayerGroup;

export interface CompiledLayerGroup extends CompiledLayerBase {
  type: "group";
  layer: LayerGroup;
  layers: CompiledLayer[];

  // A complete flattened hierarchy of every layer (recursive) under this group
  idToLayer: Record<string, CompiledLayer>;
}

export const defaultEmptyLayerGroup = (): LayerGroup => ({
  type: "group",
  id: "",
  name: "",
  visible: true,
  opacity: 1.0,
  layers: []
});

export const defaultEmptyLayerShader = (): LayerShader => ({
  type: "shader",
  id: "",
  name: "",
  visible: true,
  opacity: 1.0,
  blendMode: "normal",
  timeMode: "normal",
  timeScale: 1.0,
  code: `
vec4 render() {
  return texture(gPreviousLayer, gUV);
}`.trim(),
  values: []
});

export const wrapLayerShaderInGroup = (layerShader: LayerShader): LayerGroup => ({
  ...defaultEmptyLayerGroup(),
  layers: [layerShader]
});

export const cloneLayer = <T extends Layer>(layer: T): T =>
  JSON.parse(JSON.stringify(layer));

export const defaultGradient = (): ShaderGradient => ({
  stops: [
    {
      t: 0,
      color: [0, 0, 0, 1]
    },
    {
      t: 1,
      color: [1, 1, 1, 1]
    },
  ]
});

export const sortGradientStops = (gradient: ShaderGradient): ShaderGradientStop[] => {
  const stops = [...gradient.stops];
  stops.sort((a, b) => {
    return a.t - b.t;
  });
  return stops;
}

export interface FoundLayer {
  layer: Layer;
  layerIndex: number;
  parent: LayerGroup;
}
export const findChildLayerAndParentById = (root: LayerGroup, id: string): FoundLayer | null => {
  for (let i = 0; i < root.layers.length; ++i) {
    const childLayer = root.layers[i];
    if (childLayer.id === id) {
      return {
        layer: childLayer,
        layerIndex: i,
        parent: root
      }
    }
    if (childLayer.type === "group") {
      const result = findChildLayerAndParentById(childLayer, id);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

export const removeLayer = (root: LayerGroup, id: string): boolean => {
  const result = findChildLayerAndParentById(root, id);
  if (!result) {
    return false;
  }
  result.parent.layers.splice(result.layerIndex, 1);
  return true;
};

export const addLayer = (root: LayerGroup, layerToAdd: Layer, relativeToId?: string): void => {
  if (!relativeToId) {
    root.layers.unshift(layerToAdd);
    return;
  }

  const result = findChildLayerAndParentById(root, relativeToId);
  if (!result) {
    root.layers.unshift(layerToAdd);
    return;
  }

  // As a special case, if we're adding relative to a group layer, we'll add it as a child
  if (result.layer.type === "group") {
    result.layer.layers.unshift(layerToAdd);
  } else {
    result.parent.layers.splice(result.layerIndex, 0, layerToAdd);
  }
};

const expect = <T>(value: T | null | undefined, name: string): T => {
  if (!value) {
    throw new Error(`Expected to get: ${name}`);
  }
  return value;
}

// tags: <types>
type GLSLType =
  NumberType |
  NumberVectorType |
  BoolType |
  BoolVectorType |
  Sampler2DType |
  GradientType;

interface ProcessedUniformBase extends CompiledUniformBase {
  parent: ProcessedLayerShader;
}

interface ProcessedUniformBaseSingleLocation extends ProcessedUniformBase {
  location: WebGLUniformLocation | null;
}

interface ProcessedUniformNumber extends ProcessedUniformBaseSingleLocation, CompiledUniformNumber {
  parent: ProcessedLayerShader;
}

interface ProcessedUniformNumberVector extends ProcessedUniformBaseSingleLocation, CompiledUniformNumberVector {
  parent: ProcessedLayerShader;
}

interface ProcessedUniformBool extends ProcessedUniformBaseSingleLocation, CompiledUniformBool {
  parent: ProcessedLayerShader;
}

interface ProcessedUniformBoolVector extends ProcessedUniformBaseSingleLocation, CompiledUniformBoolVector {
  parent: ProcessedLayerShader;
}

interface ProcessedUniformSampler2D extends ProcessedUniformBaseSingleLocation, CompiledUniformSampler2D {
  parent: ProcessedLayerShader;
}

interface ProcessedGradientLocation {
  t: WebGLUniformLocation;
  color: WebGLUniformLocation;
}

interface ProcessedUniformGradient extends ProcessedUniformBase, CompiledUniformGradient {
  parent: ProcessedLayerShader;
  location: ProcessedGradientLocation[] | null;
}

// tags: <types>
type ProcessedUniform =
  ProcessedUniformNumber |
  ProcessedUniformNumberVector |
  ProcessedUniformBool |
  ProcessedUniformBoolVector |
  ProcessedUniformSampler2D |
  ProcessedUniformGradient;

interface NewUniform {
  type: GLSLType;
  name: string;
  afterUniform: string;
}

interface ProcessedLayerShader extends CompiledLayerShader {
  parent: ProcessedLayerGroup | null;
  uniforms: ProcessedUniform[];
  program: WebGLProgram | null;

  // Global uniforms (entirely possible to be null if they are unused)
  gOpacity: WebGLUniformLocation | null;
  gResolution: WebGLUniformLocation | null;
  gTime: WebGLUniformLocation | null;
  gPreviousLayer: WebGLUniformLocation | null;
  gBlendMode: WebGLUniformLocation | null;
}

type ProcessedLayer = ProcessedLayerShader | ProcessedLayerGroup;

interface ProcessedLayerGroup extends CompiledLayerGroup {
  parent: ProcessedLayerGroup | null;
  layers: ProcessedLayer[];
  idToLayer: Record<string, ProcessedLayer>;
  timeSeconds: number;
}

// This type contains all the possible attributes for all types
interface ProcessedComment {
  default?: any;
  min?: any;
  max?: any;
  step?: any;
}

interface ProcessedShaderSuccess {
  shader: WebGLShader;
  error?: undefined;
}
interface ProcessedShaderFailed {
  shader: null;
  error: string;
}
type ProcessedShader = ProcessedShaderSuccess | ProcessedShaderFailed;

interface ProcessedProgram {
  program: WebGLProgram | null;
  error?: string;
}

interface RenderTarget {
  texture: WebGLTexture;
  buffer: WebGLFramebuffer;
}

const pass = <T>(value: T): T => value;

const validateGLSLFloat = (value: any, validatedDefault: number = 0): number =>
  (value === undefined || value === null) ? validatedDefault : (Number(value) || 0);

const validateGLSLInt = (value: any, validatedDefault: number = 0): number =>
  Math.floor(validateGLSLFloat(value, validatedDefault));

const validateGLSLNumber = (glslType: NumberType, value: any, validatedDefault: number = 0): number =>
  glslType === "int"
    ? validateGLSLInt(value, validatedDefault)
    : validateGLSLFloat(value, validatedDefault)

export const numberType = (glslType: NumberVectorType | NumberType) =>
  glslType[0] === "i" ? "int" : "float";

const minimumStepValue = (glslType: NumberVectorType | NumberType) =>
  numberType(glslType) === "int" ? 1 : 0;

interface NumberVectorParts {
  numberType: NumberType;
  components: number;
}

export const getNumberVectorParts = (glslType: NumberVectorType): NumberVectorParts => ({
  numberType: numberType(glslType),
  components: Number(glslType[glslType.length - 1])
});

export const getBoolVectorComponents = (glslType: BoolVectorType): number =>
  Number(glslType[glslType.length - 1]);

const vectorScalarConstructor = <T>(componentCount: number, fillValue: T): T[] => {
  const result = new Array<T>(componentCount);
  result.fill(fillValue);
  return result;
}

const vectorNumberScalarConstructor = (glslType: NumberVectorType, fillValue: number = 0): number[] => {
  const parts = getNumberVectorParts(glslType);
  return vectorScalarConstructor<number>(parts.components, fillValue);
}

const vectorBoolScalarConstructor = (glslType: BoolVectorType, fillValue: boolean = false): boolean[] => {
  const components = getBoolVectorComponents(glslType);
  return vectorScalarConstructor<boolean>(components, fillValue);
}

const validateGLSLNumberVector = (
  glslType: NumberVectorType,
  value: any,
  validatedDefault: number[] = vectorNumberScalarConstructor(glslType)): number[] => {
  if (!Array.isArray(value)) {
    return validatedDefault;
  }

  const parts = getNumberVectorParts(glslType);
  const result: number[] = [];
  for (let i = 0; i < parts.components; ++i) {
    result[i] = validateGLSLNumber(parts.numberType, value[i], validatedDefault[i]);
  }
  return result;
}

const validateGLSLBool = (glslType: BoolType, value: any, validatedDefault: boolean = false): boolean =>
  (value === undefined || value === null) ? validatedDefault : Boolean(value);

const validateGLSLBoolVector = (
  glslType: BoolVectorType,
  value: any,
  validatedDefault: boolean[] = vectorBoolScalarConstructor(glslType)): boolean[] => {
  if (!Array.isArray(value)) {
    return validatedDefault;
  }

  const components = getBoolVectorComponents(glslType);
  const result: boolean[] = [];
  for (let i = 0; i < components; ++i) {
    result[i] = validateGLSLBool("bool", value[i], validatedDefault[i]);
  }
  return result;
}

const validateGLSLSampler2D = (glslType: Sampler2DType, value: any, validatedDefault: ShaderTexture = { url: "" }): ShaderTexture => {
  if (value === undefined) {
    return validatedDefault;
  }

  if (typeof value === "object" && value !== null) {
    if (typeof value.url === "string") {
      return value;
    }
    return validatedDefault;
  } else {
    return { url: String(value) };
  }
}

const validateGLSLGradient = (glslType: GradientType, value: any, validatedDefault: ShaderGradient = defaultGradient()): ShaderGradient => {
  if (value === undefined) {
    return validatedDefault;
  }

  if (typeof value === "object" && value !== null) {
    if (Array.isArray(value.stops)) {
      return value;
    }

    // Support for the gradient shorthand, e.g. a black to a white gradient would be:
    // {0: [0,0,0,1], 1: [1,1,1,1]}
    const gradient: ShaderGradient = {
      stops: []
    };

    for (const key of Object.keys(value)) {
      const t = Number(key);
      if (isNaN(t)) {
        return validatedDefault;
      }
      gradient.stops.push({
        t,
        color: value[t]
      })
    }
    return gradient;
  }
  return validatedDefault;
}

// tags: <types>
// validateGLSLFloat
// validateGLSLInt
// validateGLSLNumber
// validateGLSLNumberVector
// validateGLSLBool
// validateGLSLBoolVector
// validateGLSLSampler2D
// validateGLSLGradient

export type LoadTextureFunction = (url: string, texture: WebGLTexture, gl: WebGL2RenderingContext) => void;

export const maxGradientStops = 16;

const newlineRegex = /\r|\n|\r\n/u;
const fragmentShaderHeader = `#version 300 es
precision highp float;
const float gPI = acos(-1.0);
const float gPI2 = gPI * 2.0;
in vec2 gPosition;
in vec2 gUV;
out vec4 gFragColor;
uniform sampler2D gPreviousLayer;
uniform float gOpacity;
uniform vec2 gResolution;
uniform float gTime;
uniform int gBlendMode;

float gLuminance(vec3 rgb) {
  return (0.2126 * rgb.r) + (0.7152 * rgb.g) + (0.0722 * rgb.b);
}

float gNoise2D(vec2 value) {
  return fract(sin(value.x * 3433.8 + value.y * 3843.98) * 45933.8);
}

float gDegreesToRadians(float degrees) {
  return degrees / 180.0 * gPI;
}

mat2 gRotateMatrix2D(float radians) {
  float c = cos(radians);
  float s = sin(radians);
  return mat2(c, s, -s, c);
}

struct GradientStop {
  float t;
  vec4 color;
};
const int gMaxGradientStops = ${maxGradientStops};
#define gradient GradientStop[gMaxGradientStops]

vec4 gSampleGradient(gradient stops, float t) {
  // Since the array is always a fixed size, the last entries are duplicated to fill the array
  t = t == 1.0 ? 1.0 : fract(t);
  GradientStop prevStop = stops[0];
  prevStop.t = 0.0;
  for (int i = 0; i < gMaxGradientStops; ++i) {
    GradientStop stop = stops[i];
    if (t < stop.t) {
      float interpolant = (t - prevStop.t) / (stop.t - prevStop.t);
      return mix(prevStop.color, stop.color, interpolant);
    }
    prevStop = stop;
  }
  return prevStop.color;
}

${blendModeList.map((blendMode, index) =>
  `const int gBlendMode${blendMode[0].toUpperCase()}${blendMode.substring(1)} = ${index};`).join("\n")}

vec4 gApplyBlendMode(int blendMode, float opacity, vec4 source, vec4 dest) {
  // Overwrite is a special case we use internally when we want to render without a previous layer
  if (blendMode == gBlendModeOverwrite) {
    return vec4(source.rgb, 1);
  }

  // We also handle dissolve as a special case since it never blends (always opaque)
  if (blendMode == gBlendModeDissolve) {
    source.a *= opacity;
    float noise = gNoise2D(gUV);
    vec4 color;
    if (source.a == 1.0) {
      color = source;
    } else if (source.a == 0.0) {
      color = dest;
    } else {
      color = source.a < noise ? dest : source;
    }
    return vec4(color.rgb, 1);
  }
  
  vec3 src = source.rgb;
  float srcAlpha = source.a * opacity;
  vec3 dst = dest.rgb;
  vec3 hlf = vec3(0.5);
  vec3 one = vec3(1.0);
  vec3 two = vec3(2.0);
  vec3 epsilon = vec3(0.1);

  vec3 blended = vec3(0);
  switch (blendMode) {
    case gBlendModeNormal: blended = src; break;

    case gBlendModeMultiply: blended = src * dst; break;
    case gBlendModeDarken: blended = min(src, dst); break;
    case gBlendModeColorBurn: blended = one - (one - dst) / max(src, epsilon); break;
    case gBlendModeLinearBurn: blended = src + dst - one; break;
    case gBlendModeDarkerColor: blended = gLuminance(src) < gLuminance(dst) ? src : dst; break;

    case gBlendModeScreen: blended = one - (one - src) * (one - dst); break;
    case gBlendModeLighten: blended = max(src, dst); break;
    case gBlendModeColorDodge: blended = dst / max(one - src, epsilon); break;
    case gBlendModeLinearDodge: blended = src + dst; break;
    case gBlendModeLighterColor: blended = gLuminance(src) > gLuminance(dst) ? src : dst; break;

    case gBlendModeOverlay: blended = vec3(greaterThan(dst,hlf))*(one-(one-two*(dst-hlf))*(one-src))+vec3(lessThanEqual(dst,hlf))*((two*dst)*src); break;
    case gBlendModeSoftLight: blended = vec3(greaterThan(src,hlf))*(one-(one-dst)*(one-(src-hlf)))+vec3(lessThanEqual(src,hlf))*(dst*(src+hlf)); break;
    case gBlendModeHardLight: blended = vec3(greaterThan(src,hlf))*(one-(one-dst)*(one-two*(src-hlf)))+vec3(lessThanEqual(src,hlf))*(dst*(two*src)); break;
    case gBlendModeVividLight: blended = vec3(greaterThan(src,hlf))*(dst/max(one-two*(src-hlf),epsilon))+vec3(lessThanEqual(src,hlf))*(one-(one-dst)/max(two*src,epsilon)); break;
    case gBlendModeLinearLight: blended = vec3(greaterThan(src,hlf))*(dst+two*(src-hlf))+vec3(lessThanEqual(src,hlf))*(dst+two*src-one); break;
    case gBlendModePinLight: blended = vec3(greaterThan(src,hlf))*max(dst,two*(src-hlf))+vec3(lessThanEqual(src,hlf))*min(dst,two*src); break;
    case gBlendModeHardMix: blended = src; break;

    case gBlendModeDifference: blended = abs(dst - src); break;
    case gBlendModeExclusion: blended = hlf - two * (dst - hlf) * (src - hlf); break;
    case gBlendModeSubtract: blended = dst - src; break;
    case gBlendModeDivide: blended = dst / max(src, epsilon); break;
  }

  return vec4(srcAlpha * blended + (1.0 - srcAlpha) * dst, 1.0);
}
`;

const fragmentShaderHeaderLineCount = fragmentShaderHeader.split(newlineRegex).length;

const fragmentShaderFooter = `
void main() {
  vec4 source = render();
  vec4 dest = texture(gPreviousLayer, gUV);
  gFragColor = gApplyBlendMode(gBlendMode, gOpacity, source, dest);
}`;

export type RenderCallback = (frameTimeSeconds: number) => void;

export const defaultFrameTime = 1 / 60;

export interface RenderOptions {
  /**
   * Whether we draw the final result to the back buffer at the end of render all visible layers.
   * @default true
   */
  drawToBackBuffer?: boolean;
};

export class RenderTargets {
  public get width() {
    return this.widthInternal;
  }

  public get height() {
    return this.heightInternal;
  }

  public constructor(
    private widthInternal: number,
    private heightInternal: number,
    private readonly targets: [RenderTarget, RenderTarget]) {
  }
}

interface RenderTargetsInternal {
  widthInternal: number;
  heightInternal: number;
  targets: [RenderTarget, RenderTarget];
}

const DEFAULT_CHECKER_SIZE = 8;

export type RenderLayerShaderCallback = (compiledLayerShader: CompiledLayerShader, gl: WebGL2RenderingContext) => void;

export class RaverieVisualizer {
  private readonly gl: WebGL2RenderingContext;
  private readonly loadTexture: LoadTextureFunction;

  private textureCache: Record<string, WebGLTexture | undefined> = {};

  private readonly vertexShader: WebGLShader;

  // For rendering checker-board "transparent" background
  private readonly checkerboardShader: ProcessedLayerShader;
  private readonly checkerboardSize: ShaderValueNumber;

  // For copying the final result to the back buffer
  private readonly copyShader: ProcessedLayerShader;

  private lastTimeStampMs: number = -1;

  public onBeforeRender: RenderCallback | null = null;

  public constructor(gl: WebGL2RenderingContext, loadTexture: LoadTextureFunction) {
    this.gl = gl;
    this.loadTexture = loadTexture;

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const vertexPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
    const vertices = [
      -1, -1, // Bottom left
      +1, -1, // Bottom right
      -1, +1, // Top left
      +1, +1, // Top right
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // All effects currently use the same vertex shader
    const vertexShader = `#version 300 es
      in vec2 _gVertexPosition;
      out vec2 gPosition;
      out vec2 gUV;
      void main() {
        gPosition = _gVertexPosition;
        gUV = (_gVertexPosition + vec2(1.0, 1.0)) * 0.5;
        gl_Position = vec4(_gVertexPosition, 0.0, 1.0);
      }`;

    const processedVertexShader = this.createShader(vertexShader, gl.VERTEX_SHADER);
    this.vertexShader = expect(processedVertexShader.shader,
      processedVertexShader.error!);

    this.checkerboardShader = this.compileLayerShader({
      ...defaultEmptyLayerShader(),
      blendMode: "overwrite",
      code: `
      uniform float checkerPixelSize; // default: ${DEFAULT_CHECKER_SIZE}
      vec4 render() {
        vec2 pixels = gUV * gResolution;
        vec2 uv = floor(pixels / vec2(checkerPixelSize));
        float checker = mod(uv.x + uv.y, 2.0);
        return vec4(vec3(max(checker, 0.8)), 1);
      }`
    }, null, true);
    const checkerboardSize = this.checkerboardShader.layer.values.find(
      (shaderValue) => shaderValue.name === "checkerPixelSize");
    if (!checkerboardSize) {
      throw new Error("Unable to find 'checkerboardSize' shader value");
    }
    this.checkerboardSize = checkerboardSize as ShaderValueNumber;

    this.copyShader = this.compileLayerShader({
      ...defaultEmptyLayerShader(),
      blendMode: "overwrite",
      code: `
      vec4 render() {
        return texture(gPreviousLayer, gUV);
      }`
    }, null, true);
  }

  private createRenderTarget(width: number, height: number): RenderTarget {
    const gl = this.gl;
    const buffer = expect(gl.createFramebuffer(), "WebGLFramebuffer");
    gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
    const texture = this.createTexture();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {
      texture: texture,
      buffer: buffer
    };
  }

  private deleteRenderTarget(renderTarget: RenderTarget) {
    const gl = this.gl;
    gl.deleteFramebuffer(renderTarget.buffer);
    gl.deleteTexture(renderTarget.texture);
  }

  public createRenderTargets(width: number, height: number): RenderTargets {
    return new RenderTargets(Math.max(width, 1), Math.max(height, 1), [
      this.createRenderTarget(width, height),
      this.createRenderTarget(width, height),
    ]);
  }

  public resizeRenderTargets(targets: RenderTargets, width: number, height: number) {
    const targetsInternal = targets as any as RenderTargetsInternal;
    targetsInternal.widthInternal = Math.max(width, 1);
    targetsInternal.heightInternal = Math.max(height, 1);

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, targetsInternal.targets[0].texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindTexture(gl.TEXTURE_2D, targetsInternal.targets[1].texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  public deleteRenderTargets(targets: RenderTargets) {
    const targetsInternal = targets as any as RenderTargetsInternal;
    this.deleteRenderTarget(targetsInternal.targets[0]);
    this.deleteRenderTarget(targetsInternal.targets[1]);
    const gl = this.gl;
  }

  private createShader(str: string, type: GLenum): ProcessedShader {
    const gl = this.gl;
    const shader = expect(gl.createShader(type), "WebGLShader");
    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    const compileStatus = gl.getShaderParameter(shader, gl.COMPILE_STATUS) as boolean;
    if (!compileStatus) {
      const compilationLog = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      return {
        shader: null,
        error: compilationLog || "Failed to compile"
      };
    }
    return { shader };
  }

  private createProgram(fragmentShader: string, blendMode: LayerShaderBlendMode): ProcessedProgram {
    const gl = this.gl;
    const program = expect(gl.createProgram(), "WebGLProgram");

    const fragmentComposited = `${fragmentShaderHeader}\n${fragmentShader}\n${fragmentShaderFooter}`;
    const processedFragmentShader = this.createShader(fragmentComposited, gl.FRAGMENT_SHADER);
    if (!processedFragmentShader.shader) {
      return {
        program: null,
        error: processedFragmentShader.error,
      };
    }

    gl.attachShader(program, expect(this.vertexShader, "Vertex Shader"));
    gl.attachShader(program, processedFragmentShader.shader);
    gl.linkProgram(program);
    const linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS) as boolean;
    if (!linkStatus) {
      const programLog = gl.getProgramInfoLog(program);
      return {
        program,
        error: programLog || "Failed to link"
      };
    }
    return { program };
  }

  private createTexture(): WebGLTexture {
    const gl = this.gl;
    const texture = expect(gl.createTexture(), "WebGLTexture");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
  }

  public compile(layerGroup: LayerGroup, mode: "clone" | "modifyInPlace" = "clone"): CompiledLayerGroup {
    // Let the user pick if we make a copy, because we're going to potentially
    // modify the group such as if we find new uniforms within the shaders
    return this.compileLayerGroup(mode === "clone"
      ? JSON.parse(JSON.stringify(layerGroup)) as LayerGroup
      : layerGroup, null);
  }

  private compileLayerShader(layerShader: LayerShader, parent: ProcessedLayerGroup | null, throwOnError = false): ProcessedLayerShader {
    const gl = this.gl;
    const processedProgram = this.createProgram(layerShader.code, layerShader.blendMode);

    if (processedProgram.error) {
      if (throwOnError) {
        throw new Error(processedProgram.error);
      }
    }

    // It's possible that there was a compile/linker error and we got no program back
    const program = processedProgram.program;
    if (program) {
      const vertexPosAttrib = gl.getAttribLocation(program, '_gVertexPosition');
      gl.enableVertexAttribArray(vertexPosAttrib);
      gl.vertexAttribPointer(vertexPosAttrib, 2, gl.FLOAT, false, 0, 0);
    }

    // tags: <types>
    const uniformRegex =
      /uniform\s+(int|float|vec2|vec3|vec4|ivec2|ivec3|ivec4|bool|bvec2|bvec3|bvec4|sampler2D|gradient)\s+([a-zA-Z_][a-zA-Z0-9_]*)(.*)/gum;

    const newUniformNames: Record<string, true> = {};
    const newUniforms: NewUniform[] = [];
    for (; ;) {
      const result = uniformRegex.exec(layerShader.code);
      if (!result) {
        break;
      }
      const name = result[2];
      // Ignore uniforms of the same name which happens often while editing code live
      if (newUniformNames[name]) {
        continue;
      }

      newUniformNames[name] = true;
      newUniforms.push({
        type: result[1] as GLSLType,
        name,
        afterUniform: result[3]
      });
    }

    // Make a copy of the old shader values that we pop from as we map old to new
    const oldShaderValues = layerShader.values.slice(0);

    const errors: CompiledError[] = [];
    if (processedProgram.error) {
      // WebGL errors in Chrome actually have a null terminator in them (\x00)
      const lines = processedProgram.error.split(/\r|\n|\r\n|\x00/u);
      for (const line of lines) {
        if (line.trim() === "") {
          continue;
        }
        const result = /^(?:ERROR|WARNING): 0:([0-9]+): (.*)/gum.exec(line);
        if (result) {
          errors.push({
            line: Number(result[1]) - fragmentShaderHeaderLineCount,
            text: result[2]
          });
        } else {
          errors.push({
            line: 1,
            text: line
          });
        }
      }
    }

    const getUniformLocation = (name: string) => program
      ? gl.getUniformLocation(program, name)
      : null;

    const processedLayerShader: ProcessedLayerShader = {
      type: "shader",
      parent,
      layer: layerShader,
      uniforms: [],
      errors,
      program,
      gOpacity: getUniformLocation("gOpacity"),
      gResolution: getUniformLocation("gResolution"),
      gTime: getUniformLocation("gTime"),
      gPreviousLayer: getUniformLocation("gPreviousLayer"),
      gBlendMode: getUniformLocation("gBlendMode"),
    };

    const processedUniforms: ProcessedUniform[] = newUniforms.map<ProcessedUniform>((unprocessedUniform, uniformIndex) => {
      const { type, name, afterUniform } = unprocessedUniform;
      const location = getUniformLocation(name);

      let parsedComment: ProcessedComment = {};

      const commentStart = afterUniform.indexOf("//");
      if (commentStart !== -1) {
        // Check if we can parse the comment as JSON (skip 2 characters for the //)
        const commentText = afterUniform.substring(commentStart + 2);
        const innerJson = commentText.replace(/[a-zA-Z0-9_.]+\s*:/gum, (found) => {
          const identifier = found.substring(0, found.indexOf(":")).trim();
          return `"${identifier}":`;
        });

        const json = `{${innerJson}}`;
        try {
          parsedComment = JSON.parse(json);
        } catch {
          // Ignore the comment for now
        }
      }

      // We always first look by name
      let foundShaderValue: ShaderValue | null = null;
      for (let i = 0; i < oldShaderValues.length; ++i) {
        const oldShaderValue = oldShaderValues[i];
        if (oldShaderValue.name === name) {
          oldShaderValues.splice(i, 1);
          foundShaderValue = oldShaderValue;
          break;
        }
      }

      // If we didn't find it by name, we'll detect a potential rename by checking if there
      // is a uniform at the same previous index that is also of the same type and is *unused*
      if (foundShaderValue === null) {
        const oldShaderValueAtIndex = layerShader.values[uniformIndex] as ShaderValue | undefined;
        const isRename =
          oldShaderValueAtIndex &&
          oldShaderValueAtIndex.type === type &&
          !newUniformNames[oldShaderValueAtIndex.name];

        if (isRename) {
          foundShaderValue = oldShaderValueAtIndex;
        }
      }

      // tags: <types>
      switch (type) {
        case "int":
        case "float": {
          const defaultValue = validateGLSLNumber(type, parsedComment.default);
          return pass<ProcessedUniformNumber>({
            type,
            location,
            name,
            parent: processedLayerShader,
            parsedComment,
            shaderValue: {
              name,
              type,
              value: validateGLSLNumber(type, foundShaderValue?.value, defaultValue)
            },
            defaultValue,
            minValue: validateGLSLNumber(type, parsedComment.min, Number.NEGATIVE_INFINITY),
            maxValue: validateGLSLNumber(type, parsedComment.max, Number.POSITIVE_INFINITY),
            stepValue: validateGLSLNumber(type, parsedComment.step, minimumStepValue(type)),
          });
        }
        case "vec2":
        case "vec3":
        case "vec4":
        case "ivec2":
        case "ivec3":
        case "ivec4": {
          const defaultValue = validateGLSLNumberVector(type, parsedComment.default);
          return pass<ProcessedUniformNumberVector>({
            type,
            location,
            name,
            parent: processedLayerShader,
            parsedComment,
            shaderValue: {
              name,
              type,
              value: validateGLSLNumberVector(type, foundShaderValue?.value, defaultValue)
            },
            defaultValue,
            minValue: validateGLSLNumberVector(type, parsedComment.min, vectorNumberScalarConstructor(type, Number.NEGATIVE_INFINITY)),
            maxValue: validateGLSLNumberVector(type, parsedComment.max, vectorNumberScalarConstructor(type, Number.POSITIVE_INFINITY)),
            stepValue: validateGLSLNumberVector(type, parsedComment.step, vectorNumberScalarConstructor(type, minimumStepValue(type))),
          });
        }
        case "bool": {
          const defaultValue = validateGLSLBool(type, parsedComment.default);
          return pass<ProcessedUniformBool>({
            type,
            location,
            name,
            parent: processedLayerShader,
            parsedComment,
            shaderValue: {
              name,
              type,
              value: validateGLSLBool(type, foundShaderValue?.value, defaultValue)
            },
            defaultValue
          });
        }
        case "bvec2":
        case "bvec3":
        case "bvec4": {
          const defaultValue = validateGLSLBoolVector(type, parsedComment.default);
          return pass<ProcessedUniformBoolVector>({
            type,
            location,
            name,
            parent: processedLayerShader,
            parsedComment,
            shaderValue: {
              name,
              type,
              value: validateGLSLBoolVector(type, foundShaderValue?.value, defaultValue)
            },
            defaultValue
          });
        }
        case "sampler2D": {
          const defaultValue = validateGLSLSampler2D(type, parsedComment.default);
          return pass<ProcessedUniformSampler2D>({
            type,
            location,
            name,
            parent: processedLayerShader,
            parsedComment,
            shaderValue: {
              name,
              type,
              value: validateGLSLSampler2D(type, foundShaderValue?.value, defaultValue)
            },
            defaultValue,
          });
        }
        case "gradient": {
          const defaultValue = validateGLSLGradient(type, parsedComment.default);
          let location: ProcessedGradientLocation[] | null = [];
          for (let i = 0; i < maxGradientStops; ++i) {
            const t = getUniformLocation(`${name}[${i}].t`);
            const color = getUniformLocation(`${name}[${i}].color`);
            if (!t || !color) {
              location = null;
              break;
            }
            location.push({ t, color });
          }
          return pass<ProcessedUniformGradient>({
            type,
            location,
            name,
            parent: processedLayerShader,
            parsedComment,
            shaderValue: {
              name,
              type,
              value: validateGLSLGradient(type, foundShaderValue?.value, defaultValue)
            },
            defaultValue,
          });
        }
        default: throw new Error(`Unexpected GLSL type '${type}'`)
      }
    });

    // Now that we've processed all the new uniforms and either
    // found their old shader values or made new ones, lets update the
    // shader values on the LayerShader to match. Note that this will
    // mutate the object, however it may be a copy of the user's LayerShader
    // depending on which option they passed into `compile`
    layerShader.values.length = 0;
    layerShader.values.push(...processedUniforms.map((processedUniform) =>
      processedUniform.shaderValue));

    processedLayerShader.uniforms = processedUniforms;
    return processedLayerShader;
  }

  private compileLayerGroup(layerGroup: LayerGroup, parent: ProcessedLayerGroup | null): ProcessedLayerGroup {
    const processedLayerGroup: ProcessedLayerGroup = {
      type: "group",
      parent,
      layer: layerGroup,
      layers: [],
      idToLayer: {},
      timeSeconds: 0
    };

    const mapLayerById = (processedLayer: ProcessedLayer) => {
      const id = processedLayer.layer.id;
      if (id in processedLayerGroup.idToLayer) {
        throw new Error(`Layer id '${id}' was not unique (another layer had the same id)`);
      }
      processedLayerGroup.idToLayer[id] = processedLayer;
    }

    for (const layer of layerGroup.layers) {
      if (layer.type === "shader") {
        const processedLayerShader = this.compileLayerShader(layer, processedLayerGroup);
        processedLayerGroup.layers.push(processedLayerShader);
        mapLayerById(processedLayerShader);
      } else {
        // Recursively compile the child group
        const processedChildGroup = this.compileLayerGroup(layer, processedLayerGroup);
        processedLayerGroup.layers.push(processedChildGroup);
        mapLayerById(processedChildGroup);
        for (const nestedCompiledLayer of Object.values(processedChildGroup.idToLayer)) {
          mapLayerById(nestedCompiledLayer);
        }
      }
    }
    return processedLayerGroup;
  }

  public getOrCacheTexture(url: string): WebGLTexture {
    const texture = this.textureCache[url];
    if (texture) {
      return texture;
    }
    const newTexture = this.createTexture();

    const gl = this.gl;
    // By default unloaded textures are just 1x1 pixel black with no alpha (0,0,0,0)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    this.textureCache[url] = newTexture;
    this.loadTexture(url, newTexture, this.gl);
    return newTexture;
  }

  private renderLayerShaderInternal(
    processedLayerShader: ProcessedLayerShader,
    parentOpacity: number,
    frameBuffer: WebGLFramebuffer | null,
    previousLayerTexture: WebGLTexture | null,
    width: number,
    height: number,
    timeSeconds: number,
    onRender?: RenderLayerShaderCallback) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

    gl.clearColor(1, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (processedLayerShader.program) {
      gl.useProgram(processedLayerShader.program);

      // Apply global uniforms
      gl.uniform1f(processedLayerShader.gOpacity, processedLayerShader.layer.opacity * parentOpacity);
      gl.uniform2f(processedLayerShader.gResolution, width, height);
      gl.uniform1f(processedLayerShader.gTime, timeSeconds);

      const blendModeIndex = blendModeToIndex[processedLayerShader.layer.blendMode];
      gl.uniform1i(processedLayerShader.gBlendMode, blendModeIndex);

      gl.uniform1i(processedLayerShader.gPreviousLayer, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, previousLayerTexture);

      // Apply layer uniforms
      let textureSamplerIndex = 1;
      for (const processedUniform of processedLayerShader.uniforms) {
        // Don't set uniforms that don't have locations. These can occur if we
        // found the uniform via a regex, but it was optimized out by the compiler
        if (!processedUniform.location) {
          continue;
        }

        const value = processedUniform.shaderValue.value;
        // tags: <types>
        switch (processedUniform.type) {
          case "int":
          case "float": {
            const validatedValue = validateGLSLNumber(processedUniform.type, value,
              processedUniform.defaultValue);
            if (processedUniform.type === "int") {
              gl.uniform1i(processedUniform.location, validatedValue);
            } else {
              gl.uniform1f(processedUniform.location, validatedValue);
            }
            break;
          }
          case "vec2":
          case "vec3":
          case "vec4":
          case "ivec2":
          case "ivec3":
          case "ivec4": {
            const validatedValue = validateGLSLNumberVector(processedUniform.type, value,
              processedUniform.defaultValue);
            switch (processedUniform.type) {
              case "vec2":
                gl.uniform2f(processedUniform.location, validatedValue[0], validatedValue[1]);
                break;
              case "vec3":
                gl.uniform3f(processedUniform.location, validatedValue[0], validatedValue[1], validatedValue[2]);
                break;
              case "vec4":
                gl.uniform4f(processedUniform.location, validatedValue[0], validatedValue[1], validatedValue[2], validatedValue[3]);
                break;
              case "ivec2":
                gl.uniform2i(processedUniform.location, validatedValue[0], validatedValue[1]);
                break;
              case "ivec3":
                gl.uniform3i(processedUniform.location, validatedValue[0], validatedValue[1], validatedValue[2]);
                break;
              case "ivec4":
                gl.uniform4i(processedUniform.location, validatedValue[0], validatedValue[1], validatedValue[2], validatedValue[3]);
                break;
            }
            break;
          }
          case "bool": {
            const validatedValue = validateGLSLBool(processedUniform.type, value, processedUniform.defaultValue);
            gl.uniform1i(processedUniform.location, Number(validatedValue));
            break;
          }
          case "bvec2":
          case "bvec3":
          case "bvec4": {
            const validatedValue = validateGLSLBoolVector(processedUniform.type, value,
              processedUniform.defaultValue);
            switch (processedUniform.type) {
              case "bvec2":
                gl.uniform2i(processedUniform.location, Number(validatedValue[0]), Number(validatedValue[1]));
                break;
              case "bvec3":
                gl.uniform3i(processedUniform.location, Number(validatedValue[0]), Number(validatedValue[1]), Number(validatedValue[2]));
                break;
              case "bvec4":
                gl.uniform4i(processedUniform.location, Number(validatedValue[0]), Number(validatedValue[1]), Number(validatedValue[2]), Number(validatedValue[3]));
                break;
            }
            break;
          }
          case "sampler2D": {
            const validatedValue = validateGLSLSampler2D(processedUniform.type, value,
              processedUniform.defaultValue);
            const texture = this.getOrCacheTexture(validatedValue.url);
            gl.activeTexture(gl.TEXTURE0 + textureSamplerIndex);
            gl.bindTexture(gl.TEXTURE_2D, texture);

            const choose = <T>(first: T | undefined, second: T | undefined, fallback: T): T => {
              if (typeof first !== "undefined") {
                return first;
              }
              if (typeof second !== "undefined") {
                return second;
              }
              return fallback;
            };

            const filter = choose(validatedValue.filter, processedUniform.defaultValue.filter, "mipmap");
            const wrapHorizontal = choose(validatedValue.wrapHorizontal, processedUniform.defaultValue.wrapHorizontal, "repeat");
            const wrapVertical = choose(validatedValue.wrapVertical, processedUniform.defaultValue.wrapVertical, "repeat");

            const wrapModeToGLParam = (wrapMode: WrapMode) => {
              switch (wrapMode) {
                case "repeat": return gl.REPEAT;
                case "mirrored": return gl.MIRRORED_REPEAT;
                case "clamp": return gl.CLAMP_TO_EDGE;
                default: throw new Error(`Unexpected wrap mode ${wrapMode}`);
              }
            };

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapModeToGLParam(wrapHorizontal));
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapModeToGLParam(wrapVertical));

            const [minFilter, magFilter] = (() => {
              switch (filter) {
                case "nearest": return [gl.NEAREST, gl.NEAREST];
                case "linear": return [gl.LINEAR, gl.LINEAR];
                case "mipmap": return [gl.LINEAR_MIPMAP_LINEAR, gl.LINEAR];
                default: throw new Error(`Unexpected filter ${filter}`);
              }
            })();

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);

            if (filter === "mipmap") {
              gl.generateMipmap(gl.TEXTURE_2D);
            }

            gl.uniform1i(processedUniform.location, textureSamplerIndex);
            ++textureSamplerIndex;
            break;
          }
          case "gradient": {
            const validatedValue = validateGLSLGradient(processedUniform.type, value,
              processedUniform.defaultValue);

            const stops = sortGradientStops(validatedValue);
            let lastStop: ShaderGradientStop = {
              t: 1,
              color: [0, 0, 0, 1]
            };
            for (let i = 0; i < maxGradientStops; ++i) {
              const gradientLocation = processedUniform.location[i];
              const stop = stops[i] || lastStop;
              gl.uniform1f(gradientLocation.t, stop.t);
              gl.uniform4f(gradientLocation.color, stop.color[0], stop.color[1], stop.color[2], stop.color[3]);
              lastStop = stop;
            }
            break;
          }
          default: throw new Error(`Unexpected GLSL type '${(processedUniform as any).type}'`)
        }
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    if (onRender) {
      onRender(processedLayerShader, gl);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  private clearRenderTargetInternal(renderTarget: RenderTarget, width: number, height: number, checkerSize = DEFAULT_CHECKER_SIZE) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.buffer);
    gl.clearColor(1, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.checkerboardSize.value = checkerSize;
    this.renderLayerShaderInternal(
      this.checkerboardShader,
      1.0,
      renderTarget.buffer,
      null,
      width,
      height,
      0);
  };

  public renderLayerShaderPreviews(
    compiledLayerGroup: CompiledLayerGroup,
    timeStampMs: number,
    renderTargets: RenderTargets,
    onRender: RenderLayerShaderCallback,
    checkerSize: number = DEFAULT_CHECKER_SIZE) {
    const processedLayerGroup = compiledLayerGroup as ProcessedLayerGroup;

    const targetsInternal = renderTargets as any as RenderTargetsInternal;
    this.gl.viewport(0, 0, targetsInternal.widthInternal, targetsInternal.heightInternal);

    this.clearRenderTargetInternal(
      targetsInternal.targets[0],
      targetsInternal.widthInternal,
      targetsInternal.heightInternal,
      checkerSize);

    const frameBuffer = targetsInternal.targets[1].buffer;
    const checkerTexture = targetsInternal.targets[0].texture;

    const timeSeconds = timeStampMs / 1000;

    // We render each layer as if it is a standalone with only the checkerboard behind it
    const results: Record<string, Uint8Array> = {};
    for (const processedLayer of Object.values(processedLayerGroup.idToLayer)) {
      if (processedLayer.type === "shader") {
        const blendMode = processedLayer.layer.blendMode;
        processedLayer.layer.blendMode = "normal";
        this.renderLayerShaderInternal(
          processedLayer,
          1.0,
          frameBuffer,
          checkerTexture,
          targetsInternal.widthInternal,
          targetsInternal.heightInternal,
          timeSeconds,
          onRender);
        processedLayer.layer.blendMode = blendMode;
      }
    }
    return results;
  };

  public render(
    compiledLayerGroup: CompiledLayerGroup,
    timeStampMs: number,
    renderTargets: RenderTargets,
    options?: RenderOptions): number {
    const processedLayerGroup = compiledLayerGroup as ProcessedLayerGroup;
    const frameTimeSeconds = this.lastTimeStampMs === -1
      ? defaultFrameTime
      : (timeStampMs - this.lastTimeStampMs) / 1000;
    this.lastTimeStampMs = timeStampMs;

    if (this.onBeforeRender) {
      this.onBeforeRender(frameTimeSeconds);
    }

    const gl = this.gl;
    const targetsInternal = renderTargets as any as RenderTargetsInternal;
    gl.viewport(0, 0, targetsInternal.widthInternal, targetsInternal.heightInternal);

    const timeSeconds = timeStampMs / 1000;

    let renderTargetIndex = 0;
    const renderRecursive = (processedLayerGroup: ProcessedLayerGroup, parentOpacity: number) => {
      const groupOpacity = processedLayerGroup.layer.opacity * parentOpacity;
      for (let i = processedLayerGroup.layers.length - 1; i >= 0; --i) {
        const layer = processedLayerGroup.layers[i];
        // Skip invisible layers
        if (!layer.layer.visible) {
          continue;
        }

        if (layer.type === "shader") {
          // We only render the layer if it has a valid program (also don't swap buffers)
          // Treat this like it's an invisible layer
          if (layer.program) {
            renderTargetIndex = Number(!renderTargetIndex);

            this.renderLayerShaderInternal(
              layer,
              groupOpacity,
              targetsInternal.targets[renderTargetIndex].buffer,
              targetsInternal.targets[Number(!renderTargetIndex)].texture,
              targetsInternal.widthInternal,
              targetsInternal.heightInternal,
              timeSeconds);
          }
        } else {
          renderRecursive(layer, groupOpacity);
        }
      }
    }

    this.clearRenderTargetInternal(targetsInternal.targets[0], targetsInternal.widthInternal, targetsInternal.heightInternal);
    this.clearRenderTargetInternal(targetsInternal.targets[1], targetsInternal.widthInternal, targetsInternal.heightInternal);

    renderRecursive(processedLayerGroup, 1.0);

    const drawToBackBuffer = options?.drawToBackBuffer === undefined
      ? true
      : options?.drawToBackBuffer;

    if (drawToBackBuffer) {
      this.renderLayerShaderInternal(
        this.copyShader,
        1.0,
        null,
        targetsInternal.targets[renderTargetIndex].texture,
        targetsInternal.widthInternal,
        targetsInternal.heightInternal,
        timeSeconds);
    }
    return frameTimeSeconds;
  }
}
