import React from "react";
import {DeviceIdentifier, InputIdentifier, ShaderAxisBindings, ShaderButtonBindings} from "../core/core";
import Box from "@mui/material/Box";
import {TooltipIconButton} from "./tooltipIconButton";
import ClearIcon from "@mui/icons-material/Clear";
import AddIcon from "@mui/icons-material/Add";
import {Modal} from "./modal";
import {listenForInput} from "../core/browser";
import {useStyles} from "./style";
import { capCase } from "./textTransforms";

export interface ControlBindingsProps<Bindings extends ShaderButtonBindings | ShaderAxisBindings> {
  type: "axis" | "button";
  binding: Bindings;
  onChanged: (newBindings: Bindings) => void;
}

interface AddControlBindingProps {
  type: "axis" | "button";
  onInputTriggered: (deviceId: DeviceIdentifier, inputId: InputIdentifier) => void;
}

const AddControlBinding: React.FC<AddControlBindingProps> = (props) => {
  const [displayDeviceId, setDisplayDeviceId] = React.useState<DeviceIdentifier>("None");
  const [displayInputId, setDisplayInputId] = React.useState<InputIdentifier>("");
  const inputAreaRef = React.useRef<HTMLDivElement>(null);
  const classes = useStyles();

  React.useEffect(() => {
    if (inputAreaRef.current) {
      return listenForInput(inputAreaRef.current, (type, deviceId, inputId) => {
        if (type === props.type) {
          setDisplayDeviceId(deviceId);
          setDisplayInputId(inputId);
          props.onInputTriggered(deviceId, inputId);
        }
      });
    }
    return undefined;
  }, [inputAreaRef.current]);

  const message = props.type === "button"
    ? "Focus here and press any key / click / gamepad button, etc."
    : "Move the pointer over this area or move a gamepad axis, etc.";

  return <Box>
    <Box display="flex" alignItems="center" mb={1}>
      <Box flexBasis="15%" mr={1}>{capCase(displayDeviceId)}:</Box>
      <Box flexBasis="85%">'{displayInputId}'</Box>
    </Box>
    <Box
      ref={inputAreaRef}
      className={classes.focusOutline}
      width="100%"
      height="100px"
      bgcolor="white"
      color="black"
      borderRadius="4px"
      p={1}
      sx={{
        opacity: 0.5
      }}>
      {message}
    </Box>
  </Box>;
};

export const ControlBindings = <Bindings extends ShaderButtonBindings | ShaderAxisBindings>(props: ControlBindingsProps<Bindings>) => {
  const rows = Object.keys(props.binding).map((deviceId) => {
    const inputId = props.binding[deviceId];
    return <Box key={deviceId} display="flex" alignItems="center">
      <Box flexBasis="100%">{capCase(deviceId)}</Box>
      <Box flexBasis="50%">'{inputId.toString()}'</Box>
      <TooltipIconButton size="small" tooltip="Delete Control Binding" tooltipPlacement="left" onClick={() => {
        const newBinding = {...props.binding};
        delete newBinding[deviceId];
        props.onChanged(newBinding);
      }}>
        <ClearIcon />
      </TooltipIconButton>
    </Box>;
  });

  return <Box>
    {rows}
    <Box display="flex" alignItems="center">
      <Box flexBasis="150%" />
      <TooltipIconButton size="small" tooltip="Add Control Binding" tooltipPlacement="left" onClick={async () => {
        // Pop up modal dialog that lets you press any button for a control, including mouse
        // escape exits the dialog or clicking the X
        let triggeredDeviceId: DeviceIdentifier | null = null;
        let triggeredInputId: InputIdentifier | null = null;
        const result = await Modal.confirm("Add Control Binding", () =>
          <AddControlBinding type={props.type} onInputTriggered={(deviceId, inputId) => {
            triggeredDeviceId = deviceId;
            triggeredInputId = inputId;
          }}/>);

        if (result && triggeredDeviceId !== null && triggeredInputId !== null) {
          const newBinding = {...props.binding};
          newBinding[triggeredDeviceId] = triggeredInputId;
          props.onChanged(newBinding);
        }
      }}>
        <AddIcon />
      </TooltipIconButton>
    </Box>
  </Box>;
};
