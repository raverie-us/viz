import IconButton from "@mui/material/IconButton";
import Fab from "@mui/material/Fab";
import {CustomTooltip} from "./customTooltip";
import React from "react";
import {SxProps, Theme} from "@mui/material/styles";

type ButtonProps = React.ComponentProps<"button">;

interface TooltipIconButtonProps extends ButtonProps {
  tooltip: string;

  component?: string;

  tooltipPlacement?:
  | "bottom-end"
  | "bottom-start"
  | "bottom"
  | "left-end"
  | "left-start"
  | "left"
  | "right-end"
  | "right-start"
  | "right"
  | "top-end"
  | "top-start"
  | "top";

  mode?: "icon" | "floating";

  edge?: "start" | "end" | false;

  size?: "small" | "medium" | "large";

  sx?: SxProps<Theme>;
}

const removeProps = (obj: any, ...names: string[]) => {
  const copy = {...obj};
  for (const name of names) {
    delete copy[name];
  }
  return copy;
};

export const TooltipIconButton = React.forwardRef((props: TooltipIconButtonProps, ref) => <CustomTooltip
  tooltip={props.tooltip}
  disabled={props.disabled}
  placement={props.tooltipPlacement}>
  {
    props.mode === "floating"
      ? <Fab ref={ref} {...removeProps(props, "tooltipPlacement", "edge")}>
        {props.children}
      </Fab>
      : <IconButton ref={ref} {...removeProps(props, "tooltipPlacement")}>
        {props.children}
      </IconButton>
  }
</CustomTooltip>);


