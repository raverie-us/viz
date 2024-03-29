const MINIMAL_REBUILD_ENABLED = false;

export interface LayerObject {
  name: string;
  id: string;
  visible: boolean;
  authorName?: string;
  authorUrl?: string;
}

export interface LayerBase extends LayerObject {
  opacity: number;
  blendMode: LayerBlendMode;
}

export type LayerCode = LayerShader | LayerJavaScript | LayerSDF;
export type Layer = LayerCode | LayerGroup;
export type LayerGroupChild = LayerShader | LayerJavaScript | LayerGroup;
export type LayerWithChildren = LayerGroup | LayerShader | LayerSDF;

export interface LayerGroup extends LayerBase {
  type: "group";
  layers: LayerGroupChild[];
}

export interface LayerRoot extends LayerGroup {
  width: number;
  height: number;
}

export type LayerBlendMode =
  "passThrough" |

  "normal" |
  "dissolve" |
  "overwrite" |
  "mask" |
  "none" |

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
  "passThrough",

  "normal",
  "dissolve",
  "overwrite",
  "mask",
  "none",

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
  "overwrite",
  "mask",
  "none",
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

export const blendModeDisplayGroup: (LayerBlendMode | null)[] = [
  "passThrough",
  null,
  ...blendModeDisplay
];

export type NumberType = "int" | "float";
export type NumberVectorType = "vec2" | "vec3" | "vec4" | "ivec2" | "ivec3" | "ivec4";
export type BoolType = "bool";
export type BoolVectorType = "bvec2" | "bvec3" | "bvec4";
export type EnumType = "enum";
export type Sampler2DType = "sampler2D";
export type GradientType = "gradient";
export type ButtonType = "button";
export type AxisType = "axis";
export type VectorType = BoolVectorType | NumberVectorType;

export interface CurveInputTime {
  type: "time";
  duration: number;
}

export interface CurveInputButton {
  type: ButtonType;
  bindings: ShaderButtonBindings;
}

export interface CurveInputAxis {
  type: AxisType;
  bindings: ShaderAxisBindings;
}

export interface CurveInputAudioReactiveScalar {
  type: "audioReactiveScalar";
}

export interface CurveInputAudioVolume {
  type: "audioVolume";
}

export interface CurveInputAudioVolumeAverage {
  type: "audioVolumeAverage";
}

export interface Curve {
  min?: number;
  max?: number;
}

export type CurveInput =
  CurveInputTime |
  CurveInputButton |
  CurveInputAxis |
  CurveInputAudioReactiveScalar |
  CurveInputAudioVolume |
  CurveInputAudioVolumeAverage;

export interface CurveWithInput extends Curve {
  input?: CurveInput;
}

export const evaluateCurve = (curve: Curve, inputValue: number) => {
  // For now we don't actually have a curve, we're just pretending it's linear
  const min = curve.min === undefined ? 0 : curve.min;
  const max = curve.max === undefined ? 1 : curve.max;
  return min + (max - min) * inputValue;
}

const validateCurve = (value: any): CurveWithInput | undefined => {
  const isCurveWithInput =
    typeof value === "object" &&
    value &&
    (value.min === undefined || typeof value.min === "number") &&
    (value.max === undefined || typeof value.max === "number") &&
    (value.input === undefined || typeof value.input === "object" && value.input);

  if (isCurveWithInput) {
    return value as CurveWithInput;
  }
  return undefined;
}

const validateCurves = (type: VectorType, value: any): (CurveWithInput | undefined)[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const components = getVectorComponents(type);
  value.length = components;

  for (let i = 0; i < components; ++i) {
    value[i] = validateCurve(value[i]);
  }

  return value;
}

const extractCurve = (foundShaderValue: ShaderValueWithCurves | null, defaultCurve: CurveWithInput | undefined | null) => {
  // If we had a previous value, then we never attach the defaultCurve (always just use the previous)
  if (foundShaderValue) {
    return validateCurve(foundShaderValue.curve);
  }
  return defaultCurve;
}

const extractCurves = (type: VectorType, foundShaderValue: ShaderValueWithCurves | null, defaultCurve: (CurveWithInput | undefined | null)[] | undefined | null) => {
  // If we had a previous value, then we never attach the defaultCurve (always just use the previous)
  if (foundShaderValue) {
    return validateCurves(type, foundShaderValue.curve);
  }
  return defaultCurve;
}

export interface ShaderValueBase {
  name: string;
}

export interface ShaderValueNumber extends ShaderValueBase {
  type: NumberType;
  value: number;
  curve?: CurveWithInput | null;
}

export interface ShaderValueNumberVector extends ShaderValueBase {
  type: NumberVectorType;
  value: number[];
  curve?: (CurveWithInput | undefined | null)[] | null;
}

export interface ShaderValueBool extends ShaderValueBase {
  type: BoolType;
  value: boolean;
  curve?: CurveWithInput | null;
}

export interface ShaderValueBoolVector extends ShaderValueBase {
  type: BoolVectorType;
  value: boolean[];
  curve?: (CurveWithInput | undefined | null)[] | null;
}

export interface ShaderValueWithCurves extends ShaderValueBase {
  curve?: CurveWithInput | null | (CurveWithInput | undefined | null)[];
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

interface ShaderButtonState {
  buttonHeld: boolean;
  buttonTriggered: boolean;
  buttonReleased: boolean;
  buttonTriggeredTimestamp: number;
  buttonReleasedTimestamp: number;
  touchHeld: boolean;
  touchTriggered: boolean;
  touchReleased: boolean;
  touchTriggeredTimestamp: number;
  touchReleasedTimestamp: number;
  value: number;
}

export type DeviceIdentifier = string;
export type InputIdentifier = string | number;

export type ShaderButtonBindings = Record<DeviceIdentifier, InputIdentifier>;

export interface ShaderValueButton extends ShaderValueBase {
  type: ButtonType;
  value: ShaderButtonBindings;
}

interface ShaderAxisState {
  value: number;
}

export type ShaderAxisBindings = Record<DeviceIdentifier, InputIdentifier | AxisFromButtons>;

export interface ShaderValueAxis extends ShaderValueBase {
  type: AxisType;
  value: ShaderAxisBindings;
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

export interface LayerCodeBase extends LayerBase {
  code: string;
  values: ShaderValue[];
}

export interface LayerSDF extends LayerObject {
  type: "sdf";

  code: string;
  values: ShaderValue[];

  layers: LayerSDF[];
};

export interface LayerShader extends LayerCodeBase {
  type: "shader";

  layers?: LayerSDF[];
}

export interface LayerJavaScript extends LayerCodeBase {
  type: "js";
}

export interface CompiledUniformBase {
  name: string;
  nameMangleIndices: number[];
  parent: CompiledLayerCode;
  parsedComment: Record<string, any>;
}

export interface CompiledUniformNumber extends CompiledUniformBase {
  type: NumberType;
  shaderValue: ShaderValueNumber;
  defaultValue: number;
  defaultCurve?: CurveWithInput | null;
  minValue: number;
  maxValue: number;
  stepValue: number;
}

export interface CompiledUniformNumberVector extends CompiledUniformBase {
  type: NumberVectorType;
  shaderValue: ShaderValueNumberVector;
  defaultValue: number[];
  defaultCurve?: (CurveWithInput | undefined | null)[];
  minValue: number[];
  maxValue: number[];
  stepValue: number[];
}

export interface CompiledUniformBool extends CompiledUniformBase {
  type: BoolType;
  shaderValue: ShaderValueBool;
  defaultValue: boolean;
  defaultCurve?: CurveWithInput | null;
}

export interface CompiledUniformBoolVector extends CompiledUniformBase {
  type: BoolVectorType;
  shaderValue: ShaderValueBoolVector;
  defaultValue: boolean[];
  defaultCurve?: (CurveWithInput | undefined | null)[];
}

export interface CompiledUniformEnum extends CompiledUniformBase {
  type: EnumType;
  shaderValue: ShaderValueEnum;
  defaultValue: string;
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

export interface CompiledUniformButton extends CompiledUniformBase {
  type: ButtonType;
  shaderValue: ShaderValueButton;
  defaultValue: ShaderButtonBindings;
}

export type AxisFromButtons = Record<number, InputIdentifier> & {
  default?: number;
}

export interface CompiledUniformAxis extends CompiledUniformBase {
  type: AxisType;
  shaderValue: ShaderValueAxis;
  defaultValue: ShaderAxisBindings;
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

export interface CompiledLayerObject {
}

export interface CompiledLayerBase extends CompiledLayerObject {
  parent: CompiledLayerGroup | null;
  usesAudioInput: boolean;
}

export interface CompiledLayerCodeBase extends CompiledLayerBase {
  code: string;
  uniforms: CompiledUniform[];
  errors: CompiledError[];
}

interface SDFParam {
  name: string;
};

export interface CompiledLayerSDF extends CompiledLayerObject {
  type: "sdf";
  layer: LayerSDF;
  layers: CompiledLayerSDF[];
  parent: CompiledLayerSDF | CompiledLayerShader | null;

  usesAudioInput: boolean;

  code: string;
  uniforms: CompiledUniform[];
  errors: CompiledError[];
  functionNameMangleIndex: number;
  mangledId: string;

  sdfParameters: SDFParam[];
  variadicSdf: boolean;
  attributes: SDFFunctionAttributes;

  shaderNodes: SDFShaderNode[];
  allChildShaderNodes: SDFShaderNode[];
  sdfId: number;
}

export interface CompiledLayerShader extends CompiledLayerCodeBase {
  type: "shader";
  layer: LayerShader;

  layers: CompiledLayerSDF[];
  sdfTreeResult: SDFShaderTreeResult | null;
  sdfUniforms: CompiledUniform[];
  combinedUniforms: CompiledUniform[];
}

export interface CompiledLayerJavaScript extends CompiledLayerCodeBase {
  type: "js";
  layer: LayerJavaScript;
  handle: any;
}

export type CompiledLayerCode = CompiledLayerShader | CompiledLayerJavaScript | CompiledLayerSDF;
export type CompiledLayer = CompiledLayerCode | CompiledLayerGroup;
export type CompiledLayerWithChildren = CompiledLayerGroup | CompiledLayerShader | CompiledLayerSDF;

export interface CompiledLayerGroup extends CompiledLayerBase {
  type: "group";
  layer: LayerGroup;
  layers: CompiledLayer[];
}

export interface CompiledLayerRoot extends CompiledLayerGroup {
  layer: LayerRoot;

