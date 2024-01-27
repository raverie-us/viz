import Box from "@mui/material/Box";
import React from "react";
import {ColorPicker, toColorString} from "./colorPicker";
import {ShaderGradient, ShaderGradientStop, sortGradientStops} from "../core/core";
import {commonGradients} from "../core/gradients";
import Draggable from "react-draggable";
import NavigationIcon from "@mui/icons-material/Navigation";
import IconButton from "@mui/material/IconButton";
import {useResizeDetector} from "react-resize-detector";
import {NumberInput} from "./numberInput";
import {TooltipIconButton} from "./tooltipIconButton";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Popover from "@mui/material/Popover";
import {cloneObject} from "./utility";
import { useTheme } from "@mui/material/styles";

const STOP_WIDTH = 34;
const STOP_WIDTH_HALF = STOP_WIDTH / 2;

export interface GradientPickerProps {
  gradient: ShaderGradient;
  onChanged: (newGradient: ShaderGradient) => void;
}

interface GradientStopProps {
  t: number;
  color: string;
  parentWidth: number;
  selected: boolean;
  onSelected: () => void;
  onChanged: (newTValue: number) => void;
}

const GradientStop: React.FC<GradientStopProps> = (props) => {
  const theme = useTheme();
  const boundsRight = props.parentWidth - STOP_WIDTH;
  return <Draggable
    axis="x"
    onMouseDown={props.onSelected}
    onDrag={(e, data) => {
      props.onChanged(data.x / boundsRight);
    }}
    position={{x: props.t * boundsRight, y: 0}}
    bounds={{left: 0, right: boundsRight}}>
    <IconButton sx={{position: "absolute"}} size="small">
      <NavigationIcon
        sx={{
            "& path": props.selected
            ? {
              stroke: theme.palette.primary.main,
              strokeWidth: "2px",
              strokeLinejoin: "round"
            }
            : {
              stroke: "rgba(0,0,0,0.54)",
              strokeWidth: "1px",
              strokeLinejoin: "round"
            }
        }}
        htmlColor={props.color}/>
    </IconButton>
  </Draggable>;
};

const backgroundFromGradient = (gradient: ShaderGradient) => {
  const stopCount = gradient.stops.length;
  if (stopCount === 0) {
    return "rgba(0,0,0,1)";
  } else if (stopCount === 1) {
    return toColorString(gradient.stops[0].color);
  }
  let rgbaStops = "";
  for (const stop of sortGradientStops(gradient)) {
    rgbaStops += `, ${toColorString(stop.color)} ${stop.t * 100}%`;
  }
  return `linear-gradient(90deg${rgbaStops})`;
};

export const GradientPicker: React.FC<GradientPickerProps> = (props) => {
  const [premadeGradientsOpen, setPremadeGradientsOpen] = React.useState(false);
  const premadeGradientsRef = React.useRef<HTMLButtonElement>(null);
  const [selectedStop, setSelectedStop] = React.useState<ShaderGradientStop | null>(null);
  const {width, ref} = useResizeDetector<HTMLElement>({
    refreshMode: "debounce",
    refreshRate: 0
  });
  const gradient = {...props.gradient};

  const background = backgroundFromGradient(props.gradient);

  const noneSelected = selectedStop === null;

  return <Box width="100%">
    <Box
      width={`calc(100% - ${STOP_WIDTH}px)`}
      height="20px"
      ml={`${STOP_WIDTH_HALF}px`}
      mr={`${STOP_WIDTH_HALF}px`}
      borderRadius={1}
      border="1px #ccc solid"
      sx={{background}}
      onClick={(e) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        const t = (e.clientX - rect.left) / rect.width;
        const newStop: ShaderGradientStop = {
          t,
          color: [0, 0, 0, 1]
        };
        gradient.stops.push(newStop);
        setSelectedStop(newStop);
        props.onChanged(gradient);
      }}
    />
    <Box ref={ref} width="100%" height="40px" position="relative">
      {
        width && gradient.stops.map((stop, index) =>
          <GradientStop
            key={index}
            t={stop.t}
            selected={selectedStop === stop}
            color={toColorString(stop.color)!}
            parentWidth={width}
            onSelected={() => setSelectedStop(stop)}
            onChanged={(newTValue) => {
              stop.t = newTValue;
              props.onChanged(gradient);
            }}/>)
      }
    </Box>
    <Box display="flex" justifyContent="space-between">
      <ColorPicker
        color={selectedStop?.color}
        disabled={noneSelected}
        onChange={(hexColor, rgbaNormalized) => {
          if (selectedStop) {
            selectedStop.color = rgbaNormalized;
            props.onChanged(gradient);
          }
        }}>
      </ColorPicker>
      <NumberInput
        label="Position"
        disabled={noneSelected}
        sx={{width: "70px"}}
        value={selectedStop ? Math.floor(selectedStop.t * 100) : 0}
        width="70px"
        height="30px"
        postfix="%"
        onChange={(value) => {
          if (selectedStop) {
            selectedStop.t = value / 100;
            props.onChanged(gradient);
          }
        }}
      />
      <TooltipIconButton size="small" tooltipPlacement="bottom" tooltip="Delete Gradient Stop" onClick={() => {
        if (selectedStop) {
          const stopIndex = gradient.stops.indexOf(selectedStop);
          gradient.stops.splice(stopIndex, 1);
          props.onChanged(gradient);
        }
      }}>
        <DeleteForeverIcon/>
      </TooltipIconButton>
      <TooltipIconButton ref={premadeGradientsRef} size="small" tooltipPlacement="bottom" tooltip="Premade Gradients" onClick={() => {
        setPremadeGradientsOpen(true);
      }}>
        <ExpandMoreIcon/>
      </TooltipIconButton>

      <Popover
        open={premadeGradientsOpen}
        anchorEl={premadeGradientsRef.current}
        onClose={() => {
          setPremadeGradientsOpen(false);
        }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left"
        }}
      >
        <Box p={1} display="grid" gridTemplateColumns="repeat(5, 1fr)" gap={1}>
          {commonGradients.map((commonGradient, index) => <Box
            key={index}
            width="32px"
            height="32px"
            borderRadius={1}
            border="1px #ccc solid"
            sx={{background: backgroundFromGradient(commonGradient)}}
            onClick={() => {
              props.onChanged(cloneObject(commonGradient));
            }}
          />)}
        </Box>
      </Popover>
    </Box>
  </Box>;
};
