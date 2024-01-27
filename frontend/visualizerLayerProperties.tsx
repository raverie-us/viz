import React from "react";
import {CompiledLayer, CompiledUniform} from "../core/core";
import {
  PropertyBase,
  PropertyGeneric,
  PropertyGradient,
  PropertyGrid,
  PropertyNumber,
  PropertySampler,
  PropertyNumberVector,
  PropertyBool,
  PropertyBoolVector,
  PropertyEnum,
  PropertyButton,
  PropertyAxis
} from "./propertyGrid";
import {pass} from "./utility";

export interface VisualizerLayerPropertiesProps {
  compiledLayer: CompiledLayer | null;
  onChanged: () => void;
}

const uniformToProperty = (uniform: CompiledUniform): PropertyGeneric => {
  const type = uniform.type;

  const base: PropertyBase = {
    name: uniform.name,
    editor: typeof uniform.parsedComment.type === "string"
      ? uniform.parsedComment.type
      : undefined
  };

  switch (type) {
    case "int":
    case "float":
      return pass<PropertyNumber>({
        ...base,
        type,
        getValue: () => uniform.shaderValue.value,
        setValue: (value) => {
          uniform.shaderValue.value = value;
        },
        minValue: uniform.minValue,
        maxValue: uniform.maxValue,
        stepValue: uniform.stepValue,
        curve: uniform.shaderValue.curve
      });
    case "vec2":
    case "vec3":
    case "vec4":
    case "ivec2":
    case "ivec3":
    case "ivec4":
      return pass<PropertyNumberVector>({
        ...base,
        type,
        getValue: () => uniform.shaderValue.value,
        setValue: (value) => {
          uniform.shaderValue.value = value;
        },
        minValue: uniform.minValue,
        maxValue: uniform.maxValue,
        stepValue: uniform.stepValue,
        curve: uniform.shaderValue.curve
      });
    case "bool":
      return pass<PropertyBool>({
        ...base,
        type,
        getValue: () => uniform.shaderValue.value,
        setValue: (value) => {
          uniform.shaderValue.value = value;
        },
        curve: uniform.shaderValue.curve
      });
    case "bvec2":
    case "bvec3":
    case "bvec4":
      return pass<PropertyBoolVector>({
        ...base,
        type,
        getValue: () => uniform.shaderValue.value,
        setValue: (value) => {
          uniform.shaderValue.value = value;
        },
        curve: uniform.shaderValue.curve
      });
    case "enum":
      return pass<PropertyEnum>({
        ...base,
        type,
        getValue: () => {
          const value = uniform.shaderValue.value;
          if (typeof value === "string") {
            return value;
          }
          return uniform.enumDescription.intToString[value];
        },
        setValue: (value) => {
          // We always set as a string
          uniform.shaderValue.value = value;
        },
        enumValues: Object.keys(uniform.enumDescription.stringToInt)
      });
    case "sampler2D":
      return pass<PropertySampler>({
        ...base,
        type,
        getValue: () => uniform.shaderValue.value,
        setValue: (value) => {
          uniform.shaderValue.value = value;
        }
      });
    case "gradient":
      return pass<PropertyGradient>({
        ...base,
        type,
        getValue: () => uniform.shaderValue.value,
        setValue: (value) => {
          uniform.shaderValue.value = value;
        }
      });
    case "button":
      return pass<PropertyButton>({
        ...base,
        type: "button",
        getValue: () => uniform.shaderValue.value,
        setValue: (value) => {
          uniform.shaderValue.value = value;
        }
      });
    case "axis":
      return pass<PropertyAxis>({
        ...base,
        type: "axis",
        getValue: () => uniform.shaderValue.value,
        setValue: (value) => {
          uniform.shaderValue.value = value;
        }
      });
  }
  throw new Error(`Unexpected uniform type '${type}'`);
};

export const VisualizerLayerProperties: React.FC<VisualizerLayerPropertiesProps> = (props) => {
  if (props.compiledLayer === null || props.compiledLayer.type === "group") {
    return null;
  }

  return <PropertyGrid properties={props.compiledLayer.uniforms.map(uniformToProperty)} onChanged={props.onChanged}/>;
};