  // A complete flattened hierarchy of every layer (recursive) under this group
  idToLayer: Record<string, CompiledLayer>;
}

export const defaultEmptyLayerGroup = (): LayerGroup => ({
  type: "group",
  id: "",
  name: "",
  visible: true,
  opacity: 1.0,
  blendMode: "passThrough",
  layers: []
});

export const defaultWidth = 360;
export const defaultHeight = 640;

export const defaultEmptyLayerRoot = (): LayerRoot => ({
  ...defaultEmptyLayerGroup(),
  width: defaultWidth,
  height: defaultHeight
});

export const defaultEmptyCompiledLayerGroup = (): CompiledLayerGroup => pass<ProcessedLayerGroup>({
  type: "group",
  layer: defaultEmptyLayerGroup(),
  parent: null,
  layers: [],
  usesAudioInput: false
});

export const defaultEmptyCompiledLayerRoot = (): CompiledLayerRoot => pass<ProcessedLayerRoot>({
  type: "group",
  layer: defaultEmptyLayerRoot(),
  idToLayer: {},
  parent: null,
  layers: [],
  usesAudioInput: false
});

export const defaultEmptyLayerShader = (): LayerShader => ({
  type: "shader",
  id: "",
  name: "",
  visible: true,
  opacity: 1.0,
  blendMode: "normal",
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
  code: "",
  values: []
});

export const wrapLayerInLayerGroup = (layer: LayerGroupChild): LayerGroup => ({
  ...defaultEmptyLayerGroup(),
  layers: [layer]
});

export const wrapLayerInLayerRoot = (layer: LayerGroupChild): LayerRoot => ({
  ...defaultEmptyLayerRoot(),
  layers: [layer]
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

export const defaultButtonBindings = (): ShaderButtonBindings => ({});
export const defaultAxisBindings = (): ShaderAxisBindings => ({});

const defaultButtonState = (): ShaderButtonState => ({
  buttonHeld: false,
  buttonTriggered: false,
  buttonReleased: false,
  buttonTriggeredTimestamp: 0,
  buttonReleasedTimestamp: 0,
  touchHeld: false,
  touchTriggered: false,
  touchReleased: false,
  touchTriggeredTimestamp: 0,
  touchReleasedTimestamp: 0,
  value: 0
});

const defaultAxisState = (): ShaderAxisState => ({
  value: 0
});

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

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
  parent: LayerWithChildren;
}
export const findChildLayerAndParentById = (root: LayerWithChildren, id: string): FoundLayer | null => {
  if (!root.layers) {
    return null;
  }

  for (let i = 0; i < root.layers.length; ++i) {
    const childLayer = root.layers[i];
    if (childLayer.id === id) {
      return {
        layer: childLayer,
        layerIndex: i,
        parent: root
      }
    }

    if ("layers" in childLayer) {
      const result = findChildLayerAndParentById(childLayer, id);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

export const removeLayer = (root: LayerWithChildren, id: string): boolean => {
  const result = findChildLayerAndParentById(root, id);
  if (!result || !result.parent.layers) {
    return false;
  }
  result.parent.layers.splice(result.layerIndex, 1);
  return true;
};

export const canParentLayer = (parent: Layer, child: Layer): LayerWithChildren | null => {
  if (parent.type === "group") {
    if (child.type === "group" || child.type === "shader" || child.type === "js") {
      return parent;
    }
  }

  if (parent.type === "shader" || parent.type === "sdf") {
    if (child.type === "sdf") {
      return parent;
    }
  }
  return null;
}

const addLayerIfValid = (parent: Layer, layerToAdd: Layer, layerIndex = 0): boolean => {
  const validParent = canParentLayer(parent, layerToAdd);
  if (validParent) {
    if (!validParent.layers) {
      validParent.layers = [];
    }

    validParent.layers.splice(layerIndex, 0, layerToAdd as any);
    return true;
  }
  return false;
}

export const addLayer = (root: LayerWithChildren, layerToAdd: Layer, relativeToId?: string): boolean => {
  if (!relativeToId) {
    return addLayerIfValid(root, layerToAdd);
  }

  const result = findChildLayerAndParentById(root, relativeToId);
  if (!result) {
    return addLayerIfValid(root, layerToAdd);
  }

  // First attempt to add it to the parent, if that does not work
  // then attempt to add it to the relative target as well
  if (addLayerIfValid(result.parent, layerToAdd, result.layerIndex)) {
    return true;
  }

  return addLayerIfValid(result.layer, layerToAdd);
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

interface ProcessedButtonLocation {
  buttonHeld: WebGLUniformLocation | null;
  buttonTriggered: WebGLUniformLocation | null;
  buttonReleased: WebGLUniformLocation | null;
  buttonTriggeredTimestamp: WebGLUniformLocation | null;
  buttonReleasedTimestamp: WebGLUniformLocation | null;
  touchHeld: WebGLUniformLocation | null;
  touchTriggered: WebGLUniformLocation | null;
  touchReleased: WebGLUniformLocation | null;
  touchTriggeredTimestamp: WebGLUniformLocation | null;
  touchReleasedTimestamp: WebGLUniformLocation | null;
  value: WebGLUniformLocation | null;
}

interface ProcessedUniformButton extends ProcessedUniformBase, CompiledUniformButton {
  parent: ProcessedLayerCode;
  location: ProcessedButtonLocation;
}

interface ProcessedAxisLocation {
  value: WebGLUniformLocation | null;
}

interface ProcessedUniformAxis extends ProcessedUniformBase, CompiledUniformAxis {
  parent: ProcessedLayerCode;
  location: ProcessedAxisLocation;
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
  nameMangleIndices: number[];
  afterUniform: string;
}

interface ProcessedLayerSDF extends CompiledLayerSDF {
  uniforms: ProcessedUniform[];
}

interface ProcessedLayerShader extends CompiledLayerShader {
  parent: ProcessedLayerGroup | null;
  uniforms: ProcessedUniform[];
  sdfUniforms: ProcessedUniform[];
  combinedUniforms: ProcessedUniform[];
  program: WebGLProgram | null;

  // Global uniforms (entirely possible to be null if they are unused)
  gOpacity: WebGLUniformLocation | null;
  gResolution: WebGLUniformLocation | null;
  gTime: WebGLUniformLocation | null;
  gFrame: WebGLUniformLocation | null;
  gPreviousLayer: WebGLUniformLocation | null;
  gBlendMode: WebGLUniformLocation | null;
  gFlipY: WebGLUniformLocation | null;
  gZero: WebGLUniformLocation | null;
  gSdfHighlightId: WebGLUniformLocation | null;

  gAudioFrequencies: WebGLUniformLocation | null;
  gAudioSamples: WebGLUniformLocation | null;
  gAudioVolume: WebGLUniformLocation | null;
  gAudioVolumeAverage: WebGLUniformLocation | null;
  gAudioVolumePeak: WebGLUniformLocation | null;
  gAudioVolumeTrough: WebGLUniformLocation | null;
  gAudioReactiveScalar: WebGLUniformLocation | null;
}

interface ProcessedLayerJavaScript extends CompiledLayerJavaScript {
  parent: ProcessedLayerGroup | null;
  uniforms: ProcessedUniform[];
  texture: WebGLTexture;
  completedRequestId: number;
  lastRequestId: number;
}

type ProcessedLayerCode = ProcessedLayerShader | ProcessedLayerJavaScript | ProcessedLayerSDF;
type ProcessedLayer = ProcessedLayerCode | ProcessedLayerGroup;

type IdToLayer = Record<string, ProcessedLayer>;

interface ProcessedLayerGroup extends CompiledLayerGroup {
  parent: ProcessedLayerGroup | null;
  layers: ProcessedLayer[];
}

interface ProcessedLayerRoot extends ProcessedLayerGroup {
  parent: null;
  layer: LayerRoot;

  idToLayer: IdToLayer;
}

// This type contains all the possible attributes for all types
interface ProcessedComment {
  default?: any;
  min?: any;
  max?: any;
  step?: any;
  enum?: any;
  curve?: any;
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
  completeCode: string;
  error?: string;
}

interface RenderTarget {
  parent: RenderTargets;
  width: number;
  height: number;
  texture: WebGLTexture;
  buffer: WebGLFramebuffer;
  useCount: number;
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

export const getVectorComponents = (glslType: BoolVectorType | NumberVectorType): number =>
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
  const components = getVectorComponents(glslType);
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

const validateGLSLBool = (glslType: BoolType, value: any, validatedDefault: boolean = false): boolean => {
  if (value === undefined || value === null) {
    return validatedDefault;
  }

  if (typeof value === "number") {
    return value >= 0.5;
  }

  return Boolean(value);
}

const validateGLSLBoolVector = (
  glslType: BoolVectorType,
  value: any,
  validatedDefault: boolean[] = vectorBoolScalarConstructor(glslType)): boolean[] => {
  if (!Array.isArray(value)) {
    return validatedDefault;
  }

  const components = getVectorComponents(glslType);
  const result: boolean[] = [];
  for (let i = 0; i < components; ++i) {
    result[i] = validateGLSLBool("bool", value[i], validatedDefault[i]);
  }
  return result;
}

interface EnumDescription {
  stringToInt: Record<string, number>;
  intToString: Record<number, string>;
  defaultValue: string;
}

const parseEnumDescription = (enumDefinition: any): EnumDescription | null => {
  if (typeof enumDefinition !== "object" || enumDefinition === null) {
    return null;
  }

  const result: EnumDescription = {
    intToString: {},
    stringToInt: {},
    defaultValue: ""
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

    result.defaultValue = keys[0];

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

const validateGLSLEnum = (glslType: EnumType, value: any, validatedDefault: string, enumDescription: EnumDescription): string => {
  if (typeof value === "number") {
    // As long as it's a valid enum value
    const stringValue = enumDescription.intToString[value];
    if (stringValue) {
      return stringValue;
    }
  } else if (typeof value === "string") {
    const enumValue = enumDescription.stringToInt[value];
    if (enumValue !== undefined) {
      return value;
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

const validateGLSLButton = (glslType: ButtonType, value: any, validatedDefault: ShaderButtonBindings = defaultButtonBindings()): ShaderButtonBindings => {
  if (typeof value !== "object" || value === null) {
    return validatedDefault;
  }
  // TODO(trevor): Validate the types of all keys and values?
  return value;
}

const validateGLSLAxis = (glslType: AxisType, value: any, validatedDefault: ShaderAxisBindings = defaultAxisBindings()): ShaderAxisBindings => {
  if (typeof value !== "object" || value === null) {
    return validatedDefault;
  }
  // TODO(trevor): Validate the types of all keys and values (including axis from buttons)?
  return value;
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

export interface UserTexture {
  url: string;
  texture: WebGLTexture;
  gl: WebGL2RenderingContext;
  handle: any;
}

export type LoadTextureFunction = (userTexture: UserTexture) => void;
export type UpdateTextureFunction = (userTexture: UserTexture) => boolean;

export const maxGradientStops = 16;


interface SDFFunctionAttributes {
  halfExtents?: string;
};

interface SDFShaderNode {
  id: number;
  sdf: CompiledLayerSDF;
  children: SDFShaderNode[];
};

interface SDFShaderTreeResult {
  root: SDFShaderNode;
  nodeCount: number;
  allValidSdfs: CompiledLayerSDF[];
  shaderNodeIdToObject: Record<number, CompiledLayerSDF>;
  objectIdToShaderNodes: Record<string, SDFShaderNode[]>;
};

const sdfVariadicMax = 64;
const sdfNoHitId = 0xffffffff;
const sdfHighlightNone = 0xffffffff;

const sdfUnion: LayerSDF = {
  type: "sdf",
  name: "union",
  id: "union",
  visible: true,
  values: [],
  layers: [],
  code: `
gSdfResult map(inout gSdfContext context, gSdfVariadic variadic) {
  gSdfResult result = gSdfMap(context, variadic.sdfs[0]);
  for (int i = 1; i < variadic.count; ++i) {
    gSdfResult next = gSdfMap(context, variadic.sdfs[i]);
    if (next.distance < result.distance) {
      result = next;
    }
  }
  return result;
}`.trim(),
};

const idToMangleId = (name: string) =>
  name.replace(/[^a-zA-Z0-9_]/gum, "_").replace(/__+/gum, "_");

const debugShaderTree = (root: SDFShaderNode) => {
  let graph = 'digraph {\n';
  const recurse = (node: SDFShaderNode) => {
    graph += `${node.id} [label="${node.sdf.layer.name}"]\n`;
    for (const child of node.children) {
      graph += `${node.id} -> ${child.id}\n`;
      recurse(child);
    }
  };
  recurse(root);
  graph += '}\n';
  return graph;
}

const addLineNumbers = (text: string, firstLine = 1) => {
  const lines = text.split("\n");
  const numberLength = (lines.length - 1 + firstLine).toString().length;
  return lines.map((line, index) =>
    `${(index + firstLine).toString().padStart(numberLength, "0")}: ${line}`).join("\n");
}

const newlineRegex = /\r|\n|\r\n/u;
const fragmentShaderHeader = `#version 300 es
precision highp float;
const float gPI = acos(-1.0);
const float gPI2 = gPI * 2.0;
const float gPositiveInfinity = intBitsToFloat(0x7F800000);
in vec2 gPosition;
in vec2 gUV;
out vec4 gFragColor;
uniform sampler2D gPreviousLayer;
uniform float gOpacity;
uniform vec2 gResolution;
uniform float gTime;
uniform int gFrame;
uniform int gBlendMode;
uniform int gZero;

uniform sampler2D gAudioFrequencies;
uniform sampler2D gAudioSamples;
uniform float gAudioVolume;
uniform float gAudioVolumeAverage;
uniform float gAudioVolumePeak;
uniform float gAudioVolumeTrough;
uniform float gAudioReactiveScalar;

float gLuminance(vec3 rgb) {
  return (0.2126 * rgb.r) + (0.7152 * rgb.g) + (0.0722 * rgb.b);
}

float gNoise2D(vec2 value) {
  return fract(sin(value.x * 3433.8 + value.y * 3843.98) * 45933.8);
}

float gDegreesToRadians(float degrees) {
  return degrees / 180.0 * gPI;
}

vec2 gDegreesToRadians(vec2 degrees) {
  return vec2(gDegreesToRadians(degrees.x), gDegreesToRadians(degrees.y));
}

vec3 gDegreesToRadians(vec3 degrees) {
  return vec3(gDegreesToRadians(degrees.x), gDegreesToRadians(degrees.y), gDegreesToRadians(degrees.z));
}

mat2 gRotateMatrix2D(float radians) {
  float c = cos(radians);
  float s = sin(radians);
  return mat2(c, s, -s, c);
}

mat3 gRotateMatrix3D(float radians, vec3 axis) {
  axis = normalize(axis);
  float c = cos(radians);
  float s = sin(radians);
  float oc = 1.0 - c;

  return mat3(
    oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
    oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
    oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c
  );
}

mat3 gRotateEulerMatrix3D(vec3 radians) {
  return
    gRotateMatrix3D(radians.y, vec3(0,1,0)) *
    gRotateMatrix3D(radians.x, vec3(1,0,0)) *
    gRotateMatrix3D(radians.z, vec3(0,0,1));
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

vec3 gRGB2HSV(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 gHSV2RGB(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

struct gButton {
  bool buttonHeld;
  bool buttonTriggered;
  bool buttonReleased;
  float buttonTriggeredTimestamp;
  float buttonReleasedTimestamp;
  bool touchHeld;
  bool touchTriggered;
  bool touchReleased;
  float touchTriggeredTimestamp;
  float touchReleasedTimestamp;
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
  // Pass through is a special case we use internally when we want to render without a previous layer
  // It also has a dual purpose for folders/groups to pass through the background when rendering
  if (blendMode == gBlendModePassThrough || blendMode == gBlendModeOverwrite) {
    return source;
  }
  float srcAlpha = source.a * opacity;

  // Mask is a special blend mode that always overwrites alpha only
  if (blendMode == gBlendModeMask) {
    // We use min because we don't want to set alpha to a value higher than what exists on the dest
    dest.a = min(dest.a, srcAlpha);
    return dest;
  }

  // None is a special mode that doesn't render anything, used for cases where we want to render off screen targets
  if (blendMode == gBlendModeNone) {
    return dest;
  }

  // We also handle dissolve as a special case since it never blends (always opaque)
  if (blendMode == gBlendModeDissolve) {
    float noise = gNoise2D(gUV);
    source.a = 1.0;
    vec4 color;
    if (srcAlpha == 1.0) {
      color = source;
    } else if (srcAlpha == 0.0) {
      color = dest;
    } else {
      color = srcAlpha < noise ? dest : source;
    }
    return color;
  }
  
  vec3 src = source.rgb;
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

  vec4 alphaBlended = srcAlpha * source + (1.0 - srcAlpha) * dest;
  vec4 blendModeBlended = vec4(srcAlpha * blended + (1.0 - srcAlpha) * dst, min(srcAlpha + dest.a, 1.0));
  return mix(alphaBlended, blendModeBlended, dest.a);
}

const int gSdfNoHitId = ${sdfNoHitId};
const int gSdfHighlightNone = ${sdfHighlightNone};
const int gSdfVariadicMax = ${sdfVariadicMax};
uniform int gSdfHighlightId;

struct gSdf {
  int id;
};

struct gSdfResult {
  float distance;
  int id;
};

struct gSdfVariadic {
  int count;
  gSdf sdfs[gSdfVariadicMax];
};

const gSdf gSdfNull = gSdf(gSdfNoHitId);
const gSdfResult gSdfResultNull = gSdfResult(gPositiveInfinity, gSdfNoHitId);
const gSdfVariadic gSdfVariadicNull = gSdfVariadic(0, gSdf[gSdfVariadicMax](${new Array(sdfVariadicMax).fill("gSdfNull").join(",")}));
`;

const countCodeLines = (code: string) => code.split(newlineRegex).length;

const fragmentShaderHeaderLineCount = countCodeLines(fragmentShaderHeader);

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
export const defaultAudioSampleCount = 512;
export const defaultVolumeAverageSeconds = 0.5;
export const defaultMinDecibels = -100;
export const defaultMaxDecibels = -30;

export const maxRenderTargetSize = 16384;

const average = (array: Float32Array) => {
  let sum = 0;
  for (let i = 0; i < array.length; ++i) {
    sum += array[i];
  }
  return sum / array.length;
};

export class RenderTargets {
  public get width() {
    return this.widthFinal;
  }

  public get height() {
    return this.heightFinal;
  }

  private readonly unusedTargets: RenderTarget[] = [];
  private readonly allTargets: RenderTarget[] = [];

  // We start it off at 1 based indexing (insert a dummy)
  private readonly antiAliasTargets: RenderTarget[] = [undefined as any as RenderTarget];

  public constructor(
    private widthFinal: number,
    private heightFinal: number,
    private widthRender: number,
    private heightRender: number,
    private antiAliasLevel: number) {
  }
}

interface RenderTargetsInternal {
  widthFinal: number;
  heightFinal: number;
  widthRender: number;
  heightRender: number;
  antiAliasLevel: number;
  unusedTargets: RenderTarget[];
  allTargets: RenderTarget[];
  antiAliasTargets: RenderTarget[];
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
  gBlendMode: number,
  gAudioFrequencies: Float32Array,
  gAudioSamples: Float32Array,
  gAudioVolume: number,
  gAudioVolumeAverage: number,
  gAudioVolumePeak: number,
  gAudioVolumeTrough: number,
  gAudioReactiveScalar: number,
}

export type CompactUniforms = Record<string, ShaderValue["value"] | ShaderButtonState | ShaderAxisState>;

export type RenderLayerCodeCallback = (compiledLayer: CompiledLayerCode, gl: WebGL2RenderingContext) => void;
export type SampleButtonCallback = (device: DeviceIdentifier, inputId: InputIdentifier) => SampledButton | null;
export type SampleAxisCallback = (device: DeviceIdentifier, inputId: InputIdentifier) => SampledAxis | null;
export type CompileJavaScriptCallback = (layer: LayerJavaScript) => CompiledJavaScript;
export type RenderJavaScriptCallback = (
  requestId: number,
  layer: CompiledLayerJavaScript,
  globals: JavaScriptGlobals,
  uniforms: CompactUniforms,
) => void;
export type DeleteJavaScriptCallback = (layer: CompiledLayerJavaScript) => void;
export type SafeEvalCallback = <T>(javaScript: string) => Promise<T>;

const getRequiredUniform = <T extends ProcessedUniform>(processedLayerShader: ProcessedLayerShader, uniformName: string): T => {
  const uniform = processedLayerShader.uniforms.find((uniform) => uniform.name === uniformName);
  if (!uniform) {
    throw new Error(`Unable to find uniform '${uniformName}'`);
  }
  return uniform as T;
};

const getUniformKey = (uniform: CompiledUniform): string => `${uniform.parent.layer.id}\0${uniform.name}`;

type UniformLocationCallback = (name: string) => WebGLUniformLocation | null;

const clearObject = (obj: any) => {
  for (const prop in obj) {
    delete obj[prop];
  }
}

interface AudioVolume {
  volume: number;
  timeStampMs: number;
}

export class RaverieVisualizer {
  private textureCache: Record<string, UserTexture | undefined> = {};

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
  private sdfHighlightId: number = sdfNoHitId;

  private buttonStates: Record<string, ShaderButtonState | undefined> = {};
  private axisStates: Record<string, ShaderAxisState | undefined> = {};

  public onBeforeRender: RenderCallback | null = null;

  public onBeforeControlsUpdate: ControlsUpdateCallback | null = null;
  public onSampleButton: SampleButtonCallback | null = null;
  public onSampleAxis: SampleAxisCallback | null = null;

  public onCompileJavaScriptLayer: CompileJavaScriptCallback | null = null;
  public onRenderJavaScriptLayer: RenderJavaScriptCallback | null = null;
  public onDeleteJavaScriptLayer: DeleteJavaScriptCallback | null = null;

  public onSafeEval: SafeEvalCallback | null = null;

  private audioFrequencies: Float32Array = new Float32Array(defaultAudioSampleCount);
  private audioFrequenciesTexture: WebGLTexture;
  private audioSamples: Float32Array = new Float32Array(defaultAudioSampleCount);
  private audioSamplesTexture: WebGLTexture;

  private audioVolume: number = 0;
  private audioVolumeAverage: number = 0;
  private audioVolumePeak: number = 0;
  private audioVolumeTrough: number = 0;
  private audioRollingVolumes: AudioVolume[] = [];

  // This is a number between [0, 1] that can be used for things like reactive lighting.
  //   0 represents the current volume is at or below the rolling average volume
  //   1 represents the current volume is at peak volume
  private audioReactiveScalar: number = 0;

  public get isRendering() {
    return this.isRenderingInternal;
  }

  public safeEvalExpressionWithArguments = <T = any>(script: string, args: Record<string, ShaderValue>) => {
    if (!this.onSafeEval) {
      return null;
    }
    const paramsWithDefaults = Object.entries(args).map((entry) => `${entry[0]}=${JSON.stringify(entry[1])}`).join(",");
    return this.onSafeEval<T>(`((${paramsWithDefaults}) => ${script})()`);
  };

  public updateAudioSamples(frequencies: Float32Array, samples: Float32Array, timeStampMs: number) {
    if (frequencies.length !== defaultAudioSampleCount) {
      throw new Error(`The number of audio frequencies should be ${defaultAudioSampleCount}`);
    }
    if (samples.length !== defaultAudioSampleCount) {
      throw new Error(`The number of audio samples should be ${defaultAudioSampleCount}`);
    }

    const SMOOTH_SAMPLE_RADIUS = 2;
    const SMOOTH_SAMPLE_TOTAL = SMOOTH_SAMPLE_RADIUS * 2 + 1;
    const VOLUME_AVERAGE_INTERPOLANT = 0.75;
    const REACTIVE_SCALAR_INTERPOLANT = 0.65;

    for (let i = 0; i < defaultAudioSampleCount; ++i) {
      const frequencyDecibelsClamped = clamp(frequencies[i], defaultMinDecibels, defaultMaxDecibels);
      const frequencyNormalized = (frequencyDecibelsClamped - defaultMinDecibels) / (defaultMaxDecibels - defaultMinDecibels);

      this.audioFrequencies[i] = frequencyNormalized;

      // Apply smoothing between samples
      let sample = 0.0;
      for (let x = -SMOOTH_SAMPLE_RADIUS; x <= SMOOTH_SAMPLE_RADIUS; ++x) {
        const index = clamp(i + x, 0, defaultAudioSampleCount - 1);
        sample += samples[index];
      }
      sample /= SMOOTH_SAMPLE_TOTAL;
      sample = clamp(sample, -1, 1);

      // Audio samples are jumpy so we apply temporal smoothing too
      this.audioSamples[i] = lerp(this.audioSamples[i], sample * 0.5 + 0.5, 0.1);
    }

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.audioFrequenciesTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, defaultAudioSampleCount, 1, 0, gl.RED, gl.FLOAT, this.audioFrequencies);
    gl.bindTexture(gl.TEXTURE_2D, this.audioSamplesTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, defaultAudioSampleCount, 1, 0, gl.RED, gl.FLOAT, this.audioSamples);

    // https://physics.stackexchange.com/questions/46228/averaging-decibels
    this.audioVolume = lerp(this.audioVolume, average(this.audioFrequencies), VOLUME_AVERAGE_INTERPOLANT);

    this.audioRollingVolumes.push({
      timeStampMs,
      volume: this.audioVolume
    });

    while (this.audioRollingVolumes.length > 0) {
      const audioVolume = this.audioRollingVolumes[0];
      const audioVolumeAgeSeconds = (timeStampMs - audioVolume.timeStampMs) / 1000;
      if (audioVolumeAgeSeconds > defaultVolumeAverageSeconds) {
        this.audioRollingVolumes.shift();
      } else {
        break;
      }
    }

    let audioVolumePeak = 0;
    let audioVolumeTrough = 1;
    this.audioVolumeAverage = 0;
    for (const lastVolume of this.audioRollingVolumes) {
      audioVolumePeak = Math.max(this.audioVolumePeak, lastVolume.volume);
      audioVolumeTrough = Math.min(audioVolumeTrough, lastVolume.volume);
      this.audioVolumeAverage += lastVolume.volume;
    }
    this.audioVolumeAverage /= this.audioRollingVolumes.length;
    audioVolumePeak = Math.max(audioVolumePeak, this.audioVolumeAverage);
    audioVolumeTrough = Math.min(audioVolumeTrough, this.audioVolumeAverage);

    this.audioVolumePeak = lerp(this.audioVolumePeak, audioVolumePeak, VOLUME_AVERAGE_INTERPOLANT);
    this.audioVolumeTrough = lerp(this.audioVolumeTrough, audioVolumeTrough, VOLUME_AVERAGE_INTERPOLANT);

    // Note this may be Infinity if audioVolumePeak === audioVolumeTrough, but this
    // is OK because we clamp it which properly handles Infinity
    const unclampedAudioReactiveScalar =
      (this.audioVolume - this.audioVolumeTrough) / (this.audioVolumePeak - this.audioVolumeTrough);
    const clampedAudioReactiveScalar = isNaN(unclampedAudioReactiveScalar)
      ? 0
      : clamp(unclampedAudioReactiveScalar, 0, 1);
    this.audioReactiveScalar = lerp(
      this.audioReactiveScalar, clampedAudioReactiveScalar, REACTIVE_SCALAR_INTERPOLANT);
  }

  public constructor(
    public readonly gl: WebGL2RenderingContext,
    private readonly loadTexture: LoadTextureFunction,
    private readonly updateTexture: UpdateTextureFunction) {

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    // TODO(trevor): Premultiplied alpha
    //gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

    this.audioFrequenciesTexture = this.createTexture(gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, defaultAudioSampleCount, 1, 0, gl.RED, gl.FLOAT, null);
    this.audioSamplesTexture = this.createTexture(gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, defaultAudioSampleCount, 1, 0, gl.RED, gl.FLOAT, null);

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
      uniform bool gFlipY;
      void main() {
        vec2 pos = _gVertexPosition;
        if (gFlipY) {
          pos.y = -pos.y;
        }
        gPosition = pos;
        gUV = (pos + vec2(1.0, 1.0)) * 0.5;
        gl_Position = vec4(_gVertexPosition, 0.0, 1.0);
      }`;

    const processedVertexShader = this.createShader(vertexShader, gl.VERTEX_SHADER);
    this.vertexShader = expect(processedVertexShader.shader,
      processedVertexShader.error!);

    this.checkerboardShader = this.compileLayerShader({}, {
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

    this.copyShader = this.compileLayerShader({}, {
      ...defaultEmptyLayerShader(),
      blendMode: "overwrite",
      code: `
      vec4 render() {
        return texture(gPreviousLayer, gUV);
      }`
    }, null, true);

    this.customTextureShader = this.compileLayerShader({}, {
      ...defaultEmptyLayerShader(),
      code: `
      uniform sampler2D textureInput;
      vec4 render() {
        return texture(textureInput, gUV);
      }`
    }, null, true);
    this.customTextureUniform = getRequiredUniform(this.customTextureShader, "textureInput");
  }

  private createRenderTargetInternal(parent: RenderTargets, width: number, height: number): RenderTarget {
    const gl = this.gl;
    const buffer = expect(gl.createFramebuffer(), "WebGLFramebuffer");
    gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
    const texture = this.createTexture();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return {
      parent,
      width,
      height,
      texture: texture,
      buffer: buffer,
      useCount: 0
    };
  }

  private createRenderTarget(parent: RenderTargets): RenderTarget {
    // We only push the new render target into allTargets and not unusedTargets because the
    // only reason this function gets called is to allocate a target that is about to be used
    const targetsInternal = parent as any as RenderTargetsInternal;
    const newTarget = this.createRenderTargetInternal(parent, targetsInternal.widthRender, targetsInternal.heightRender);

    targetsInternal.allTargets.push(newTarget);
    return newTarget;
  }

  private deleteRenderTarget(renderTarget: RenderTarget) {
    const gl = this.gl;
    gl.deleteFramebuffer(renderTarget.buffer);
    gl.deleteTexture(renderTarget.texture);
  }

  public createRenderTargets(width: number, height: number, desiredAntiAliasLevel: number = 1): RenderTargets {
    width = Math.max(width, 1);
    height = Math.max(height, 1);

    const maxDimension = Math.max(width, height);
    const maxAntiAliasLevel = Math.floor(Math.sqrt(maxRenderTargetSize / maxDimension)) + 1;
    const determinedAntiAliasLevel = clamp(desiredAntiAliasLevel, 1, maxAntiAliasLevel);
    const scale = Math.pow(2, determinedAntiAliasLevel - 1);
    const renderWidth = width * scale;
    const renderHeight = height * scale;

    const targets = new RenderTargets(width, height, renderWidth, renderHeight, determinedAntiAliasLevel);
    const targetsInternal = targets as any as RenderTargetsInternal;

    for (let aa = 1; aa < determinedAntiAliasLevel; ++aa) {
      const aaPower = Math.pow(2, aa);
      const targetWidth = Math.floor(renderWidth / aaPower);
      const targetHeight = Math.floor(renderHeight / aaPower);

      const aaTarget = this.createRenderTargetInternal(targets, targetWidth, targetHeight);

      // Ensure this target cannot be 'released' and put back into unused targets, as it is not the same size
      aaTarget.useCount = -1;

      targetsInternal.antiAliasTargets.push(aaTarget);
    }

    return targets;
  }

  public resizeRenderTargets(targets: RenderTargets, width: number, height: number) {
    const targetsInternal = targets as any as RenderTargetsInternal;
    if (targetsInternal.antiAliasLevel !== 1) {
      throw new Error("Anti-aliased targets cannot be resized yet (not implemented)");
    }

    targetsInternal.widthRender = targetsInternal.widthFinal = Math.max(width, 1);
    targetsInternal.heightRender = targetsInternal.heightFinal = Math.max(height, 1);

    const gl = this.gl;
    for (const target of targetsInternal.allTargets) {
      gl.bindTexture(gl.TEXTURE_2D, target.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      target.width = width;
      target.height = height;
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  public deleteRenderTargets(targets: RenderTargets) {
    const targetsInternal = targets as any as RenderTargetsInternal;
    if (targetsInternal.unusedTargets.length !== targetsInternal.allTargets.length) {
      throw new Error("Cannot delete targets that are in use");
    }

    for (const target of targetsInternal.allTargets) {
      this.deleteRenderTarget(target);
    }
    targetsInternal.allTargets.length = 0;
    targetsInternal.unusedTargets.length = 0;
  }

  private requestRenderTarget(targets: RenderTargets): RenderTarget {
    const targetsInternal = targets as any as RenderTargetsInternal;
    const newTarget = targetsInternal.unusedTargets.length === 0
      ? this.createRenderTarget(targets)
      : targetsInternal.unusedTargets.pop() as RenderTarget;

    if (newTarget.width !== targets.width || newTarget.height !== targets.height) {
      throw new Error("Expected new target to match RenderTargets dimensions");
    }
    ++newTarget.useCount;
    return newTarget;
  }

  private releaseRenderTarget(target: RenderTarget) {
    // As a special case, some render targets like anti-alias targets don't get freed
    if (target.useCount === -1) {
      return;
    }
    if (target.useCount === 0) {
      throw new Error("Attempt to release already freed RenderTarget");
    }

    const targetsInternal = target.parent as any as RenderTargetsInternal;
    --target.useCount;
    if (target.useCount === 0) {
      targetsInternal.unusedTargets.push(target);
    }
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

    const completeCode = `${fragmentShaderHeader}\n${fragmentShader}\n${fragmentShaderFooter}`;
    const processedFragmentShader = this.createShader(completeCode, gl.FRAGMENT_SHADER);
    if (!processedFragmentShader.shader) {
      return {
        program: null,
        completeCode,
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
        completeCode,
        error: programLog || "Failed to link"
      };
    }
    return { program, completeCode };
  }

  private createTexture(optionalFilterMode?: number): WebGLTexture {
    const gl = this.gl;
    const filterMode = optionalFilterMode === undefined ? gl.LINEAR : optionalFilterMode;
    const texture = expect(gl.createTexture(), "WebGLTexture");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterMode);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterMode);
    return texture;
  }

  private createBlankTexture(): WebGLTexture {
    const texture = this.createTexture();
    const gl = this.gl;
    // By default unloaded textures are just 1x1 pixel black with no alpha (0,0,0,0)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return texture;
  }

  public async preload(layerRoot: LayerRoot): Promise<void> {
    const compiledLayerRoot = this.compile(layerRoot, "clone");

    const pendingTextures: UserTexture[] = [];

    const loadTexture = (shaderTexture: ShaderTexture) => {
      const userTexture = this.getOrCacheTexture(shaderTexture.url);
      pendingTextures.push(userTexture);
    }

    for (const compiledLayer of Object.values(compiledLayerRoot.idToLayer)) {
      if (compiledLayer.type !== "group") {
        for (const uniform of compiledLayer.uniforms) {
          if (uniform.type === "sampler2D") {
            loadTexture(validateGLSLSampler2D("sampler2D", uniform.defaultValue));
            loadTexture(validateGLSLSampler2D("sampler2D", uniform.shaderValue.value));
          }
        }
      }
    }

    let resolver: (() => void) | null = null;
    const promise = new Promise<void>((resolve) => {
      resolver = resolve;
    });

    // TODO(trevor): Refactor this to use loaded events, it introduces a dependence on setInterval...
    const interval = setInterval(() => {
      const incompleteTextures: UserTexture[] = [];
      for (const pendingTexture of pendingTextures) {
        if (!this.updateTexture(pendingTexture)) {
          incompleteTextures.push(pendingTexture);
        }
      }
      if (incompleteTextures.length === 0) {
        resolver!();
        clearInterval(interval);
      }

      pendingTextures.length = 0;
      pendingTextures.push(...incompleteTextures);
    }, 10);

    return promise;
  }

  public compile(layerRoot: LayerRoot, mode: "clone" | "modifyInPlace" = "clone", previous?: CompiledLayerRoot): CompiledLayerRoot {
    const root = mode === "clone"
      ? JSON.parse(JSON.stringify(layerRoot)) as LayerRoot
      : layerRoot;

    // Backwards compatibility
    if (root.width === undefined) {
      root.width = defaultWidth;
    }
    if (root.height === undefined) {
      root.height = defaultHeight;
    }

    // Let the user pick if we make a copy, because we're going to potentially
    // modify the group such as if we find new uniforms within the shaders
    const previousProcessedRoot = previous as ProcessedLayerRoot | undefined;
    const previousIdToLayer: IdToLayer | undefined = previousProcessedRoot
      ? { ...previousProcessedRoot.idToLayer }
      : undefined;
    const processedLayerRoot = this.compileLayerRoot(root, previousIdToLayer);

    // The remaining layers inside previousIdToLayer must be deleted
    for (const id in previousIdToLayer) {
      this.deleteLayer(previousIdToLayer[id], false);
    }

    return processedLayerRoot;
  }

  private getUniformLocationGradient(name: string, getUniformLocation: UniformLocationCallback): ProcessedGradientLocation[] | null {
    const location: ProcessedGradientLocation[] = [];
    for (let i = 0; i < maxGradientStops; ++i) {
      const t = getUniformLocation(`${name}[${i}].t`);
      const color = getUniformLocation(`${name}[${i}].color`);
      if (!t || !color) {
        return null;
      }
      location.push({ t, color });
    }
    return location;
  }

  private getUniformLocationButton(name: string, getUniformLocation: UniformLocationCallback): ProcessedButtonLocation {
    return {
      buttonHeld: getUniformLocation(`${name}.buttonHeld`),
      buttonTriggered: getUniformLocation(`${name}.buttonTriggered`),
      buttonReleased: getUniformLocation(`${name}.buttonReleased`),
      buttonTriggeredTimestamp: getUniformLocation(`${name}.buttonTriggeredTimestamp`),
      buttonReleasedTimestamp: getUniformLocation(`${name}.buttonReleasedTimestamp`),
      touchHeld: getUniformLocation(`${name}.touchHeld`),
      touchTriggered: getUniformLocation(`${name}.touchTriggered`),
      touchReleased: getUniformLocation(`${name}.touchReleased`),
      touchTriggeredTimestamp: getUniformLocation(`${name}.touchTriggeredTimestamp`),
      touchReleasedTimestamp: getUniformLocation(`${name}.touchReleasedTimestamp`),
      value: getUniformLocation(`${name}.value`)
    };
  }

  private getUniformLocationAxis(name: string, getUniformLocation: UniformLocationCallback): ProcessedAxisLocation {
    return {
      value: getUniformLocation(`${name}.value`)
    };
  }

  private getUniformLocationGeneric(name: string, getUniformLocation: UniformLocationCallback, type: GLSLType): ProcessedUniform["location"] {
    switch (type) {
      case "gradient":
        return this.getUniformLocationGradient(name, getUniformLocation);
      case "button":
        return this.getUniformLocationButton(name, getUniformLocation);
      case "axis":
        return this.getUniformLocationAxis(name, getUniformLocation);
      default:
        return getUniformLocation(name);
    }
  }

  private parseUniforms(parent: ProcessedLayerCode, getUniformLocation: UniformLocationCallback) {
    const layerCode = parent.layer;

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

      const nameMangleIndices: number[] = [];
      const nameUsageRegex = new RegExp(`\\b${name}\\b`, "gum");
      for (; ;) {
        const result = nameUsageRegex.exec(layerCode.code);
        if (!result) {
          break;
        }
        nameMangleIndices.push(result.index + result[0].length);
      }

      newUniformNames[name] = true;
      newUniforms.push({
        type: result[1] as GLSLType,
        name,
        nameMangleIndices,
        afterUniform: result[3]
      });
    }

    // Make a copy of the old shader values that we pop from as we map old to new
    const oldShaderValues = layerCode.values.slice(0);

    const processedUniforms: ProcessedUniform[] = newUniforms.map<ProcessedUniform>((unprocessedUniform, uniformIndex) => {
      const { type, name, nameMangleIndices, afterUniform } = unprocessedUniform;
      const location = getUniformLocation(name);

      let parsedComment: ProcessedComment = {};

      const commentStart = afterUniform.indexOf("//");
      if (commentStart !== -1) {
        // Check if we can parse the comment as JSON (skip 2 characters for the //)
        const commentText = afterUniform.substring(commentStart + 2);
        const innerJson = commentText.replace(/[-a-zA-Z0-9_.]+\s*:/gum, (found) => {
          const identifier = found.substring(0, found.indexOf(":")).trim();
          // TODO(trevor): Hack for data urls. We should do something better than regex
          // find/replace where we walk the potential JSON and ignore replacements in strings
          if (identifier === "data") {
            return found;
          }
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
      let foundShaderValue: ShaderValue & ShaderValueWithCurves | null = null;
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
                nameMangleIndices,
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
          const defaultCurve = validateCurve(parsedComment.curve);
          return pass<ProcessedUniformNumber>({
            type,
            location,
            name,
            nameMangleIndices,
            parent,
            parsedComment,
            shaderValue: {
              name,
              type,
              value: validateGLSLNumber(type, foundShaderValue?.value, defaultValue),
              curve: extractCurve(foundShaderValue, defaultCurve)
            },
            defaultValue,
            defaultCurve,
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
          const defaultCurve = validateCurves(type, parsedComment.curve);
          return pass<ProcessedUniformNumberVector>({
            type,
            location,
            name,
            nameMangleIndices,
            parent,
            parsedComment,
            shaderValue: {
              name,
              type,
              value: validateGLSLNumberVector(type, foundShaderValue?.value, defaultValue),
              curve: extractCurves(type, foundShaderValue, defaultCurve)
            },
            defaultValue,
            defaultCurve,
            minValue: validateGLSLNumberVector(type, parsedComment.min, vectorNumberScalarConstructor(type, Number.NEGATIVE_INFINITY)),
            maxValue: validateGLSLNumberVector(type, parsedComment.max, vectorNumberScalarConstructor(type, Number.POSITIVE_INFINITY)),
            stepValue: validateGLSLNumberVector(type, parsedComment.step, vectorNumberScalarConstructor(type, minimumStepValue(type))),
          });
        }
        case "bool": {
          const defaultValue = validateGLSLBool(type, parsedComment.default);
          const defaultCurve = validateCurve(parsedComment.curve);
          return pass<ProcessedUniformBool>({
            type,
            location,
            name,
            nameMangleIndices,
            parent,
            parsedComment,
            shaderValue: {
              name,
              type,
              value: validateGLSLBool(type, foundShaderValue?.value, defaultValue),
              curve: extractCurve(foundShaderValue, defaultCurve)
            },
            defaultValue,
            defaultCurve
          });
        }
        case "bvec2":
        case "bvec3":
        case "bvec4": {
          const defaultValue = validateGLSLBoolVector(type, parsedComment.default);
          const defaultCurve = validateCurves(type, parsedComment.curve);
          return pass<ProcessedUniformBoolVector>({
            type,
            location,
            name,
            nameMangleIndices,
            parent,
            parsedComment,
            shaderValue: {
              name,
              type,
              value: validateGLSLBoolVector(type, foundShaderValue?.value, defaultValue),
              curve: extractCurves(type, foundShaderValue, defaultCurve)
            },
            defaultValue,
            defaultCurve
          });
        }
        case "sampler2D": {
          const defaultValue = validateGLSLSampler2D(type, parsedComment.default);
          return pass<ProcessedUniformSampler2D>({
            type,
            location,
            name,
            nameMangleIndices,
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
          const location = this.getUniformLocationGradient(name, getUniformLocation);
          return pass<ProcessedUniformGradient>({
            type,
            location,
            name,
            nameMangleIndices,
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
          const defaultValue = validateGLSLButton(type, parsedComment.default);
          const location = this.getUniformLocationButton(name, getUniformLocation);

          return pass<ProcessedUniformButton>({
            type,
            location,
            name,
            nameMangleIndices,
            parent,
            parsedComment,
            shaderValue: {
              name,
              type,
              value: validateGLSLButton(type, foundShaderValue?.value, defaultValue)
            },
            defaultValue,
          });
        }
        case "axis": {
          const defaultValue = validateGLSLAxis(type, parsedComment.default);
          const location = this.getUniformLocationAxis(name, getUniformLocation);

          return pass<ProcessedUniformAxis>({
            type,
            location,
            name,
            nameMangleIndices,
            parent,
            parsedComment,
            shaderValue: {
              name,
              type,
              value: validateGLSLAxis(type, foundShaderValue?.value, defaultValue)
            },
            defaultValue,
          });
        }
        default: throw new Error(`Unexpected GLSL type '${type}'`)
      }
    });

    this.copyProcessedUniformToShaderValues(layerCode, processedUniforms);
    return processedUniforms;
  }

  private copyProcessedUniformToShaderValues(copyToLayerCodeShaderValues: LayerCode, processedUniforms: ProcessedUniform[]) {
    // Now that we've processed all the new uniforms and either
    // found their old shader values or made new ones, lets update the
    // shader values on the LayerShader to match. Note that this will
    // mutate the object, however it may be a copy of the user's LayerShader
    // depending on which option they passed into `compile`
    copyToLayerCodeShaderValues.values.length = 0;
    copyToLayerCodeShaderValues.values.push(...processedUniforms.map((processedUniform) =>
      processedUniform.shaderValue));
  }

  private rebuildFromPrevious<T extends ProcessedLayerCode>(layer: T["layer"], parent: ProcessedLayerGroup | null, previousIdToLayer: IdToLayer | undefined): T | null {
    if (!MINIMAL_REBUILD_ENABLED) {
      return null;
    }

    // If the previous layer type and code are the same, then steal it
    const previous = previousIdToLayer && previousIdToLayer[layer.id];
    if (previous && previous.type === layer.type && previous.code === layer.code && previous.layer.code === layer.code) {
      const previousLayer = previous as T;
      previousLayer.parent = parent;
      previousLayer.layer = layer;

      const getUniformLocation = (name: string) => previousLayer.type === "shader" && previousLayer.program
        ? this.gl.getUniformLocation(previousLayer.program, name)
        : null;

      previousLayer.layer.values = layer.values;

      // TODO(trevor): This can be made more efficient by not having to parse
      // every parameter (just use the old ones). Would need to detect renames, etc.
      previousLayer.uniforms = this.parseUniforms(previousLayer, getUniformLocation);

      // We remove the layer from previousIdToLayer so that we know which ones were used and which to delete
      delete previousIdToLayer[layer.id];

      return previousLayer;
    }

    return null;
  }

  // TODO(trevor): Rebuild - Must take previousIdToLayer to support rebuild
  private compileLayerSDF(idToLayer: IdToLayer, layerSdf: LayerSDF, parent: CompiledLayerSDF | null, throwOnError: boolean): CompiledLayerSDF {
    const code = layerSdf.code;

    const parseErrors: CompiledError[] = [];
    const addParseError = (text: string, line = 0) => {
      if (throwOnError) {
        throw new Error(text);
      }
      parseErrors.push({ text, line });
    }

    const signatureRegex = /(?:\/\*(\{.*?\})\*\/)?\s*gSdfResult\s+map\(inout gSdfContext context\b/gms;
    // Keep in sync with the end of the above regex (should be directly after 'map')
    const signatureEnding = "(inout gSdfContext context";
    const signatureResult = signatureRegex.exec(code);

    let attributes: SDFFunctionAttributes = {};
    let sdfParameters: SDFParam[] = [];
    let variadicSdf = false;
    let sdfFooter = `
      vec4 render() {
        return vec4(1, 0, 0, 1);
      }`;
    let functionNameMangleIndex = -1;
    if (signatureResult) {
      functionNameMangleIndex = signatureResult.index + signatureResult[0].length - signatureEnding.length;

      // TODO(trevor): Figure out how to eval this without having to use await
      const parseAttributes = <T extends Object>(javaScript: string): T => {
        const attributesOrNull = javaScript ? null/*await safeEval<T>(`(${javaScript})`)*/ : null;
        return (typeof attributesOrNull === "object" && attributesOrNull)
          ? attributesOrNull
          : {} as T;
      };

      attributes = parseAttributes<SDFFunctionAttributes>(signatureResult[1]);
      // TODO(trevor): Validate the half extents attribute by running it at least once
      if (typeof attributes.halfExtents !== "undefined") {
        if (typeof attributes.halfExtents !== "string") {
          addParseError(`The halfExtents attribute must be a string that contains JavaScript to build ` +
            `the AABB half extents as a 3 component array, e.g. [1,1,1], got '${attributes.halfExtents}'`);
        }
      }

      // We start the parentheses count at 1 since we got the first one in the signature above
      const signatureStart = signatureResult.index + signatureResult[0].length;
      let signatureEnd = signatureStart;
      let parensCount = 1;
      for (; signatureEnd < code.length; ++signatureEnd) {
        const c = code[signatureEnd];
        if (c === "(") {
          ++parensCount;
        }
        if (c === ")") {
          --parensCount;
          if (parensCount === 0) {
            break;
          }
        }
      }

      if (parensCount !== 0) {
        addParseError("The function signature was not able to be parsed (are there a correct number of parentheses?)");
      }

      const signature = code.substring(signatureStart, signatureEnd);

      const paramRegex = /(?:gSdf\s+([a-zA-Z_][a-zA-Z0-9_]*))|(?:gSdfVariadic\s+([a-zA-Z_][a-zA-Z0-9_]*))/gm;
      for (; ;) {
        const paramResult = paramRegex.exec(signature);
        if (!paramResult) {
          break;
        }

        if (paramResult[2]) {
          if (sdfParameters.length) {
            addParseError("Cannot take gSdf parameters and use gSdfVariadic at the same time");
          }
          variadicSdf = true;
        } else {
          if (variadicSdf) {
            addParseError("Cannot take gSdf parameters and use gSdfVariadic at the same time");
          }
          const paramName = paramResult[1];
          sdfParameters.push({
            name: paramName
          });
        }
      }

      // Ultimately all sdf children are swept up and added to a generated root shader
      // However it is useful to see compiler errors, as well as gather uniforms
      // so we treat the sdf as if it's a LayerShader temporarily with a special footer

      // The footer will call the map function with "null" sdfs or an empty sdf array for variadics
      const sdfArgs = variadicSdf
        ? ", gSdfVariadicNull"
        : ", gSdfNull".repeat(sdfParameters.length);
      sdfFooter = `
        vec4 render() {
          gSdfContext context = gSdfContextNull;
          gSdfResult result = map(context${sdfArgs});
          return vec4(result.distance, float(result.id), 0, 1);
        }`;
    } else {
      addParseError(`Function signature must be 'gSdfResult map(inout gSdfContext context, ...)'`);
    }

    // TODO(trevor): Rebuild - Ignoring passing previousIdToLayer until we know it works
    const processedSdfShader = this.compileLayerShader({}, {
      type: "shader",
      blendMode: "passThrough",
      opacity: 1,
      code: `${layerSdf.code}\n${sdfFooter}`,
      id: layerSdf.id,
      name: layerSdf.name,
      values: layerSdf.values,
      visible: layerSdf.visible,
      authorName: layerSdf.authorName,
      authorUrl: layerSdf.authorUrl,
      // We intentionally set this to undefined as we handle the sdf children separately
      layers: undefined
    }, null, throwOnError);

    const processedLayerSdf: ProcessedLayerSDF = {
      type: "sdf",

      layer: layerSdf,
      layers: [],
      parent,

      code: layerSdf.code,
      usesAudioInput: processedSdfShader.usesAudioInput,
      uniforms: processedSdfShader.uniforms,
      errors: [...processedSdfShader.errors, ...parseErrors],
      functionNameMangleIndex,
      mangledId: idToMangleId(layerSdf.id),

      attributes,
      sdfParameters,
      variadicSdf,

      shaderNodes: [],
      allChildShaderNodes: [],
      sdfId: sdfNoHitId
    };

    // Reparent the uniforms to this layer and clear locations
    // (will be set later whe compiling the parent LayerShader)
    for (const uniform of processedLayerSdf.uniforms) {
      uniform.location = null;
      uniform.parent = processedLayerSdf;
    }

    // TODO(trevor): Rebuild - Delete the layer immediately until we get rebuilding working
    // Note that this clears the object, so we have to grab properties before we delete it
    // We don't want it to clear the uniforms however
    processedSdfShader.uniforms = [];
    processedSdfShader.errors = [];
    this.deleteCompiledLayerShader(processedSdfShader, false);

    for (const sdfChild of layerSdf.layers) {
      const compiledSdfChild = this.compileLayerSDF(idToLayer, sdfChild, processedLayerSdf, throwOnError);
      processedLayerSdf.layers.push(compiledSdfChild);
    }
    this.mapLayerById(idToLayer, processedLayerSdf);
    return processedLayerSdf;
  }

  private buildSDFShaderTree(rootObjs: CompiledLayerSDF[]): SDFShaderTreeResult | null {
    let shaderIdCounter = 0;
    const allValidSdfs: CompiledLayerSDF[] = [];

    const shaderNodeIdToObject: Record<number, CompiledLayerSDF> = {};
    const objectIdToShaderNodes: Record<string, SDFShaderNode[]> = {};

    const createNode = (ownerSdf: CompiledLayerSDF, sdf: CompiledLayerSDF, children: SDFShaderNode[]): SDFShaderNode => {
      const id = shaderIdCounter++;
      shaderNodeIdToObject[id] = ownerSdf;
      const shaderNodesPerObject = objectIdToShaderNodes[ownerSdf.layer.id] || [];
      objectIdToShaderNodes[ownerSdf.layer.id] = shaderNodesPerObject;
      ownerSdf.shaderNodes = shaderNodesPerObject;
      sdf.allChildShaderNodes.push(...children);
      const node: SDFShaderNode = {
        id,
        children,
        sdf,
      };
      shaderNodesPerObject.push(node);
      if (ownerSdf.sdfId === sdfNoHitId) {
        ownerSdf.sdfId = id;
      }
      return node;
    };

    // Special case for unions since they are a built in operation
    let unionCounter = 0;
    const createUnion = (ownerSdf: CompiledLayerSDF, children: SDFShaderNode[]): SDFShaderNode => {
      const sdfUnionNew = { ...sdfUnion };
      sdfUnionNew.id = `union_${unionCounter}`;
      sdfUnionNew.name = sdfUnionNew.id;
      ++unionCounter;
      const unionSdf = this.compileLayerSDF({}, sdfUnionNew, null, true);
      allValidSdfs.push(unionSdf);
      return createNode(ownerSdf, unionSdf, children);
    }

    const recurse = (obj: CompiledLayerSDF): SDFShaderNode | null => {
      if (obj.errors.length !== 0 || obj.functionNameMangleIndex === -1) {
        // We skip all sdfs and their children if there is an error
        return null;
      }

      allValidSdfs.push(obj);

      // First recurse over all children so they are evaluated prior
      const validChildren: SDFShaderNode[] = [];
      for (const child of obj.layers) {
        const childNode = recurse(child);
        if (childNode) {
          validChildren.push(childNode);
        }
      }

      const sdfParameterCount = obj.sdfParameters.length;

      if (obj.variadicSdf) {
        // Easy case since it doesn't matter how many children we have
        return createNode(obj, obj, validChildren);
      } else {
        // If we have the exact number of children then just return our node
        if (sdfParameterCount === validChildren.length) {
          return createNode(obj, obj, validChildren);
        }

        // If we don't have enough children to make this valid, then early out
        if (validChildren.length < sdfParameterCount) {
          // If we have no children, then we can't validly display anything
          if (validChildren.length === 0) {
            return null;
          }
          // If we only have one valid child, promote it to be in our place
          if (validChildren.length === 1) {
            return validChildren[0];
          }

          // Otherwise, create a union for all the children in our place
          return createUnion(obj, validChildren);
        }

        if (sdfParameterCount === 0 && validChildren.length !== 0) {
          // Generate a union and place all children and this node under that union
          return createUnion(obj, [...validChildren, createNode(obj, obj, [])]);
        }

        // Unary operation
        if (sdfParameterCount === 1) {
          // At this point we already handled having 0 or 1 parameters above
          // This means we need to create a union for all children and have that union as our single input
          return createNode(obj, obj, [createUnion(obj, validChildren)]);
        }

        // Binary operation
        if (sdfParameterCount === 2) {
          // At this point we already handled 0, 1, or 2 parameters above, so we have more than 2 here
          // We always apply the binary operation between the first parameter and the rest as a union
          return createNode(obj, obj, [validChildren[0], createUnion(obj, validChildren.slice(1))]);
        }

        // At this point we've handled all 0, 1, and 2 sdf parameter shaders, meaning the shader has more
        // We've also handled all cases where we have less children than expected, or the exact number of children
        // That means here we have more children than were expected, so we make a union for the node itself and
        // the remaining children
        if (validChildren.length <= sdfParameterCount) {
          throw new Error("Should have had more children than expected parameters since we got to this case");
        }
        const exactChildren = validChildren.slice(0, sdfParameterCount);
        const remainingChildren = validChildren.slice(sdfParameterCount);
        return createUnion(obj, [createNode(obj, obj, exactChildren), ...remainingChildren]);
      }
    }

    const roots: SDFShaderNode[] = [];
    for (const rootObj of rootObjs) {
      const result = recurse(rootObj);
      if (result) {
        roots.push(result);
      }
    }

    // If we have no roots, then the tree is pointless
    if (roots.length === 0) {
      return null;
    }

    const root = roots.length === 1
      ? roots[0]
      : createUnion(rootObjs[0], roots);

    return { allValidSdfs, root, shaderNodeIdToObject, objectIdToShaderNodes, nodeCount: shaderIdCounter };
  };

  private buildSDFShader(treeResult: SDFShaderTreeResult) {
    // All sdf leaf objects have the shader signature:
    // gSdfResult map(inout gSdfContext context, ...)

    let shaderFunctions = '';
    let shaderMaps = '';

    const insertString = (base: string, baseIndex: number, toBeInserted: string) =>
      `${base.substring(0, baseIndex)}${toBeInserted}${base.substring(baseIndex)}`;

    const generateMapCall = (node: SDFShaderNode) => {
      if (node.sdf.variadicSdf) {
        return `
          gSdfVariadic variadic = gSdfVariadicNull;
          variadic.count = ${node.children.length};
          ${node.children.map((child, index) => `variadic.sdfs[${index}] = gSdf(${child.id});`).join("")}
          result = map_${node.sdf.mangledId}(context, variadic);`;
      }

      let shaderParams = "";
      for (const child of node.children) {
        shaderParams += `, gSdf(${child.id})`;
      }

      return `result = map_${node.sdf.mangledId}(context${shaderParams});`;
    }

    for (const sdf of treeResult.allValidSdfs) {
      if (sdf.errors.length !== 0 || sdf.functionNameMangleIndex === -1) {
        console.error(sdf);
        throw new Error("SDF was added that had errors");
      }

      const insertLocations: number[] = [];
      for (const uniform of sdf.uniforms) {
        insertLocations.push(...uniform.nameMangleIndices);
      }
      insertLocations.push(sdf.functionNameMangleIndex);

      // Mangle all calls to gSdfMap
      let hadSdfMapCalls = false;
      const sdfMapRegex = /\bgSdfMap\b/gum;
      for (; ;) {
        const result = sdfMapRegex.exec(sdf.code);
        if (!result) {
          break;
        }
        hadSdfMapCalls = true;
        insertLocations.push(result.index + result[0].length);
      }

      // Sort it from highest to lowest indices so that as we insert which increases the string
      // length we don't need to keep track of how much we've offset the string for the next insert
      insertLocations.sort((a, b) => b - a);

      let mangledCode = sdf.code;
      const mangleIdPostfix = `_${sdf.mangledId}`;
      for (const insertLocation of insertLocations) {
        mangledCode = insertString(mangledCode, insertLocation, mangleIdPostfix);
      }

      if (hadSdfMapCalls) {
        shaderFunctions += `gSdfResult gSdfMap_${sdf.mangledId}(inout gSdfContext context, gSdf sdf);\n`
      }
      shaderFunctions += `${mangledCode}\n`;

      if (hadSdfMapCalls) {
        shaderMaps += `
        gSdfResult gSdfMap_${sdf.mangledId}(inout gSdfContext context, gSdf sdf) {
          vec3 savedPoint = context.point;
          gSdfResult result = gSdfResultNull;
          context.id = sdf.id;

          switch (sdf.id) {`;

        for (const node of sdf.allChildShaderNodes) {
          shaderMaps += `
            case ${node.id}: {
              ${generateMapCall(node)}
              break;
            }`;
        }

        shaderMaps += `
          }
          
          context.point = savedPoint;
          if (context.renderId == sdf.id) {
            context.result = result;
          }
          return result;
        }`;
      }
    }

    let shaderParams = "";
    for (const child of treeResult.root.children) {
      shaderParams += `, gSdf(${child.id})`;
    }
    const shaderScene = `
    gSdfResult result;
    ${generateMapCall(treeResult.root)}
    if (context.renderId == gSdfRootId) {
      context.result = result;
    }
    return context.result;`;

    return this.generateSDFShaderHeader(`${shaderFunctions}\n${shaderMaps}`, treeResult.nodeCount, treeResult.root.id, shaderScene);
  };

  private generateSDFShaderHeader(shaderFunctions: string, nodeCount: number, rootId: number, shaderScene: string) {
    return `
    const int gSdfNodeCount = ${nodeCount};
    const int gSdfRootId = ${rootId};

    struct gSdfContext {
      vec3 point;
      int id;
      int renderId;
      gSdfResult result;
    };

    const gSdfContext gSdfContextNull = gSdfContext(vec3(0), gSdfNoHitId, gSdfRootId, gSdfResultNull);

    // Dummy version that never gets called since we mangle all calls to gSdfMap
    // This is only used when compiling the sdf in isolation
    gSdfResult gSdfMap(inout gSdfContext context, gSdf sdf) {
      return gSdfResultNull;
    }

    ${shaderFunctions}
    
    gSdfResult gSdfScene(inout gSdfContext context) {
      context.id = gSdfRootId;
      ${shaderScene}
    }`;
  }

  private compileLayerShader(idToLayer: IdToLayer, layerShader: LayerShader, parent: ProcessedLayerGroup | null, throwOnError: boolean, previousIdToLayer?: IdToLayer): ProcessedLayerShader {
    const previousRebuild = this.rebuildFromPrevious<ProcessedLayerShader>(layerShader, parent, previousIdToLayer);
    if (previousRebuild) {
      return previousRebuild;
    }

    const compiledSdfChildren: CompiledLayerSDF[] = [];
    let sdfHeader = this.generateSDFShaderHeader("", 1, 0, "return gSdfResultNull;");
    let sdfTreeResult: SDFShaderTreeResult | null = null;
    if (layerShader.layers) {
      for (const sdf of layerShader.layers) {
        compiledSdfChildren.push(this.compileLayerSDF(idToLayer, sdf, null, throwOnError));
      }

      // Now that we have compiled all the sdf children, we need to generate the sdf shader
      // We create a fake root that unions all the children together
      sdfTreeResult = this.buildSDFShaderTree(compiledSdfChildren);
      if (sdfTreeResult) {
        sdfHeader = this.buildSDFShader(sdfTreeResult);
      }
    }

    const gl = this.gl;
    const processedProgram = this.createProgram(`${sdfHeader}\n${layerShader.code}`);

    if (processedProgram.error) {
      const programText = addLineNumbers(processedProgram.completeCode);
      const shaderTreeText = sdfTreeResult ? debugShaderTree(sdfTreeResult.root) : null;
      const errorText = `${processedProgram.error}\n\n--- Program:\n${programText}\n\n--- Shader Tree:\n${shaderTreeText}`;
      if (throwOnError) {
        throw new Error(errorText);
      } else {
        console.log(errorText);
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
            line: Number(result[1]) - fragmentShaderHeaderLineCount - countCodeLines(sdfHeader),
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
      code: layerShader.code,
      uniforms: [],
      errors,
      program,
      layers: compiledSdfChildren,
      sdfTreeResult,
      sdfUniforms: [],
      combinedUniforms: [],
      gOpacity: getUniformLocation("gOpacity"),
      gResolution: getUniformLocation("gResolution"),
      gTime: getUniformLocation("gTime"),
      gFrame: getUniformLocation("gFrame"),
      gPreviousLayer: getUniformLocation("gPreviousLayer"),
      gBlendMode: getUniformLocation("gBlendMode"),
      gFlipY: getUniformLocation("gFlipY"),
      gZero: getUniformLocation("gZero"),
      gSdfHighlightId: getUniformLocation("gSdfHighlightId"),
      gAudioFrequencies: getUniformLocation("gAudioFrequencies"),
      gAudioSamples: getUniformLocation("gAudioSamples"),
      gAudioVolume: getUniformLocation("gAudioVolume"),
      gAudioVolumeAverage: getUniformLocation("gAudioVolumeAverage"),
      gAudioVolumePeak: getUniformLocation("gAudioVolumePeak"),
      gAudioVolumeTrough: getUniformLocation("gAudioVolumeTrough"),
      gAudioReactiveScalar: getUniformLocation("gAudioReactiveScalar"),
      usesAudioInput: false,
    };

    // If we have an SDF tree, then we want to capture all the new uniform locations
    // since we mangled each one and combined it into generated code for this shader layer
    if (sdfTreeResult) {
      for (const compiledSdf of sdfTreeResult.allValidSdfs) {
        const processedSdf = compiledSdf as ProcessedLayerSDF;
        for (const uniform of processedSdf.uniforms) {
          uniform.location = this.getUniformLocationGeneric(
            `${uniform.name}_${processedSdf.mangledId}`, getUniformLocation, uniform.type);
          processedLayerShader.sdfUniforms.push(uniform);
        }
      }
    }

    // Ideally we would just pass this in as a parent when compiling the sdf, but we have to compile
    // SDFs before we compile this layer since part of this layer's code is generated by the SDFs
    for (const sdfChild of compiledSdfChildren) {
      sdfChild.parent = processedLayerShader;
    }

    // Detect if the optimized shader used any of these inputs
    processedLayerShader.usesAudioInput =
      Boolean(processedLayerShader.gAudioFrequencies) ||
      Boolean(processedLayerShader.gAudioSamples) ||
      Boolean(processedLayerShader.gAudioVolume) ||
      Boolean(processedLayerShader.gAudioVolumeAverage) ||
      Boolean(processedLayerShader.gAudioVolumePeak) ||
      Boolean(processedLayerShader.gAudioVolumeTrough) ||
      Boolean(processedLayerShader.gAudioReactiveScalar);

    processedLayerShader.uniforms = this.parseUniforms(processedLayerShader, getUniformLocation);

    processedLayerShader.combinedUniforms = [...processedLayerShader.uniforms, ...processedLayerShader.sdfUniforms];

    this.mapLayerById(idToLayer, processedLayerShader);
    return processedLayerShader;
  }

  private compileLayerJavaScript(idToLayer: IdToLayer, layerJavaScript: LayerJavaScript, parent: ProcessedLayerGroup | null, previousIdToLayer?: IdToLayer): ProcessedLayerJavaScript {
    const previousRebuild = this.rebuildFromPrevious<ProcessedLayerJavaScript>(layerJavaScript, parent, previousIdToLayer);
    if (previousRebuild) {
      return previousRebuild;
    }

    // This is a crude way of determining if the JS layer uses audio input, but for now
    // it's only a suggestion and isn't used for anything other that informing the editor
    const usesAudioInput = /gAudio/gum.test(layerJavaScript.code);

    const processedLayerJavaScript: ProcessedLayerJavaScript = {
      type: "js",
      layer: layerJavaScript,
      code: layerJavaScript.code,
      handle: null,
      uniforms: [],
      parent,
      errors: [],
      texture: this.createBlankTexture(),
      completedRequestId: -1,
      lastRequestId: -1,
      usesAudioInput
    };

    if (this.onCompileJavaScriptLayer) {
      const result = this.onCompileJavaScriptLayer(layerJavaScript);
      processedLayerJavaScript.handle = result.handle;
      processedLayerJavaScript.uniforms = this.parseUniforms(processedLayerJavaScript, () => null);
    }

    this.mapLayerById(idToLayer, processedLayerJavaScript);
    return processedLayerJavaScript;
  }

  private compileLayerRoot(layerRoot: LayerRoot, previousIdToLayer?: IdToLayer): ProcessedLayerRoot {
    const idToLayer: IdToLayer = {};
    const processedLayerRoot = this.compileLayerGroup(idToLayer, layerRoot, null, previousIdToLayer) as ProcessedLayerRoot;
    processedLayerRoot.idToLayer = idToLayer;
    return processedLayerRoot;
  }

  private compileLayerGroup(idToLayer: IdToLayer, layerGroup: LayerGroup, parent: ProcessedLayerGroup | null, previousIdToLayer?: IdToLayer): ProcessedLayerGroup {
    const processedLayerGroup: ProcessedLayerGroup = {
      type: "group",
      parent,
      layer: layerGroup,
      layers: [],
      usesAudioInput: false,
    };

    for (const layer of layerGroup.layers) {
      if (layer.type === "shader") {
        const processedLayerShader = this.compileLayerShader(idToLayer, layer, processedLayerGroup, false, previousIdToLayer);
        processedLayerGroup.layers.push(processedLayerShader);
        processedLayerGroup.usesAudioInput ||= processedLayerShader.usesAudioInput;
      } else if (layer.type === "js") {
        const processedLayerJavaScript = this.compileLayerJavaScript(idToLayer, layer, processedLayerGroup, previousIdToLayer);
        processedLayerGroup.layers.push(processedLayerJavaScript);
        processedLayerGroup.usesAudioInput ||= processedLayerJavaScript.usesAudioInput;
      } else {
        // Recursively compile the child group
        const processedChildGroup = this.compileLayerGroup(idToLayer, layer, processedLayerGroup, previousIdToLayer);
        processedLayerGroup.layers.push(processedChildGroup);
        processedLayerGroup.usesAudioInput ||= processedChildGroup.usesAudioInput;
      }
    }
    this.mapLayerById(idToLayer, processedLayerGroup);
    return processedLayerGroup;
  }

  private mapLayerById(idToLayer: IdToLayer, processedLayer: ProcessedLayer) {
    const id = processedLayer.layer.id;
    if (id in idToLayer) {
      throw new Error(`Layer id '${id}' was not unique (another layer had the same id)`);
    }
    idToLayer[id] = processedLayer;
  }

  public deleteLayer(compiledLayer: CompiledLayer, deleteChildLayers = true) {
    switch (compiledLayer.type) {
      case "group":
        this.deleteCompiledLayerGroup(compiledLayer, deleteChildLayers);
        break;
      case "js":
        this.deleteCompiledLayerJavaScript(compiledLayer);
        break;
      case "shader":
        this.deleteCompiledLayerShader(compiledLayer, deleteChildLayers);
        break;
      case "sdf":
        this.deleteCompiledLayerSDF(compiledLayer, deleteChildLayers);
        break;
    }
  }

  private deleteCompiledLayerSDF(compiledSdf: CompiledLayerSDF, deleteChildLayers = true) {
    if (deleteChildLayers) {
      for (const childSdf of compiledSdf.layers) {
        this.deleteCompiledLayerSDF(childSdf);
      }
    }
    clearObject(compiledSdf);
  }

  private deleteCompiledLayerCode(compiledLayer: CompiledLayerCode) {
    for (const uniform of compiledLayer.uniforms) {
      clearObject(uniform);
    }
  }

  private deleteCompiledLayerShader(compiledLayer: CompiledLayerShader, deleteChildLayers = true) {
    const processedLayer = compiledLayer as ProcessedLayerShader;
    this.gl.deleteProgram(processedLayer.program);

    if (deleteChildLayers) {
      for (const childSdf of processedLayer.layers) {
        this.deleteCompiledLayerSDF(childSdf);
      }
    }

    this.deleteCompiledLayerCode(compiledLayer);
    clearObject(processedLayer);
  }

  private deleteCompiledLayerJavaScript(compiledLayer: CompiledLayerJavaScript) {
    const processedLayer = compiledLayer as ProcessedLayerJavaScript;

    if (processedLayer.handle && this.onDeleteJavaScriptLayer) {
      this.onDeleteJavaScriptLayer(processedLayer);
    }
    this.gl.deleteTexture(processedLayer.texture);

    this.deleteCompiledLayerCode(compiledLayer);
    clearObject(processedLayer);
  }

  private deleteCompiledLayerGroup(compiledLayer: CompiledLayerGroup, deleteChildLayers = true) {
    const processedLayer = compiledLayer as ProcessedLayerGroup;

    if (deleteChildLayers) {
      for (const childLayer of processedLayer.layers) {
        this.deleteLayer(childLayer);
      }
    }

    // If this is a root group
    if ("idToLayer" in processedLayer) {
      const processedRoot = processedLayer as ProcessedLayerRoot;
      clearObject(processedRoot.idToLayer);
    }
    clearObject(processedLayer);
  }

  public getOrCacheTexture(url: string): UserTexture {
    const texture = this.textureCache[url];
    if (texture) {
      return texture;
    }

    const userTexture: UserTexture = {
      gl: this.gl,
      texture: this.createBlankTexture(),
      url,
      handle: null
    };
    this.loadTexture(userTexture);

    this.textureCache[url] = userTexture;
    return userTexture;
  }

  private evaluatePossibleCurves(processedUniform: ProcessedUniform, timeSeconds: number): ShaderValue["value"] {
    // Since the actual value types here are just generic maps, it makes it difficult to
    // generically check for curves and since we can't use them on buttons/axes, skip them
    const shaderValue = processedUniform.shaderValue;
    const shaderValueWithCurves = shaderValue as ShaderValueWithCurves;

    const uniformKey = getUniformKey(processedUniform);

    const value = shaderValue.value;

    const curve = shaderValueWithCurves.curve;
    if (!curve) {
      return value;
    }

    if (Array.isArray(curve)) {
      const valueAsArray = Array.isArray(value) ? value : [];

      const newArray: typeof valueAsArray = [];
      for (let i = 0; i < curve.length; ++i) {
        const elementValue = valueAsArray[i];
        const elementCurve = curve[i];

        if (elementCurve) {
          newArray[i] = this.evaluateCurve(elementCurve, `${uniformKey}_curve[${i}]`, timeSeconds);
        } else {
          newArray[i] = elementValue;
        }
      }
      return newArray;
    }

    return this.evaluateCurve(curve, `${uniformKey}_curve`, timeSeconds);
  }

  public highlightSdf(sdf: CompiledLayerSDF | null) {
    this.sdfHighlightId = sdf ? sdf.sdfId : sdfNoHitId;
  }

  private checkErrors() {
    const errorCode = this.gl.getError();
    switch (errorCode) {
      case this.gl.NO_ERROR: return;
      case this.gl.INVALID_ENUM: console.error("INVALID_ENUM"); return;
      case this.gl.INVALID_VALUE: console.error("INVALID_VALUE"); return;
      case this.gl.INVALID_OPERATION: console.error("INVALID_OPERATION"); return;
      case this.gl.INVALID_FRAMEBUFFER_OPERATION: console.error("INVALID_FRAMEBUFFER_OPERATION"); return;
      case this.gl.OUT_OF_MEMORY: console.error("OUT_OF_MEMORY"); return;
      case this.gl.CONTEXT_LOST_WEBGL: console.error("CONTEXT_LOST_WEBGL"); return;
    }
  }

  private renderLayerShaderInternal(
    processedLayerShader: ProcessedLayerShader,
    parentOpacity: number,
    frameBuffer: WebGLFramebuffer | null,
    previousLayerTexture: WebGLTexture | null,
    width: number,
    height: number,
    timeSeconds: number,
    flipY: boolean,
    onRender?: RenderLayerCodeCallback) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

    if (processedLayerShader.program) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(processedLayerShader.program);

      // Apply global uniforms
      gl.uniform1f(processedLayerShader.gOpacity, processedLayerShader.layer.opacity * parentOpacity);
      gl.uniform2f(processedLayerShader.gResolution, width, height);
      gl.uniform1f(processedLayerShader.gTime, timeSeconds);
      gl.uniform1i(processedLayerShader.gFrame, this.frame);
      gl.uniform1i(processedLayerShader.gFlipY, Number(flipY));
      gl.uniform1i(processedLayerShader.gZero, 0);
      gl.uniform1i(processedLayerShader.gSdfHighlightId, this.sdfHighlightId);

      const blendModeIndex = blendModeToIndex[processedLayerShader.layer.blendMode];
      gl.uniform1i(processedLayerShader.gBlendMode, blendModeIndex);

      gl.uniform1i(processedLayerShader.gPreviousLayer, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, previousLayerTexture);

      gl.uniform1f(processedLayerShader.gAudioVolume, this.audioVolume);
      gl.uniform1f(processedLayerShader.gAudioVolumeAverage, this.audioVolumeAverage);
      gl.uniform1f(processedLayerShader.gAudioVolumePeak, this.audioVolumePeak);
      gl.uniform1f(processedLayerShader.gAudioVolumeTrough, this.audioVolumeTrough);
      gl.uniform1f(processedLayerShader.gAudioReactiveScalar, this.audioReactiveScalar);

      gl.uniform1i(processedLayerShader.gAudioFrequencies, 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.audioFrequenciesTexture);

      gl.uniform1i(processedLayerShader.gAudioSamples, 2);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.audioSamplesTexture);

      // When applying layer uniforms we need to set each sampler uniform to an index
      // We start this at 3 to account for built in textures (gPreviousLayer, gAudioFrequencies, gAudioSamples)
      let textureSamplerIndex = 3;
      for (const processedUniform of processedLayerShader.combinedUniforms) {
        // Don't set uniforms that don't have locations. These can occur if we
        // found the uniform via a regex, but it was optimized out by the compiler
        if (!processedUniform.location) {
          continue;
        }

        const value = this.evaluatePossibleCurves(processedUniform, timeSeconds);
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
            const numericValue = processedUniform.enumDescription.stringToInt[validatedValue] || 0;
            gl.uniform1i(processedUniform.location, numericValue);
            break;
          }
          case "sampler2D": {
            // Special case for customTextureUniform as we manually set this texture internally
            if (processedUniform === this.customTextureUniform) {
              gl.activeTexture(gl.TEXTURE0 + textureSamplerIndex);
              gl.bindTexture(gl.TEXTURE_2D, this.customTexture);
              gl.uniform1i(processedUniform.location, textureSamplerIndex);
              ++textureSamplerIndex;
              break;
            }

            const validatedValue = validateGLSLSampler2D(processedUniform.type, value,
              processedUniform.defaultValue);
            const loadedTexture = this.getOrCacheTexture(validatedValue.url);
            this.updateTexture(loadedTexture);
            gl.activeTexture(gl.TEXTURE0 + textureSamplerIndex);
            gl.bindTexture(gl.TEXTURE_2D, loadedTexture.texture);

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
            const uniformKey = getUniformKey(processedUniform);
            const state = this.evaluateButton(uniformKey, processedUniform.shaderValue.value);
            gl.uniform1i(processedUniform.location.buttonHeld, Number(state.buttonHeld));
            gl.uniform1i(processedUniform.location.buttonTriggered, Number(state.buttonTriggered));
            gl.uniform1i(processedUniform.location.buttonReleased, Number(state.buttonReleased));
            gl.uniform1f(processedUniform.location.buttonTriggeredTimestamp, state.buttonTriggeredTimestamp);
            gl.uniform1f(processedUniform.location.buttonReleasedTimestamp, state.buttonReleasedTimestamp);
            gl.uniform1i(processedUniform.location.touchHeld, Number(state.touchHeld));
            gl.uniform1i(processedUniform.location.touchTriggered, Number(state.touchTriggered));
            gl.uniform1i(processedUniform.location.touchReleased, Number(state.touchReleased));
            gl.uniform1f(processedUniform.location.touchTriggeredTimestamp, state.touchTriggeredTimestamp);
            gl.uniform1f(processedUniform.location.touchReleasedTimestamp, state.touchReleasedTimestamp);
            gl.uniform1f(processedUniform.location.value, state.value);
            break;
          }
          case "axis": {
            const uniformKey = getUniformKey(processedUniform);
            const state = this.evaluateAxis(uniformKey, processedUniform.shaderValue.value);
            gl.uniform1f(processedUniform.location.value, state.value);
            break;
          }

          default: throw new Error(`Unexpected GLSL type '${(processedUniform as any).type}'`)
        }
      }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else {
      // Clear to red to indicate an error
      gl.clearColor(1, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    if (onRender) {
      onRender(processedLayerShader, gl);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  private clearRenderTargetInternal(renderTarget: RenderTarget, checkerSize: number | false = DEFAULT_CHECKER_SIZE) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.buffer);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (checkerSize !== false) {
      this.checkerboardSize.shaderValue.value = checkerSize;
      this.renderLayerShaderInternal(
        this.checkerboardShader,
        1.0,
        renderTarget.buffer,
        null,
        renderTarget.width,
        renderTarget.height,
        0,
        false);
    }
  };

  public renderLayerShaderPreviews(
    compiledLayerRoot: CompiledLayerRoot,
    timeStampMs: number,
    renderTargets: RenderTargets,
    onRender: RenderLayerCodeCallback,
    flipY = false,
    checkerSize: number = DEFAULT_CHECKER_SIZE) {
    if (this.isRenderingInternal) {
      throw new Error("A frame is currently being rendered, wait for the promise returned by 'render()' or check 'isRendering'");
    }

    try {
      this.isRenderingInternal = true;
      const processedLayerRoot = compiledLayerRoot as ProcessedLayerRoot;

      const targetsInternal = renderTargets as any as RenderTargetsInternal;
      this.gl.viewport(0, 0, targetsInternal.widthRender, targetsInternal.heightRender);

      const checkerTarget = this.requestRenderTarget(renderTargets);
      this.clearRenderTargetInternal(checkerTarget, checkerSize);

      const renderTarget = this.requestRenderTarget(renderTargets);

      const timeSeconds = timeStampMs / 1000;

      // We render each layer as if it is a standalone with only the checkerboard behind it
      const results: Record<string, Uint8Array> = {};
      for (const processedLayer of Object.values(processedLayerRoot.idToLayer)) {
        if (processedLayer.type === "shader") {
          const blendMode = processedLayer.layer.blendMode;
          processedLayer.layer.blendMode = "normal";
          const opacity = processedLayer.layer.opacity;
          processedLayer.layer.opacity = 1.0;
          this.renderLayerShaderInternal(
            processedLayer,
            1,
            renderTarget.buffer,
            checkerTarget.texture,
            targetsInternal.widthRender,
            targetsInternal.heightRender,
            timeSeconds,
            flipY,
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
            renderTarget.buffer,
            checkerTarget.texture,
            targetsInternal.widthRender,
            targetsInternal.heightRender,
            timeSeconds,
            flipY,
            onRender);
          this.customTextureShader.layer.id = "";
        }
      }

      this.releaseRenderTarget(checkerTarget);
      this.releaseRenderTarget(renderTarget);
      return results;
    } finally {
      this.isRenderingInternal = false;
    }
  };

  private evaluateCurveInput(curveInput: CurveInput | undefined, uniqueKey: string, timeSeconds: number): number {
    if (!curveInput) {
      // TODO(trevor): This becomes curve either clip time or transition overlap time
      return timeSeconds % 1.0;
    }
    switch (curveInput.type) {
      case "time":
        return (timeSeconds / curveInput.duration) % 1.0;
      case "audioReactiveScalar":
        return this.audioReactiveScalar;
      case "audioVolume":
        return this.audioVolume;
      case "audioVolumeAverage":
        return this.audioVolumeAverage;
      case "button":
        return this.evaluateButton(uniqueKey, curveInput.bindings).value;
      case "axis": {
        return this.evaluateAxis(uniqueKey, curveInput.bindings).value * 0.5 + 0.5;
      }
    }
  }

  private evaluateCurve(curve: CurveWithInput, uniqueKey: string, timeSeconds: number): number {
    const input = clamp(this.evaluateCurveInput(curve.input, uniqueKey, timeSeconds), 0, 1);
    return evaluateCurve(curve, input);
  }

  private evaluateAxis(uniqueKey: string, bindings: ShaderAxisBindings): ShaderAxisState {
    if (!this.onSampleButton || !this.onSampleAxis) {
      return defaultAxisState();
    }
    const onSampleButton = this.onSampleButton;
    const onSampleAxis = this.onSampleAxis;

    let cumulativeAxis = 0;
    let cumulativeAxisFromButtons = 0;

    // TODO(trevor): In the future, we want the control defaults/bindings to be modifiable
    // basically we almost want that to be the "shader value", maybe in the future we'll have it all
    for (const deviceId in bindings) {
      const axisInputId = bindings[deviceId];

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

    const nextState = {
      value: cumulativeAxis === 0 ? cumulativeAxisFromButtons : cumulativeAxis
    };
    this.axisStates[uniqueKey] = nextState;
    return nextState;
  }

  private evaluateButton(uniqueKey: string, bindings: ShaderButtonBindings): ShaderButtonState {
    if (!this.onSampleButton) {
      return defaultButtonState();
    }
    const onSampleButton = this.onSampleButton;

    const cumulativeButton: SampledButton = {
      buttonHeld: false,
      touchHeld: false,
      value: 0,
    };

    // TODO(trevor): In the future, we want the control defaults/bindings to be modifiable
    // basically we almost want that to be the "shader value", maybe in the future we'll have it all
    for (const deviceId in bindings) {
      const buttonInputId = bindings[deviceId];
      const sampledButton = onSampleButton(deviceId, buttonInputId);
      if (sampledButton) {
        cumulativeButton.buttonHeld ||= sampledButton.buttonHeld;
        cumulativeButton.touchHeld ||= sampledButton.touchHeld;
        cumulativeButton.value = Math.max(cumulativeButton.value, sampledButton.value);
      }
    }

    const prevState = this.buttonStates[uniqueKey];
    const prevButtonHeld = prevState?.buttonHeld || false;
    const prevTouchHeld = prevState?.touchHeld || false;

    const buttonTriggered = cumulativeButton.buttonHeld && !prevButtonHeld;
    const buttonReleased = !cumulativeButton.buttonHeld && prevButtonHeld;
    const touchTriggered = cumulativeButton.touchHeld && !prevTouchHeld;
    const touchReleased = !cumulativeButton.touchHeld && prevTouchHeld;

    const timeSeconds = this.lastTimeStampMs / 1000;
    const buttonTriggeredTimestamp = buttonTriggered
      ? timeSeconds
      : (prevState?.buttonTriggeredTimestamp || 0);
    const buttonReleasedTimestamp = buttonReleased
      ? timeSeconds
      : (prevState?.buttonReleasedTimestamp || 0);
    const touchTriggeredTimestamp = touchTriggered
      ? timeSeconds
      : (prevState?.touchTriggeredTimestamp || 0);
    const touchReleasedTimestamp = touchReleased
      ? timeSeconds
      : (prevState?.touchReleasedTimestamp || 0);

    const nextState: ShaderButtonState = {
      buttonHeld: cumulativeButton.buttonHeld,
      buttonTriggered,
      buttonReleased,
      buttonTriggeredTimestamp,
      buttonReleasedTimestamp,
      touchHeld: cumulativeButton.touchHeld,
      touchTriggered,
      touchReleased,
      touchTriggeredTimestamp,
      touchReleasedTimestamp,
      value: cumulativeButton.value
    };

    this.buttonStates[uniqueKey] = nextState;
    return nextState;
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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, boundTexture);
      }
    }
  }

  public render(
    compiledLayerGroup: CompiledLayerGroup,
    timeStampMs: number,
    renderTargets: RenderTargets,
    flipY = false,
    renderToBackBuffer = true): number {
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
      if (this.onBeforeControlsUpdate) {
        this.onBeforeControlsUpdate();
      }

      const gl = this.gl;
      const targetsInternal = renderTargets as any as RenderTargetsInternal;
      gl.viewport(0, 0, targetsInternal.widthRender, targetsInternal.heightRender);

      const timeSeconds = timeStampMs / 1000;

      const renderRecursive = (processedLayerGroup: ProcessedLayerGroup, parentOpacity: number, readTarget: RenderTarget): RenderTarget => {
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
              const writeTarget = this.requestRenderTarget(renderTargets);

              this.renderLayerShaderInternal(
                layer,
                groupOpacity,
                writeTarget.buffer,
                readTarget.texture,
                targetsInternal.widthRender,
                targetsInternal.heightRender,
                timeSeconds,
                false);

              this.releaseRenderTarget(readTarget);
              readTarget = writeTarget;
            }
          } else if (layer.type === "js") {
            if (this.onRenderJavaScriptLayer) {
              if (layer.lastRequestId - layer.completedRequestId < defaultFramesAheadForAsyncLayers) {
                const blendModeIndex = blendModeToIndex[layer.layer.blendMode];
                const globals: JavaScriptGlobals = {
                  gBlendMode: blendModeIndex,
                  gOpacity: layer.layer.opacity * parentOpacity,
                  gResolution: [targetsInternal.widthRender, targetsInternal.heightRender],
                  gPreviousLayer: null,
                  gTime: timeSeconds,
                  gFrame: this.frame,
                  gAudioFrequencies: this.audioFrequencies,
                  gAudioSamples: this.audioSamples,
                  gAudioVolume: this.audioVolume,
                  gAudioVolumeAverage: this.audioVolumeAverage,
                  gAudioVolumePeak: this.audioVolumePeak,
                  gAudioVolumeTrough: this.audioVolumeTrough,
                  gAudioReactiveScalar: this.audioReactiveScalar,
                };

                const uniforms: CompactUniforms = {};
                for (const uniform of layer.uniforms) {
                  const uniformKey = getUniformKey(uniform);
                  const name = uniform.shaderValue.name;
                  if (uniform.type === "button") {
                    uniforms[name] = this.evaluateButton(uniformKey, uniform.shaderValue.value);
                  } else if (uniform.type === "axis") {
                    uniforms[name] = this.evaluateAxis(uniformKey, uniform.shaderValue.value);
                  } else {
                    uniforms[name] = uniform.shaderValue.value;
                  }
                }

                ++layer.lastRequestId;
                this.onRenderJavaScriptLayer(layer.lastRequestId, layer, globals, uniforms);
              }

              this.customTexture = layer.texture;
              this.customTextureShader.layer.blendMode = layer.layer.blendMode;
              this.customTextureShader.layer.opacity = layer.layer.opacity;

              const writeTarget = this.requestRenderTarget(renderTargets);

              this.renderLayerShaderInternal(
                this.customTextureShader,
                groupOpacity,
                writeTarget.buffer,
                readTarget.texture,
                targetsInternal.widthRender,
                targetsInternal.heightRender,
                timeSeconds,
                false);
              this.customTextureShader.layer.blendMode = "normal";
              this.customTextureShader.layer.opacity = 1;

              this.releaseRenderTarget(readTarget);
              readTarget = writeTarget;
            }
          } else if (layer.type === "group") {
            if (layer.layer.blendMode === "passThrough") {
              readTarget = renderRecursive(layer, groupOpacity, readTarget);
            } else {
              const requestedTarget = this.requestRenderTarget(renderTargets);
              this.clearRenderTargetInternal(requestedTarget, false);
              const resultTarget = renderRecursive(layer, 1.0, requestedTarget);

              const writeTarget = this.requestRenderTarget(renderTargets);

              // Now blend the requested target back into the read target
              this.customTexture = resultTarget.texture;
              this.customTextureShader.layer.blendMode = layer.layer.blendMode;
              this.customTextureShader.layer.opacity = 1;
              this.customTextureShader.layer.id = layer.layer.id;
              this.renderLayerShaderInternal(
                this.customTextureShader,
                1,
                writeTarget.buffer,
                readTarget.texture,
                targetsInternal.widthRender,
                targetsInternal.heightRender,
                timeSeconds,
                false);
              this.customTextureShader.layer.blendMode = "normal";
              this.customTextureShader.layer.id = "";

              this.releaseRenderTarget(resultTarget);
              this.releaseRenderTarget(readTarget);
              readTarget = writeTarget;
            }
          }
        }

        return readTarget;
      }

      const initialTarget = this.requestRenderTarget(renderTargets);
      this.clearRenderTargetInternal(initialTarget);
      let finalReadTarget = renderRecursive(processedLayerGroup, 1.0, initialTarget);

      for (let aa = 1; aa < targetsInternal.antiAliasLevel; ++aa) {
        // This is a special case where we do not call requestRenderTarget as the targets
        // have already been pre-allocated. Moreover, releaseRenderTarget does nothing to AA targets
        const aaTarget = targetsInternal.antiAliasTargets[aa];
        this.gl.viewport(0, 0, aaTarget.width, aaTarget.height);

        this.renderLayerShaderInternal(
          this.copyShader,
          1.0,
          aaTarget.buffer,
          finalReadTarget.texture,
          aaTarget.width,
          aaTarget.height,
          0,
          false);

        this.releaseRenderTarget(finalReadTarget);
        finalReadTarget = aaTarget;
      }

      if (renderToBackBuffer) {
        this.gl.viewport(0, 0, targetsInternal.widthFinal, targetsInternal.heightFinal);
        // Render to the back buffer (we pass null for the render buffer)
        this.renderLayerShaderInternal(
          this.copyShader,
          1.0,
          null,
          finalReadTarget.texture,
          targetsInternal.widthFinal,
          targetsInternal.heightFinal,
          0,
          flipY);
      } else {
        if (flipY) {
          const flipTarget = this.requestRenderTarget(renderTargets);
          this.renderLayerShaderInternal(
            this.copyShader,
            1.0,
            flipTarget.buffer,
            finalReadTarget.texture,
            targetsInternal.widthFinal,
            targetsInternal.heightFinal,
            0,
            true);

          this.releaseRenderTarget(finalReadTarget);
          finalReadTarget = flipTarget;
        }

        gl.bindFramebuffer(gl.FRAMEBUFFER, finalReadTarget.buffer);
      }

      this.releaseRenderTarget(finalReadTarget);

      return frameTimeSeconds;
    } finally {
      this.isRenderingInternal = false;
      this.checkErrors();
    }
  }
}
