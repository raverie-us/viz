import Box from "@mui/material/Box";
import React from "react";
import {NumberInput} from "./numberInput";
import {TooltipIconButton} from "./tooltipIconButton";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import HighQualityIcon from "@mui/icons-material/HighQuality";
import DiamondIcon from "@mui/icons-material/Diamond";
import InstagramIcon from "@mui/icons-material/Instagram";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import YouTubeIcon from "@mui/icons-material/YouTube";
import Button from "@mui/material/Button";
import {openFile} from "./utility";
import Typography from "@mui/material/Typography";

export interface VisualizerExportVideoSettings {
  width: number;
  height: number;
  lengthSeconds: number;
  startTimeSeconds: number;
  framesPerSecond: number;
  antiAliasLevel: number;

  quantizationParameter: number;
  speed: number;
  groupOfPictures: number;
  kbps: number;
  temporalDenoise: boolean;

  audioFileName?: string;
  audioData?: ArrayBuffer;
}

export interface VisualizerExportVideoProps {
  width: number;
  height: number;
  settings: VisualizerExportVideoSettings;
}

const NO_AUDIO_FILE_STRING = "< No audio file selected >";

export const VisualizerExportVideo: React.FC<VisualizerExportVideoProps> = (props) => {
  const [renderCounter, setRenderCounter] = React.useState(0);
  const settings = props.settings;

  const rerender = () => {
    setRenderCounter(renderCounter + 1);
  };

  return <Box>
    <Box>
      <TooltipIconButton tooltipPlacement="top" tooltip="Draft Preset" onClick={() => {
        settings.width = Math.floor(props.width / 2);
        settings.height = Math.floor(props.height / 2);
        settings.framesPerSecond = 10;

        settings.quantizationParameter = 40;
        settings.speed = 10;
        settings.groupOfPictures = 60;
        settings.kbps = 0;
        settings.temporalDenoise = false;
        rerender();
      }}>
        <DriveFileRenameOutlineIcon/>
      </TooltipIconButton>
      <TooltipIconButton tooltipPlacement="top" tooltip="High Quality Preset" onClick={() => {
        settings.width = props.width;
        settings.height = props.height;
        settings.framesPerSecond = 60;

        settings.quantizationParameter = 28;
        settings.speed = 3;
        settings.groupOfPictures = 30;
        settings.kbps = 0;
        settings.temporalDenoise = false;
        rerender();
      }}>
        <HighQualityIcon/>
      </TooltipIconButton>
      <TooltipIconButton tooltipPlacement="top" tooltip="Maximum Quality Preset" onClick={() => {
        settings.width = props.width;
        settings.height = props.height;
        settings.framesPerSecond = 60;

        settings.quantizationParameter = 10;
        settings.speed = 0;
        settings.groupOfPictures = 10;
        settings.kbps = 0;
        settings.temporalDenoise = false;
        rerender();
      }}>
        <DiamondIcon/>
      </TooltipIconButton>
      <TooltipIconButton tooltipPlacement="top" tooltip="Instagram Reels Preset" onClick={() => {
        settings.width = 1080;
        settings.height = 1920;
        settings.framesPerSecond = 30;

        settings.quantizationParameter = 28;
        settings.speed = 0;
        settings.groupOfPictures = 30;
        settings.kbps = 0;
        settings.temporalDenoise = false;
        rerender();
      }}>
        <InstagramIcon/>
      </TooltipIconButton>
      <TooltipIconButton tooltipPlacement="top" tooltip="TikTok Preset" onClick={() => {
        settings.width = 1080;
        settings.height = 1920;
        settings.framesPerSecond = 60;

        settings.quantizationParameter = 28;
        settings.speed = 0;
        settings.groupOfPictures = 30;
        settings.kbps = 0;
        settings.temporalDenoise = false;
        rerender();
      }}>
        <MusicNoteIcon/>
      </TooltipIconButton>
      <TooltipIconButton tooltipPlacement="top" tooltip="YouTube 4K Preset" onClick={() => {
        settings.width = 3840;
        settings.height = 2160;
        settings.framesPerSecond = 60;

        settings.quantizationParameter = 25;
        settings.speed = 0;
        settings.groupOfPictures = 30;
        settings.kbps = 0;
        settings.temporalDenoise = false;
        rerender();
      }}>
        <YouTubeIcon/>
      </TooltipIconButton>
    </Box>
    <Box display="flex" mt={1} mb={2} gap={1}>
      <NumberInput label="Width" value={settings.width} onChange={(newValue) => {
        settings.width = newValue;
        rerender();
      }}/>
      <NumberInput label="Height" value={settings.height} onChange={(newValue) => {
        settings.height = newValue;
        rerender();
      }}/>
    </Box>
    <Box display="flex" mt={1} mb={2} gap={1}>
      <NumberInput label="Length (Seconds)" value={settings.lengthSeconds} onChange={(newValue) => {
        settings.lengthSeconds = newValue;
        rerender();
      }}/>
      <NumberInput label="Start Time (Seconds)" value={settings.startTimeSeconds} onChange={(newValue) => {
        settings.startTimeSeconds = newValue;
        rerender();
      }}/>
    </Box>
    <Box display="flex" mt={1} mb={2} gap={1}>
      <NumberInput label="Frames Per Second" value={settings.framesPerSecond} onChange={(newValue) => {
        settings.framesPerSecond = newValue;
        rerender();
      }}/>
      <NumberInput label="Anti-Alias Level" value={settings.antiAliasLevel} onChange={(newValue) => {
        settings.antiAliasLevel = newValue;
        rerender();
      }}/>
    </Box>
    <Box display="flex" mt={1} mb={2} gap={1}>
      <Box flexGrow={1}>
        <Typography variant="caption" sx={{opacity: 0.7}}>
          {settings.audioFileName || NO_AUDIO_FILE_STRING}
        </Typography>
      </Box>
      <Button variant="contained" onClick={async () => {
        const file = await openFile("audio/*");
        if (file) {
          settings.audioFileName = file.name;
          settings.audioData = await file.arrayBuffer();
        } else {
          delete settings.audioFileName;
          delete settings.audioData;
        }
        rerender();
      }}>
        Add Audio
      </Button>
    </Box>

    Advanced Video Parameters:
    <Box display="flex" mt={2} gap={1}>
      <NumberInput label="Quantization (QP)" helperText="10=slow/best, 51=fast/compress" value={settings.quantizationParameter} onChange={(newValue) => {
        settings.quantizationParameter = newValue;
        rerender();
      }}/>
      <NumberInput label="Speed" helperText="0=slow/best, 10=fast/compress" value={settings.speed} onChange={(newValue) => {
        settings.speed = newValue;
        rerender();
      }}/>
    </Box>
    <Box display="flex" mt={2} gap={1}>
      <NumberInput label="Group Of Pictures" helperText="How often a keyframe occurs" value={settings.groupOfPictures} onChange={(newValue) => {
        settings.groupOfPictures = newValue;
        rerender();
      }}/>
      <NumberInput label="Bitrate Kbps" helperText="Overrides QP if non 0" value={settings.kbps} onChange={(newValue) => {
        settings.kbps = newValue;
        rerender();
      }}/>
    </Box>
  </Box>;
};
