import Tooltip, {TooltipProps} from "@mui/material/Tooltip";
import React from "react";
import {theme} from "./style";

interface CustomTooltipProps extends Omit<TooltipProps, "title"> {
  tooltip: string;
  disabled?: boolean;
}

export const CustomTooltip: React.FC<CustomTooltipProps> = (props: CustomTooltipProps) => {
  const {tooltip, ...tooltipProps} = props;
  return props.disabled ? props.children : <Tooltip
    enterDelay={0}
    enterTouchDelay={0}
    leaveTouchDelay={500}
    title={
      <div style={{
        fontSize: theme.typography.body1.fontSize,
        whiteSpace: "pre-wrap"
      }}>
        {tooltip}
      </div>
    }
    {...tooltipProps}>
    {props.children}
  </Tooltip>;
};
