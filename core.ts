export interface LayerBase {
  name: string;
  id: string;
  visible: boolean;
  opacity: number;
  blendMode: LayerBlendMode;
  forkedFromId?: string;
  authorName?: string;
  authorUrl?: string;
}

export type LayerCode = LayerShader | LayerJavaScript;
export type Layer = LayerCode | LayerGroup;

export interface LayerGroup extends LayerBase {
  type: "group";
  layers: Layer[];
}

export type LayerBlendMode =
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

export const blendModeList: LayerBlendMode[] = [
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

export const blendModeDisplay: (LayerBlendMode | null)[] = [
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
export type EnumType = "enum";
export type Sampler2DType = "sampler2D";
export type GradientType = "gradient";
export type ButtonType = "button";
export type AxisType = "axis";

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

// The value is either the exact enum numeric value (not the index)
// or a string which will be used to look up the enum numeric value.
export type EnumValue = number | string;

export interface ShaderValueEnum extends ShaderValueBase {
  type: EnumType;
  value: EnumValue;
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

export interface ShaderButton {
  buttonHeld: boolean;
  buttonTriggered: boolean;
  buttonReleased: boolean;
  touchHeld: boolean;
  touchTriggered: boolean;
  touchReleased: boolean;
  value: number;
}

export interface ShaderValueButton extends ShaderValueBase {
  type: ButtonType;
  value: ShaderButton;
}

export interface ShaderAxis {
  value: number;
}

export interface ShaderValueAxis extends ShaderValueBase {
  type: AxisType;
  value: ShaderAxis;
}

// tags: <types>
export type ShaderValue =
  ShaderValueNumber |
  ShaderValueNumberVector |
  ShaderValueBool |
  ShaderValueBoolVector |
  ShaderValueEnum |
  ShaderValueSampler2D |
  ShaderValueGradient |
  ShaderValueButton |
  ShaderValueAxis;

export type ShaderType = number | number[] | ShaderTexture;

export interface LayerCodeBase extends LayerBase {
  code: string;
  values: ShaderValue[];
  timeScale: number;
  timeMode: LayerShaderTimeMode;
}

export interface LayerShader extends LayerCodeBase {
  type: "shader";
}

export interface LayerJavaScript extends LayerCodeBase {
  type: "js";
}

export interface CompiledUniformBase {
  name: string;
  parent: CompiledLayerCode;
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

export interface CompiledUniformEnum extends CompiledUniformBase {
  type: EnumType;
  shaderValue: ShaderValueEnum;
  defaultValue: number;
  enumDescription: EnumDescription;
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

export type DeviceIdentifier = string;
export type InputIdentifier = string | number;

export type ButtonControlDefaults = Record<DeviceIdentifier, InputIdentifier>;

export interface CompiledUniformButton extends CompiledUniformBase {
  type: ButtonType;
  shaderValue: ShaderValueButton;
  controlDefaults: ButtonControlDefaults;
}

export type AxisFromButtons = Record<number, InputIdentifier> & {
  default?: number;
}

export type AxisControlDefaults = Record<DeviceIdentifier, InputIdentifier | AxisFromButtons>;

export interface CompiledUniformAxis extends CompiledUniformBase {
  type: AxisType;
  shaderValue: ShaderValueAxis;
  controlDefaults: AxisControlDefaults;
}

// tags: <types>
export type CompiledUniform =
  CompiledUniformNumber |
  CompiledUniformNumberVector |
  CompiledUniformBool |
  CompiledUniformBoolVector |
  CompiledUniformEnum |
  CompiledUniformSampler2D |
  CompiledUniformGradient |
  CompiledUniformButton |
  CompiledUniformAxis;

export interface CompiledError {
  line: number;
  text: string;
}

export interface CompiledLayerBase {
  parent: CompiledLayerGroup | null;
}

export interface CompiledLayerCodeBase extends CompiledLayerBase {
  uniforms: CompiledUniform[];
  errors: CompiledError[];
}

export interface CompiledLayerShader extends CompiledLayerCodeBase {
  type: "shader";
  layer: LayerShader;
}

export interface CompiledLayerJavaScript extends CompiledLayerCodeBase {
  type: "js";
  layer: LayerJavaScript;
  handle: any;
}

export type CompiledLayerCode = CompiledLayerShader | CompiledLayerJavaScript;
export type CompiledLayer = CompiledLayerCode | CompiledLayerGroup;

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
  blendMode: "normal",
  layers: []
});

export const defaultEmptyCompiledLayerGroup = (): CompiledLayerGroup => pass<ProcessedLayerGroup>({
  type: "group",
  layer: defaultEmptyLayerGroup(),
  idToLayer: {},
  parent: null,
  timeSeconds: 0,
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

export const defaultEmptyLayerJavaScript = (): LayerJavaScript => ({
  type: "js",
  id: "",
  name: "",
  visible: true,
  opacity: 1.0,
  blendMode: "normal",
  timeMode: "normal",
  timeScale: 1.0,
  code: "",
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

export const defaultButton = (): ShaderButton => ({
  buttonHeld: false,
  buttonTriggered: false,
  buttonReleased: false,
  touchHeld: false,
  touchTriggered: false,
  touchReleased: false,
  value: 0
});

export const defaultAxis = (): ShaderAxis => ({
  value: 0
});

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

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
  EnumType |
  Sampler2DType |
  GradientType |
  ButtonType |
  AxisType;

interface ProcessedUniformBase extends CompiledUniformBase {
  parent: ProcessedLayerCode;
  location?: any;
}

interface ProcessedUniformBaseSingleLocation extends ProcessedUniformBase {
  location: WebGLUniformLocation | null;
}

interface ProcessedUniformNumber extends ProcessedUniformBaseSingleLocation, CompiledUniformNumber {
  parent: ProcessedLayerCode;
}

interface ProcessedUniformNumberVector extends ProcessedUniformBaseSingleLocation, CompiledUniformNumberVector {
  parent: ProcessedLayerCode;
}

interface ProcessedUniformBool extends ProcessedUniformBaseSingleLocation, CompiledUniformBool {
  parent: ProcessedLayerCode;
}

interface ProcessedUniformBoolVector extends ProcessedUniformBaseSingleLocation, CompiledUniformBoolVector {
  parent: ProcessedLayerCode;
}

interface ProcessedUniformEnum extends ProcessedUniformBaseSingleLocation, CompiledUniformEnum {
  parent: ProcessedLayerCode;
}

interface ProcessedUniformSampler2D extends ProcessedUniformBaseSingleLocation, CompiledUniformSampler2D {
  parent: ProcessedLayerCode;
}

interface ProcessedGradientLocation {
  t: WebGLUniformLocation;
  color: WebGLUniformLocation;
}

interface ProcessedUniformGradient extends ProcessedUniformBase, CompiledUniformGradient {
  parent: ProcessedLayerCode;
  location: ProcessedGradientLocation[] | null;
}

interface ProcessedUniformButton extends ProcessedUniformBase, CompiledUniformButton {
  parent: ProcessedLayerCode;
  locationButtonHeld: WebGLUniformLocation | null;
  locationButtonTriggered: WebGLUniformLocation | null;
  locationButtonReleased: WebGLUniformLocation | null;
  locationTouchHeld: WebGLUniformLocation | null;
  locationTouchTriggered: WebGLUniformLocation | null;
  locationTouchReleased: WebGLUniformLocation | null;
  locationValue: WebGLUniformLocation | null;
}

interface ProcessedUniformAxis extends ProcessedUniformBase, CompiledUniformAxis {
  parent: ProcessedLayerCode;
  locationValue: WebGLUniformLocation | null;
}

// tags: <types>
type ProcessedUniform =
  ProcessedUniformNumber |
  ProcessedUniformNumberVector |
  ProcessedUniformBool |
  ProcessedUniformBoolVector |
  ProcessedUniformEnum |
  ProcessedUniformSampler2D |
  ProcessedUniformGradient |
  ProcessedUniformButton |
  ProcessedUniformAxis;

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
  gFrame: WebGLUniformLocation | null;
  gPreviousLayer: WebGLUniformLocation | null;
  gBlendMode: WebGLUniformLocation | null;
}

interface ProcessedLayerJavaScript extends CompiledLayerJavaScript {
  parent: ProcessedLayerGroup | null;
  uniforms: ProcessedUniform[];
  texture: WebGLTexture;
  completedRequestId: number;
  lastRequestId: number;
}

type ProcessedLayerCode = ProcessedLayerShader | ProcessedLayerJavaScript;
type ProcessedLayer = ProcessedLayerCode | ProcessedLayerGroup;

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
  enum?: any;
  controls?: any;
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

export const vectorNumberScalarConstructor = (glslType: NumberVectorType, fillValue: number = 0): number[] => {
  const parts = getNumberVectorParts(glslType);
  return vectorScalarConstructor<number>(parts.components, fillValue);
}

export const vectorBoolScalarConstructor = (glslType: BoolVectorType, fillValue: boolean = false): boolean[] => {
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

interface EnumDescription {
  stringToInt: Record<string, number>;
  intToString: Record<number, string>;
  defaultValue: number;
}

const parseEnumDescription = (enumDefinition: any): EnumDescription | null => {
  if (typeof enumDefinition !== "object" || enumDefinition === null) {
    return null;
  }

  const result: EnumDescription = {
    intToString: {},
    stringToInt: {},
    defaultValue: 0
  };

  if (Array.isArray(enumDefinition)) {
    if (enumDefinition.length === 0) {
      return null;
    }

    for (let i = 0; i < enumDefinition.length; ++i) {
      const key = enumDefinition[i];
      if (typeof key !== "string") {
        return null;
      }

      result.intToString[i] = key;
      result.stringToInt[key] = i;
    }
  } else {
    const keys = Object.keys(enumDefinition);
    if (keys.length === 0) {
      return null;
    }

    result.defaultValue = enumDefinition[keys[0]];

    for (const key of keys) {
      const enumValue = enumDefinition[key];
      if (typeof enumValue !== "number") {
        return null;
      }

      result.intToString[enumValue] = key;
      result.stringToInt[key] = enumValue;
    }
  }

  return result;
};

const validateGLSLEnum = (glslType: EnumType, value: any, validatedDefault: number, enumDescription: EnumDescription): number => {
  if (typeof value === "number") {
    // As long as it's a valid enum value
    if (enumDescription.intToString[value]) {
      return value;
    }
  } else if (typeof value === "string") {
    const enumValue = enumDescription.stringToInt[value];
    if (enumValue !== undefined) {
      return enumValue;
    }
  }

  return validatedDefault;
}

const validateGLSLSampler2D = (glslType: Sampler2DType, value: any, validatedDefault: ShaderTexture = { url: "" }): ShaderTexture => {
  if (value === undefined || value === null) {
    return validatedDefault;
  }

  if (typeof value === "object") {
    if (typeof value.url === "string") {
      return value;
    }
    return validatedDefault;
  } else {
    return { url: String(value) };
  }
}

const validateGLSLGradient = (glslType: GradientType, value: any, validatedDefault: ShaderGradient = defaultGradient()): ShaderGradient => {
  if (value === undefined || value === null) {
    return validatedDefault;
  }

  if (typeof value === "object") {
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
        color: value[key]
      })
    }
    return gradient;
  }
  return validatedDefault;
}

const validateGLSLButton = (glslType: ButtonType, value: any, validatedDefault: ShaderButton = defaultButton()): ShaderButton => {
  if (typeof value !== "object" || value === null) {
    return validatedDefault;
  }

  const isValid =
    typeof value.buttonHeld === "boolean" &&
    typeof value.buttonTriggered === "boolean" &&
    typeof value.buttonReleased === "boolean" &&
    typeof value.touchHeld === "boolean" &&
    typeof value.touchTriggered === "boolean" &&
    typeof value.touchReleased === "boolean" &&
    typeof value.value === "number";

  if (isValid) {
    return value;
  }
  return validatedDefault;
}

const validateGLSLAxis = (glslType: AxisType, value: any, validatedDefault: ShaderAxis = defaultAxis()): ShaderAxis => {
  if (typeof value !== "object" || value === null) {
    return validatedDefault;
  }

  const isValid =
    typeof value.value === "number";

  if (isValid) {
    return value;
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
// validateGLSLEnum
// validateGLSLSampler2D
// validateGLSLGradient
// validateGLSLButton
// validateGLSLAxis

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
uniform int gFrame;
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

struct gGradientStop {
  float t;
  vec4 color;
};
const int gMaxGradientStops = ${maxGradientStops};
#define gradient gGradientStop[gMaxGradientStops]

vec4 gSampleGradient(gradient stops, float t) {
  // Since the array is always a fixed size, the last entries are duplicated to fill the array
  t = t == 1.0 ? 1.0 : fract(t);
  gGradientStop prevStop = stops[0];
  prevStop.t = 0.0;
  for (int i = 0; i < gMaxGradientStops; ++i) {
    gGradientStop stop = stops[i];
    if (t < stop.t) {
      float interpolant = (t - prevStop.t) / (stop.t - prevStop.t);
      return mix(prevStop.color, stop.color, interpolant);
    }
    prevStop = stop;
  }
  return prevStop.color;
}

struct gButton {
  bool buttonHeld;
  bool buttonTriggered;
  bool buttonReleased;
  bool touchHeld;
  bool touchTriggered;
  bool touchReleased;
  float value;
};
#define button gButton

struct gAxis {
  float value;
};
#define axis gAxis

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

const blendModeEnumDescription = parseEnumDescription(blendModeList);

export type RenderCallback = (frameTimeSeconds: number) => void;
export type ControlsUpdateCallback = () => void;

export const defaultFrameTime = 1 / 60;
export const defaultFramesAheadForAsyncLayers = 2;

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

export interface SampledButton {
  buttonHeld: boolean;
  touchHeld: boolean;
  // [0, 1]
  value: number;
}

export interface SampledAxis {
  // [-1, 1]
  value: number;
}

export interface CompiledJavaScript {
  handle: any;
};

export interface JavaScriptGlobals {
  gOpacity: number,
  gResolution: [number, number],
  gTime: number,
  gFrame: number,
  gPreviousLayer: null,
  gBlendMode: number
}

export type RenderLayerCodeCallback = (compiledLayer: CompiledLayerCode, gl: WebGL2RenderingContext) => void;
export type SampleButtonCallback = (device: DeviceIdentifier, inputId: InputIdentifier) => SampledButton | null;
export type SampleAxisCallback = (device: DeviceIdentifier, inputId: InputIdentifier) => SampledAxis | null;
export type CompileJavaScriptCallback = (layer: LayerJavaScript) => CompiledJavaScript;
export type RenderJavaScriptCallback = (requestId: number, layer: CompiledLayerJavaScript, globals: JavaScriptGlobals) => void;

const getRequiredUniform = <T extends ProcessedUniform>(processedLayerShader: ProcessedLayerShader, uniformName: string): T => {
  const uniform = processedLayerShader.uniforms.find((uniform) => uniform.name === uniformName);
  if (!uniform) {
    throw new Error(`Unable to find uniform '${uniformName}'`);
  }
  return uniform as T;
};

export class RaverieVisualizer {
  public readonly gl: WebGL2RenderingContext;
  private readonly loadTexture: LoadTextureFunction;

  private textureCache: Record<string, WebGLTexture | undefined> = {};

  private readonly vertexShader: WebGLShader;

  // For rendering checker-board "transparent" background
  private readonly checkerboardShader: ProcessedLayerShader;
  private readonly checkerboardSize: ProcessedUniformNumber;

  // For copying the final result to the back buffer
  private readonly copyShader: ProcessedLayerShader;

  // For rendering externally provided images such as JavaScript layers
  private readonly customTextureShader: ProcessedLayerShader;
  private readonly customTextureUniform: ProcessedUniformSampler2D;
  private customTexture: WebGLTexture | null = null;

  private lastTimeStampMs: number = -1;
  private frame: number = -1;
  private isRenderingInternal = false;

  public onBeforeRender: RenderCallback | null = null;

  public onBeforeControlsUpdate: ControlsUpdateCallback | null = null;
  public onSampleButton: SampleButtonCallback | null = null;
  public onSampleAxis: SampleAxisCallback | null = null;

  public onCompileJavaScriptLayer: CompileJavaScriptCallback | null = null;
  public onRenderJavaScriptLayer: RenderJavaScriptCallback | null = null;

  public get isRendering() {
    return this.isRenderingInternal;
  }

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
    this.checkerboardSize = getRequiredUniform(this.checkerboardShader, "checkerPixelSize");

    this.copyShader = this.compileLayerShader({
      ...defaultEmptyLayerShader(),
      blendMode: "overwrite",
      code: `
      vec4 render() {
        return texture(gPreviousLayer, gUV);
      }`
    }, null, true);

    this.customTextureShader = this.compileLayerShader({
      ...defaultEmptyLayerShader(),
      code: `
      uniform sampler2D textureInput;
      vec4 render() {
        return texture(textureInput, gUV);
      }`
    }, null, true);
    this.customTextureUniform = getRequiredUniform(this.customTextureShader, "textureInput");
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

  private createProgram(fragmentShader: string): ProcessedProgram {
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

  private createBlankTexture(): WebGLTexture {
    const texture = this.createTexture();
    const gl = this.gl;
    // By default unloaded textures are just 1x1 pixel black with no alpha (0,0,0,0)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return texture;
  }

  public compile(layerGroup: LayerGroup, mode: "clone" | "modifyInPlace" = "clone"): CompiledLayerGroup {
    // Let the user pick if we make a copy, because we're going to potentially
    // modify the group such as if we find new uniforms within the shaders
    return this.compileLayerGroup(mode === "clone"
      ? JSON.parse(JSON.stringify(layerGroup)) as LayerGroup
      : layerGroup, null);
  }

  private parseUniforms(layerCode: LayerCode, parent: ProcessedLayerCode, getUniformLocation: (name: string) => WebGLUniformLocation | null) {
    // tags: <types>
    const uniformRegex =
      /uniform\s+(int|float|vec2|vec3|vec4|ivec2|ivec3|ivec4|bool|bvec2|bvec3|bvec4|sampler2D|gradient|button|axis)\s+([a-zA-Z_][a-zA-Z0-9_]*)(.*)/gum;

    const newUniformNames: Record<string, true> = {};
    const newUniforms: NewUniform[] = [];
    for (; ;) {
      const result = uniformRegex.exec(layerCode.code);
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
    const oldShaderValues = layerCode.values.slice(0);

    const processedUniforms: ProcessedUniform[] = newUniforms.map<ProcessedUniform>((unprocessedUniform, uniformIndex) => {
      const { type, name, afterUniform } = unprocessedUniform;
      const location = getUniformLocation(name);

      let parsedComment: ProcessedComment = {};

      const commentStart = afterUniform.indexOf("//");
      if (commentStart !== -1) {
        // Check if we can parse the comment as JSON (skip 2 characters for the //)
        const commentText = afterUniform.substring(commentStart + 2);
        const innerJson = commentText.replace(/[-a-zA-Z0-9_.]+\s*:/gum, (found) => {
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
        const oldShaderValueAtIndex = layerCode.values[uniformIndex] as ShaderValue | undefined;
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
          if (type === "int") {
            const enumDescription = parsedComment.enum === "blendMode"
              ? blendModeEnumDescription
              : parseEnumDescription(parsedComment.enum);

            if (enumDescription) {
              const defaultValue = validateGLSLEnum("enum", parsedComment.default, enumDescription.defaultValue, enumDescription);
              return pass<ProcessedUniformEnum>({
                type: "enum",
                location,
                name,
                parent,
                parsedComment,
                shaderValue: {
                  name,
                  type: "enum",
                  value: validateGLSLEnum("enum", foundShaderValue?.value, defaultValue, enumDescription)
                },
                defaultValue,
                enumDescription
              });
            }
          }

          const defaultValue = validateGLSLNumber(type, parsedComment.default);
          return pass<ProcessedUniformNumber>({
            type,
            location,
            name,
            parent,
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
            parent,
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
            parent,
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
            parent,
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
            parent,
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
            parent,
            parsedComment,
            shaderValue: {
              name,
              type,
              value: validateGLSLGradient(type, foundShaderValue?.value, defaultValue)
            },
            defaultValue,
          });
        }
        case "button": {
          const locationButtonHeld = getUniformLocation(`${name}.buttonHeld`)
          const locationButtonTriggered = getUniformLocation(`${name}.buttonTriggered`)
          const locationButtonReleased = getUniformLocation(`${name}.buttonReleased`)
          const locationTouchHeld = getUniformLocation(`${name}.touchHeld`)
          const locationTouchTriggered = getUniformLocation(`${name}.touchTriggered`)
          const locationTouchReleased = getUniformLocation(`${name}.touchReleased`)
          const locationValue = getUniformLocation(`${name}.value`)

          return pass<ProcessedUniformButton>({
            type,
            location: true,
            name,
            parent,
            parsedComment,
            locationButtonHeld,
            locationButtonTriggered,
            locationButtonReleased,
            locationTouchHeld,
            locationTouchTriggered,
            locationTouchReleased,
            locationValue,
            shaderValue: {
              name,
              type,
              value: validateGLSLButton(type, foundShaderValue?.value)
            },
            controlDefaults: parsedComment.controls
          });
        }
        case "axis": {
          const locationValue = getUniformLocation(`${name}.value`)

          return pass<ProcessedUniformAxis>({
            type,
            location: true,
            name,
            parent,
            parsedComment,
            locationValue,
            shaderValue: {
              name,
              type,
              value: validateGLSLAxis(type, foundShaderValue?.value)
            },
            controlDefaults: parsedComment.controls
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
    layerCode.values.length = 0;
    layerCode.values.push(...processedUniforms.map((processedUniform) =>
      processedUniform.shaderValue));

    return processedUniforms;
  }

  private compileLayerShader(layerShader: LayerShader, parent: ProcessedLayerGroup | null, throwOnError = false): ProcessedLayerShader {
    const gl = this.gl;
    const processedProgram = this.createProgram(layerShader.code);

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
      gFrame: getUniformLocation("gFrame"),
      gPreviousLayer: getUniformLocation("gPreviousLayer"),
      gBlendMode: getUniformLocation("gBlendMode"),
    };

    processedLayerShader.uniforms = this.parseUniforms(layerShader, processedLayerShader, getUniformLocation);
    return processedLayerShader;
  }

  private compileLayerJavaScript(layerJavaScript: LayerJavaScript, parent: ProcessedLayerGroup | null): ProcessedLayerJavaScript {
    const processedLayerJavaScript: ProcessedLayerJavaScript = {
      type: "js",
      layer: layerJavaScript,
      handle: null,
      uniforms: [],
      parent,
      errors: [],
      texture: this.createBlankTexture(),
      completedRequestId: -1,
      lastRequestId: -1,
    };

    if (this.onCompileJavaScriptLayer) {
      const result = this.onCompileJavaScriptLayer(layerJavaScript);
      processedLayerJavaScript.handle = result.handle;
      processedLayerJavaScript.uniforms = this.parseUniforms(layerJavaScript, processedLayerJavaScript, () => null);
    }

    return processedLayerJavaScript;
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
      } else if (layer.type === "js") {
        const processedLayerJavaScript = this.compileLayerJavaScript(layer, processedLayerGroup);
        processedLayerGroup.layers.push(processedLayerJavaScript);
        mapLayerById(processedLayerJavaScript);
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

    const newTexture = this.createBlankTexture();
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
    onRender?: RenderLayerCodeCallback) {
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
      gl.uniform1f(processedLayerShader.gFrame, this.frame);

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
          case "enum": {
            const validatedValue = validateGLSLEnum(processedUniform.type, value,
              processedUniform.defaultValue, processedUniform.enumDescription);
            gl.uniform1i(processedUniform.location, validatedValue);
            break;
          }
          case "sampler2D": {
            // Special case for customTextureUniform as we manually set this texture internally
            if (processedUniform === this.customTextureUniform) {
              gl.activeTexture(gl.TEXTURE0 + textureSamplerIndex);
              gl.bindTexture(gl.TEXTURE_2D, this.customTexture);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
              gl.uniform1i(processedUniform.location, textureSamplerIndex);
              ++textureSamplerIndex;
              break;
            }

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
          case "button": {
            const validatedValue = validateGLSLButton(processedUniform.type, value);
            gl.uniform1i(processedUniform.locationButtonHeld, Number(validatedValue.buttonHeld));
            gl.uniform1i(processedUniform.locationButtonTriggered, Number(validatedValue.buttonTriggered));
            gl.uniform1i(processedUniform.locationButtonReleased, Number(validatedValue.buttonReleased));
            gl.uniform1i(processedUniform.locationTouchHeld, Number(validatedValue.touchHeld));
            gl.uniform1i(processedUniform.locationTouchTriggered, Number(validatedValue.touchTriggered));
            gl.uniform1i(processedUniform.locationTouchReleased, Number(validatedValue.touchReleased));
            gl.uniform1f(processedUniform.locationValue, validatedValue.value);
            break;
          }
          case "axis": {
            const validatedValue = validateGLSLAxis(processedUniform.type, value);
            gl.uniform1f(processedUniform.locationValue, validatedValue.value);
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

    this.checkerboardSize.shaderValue.value = checkerSize;
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
    onRender: RenderLayerCodeCallback,
    checkerSize: number = DEFAULT_CHECKER_SIZE) {
    if (this.isRenderingInternal) {
      throw new Error("A frame is currently being rendered, wait for the promise returned by 'render()' or check 'isRendering'");
    }

    try {
      this.isRenderingInternal = true;
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
          const opacity = processedLayer.layer.opacity;
          processedLayer.layer.opacity = 1.0;
          this.renderLayerShaderInternal(
            processedLayer,
            1,
            frameBuffer,
            checkerTexture,
            targetsInternal.widthInternal,
            targetsInternal.heightInternal,
            timeSeconds,
            onRender);
          processedLayer.layer.blendMode = blendMode;
          processedLayer.layer.opacity = opacity;
        } else if (processedLayer.type === "js") {
          this.customTexture = processedLayer.texture;
          this.customTextureShader.layer.blendMode = "normal";
          this.customTextureShader.layer.opacity = 1;
          this.customTextureShader.layer.id = processedLayer.layer.id;
          this.renderLayerShaderInternal(
            this.customTextureShader,
            1,
            frameBuffer,
            checkerTexture,
            targetsInternal.widthInternal,
            targetsInternal.heightInternal,
            timeSeconds,
            onRender);
          this.customTextureShader.layer.id = "";
        }
      }
      return results;
    } finally {
      this.isRenderingInternal = false;
    }
  };

  private updateControls(compiledLayerGroup: CompiledLayerGroup) {
    if (!this.onSampleButton || !this.onSampleAxis) {
      return
    }
    const onSampleButton = this.onSampleButton;
    const onSampleAxis = this.onSampleAxis;

    if (this.onBeforeControlsUpdate) {
      this.onBeforeControlsUpdate();
    }

    const walk = (compiledLayer: CompiledLayer) => {
      if (compiledLayer.type === "group") {
        for (const childLayer of compiledLayer.layers) {
          walk(childLayer);
        }
      } else {
        for (const uniform of compiledLayer.uniforms) {
          if (uniform.type === "button") {
            const cumulativeButton: SampledButton = {
              buttonHeld: false,
              touchHeld: false,
              value: 0,
            };

            // TODO(trevor): In the future, we want the control defaults/bindings to be modifiable
            // basically we almost want that to be the "shader value", maybe in the future we'll have it all
            for (const deviceId in uniform.controlDefaults) {
              const buttonInputId = uniform.controlDefaults[deviceId];
              const sampledButton = onSampleButton(deviceId, buttonInputId);
              if (sampledButton) {
                cumulativeButton.buttonHeld ||= sampledButton.buttonHeld;
                cumulativeButton.touchHeld ||= sampledButton.touchHeld;
                cumulativeButton.value = Math.max(cumulativeButton.value, sampledButton.value);
              }
            }

            const prevButtonHeld = uniform.shaderValue.value.buttonHeld;
            const prevTouchHeld = uniform.shaderValue.value.touchHeld;

            uniform.shaderValue.value = {
              buttonHeld: cumulativeButton.buttonHeld,
              buttonTriggered: cumulativeButton.buttonHeld && !prevButtonHeld,
              buttonReleased: !cumulativeButton.buttonHeld && prevButtonHeld,
              touchHeld: cumulativeButton.touchHeld,
              touchTriggered: cumulativeButton.touchHeld && !prevTouchHeld,
              touchReleased: !cumulativeButton.touchHeld && prevTouchHeld,
              value: cumulativeButton.value
            };
          } else if (uniform.type === "axis") {
            let cumulativeAxis = 0;
            let cumulativeAxisFromButtons = 0;

            // TODO(trevor): In the future, we want the control defaults/bindings to be modifiable
            // basically we almost want that to be the "shader value", maybe in the future we'll have it all
            for (const deviceId in uniform.controlDefaults) {
              const axisInputId = uniform.controlDefaults[deviceId];

              if (typeof axisInputId === "object") {
                const axisFromButtons = axisInputId;
                let pressedButtonCount = 0;
                let axis = 0;
                for (const key in axisFromButtons) {
                  const buttonInputId = axisFromButtons[key];
                  if (key !== "default") {
                    const valueIfPressed = Number(key);
                    const sampledButton = onSampleButton(deviceId, buttonInputId);
                    if (sampledButton && sampledButton.buttonHeld) {
                      axis = valueIfPressed;
                      ++pressedButtonCount;
                    }
                  }
                }

                // We only set the axis value if we press a single button
                // this prevents having to choose a "winner" if multiple buttons are pressed
                // Adding values together also does not work well, especially if you have
                // an axis whose value defaults to any value other than 0, and pressing a
                // button should make it go to 0
                axis = pressedButtonCount === 1
                  ? axis
                  : axisFromButtons.default || 0;

                if (Math.abs(axis) > Math.abs(cumulativeAxisFromButtons)) {
                  cumulativeAxisFromButtons = clamp(axis, -1, 1);
                }
              } else {
                const sampledAxis = onSampleAxis(deviceId, axisInputId);
                if (sampledAxis && Math.abs(sampledAxis.value) > Math.abs(cumulativeAxis)) {
                  cumulativeAxis = sampledAxis.value;
                }
              }
            }

            if (cumulativeAxis === 0) {
              uniform.shaderValue.value.value = cumulativeAxisFromButtons;
            } else {
              uniform.shaderValue.value.value = cumulativeAxis;
            }
          }
        }
      }
    };

    walk(compiledLayerGroup);
  }

  public renderCompletedForJavaScriptLayer(requestId: number, compiledLayer: CompiledLayerJavaScript, image: ImageBitmap | null) {
    const processedLayer = compiledLayer as ProcessedLayerJavaScript;
    if (requestId > processedLayer.completedRequestId) {
      processedLayer.completedRequestId = requestId;

      if (image) {
        const gl = this.gl;

        // Get the bound texture so we can revert back to it after this change (don't change GL state)
        const boundTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
        gl.bindTexture(gl.TEXTURE_2D, processedLayer.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.bindTexture(gl.TEXTURE_2D, boundTexture);
      }
    }
  }

  public render(
    compiledLayerGroup: CompiledLayerGroup,
    timeStampMs: number,
    renderTargets: RenderTargets,
    options?: RenderOptions): number {
    if (this.isRenderingInternal) {
      throw new Error("A frame is currently being rendered, check 'isRendering'");
    }

    try {
      this.isRenderingInternal = true;
      const processedLayerGroup = compiledLayerGroup as ProcessedLayerGroup;
      const frameTimeSeconds = this.lastTimeStampMs === -1
        ? defaultFrameTime
        : (timeStampMs - this.lastTimeStampMs) / 1000;
      this.lastTimeStampMs = timeStampMs;
      ++this.frame;

      if (this.onBeforeRender) {
        this.onBeforeRender(frameTimeSeconds);
      }

      this.updateControls(compiledLayerGroup);

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
          } else if (layer.type === "js") {
            if (this.onRenderJavaScriptLayer) {
              if (layer.lastRequestId - layer.completedRequestId < defaultFramesAheadForAsyncLayers) {
                const blendModeIndex = blendModeToIndex[layer.layer.blendMode];
                const globals: JavaScriptGlobals = {
                  gBlendMode: blendModeIndex,
                  gOpacity: layer.layer.opacity * parentOpacity,
                  gResolution: [targetsInternal.widthInternal, targetsInternal.heightInternal],
                  gPreviousLayer: null,
                  gTime: timeSeconds,
                  gFrame: this.frame
                };

                ++layer.lastRequestId;
                this.onRenderJavaScriptLayer(layer.lastRequestId, layer, globals);
              }

              this.customTexture = layer.texture;
              this.customTextureShader.layer.blendMode = layer.layer.blendMode;
              this.customTextureShader.layer.opacity = layer.layer.opacity;
              renderTargetIndex = Number(!renderTargetIndex);
              this.renderLayerShaderInternal(
                this.customTextureShader,
                groupOpacity,
                targetsInternal.targets[renderTargetIndex].buffer,
                targetsInternal.targets[Number(!renderTargetIndex)].texture,
                targetsInternal.widthInternal,
                targetsInternal.heightInternal,
                timeSeconds);
              this.customTextureShader.layer.blendMode = "normal";
              this.customTextureShader.layer.opacity = 1;
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
    } finally {
      this.isRenderingInternal = false;
    }
  }
}
