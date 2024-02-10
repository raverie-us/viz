import Box from "@mui/material/Box";
import React from "react";
import {
  CurveWithInput,
  FilterMode,
  getVectorComponents,
  getNumberVectorParts,
  ShaderAxisBindings,
  ShaderButtonBindings,
  ShaderGradient,
  ShaderTexture,
  vectorNumberScalarConstructor,
  WrapMode
} from "../core/core";
import {MediaChooser} from "./mediaChooser";
import {ColorPicker} from "./colorPicker";
import {GradientPicker} from "./gradientPicker";
import {NumberInputSlider, shouldShowSlider, SliderParams} from "./numberInputSlider";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import {pass} from "./utility";
import Switch from "@mui/material/Switch";
import Select from "@mui/material/Select";
import {ControlBindings} from "./controlBinding";
import {CurveEditor} from "./curveEditor";
import {TooltipIconButton} from "./tooltipIconButton";
import TimelineIcon from "@mui/icons-material/Timeline";
import {Expander} from "./expander";
import { capCase } from "./textTransforms";

export interface PropertyBase {
  name: string;
  editor?: string;
}

export interface PropertyNumber extends PropertyBase {
  type: "int" | "float";
  getValue: () => number;
  setValue: (value: number) => void;
  minValue: number;
  maxValue: number;
  stepValue: number;
  curve: CurveWithInput | undefined | null;
}

export interface PropertyNumberVector extends PropertyBase {
  type: "vec2" | "vec3" | "vec4" | "ivec2" | "ivec3" | "ivec4";
  getValue: () => number[];
  setValue: (value: number[]) => void;
  minValue: number[];
  maxValue: number[];
  stepValue: number[];
  curve: (CurveWithInput | undefined | null)[] | undefined | null;
}

export interface PropertyBool extends PropertyBase {
  type: "bool";
  getValue: () => boolean;
  setValue: (value: boolean) => void;
  curve: CurveWithInput | undefined | null;
}

export interface PropertyBoolVector extends PropertyBase {
  type: "bvec2" | "bvec3" | "bvec4";
  getValue: () => boolean[];
  setValue: (value: boolean[]) => void;
  curve: (CurveWithInput | undefined | null)[] | undefined | null;
}

export interface PropertySampler extends PropertyBase {
  type: "sampler2D";
  getValue: () => ShaderTexture;
  setValue: (value: ShaderTexture) => void;
}

export interface PropertyGradient extends PropertyBase {
  type: "gradient";
  getValue: () => ShaderGradient;
  setValue: (value: ShaderGradient) => void;
}

export interface PropertyEnum extends PropertyBase {
  type: "enum";
  getValue: () => string;
  setValue: (value: string) => void;
  enumValues: string[];
}

export interface PropertyButton extends PropertyBase {
  type: "button";
  getValue: () => ShaderButtonBindings;
  setValue: (value: ShaderButtonBindings) => void;
}

export interface PropertyAxis extends PropertyBase {
  type: "axis";
  getValue: () => ShaderAxisBindings;
  setValue: (value: ShaderAxisBindings) => void;
}

export interface PropertyString extends PropertyBase {
  type: "string";
  getValue: () => string;
  setValue: (value: string) => void;
}

export type PropertyGeneric =
  PropertyNumber |
  PropertyNumberVector |
  PropertyBool |
  PropertyBoolVector |
  PropertySampler |
  PropertyGradient |
  PropertyEnum |
  PropertyButton |
  PropertyAxis |
  PropertyString;

export interface PropertyGridProps {
  properties: PropertyGeneric[];
  onChanged: () => void;
}

interface CurvePropertyNodeProps {
  curve: CurveWithInput | undefined | null;
}

const CurvePropertyNode: React.FC<CurvePropertyNodeProps> = (props) =>
  <Box>
    <Box display="flex" alignItems="center">
      {props.children}
      <TooltipIconButton
        sx={{marginLeft: "auto", display: "none"}}
        tooltip="Control with Curve and Inputs"
        size="small"
        tooltipPlacement="top-start">
        <TimelineIcon/>
      </TooltipIconButton>
    </Box>
    {props.curve ? <CurveEditor curve={props.curve}/> : null}
  </Box>;

