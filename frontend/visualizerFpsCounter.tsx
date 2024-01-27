import React from "react";
import {defaultFrameTime} from "../core/core";
import {RaverieVisualizerCustom} from "./visualizerCustom";

interface VisualizerFpsCounterProps {
  visualizer: RaverieVisualizerCustom;
}

const FRAME_TIME_AVERAGE_SAMPLES = 10;
const FPS_UPDATE_MS = 1000;

export const VisualizerFpsCounter: React.FC<VisualizerFpsCounterProps> = (props) => {
  const [fps, setFps] = React.useState(1 / defaultFrameTime);

  React.useEffect(() => {
    let averageFrameTimeSeconds = defaultFrameTime;

    props.visualizer.onBeforeRender = (newFrameTimeSeconds) => {
      averageFrameTimeSeconds =
        (averageFrameTimeSeconds * (FRAME_TIME_AVERAGE_SAMPLES - 1) + newFrameTimeSeconds) / FRAME_TIME_AVERAGE_SAMPLES;
    };

    const interval = setInterval(() => {
      setFps(Math.floor(1.0 / Math.max(averageFrameTimeSeconds, 0.001)));
    }, FPS_UPDATE_MS);

    return () => {
      props.visualizer.onBeforeRender = null;
      clearInterval(interval);
    };
  }, [props.visualizer]);

  if (props.visualizer.timePoint.isFixed) {
    return <>(FPS: Fixed)</>;
  }

  return <>(FPS: {fps})</>;
};
