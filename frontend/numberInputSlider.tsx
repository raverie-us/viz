import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import React from "react";
import {NumberInput, NumberInputProps} from "./numberInput";

export interface SliderParams {
  min: number;
  max: number;
}

export interface NumberInputSliderProps extends NumberInputProps, SliderParams {
  step: number;
}

const SMALLEST_STEP = 10000;

export const shouldShowSlider = (params: SliderParams) =>
  params.min !== Number.NEGATIVE_INFINITY && params.max !== Number.POSITIVE_INFINITY;

export const NumberInputSlider: React.FC<NumberInputSliderProps> = (props) => {
  const {min, max, step, ...numberInputProps} = props;

  const slider = shouldShowSlider(props)
    ? <Box width="100%" ml={1} mr={1}>
      <Slider
        size="small"
        value={props.value}
        min={min}
        max={max}
        step={Math.max(step, (max - min) / SMALLEST_STEP)}
        onChange={(e, newValue) => {
          props.onChange(newValue as number, false);
        }}
      />
    </Box>
    : null;

  return <Box display="flex" flexGrow={1} alignItems="center" gap={0.5}>
    {slider}
    <NumberInput {...numberInputProps}/>
  </Box>;
};
