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

export interface VisualizerExportImageSettings {
  width: number;
  height: number;
  startTimeSeconds: number;
  antiAliasLevel: number;
}

export interface VisualizerExportImageProps {
  width: number;
  height: number;
  settings: VisualizerExportImageSettings;
}

export const VisualizerExportImage: React.FC<VisualizerExportImageProps> = (props) => {
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
        rerender();
      }}>
        <DriveFileRenameOutlineIcon/>
      </TooltipIconButton>
      <TooltipIconButton tooltipPlacement="top" tooltip="High Quality Preset" onClick={() => {
        settings.width = props.width;
        settings.height = props.height;
        rerender();
      }}>
        <HighQualityIcon/>
      </TooltipIconButton>
      <TooltipIconButton tooltipPlacement="top" tooltip="Maximum Quality Preset" onClick={() => {
        settings.width = props.width;
        settings.height = props.height;
        rerender();
      }}>
        <DiamondIcon/>
      </TooltipIconButton>
      <TooltipIconButton tooltipPlacement="top" tooltip="Instagram Reels Preset" onClick={() => {
        settings.width = 1080;
        settings.height = 1920;
        rerender();
      }}>
        <InstagramIcon/>
      </TooltipIconButton>
      <TooltipIconButton tooltipPlacement="top" tooltip="TikTok Preset" onClick={() => {
        settings.width = 1080;
        settings.height = 1920;
        rerender();
      }}>
        <MusicNoteIcon/>
      </TooltipIconButton>
      <TooltipIconButton tooltipPlacement="top" tooltip="YouTube 4K Preset" onClick={() => {
        settings.width = 3840;
        settings.height = 2160;
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
      <NumberInput label="Start Time (Seconds)" value={settings.startTimeSeconds} onChange={(newValue) => {
        settings.startTimeSeconds = newValue;
        rerender();
      }}/>
      <NumberInput label="Anti-Alias Level" value={settings.antiAliasLevel} onChange={(newValue) => {
        settings.antiAliasLevel = newValue;
        rerender();
      }}/>
    </Box>
  </Box>;
};
