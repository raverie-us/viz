import Button from "@mui/material/Button";
import React from "react";
import {ColorResult, SketchPicker} from "react-color";
import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";

export type RGBANormalized = number[];

export interface ColorPickerProps {
  id?: string;
  color?: string | RGBANormalized;
  disableAlpha?: boolean;
  disabled?: boolean;
  onChange: (hexColor: string, rgbaNormalized: RGBANormalized) => void;
}

export const toColorString = (color?: string | RGBANormalized): string | undefined => {
  if (typeof color === "string" || color === undefined) {
    return color;
  }
  const r = color[0] * 255;
  const g = color[1] * 255;
  const b = color[2] * 255;
  const a = color[3] === undefined ? 1 : color[3]; // In CSS, alpha is already [0, 1]
  return `rgba(${r},${g},${b},${a})`;
};

export const ColorPicker: React.FC<ColorPickerProps> = (props) => {
  const [open, setOpen] = React.useState(false);
  const [color, setColor] = React.useState<string | undefined>(toColorString(props.color));
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    setColor(toColorString(props.color));
  }, [props.color]);

  const onChange = (newColor: ColorResult) => {
    const rgba = newColor.rgb;
    const rgbaNormalized = [
      rgba.r / 255,
      rgba.g / 255,
      rgba.b / 255,
      rgba.a === undefined ? 1 : rgba.a // Alpha is already [0, 1]
    ];
    setColor(toColorString(rgbaNormalized));
    props.onChange(newColor.hex, rgbaNormalized);
  };

  return <>
    <Button
      id={props.id}
      ref={buttonRef}
      disabled={props.disabled}
      sx={{
        padding: 0,
        minHeight: "32px",
        minWidth: "32px",
        height: "32px",
        width: "32px",
        borderRadius: "4px",
        outline: "rgba(0,0,0, 0.5) solid 1px",
        background: "repeating-conic-gradient(#aaa 0% 25%, #fff 0% 50%) 50% / 20px 20px",
        pointerEvents: "auto"
      }}
      onClick={() => {
        setOpen(true);
      }}
      variant="contained">
      <Box width="100%" height="100%" sx={{background: color}}/>
    </Button>
    <Popover
      anchorEl={buttonRef.current}
      onClose={() => setOpen(false)}
      anchorOrigin={{horizontal: "right", vertical: "bottom"}}
      open={open}>
      <SketchPicker
        color={color}
        disableAlpha={props.disableAlpha}
        onChange={(color, event) => {
          onChange(color);
          event.preventDefault();
        }}
        onChangeComplete={(color) => onChange(color)} />
    </Popover>
  </>;
};
