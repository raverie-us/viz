import {
  cloneLayer,
  CompiledLayerRoot,
  CompiledLayerShader,
  CompiledUniform,
  defaultEmptyLayerRoot,
  LayerBlendMode,
  LayerShader,
  numberType,
  NumberType,
  NumberVectorType,
  RaverieVisualizer,
} from "../core/core";
import { visualLayers } from "../core/featuredLayers";
import { commonSolidGradients } from "../core/gradients";

const PLACEHOLDER_IMAGE =
  "data:image/png;base64,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";

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(Math.min(value, max), min);

const randomFloat = (min: number, max: number): number =>
  lerp(min, max, Math.random());

const randomInt = (minInclusive: number, maxExclusive: number): number =>
  Math.floor(randomFloat(minInclusive, maxExclusive));

const randomIntInclusive = (min: number, max: number): number =>
  randomInt(min, max + 1);

const randomIndex = (length: number): number => randomInt(0, length);

const randomArrayValue = <T>(array: T[]): T => array[randomIndex(array.length)];

const randomChance = (chance: number): boolean => Math.random() < chance;

const generatedBlendModes: LayerBlendMode[] = [
  "normal",

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


const randomLayers = visualLayers.filter((layer) => layer.name !== "texture");

const randomNumberUniform = (
  type: NumberType,
  min: number,
  max: number,
  step: number,
  defaultValue: number
): number => {
  const randomFunc = type === "int" ? randomIntInclusive : randomFloat;
  step = step || 1.0;
  if (min !== Number.NEGATIVE_INFINITY && max !== Number.POSITIVE_INFINITY) {
    return randomFunc(min, max);
  } else {
    return clamp(defaultValue + randomFunc(-step, step), min, max);
  }
};

const randomVectorUniform = (
  type: NumberVectorType,
  min: number[],
  max: number[],
  step: number[],
  defaultValue: number[]
): number[] => {
  const result = new Array<number>(defaultValue.length);
  for (let i = 0; i < defaultValue.length; ++i) {
    result[i] = randomNumberUniform(
      numberType(type),
      min[i],
      max[i],
      step[i],
      defaultValue[i]
    );
  }
  return result;
};

// TODO: Need to do some analysis to see if the generated visual is "good"
// Does it change / is it a solid color or boring?
// Can you sort of see the background image? (enough of it?)
// What are the dominant colors, do they match the color scheme?
// If not we can toss a colorize on top
// Maybe instead of a gradient colorize layer, we can do a sort of "color correct" layer?
// Get the hue of a pixel and find the nearest hue in the gradient map
// Hue, value, saturation
// Preserve the value, but force the hue match
// Possibly force a saturation match too for the found color hue
// Can have a lot of parameters to figure out how much to interpolate (from hue, to hue, etc)
// From value, to value, from saturation, to saturation, etc
// May be more than one hue that matches within the gradient, always go with the lower one
// Can also match on value/saturation, just "find it in the gradient" algorithm and then interpolate to match
// Can even potentially do multiple and do a 3 way interpolation (on hue, value, and saturation)

// Should also try transitions
// Merge every other layer and interpolate opacity until it's gone
// We should use "randomish" 0-1 interpolations with little delays, etc
// So nothing ever transitions 100% the same, but just start with linear for now
// We can direct interpolate a layer IF it has no enum value changes (blend mode, textures, etc)
// Basically as long as everything can direct interpolate
// Also the order of the layer would matter too
// Could maybe do it only if the order lined up...
// Basically we only do layer to layer interpolation if its literally the same index


export class VisualGenerator {
  private readonly visualizer: RaverieVisualizer;
  private id: number = 0;

  public constructor(visualizer: RaverieVisualizer) {
    this.visualizer = visualizer;
  }

  private generateRandomShaderLayer() {
    const layerShader = cloneLayer(
      randomArrayValue(randomLayers)
    ) as LayerShader;
    layerShader.id = this.id.toString();
    ++this.id;
    // This isn't a runtime parameter so we can't change it without re-compiling
    if (randomChance(0.5) && "blendMode" in layerShader) {
      layerShader.blendMode = randomArrayValue(generatedBlendModes);
    }
    return layerShader;
  }

  private randomizeCompiledUniform(uniform: CompiledUniform) {
    if (uniform.parsedComment.randomize === false) {
      return;
    }
    switch (uniform.type) {
      case "float":
      case "int":
        uniform.defaultValue = uniform.shaderValue.value = randomNumberUniform(
          uniform.type,
          uniform.minValue,
          uniform.maxValue,
          uniform.stepValue,
          uniform.defaultValue
        );
        break;
      case "vec2":
      case "vec3":
      case "vec4":
      case "ivec2":
      case "ivec3":
      case "ivec4":
        uniform.defaultValue = uniform.shaderValue.value = randomVectorUniform(
          uniform.type,
          uniform.minValue,
          uniform.maxValue,
          uniform.stepValue,
          uniform.defaultValue
        );

        if (
          uniform.parsedComment.type === "position" &&
          uniform.type === "vec2"
        ) {
          if (randomChance(0.5)) {
            uniform.defaultValue = uniform.shaderValue.value = [0, 0];
          } else if (randomChance(0.5)) {
            uniform.shaderValue.value[0] = 0;
            uniform.defaultValue[0] = 0;
          }
        }
        break;
      case "gradient":
        uniform.defaultValue = uniform.shaderValue.value =
          randomArrayValue(commonSolidGradients);
        break;
      case "sampler2D":
        uniform.defaultValue = uniform.shaderValue.value = {
          url: PLACEHOLDER_IMAGE,
        };
        break;
    }
  }

  private randomizeCompiledLayerShader(compiled: CompiledLayerShader) {
    for (const uniform of compiled.uniforms) {
      this.randomizeCompiledUniform(uniform);
    }
  }

  public randomizeCompiledLayers(root: CompiledLayerRoot) {
    const division = 1.0 / root.layers.length;
    for (let i = 0; i < root.layers.length; ++i) {
      const compiledLayer = root.layers[i];
      if (compiledLayer.type === "shader") {
        compiledLayer.layer.opacity = randomFloat(0.1, 4 * division);
        this.randomizeCompiledLayerShader(compiledLayer);
      }
    }
  }

  public generateRandom(): CompiledLayerRoot {
    const root = defaultEmptyLayerRoot();
    const layerCount = randomInt(4, 12);
    for (let i = 0; i < layerCount; ++i) {
      root.layers.push(this.generateRandomShaderLayer());
    }

    const compiled = this.visualizer.compile(root, "modifyInPlace");
    this.randomizeCompiledLayers(compiled);
    return compiled;
  }
}
