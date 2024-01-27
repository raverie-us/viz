import TextField, {BaseTextFieldProps} from "@mui/material/TextField";
import React from "react";

export interface NumberInputProps extends BaseTextFieldProps {
  value: number;
  postfix?: string;
  width?: string;
  height?: string;
  decimals?: number;
  numericUpDown?: boolean;
  step?: number;
  onChange: (newValue: number, cleared: boolean) => void;
}

export const NumberInput = React.forwardRef((props: NumberInputProps, ref: React.ForwardedRef<HTMLDivElement>) => {
  const [inputText, setInputText] = React.useState("");
  const [hasChanged, setHasChanged] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const {value, postfix, width, height, numericUpDown, onChange, ...textFieldProps} = props;

  const computeTextFromNumber = (value: number) =>
    `${props.decimals === undefined ? value : value.toFixed(props.decimals)}${postfix || ""}`;

  const numberFromText = (text: string) =>
    Number(text.replace(/[^0-9]+$/gum, ""));

  const sx = {...props.sx, width};

  return <TextField
    {...textFieldProps}
    ref={ref}
    variant="outlined"
    fullWidth
    type={numericUpDown ? "number" : undefined}
    sx={sx}
    InputProps={{sx: {height}}}
    size="small"
    inputProps={{inputMode: "numeric", pattern: "[0-9]*", step: props.step}}
    value={focused ? inputText : computeTextFromNumber(value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        (e.target as HTMLElement).blur();
      }
    }}
    onFocus={() => {
      setInputText(computeTextFromNumber(value));
      setFocused(true);
      setHasChanged(false);
    }}
    onBlur={(e) => {
      setFocused(false);
      const num = numberFromText(e.target.value);
      // If it's not a valid number at all, revert back to the value
      if (!isNaN(num) && hasChanged) {
        onChange(num, e.target.value === "");
      }
      setHasChanged(false);
    }}
    onChange={(e) => {
      const newText = e.target.value;
      setHasChanged(true);
      setInputText(newText);
      if (newText !== "" && !newText.endsWith(".")) {
        const num = numberFromText(newText);
        if (!isNaN(num)) {
          onChange(num, false);
        }
      }
    }}/>;
});