const propertyToReactNode = (property: PropertyGeneric, onChanged: () => void): React.ReactNode => {
  const type = property.type;

  switch (type) {
    case "string":
      return <TextField
        fullWidth
        value={property.getValue()}
        onChange={(e) => {
          const newValue = e.target.value;
          if (newValue !== property.getValue()) {
            property.setValue(newValue);
            onChanged();
          }
        }}
      />;
    case "int":
    case "float": {
      return <CurvePropertyNode curve={property.curve}>
        <NumberInputSlider
          value={property.getValue()}
          min={property.minValue}
          max={property.maxValue}
          step={property.stepValue}
          onChange={(newValue) => {
            if (newValue !== property.getValue()) {
              property.setValue(newValue);
              onChanged();
            }
          }}/>
      </CurvePropertyNode>;
    }
    case "vec2":
    case "vec3":
    case "vec4":
    case "ivec2":
    case "ivec3":
    case "ivec4": {
      const parts = getNumberVectorParts(type);
      const elements: React.ReactNode[] = [];
      let flexDirection: "row" | "column" = parts.components <= 2 ? "row" : "column";
      const value = property.getValue();
      for (let i = 0; i < parts.components; ++i) {
        const sliderParams: SliderParams = {
          min: property.minValue[i],
          max: property.maxValue[i]
        };
        if (shouldShowSlider(sliderParams)) {
          flexDirection = "column";
        }
        elements.push(<CurvePropertyNode key={i} curve={property.curve ? property.curve[i] : undefined}>
          <NumberInputSlider
            value={value[i]}
            {...sliderParams}
            step={property.stepValue[i]}
            onChange={(newValue) => {
              if (newValue !== value[i]) {
                value[i] = newValue;
                property.setValue(value);
                onChanged();
              }
            }}/>
        </CurvePropertyNode>);
      }

      const elementContainer = <Box display="flex" gap={0.5} flexDirection={flexDirection}>{elements}</Box>;

      if ((type === "vec3" || type === "vec4") && property.editor === "color") {
        return <Expander header={<ColorPicker
          disableAlpha={type === "vec3"}
          color={[...property.getValue()]}
          onChange={(hexColor, rgbaNormalized) => {
            if (type === "vec3") {
              property.setValue(rgbaNormalized.slice(0, 3));
            } else {
              property.setValue(rgbaNormalized);
            }
            onChanged();
          }}/>}>
          {elementContainer}
        </Expander>;
      }

      return elementContainer;
    }
    case "bool": {
      return <CurvePropertyNode curve={property.curve}>
        <Switch
          checked={property.getValue()}
          onChange={(e, newValue) => {
            if (newValue !== property.getValue()) {
              property.setValue(newValue);
              onChanged();
            }
          }}/>
      </CurvePropertyNode>;
    }
    case "bvec2":
    case "bvec3":
    case "bvec4": {
      const components = getVectorComponents(type);
      const elements: React.ReactNode[] = [];
      const value = property.getValue();
      for (let i = 0; i < components; ++i) {
        elements.push(<CurvePropertyNode key={i} curve={property.curve ? property.curve[i] : undefined}>
          <Switch
            checked={value[i]}
            onChange={(e, newValue) => {
              if (newValue !== value[i]) {
                value[i] = newValue;
                property.setValue(value);
                onChanged();
              }
            }}/>
        </CurvePropertyNode>);
      }
      return <Box display="flex" gap={0.5} flexDirection="row">{elements}</Box>;
    }
    case "sampler2D": {
      const value = property.getValue();
      const url = value.url;
      const urlOrNull = url === "" ? null : url;

      const makeTextureWrapSelect = (
        value: WrapMode | undefined,
        direction: "Horizontal" | "Vertical",
        onChange: (value: WrapMode) => void) => <TextField
        value={value || "repeat"}
        variant="outlined"
        size="small"
        fullWidth
        select
        label={`Wrap ${direction}`}
        onChange={(e) => {
          onChange(e.target.value as WrapMode);
        }}
      >
        <MenuItem value="repeat">Repeat</MenuItem>
        <MenuItem value="mirrored">Mirrored Repeat</MenuItem>
        <MenuItem value="clamp">Clamp To Edge</MenuItem>
      </TextField>;

      return <Box display="flex" flexDirection="column" gap={1}>
        <MediaChooser
          type="media"
          reencode={false}
          dataUrl={urlOrNull}
          height={96}
          width={96}
          onMediasChosen={(medias) => {
            const dataUrl = medias.length === 0 ? null : medias[0];
            if (dataUrl !== url) {
              value.url = dataUrl || "";
              property.setValue(value);
              onChanged();
            }
          }}/>
        <TextField
          value={value.filter || "mipmap"}
          variant="outlined"
          size="small"
          label="Filter"
          fullWidth
          select
          onChange={(e) => {
            value.filter = e.target.value as FilterMode;
            property.setValue(value);
            onChanged();
          }}
        >
          <MenuItem value="nearest">Nearest</MenuItem>
          <MenuItem value="linear">Linear</MenuItem>
          <MenuItem value="mipmap">Mipmap</MenuItem>
        </TextField>
        {makeTextureWrapSelect(
          value.wrapHorizontal, "Horizontal", (newWrapMode) => {
            value.wrapHorizontal = newWrapMode;
            property.setValue(value);
            onChanged();
          })}
        {makeTextureWrapSelect(
          value.wrapVertical, "Vertical", (newWrapMode) => {
            value.wrapVertical = newWrapMode;
            property.setValue(value);
            onChanged();
          })}
      </Box>;
    }
    case "gradient": {
      const value = property.getValue();
      return <GradientPicker
        gradient={value}
        onChanged={(newGradient) => {
          property.setValue(newGradient);
          onChanged();
        }}
      />;
    }
    case "enum": {
      const value = property.getValue();
      return <Select
        size="small"
        fullWidth
        value={value}
        label="Age"
        onChange={(e) => {
          property.setValue(e.target.value);
          onChanged();
        }}
      >
        {property.enumValues.map((enumValue) =>
          <MenuItem key={enumValue} value={enumValue}>{capCase(enumValue)}</MenuItem>)}
      </Select>;
    }
    case "button": {
      const value = property.getValue();
      return <ControlBindings
        type="button"
        binding={value}
        onChanged={(newBindings) => {
          property.setValue(newBindings);
          onChanged();
        }}
      />;
    }
    case "axis": {
      const value = property.getValue();
      return <ControlBindings
        type="axis"
        binding={value}
        onChanged={(newBindings) => {
          property.setValue(newBindings);
          onChanged();
        }}
      />;
    }
  }
  throw new Error(`Unexpected property type '${type}'`);
};

