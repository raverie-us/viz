import Box from "@mui/material/Box";
import React from "react";
import {CompiledLayerJavaScript, CompiledLayerSDF, CompiledLayerShader} from "../../core/core";
import WarningIcon from "@mui/icons-material/Warning";
import TerminalIcon from "@mui/icons-material/Terminal";
import {TooltipIconButton} from "../tooltipIconButton";
import TextField from "@mui/material/TextField";
import {useTheme} from "@mui/material/styles";

export const LAYER_PREVIEW_SIZE = 32;
const LAYER_PREVIEW_SIZE_PX = `${LAYER_PREVIEW_SIZE}px`;

export interface VisualizerShaderLayerProps {
  compiledLayerShader: CompiledLayerShader | CompiledLayerJavaScript | CompiledLayerSDF;
  onEditCode: () => void;
  onChangedRefresh: () => void;
  onPreviewCreated: (id: string, context: CanvasRenderingContext2D) => void;
  onPreviewDestroyed: (id: string) => void;
}

export const VisualizerShaderLayer: React.FC<VisualizerShaderLayerProps> = (props) => {
  const previewRef = React.useRef<HTMLCanvasElement>(null);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const errors = props.compiledLayerShader.errors.
    map((error) => `Error on line ${error.line}: ${error.text}`).
    join("\n");

  const id = props.compiledLayerShader.layer.id;
  React.useEffect(() => {
    if (previewRef.current) {
      const context = previewRef.current.getContext("2d");
      if (context) {
        context.fillStyle = "#000";
        context.fillRect(0, 0, LAYER_PREVIEW_SIZE, LAYER_PREVIEW_SIZE);
        props.onPreviewCreated(id, context);

        return () => {
          props.onPreviewDestroyed(id);
        };
      }
    }
    return undefined;
  }, [id, previewRef.current]);

  const theme = useTheme();
  return <Box display="flex" flexDirection="row" alignItems="center">
    <Box
      width={LAYER_PREVIEW_SIZE_PX}
      height={LAYER_PREVIEW_SIZE_PX}
      minWidth={LAYER_PREVIEW_SIZE_PX}
      minHeight={LAYER_PREVIEW_SIZE_PX}
      mt={1}
      mb={1}
      display="flex"
      justifyContent="center"
      alignItems="center"
      sx={{
        backgroundColor: "white",
        outline: "1px black solid"
      }}>
      <canvas ref={previewRef} width={LAYER_PREVIEW_SIZE} height={LAYER_PREVIEW_SIZE}/>
      {props.compiledLayerShader.errors.length === 0
        ? null
        : <TooltipIconButton tooltip={errors} sx={{position: "absolute"}}>
          <WarningIcon fontSize="small"/>
        </TooltipIconButton>
      }
    </Box>
    <TextField
      value={props.compiledLayerShader.layer.name}
      fullWidth
      InputProps={{disableUnderline: true, readOnly: !isEditingName}}
      sx={{
        paddingLeft: 1,
        paddingRight: 1,
        input: isEditingName ? null : {cursor: "pointer"},
        backgroundColor: isEditingName ? theme.palette.background.default : null
      }}
      onDoubleClick={(e) => {
        setIsEditingName(true);
        (e.target as HTMLInputElement).select();
      }}
      onBlur={() => {
        setIsEditingName(false);
      }}
      onChange={(e) => {
        props.compiledLayerShader.layer.name = e.target.value;
        props.onChangedRefresh();
      }}
    />
    <Box flexGrow={1}/>
    <TooltipIconButton
      size="small"
      tooltipPlacement="left"
      tooltip="Edit Shader Code"
      onClick={props.onEditCode}>
      <TerminalIcon/>
    </TooltipIconButton>
  </Box>;
};