export const PropertyGrid: React.FC<PropertyGridProps> = (props) => <Box>
  {
    props.properties.map((property) =>
      <Box
        key={property.name}
        display="flex"
        flexDirection="row"
        alignItems="center"
        pl={1}
        pr={1}
        pt={0.5}
        pb={0.5}
        sx={{
          "&:nth-of-type(odd)": {
            backgroundColor: "rgba(255,255,255,0.0)"
          },
          "&:nth-of-type(even)": {
            backgroundColor: "rgba(255,255,255,0.05)"
          }
        }}>
        <Box width="30%">{capCase(property.name)}</Box>
        <Box width="70%">{propertyToReactNode(property, props.onChanged)}</Box>
      </Box>)
  }
</Box>;

const selectDefined = <T, >(a: T | undefined, b: T): T => a === undefined ? b : a;

export const propertiesFromObject = (obj: Record<string, any>): PropertyGeneric[] => {
  const properties: PropertyGeneric[] = [];

  for (const key of Object.keys(obj)) {
    // Ignore keys that start with '_', as these are specially used as attributes
    if (key.startsWith("_")) {
      continue;
    }

    const valueForTyping = obj[key];
    const metaData = obj[`_${key}`] as Record<string, any> | undefined;
    const metaType = metaData?.type as string | undefined;

    const base: PropertyBase = {
      name: key,
      editor: metaData?.editor
    };

    if (metaType === "enum") {
      properties.push(pass<PropertyEnum>({
        ...base,
        type: "enum",
        getValue: () => obj[key],
        setValue: (newValue) => {
          obj[key] = newValue;
        },
        enumValues: metaData!.enumValues
      }));
      continue;
    }

    if (typeof valueForTyping === "number") {
      properties.push(pass<PropertyNumber>({
        ...base,
        type: (metaType || "float") as PropertyNumber["type"],
        minValue: selectDefined<number>(metaData?.minValue, Number.NEGATIVE_INFINITY),
        maxValue: selectDefined<number>(metaData?.maxValue, Number.POSITIVE_INFINITY),
        stepValue: selectDefined<number>(metaData?.stepValue, 0),
        curve: metaData?.curve,
        getValue: () => obj[key],
        setValue: (newValue) => {
          obj[key] = newValue;
        }
      }));
      continue;
    }

    if (typeof valueForTyping === "boolean") {
      properties.push(pass<PropertyBool>({
        ...base,
        type: "bool",
        getValue: () => obj[key],
        setValue: (newValue) => {
          obj[key] = newValue;
        },
        curve: metaData?.curve
      }));
      continue;
    }

    if (typeof valueForTyping === "string") {
      properties.push(pass<PropertyString>({
        ...base,
        type: "string",
        getValue: () => obj[key],
        setValue: (newValue) => {
          obj[key] = newValue;
        }
      }));
      continue;
    }

    // Possibly a vector type
    if (Array.isArray(valueForTyping) && valueForTyping.length >= 2 && valueForTyping.length <= 4) {
      // Make sure all component types are the same as the first element
      const componentType = typeof valueForTyping[0];
      for (let i = 1; i < valueForTyping.length; ++i) {
        if (typeof valueForTyping[i] !== componentType) {
          continue;
        }
      }

      if (componentType === "number") {
        const type = (metaType || `vec${valueForTyping.length}`) as PropertyNumberVector["type"];
        properties.push(pass<PropertyNumberVector>({
          ...base,
          type,
          minValue: selectDefined<number[]>(metaData?.minValue, vectorNumberScalarConstructor(type, Number.NEGATIVE_INFINITY)),
          maxValue: selectDefined<number[]>(metaData?.maxValue, vectorNumberScalarConstructor(type, Number.POSITIVE_INFINITY)),
          stepValue: selectDefined<number[]>(metaData?.stepValue, vectorNumberScalarConstructor(type, 0)),
          getValue: () => obj[key],
          setValue: (newValue) => {
            obj[key] = newValue;
          },
          curve: metaData?.curve
        }));
        continue;
      } else if (componentType === "boolean") {
        const type = (metaType || `bvec${valueForTyping.length}`) as PropertyBoolVector["type"];
        properties.push(pass<PropertyBoolVector>({
          ...base,
          type,
          getValue: () => obj[key],
          setValue: (newValue) => {
            obj[key] = newValue;
          },
          curve: metaData?.curve
        }));
        continue;
      }
    }

    // We skip any properties we don't know...
  }

  return properties;
};
