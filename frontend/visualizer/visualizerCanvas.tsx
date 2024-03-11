import React from "react";
import Box from "@mui/material/Box";
import {TransformWrapper, TransformComponent, ReactZoomPanPinchContentRef} from "react-zoom-pan-pinch";
import {useResizeDetector} from "react-resize-detector";
import {VisualizerFpsCounter} from "./visualizerFpsCounter";
import {scaleToFit, TimePoint} from "../utility";
import {TooltipIconButton} from "../tooltipIconButton";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import {CustomTooltip} from "../customTooltip";
import Badge from "@mui/material/Badge";
import {VisualizerTime} from "./visualizerTime";
import { type VisualizerMetaContext } from "./visualizerMetaContext";

export type PositionCallback = (xNormalized: number, yNormalized: number) => void;

export interface VisualizerCanvasInterations {
  zoomIn(): void;
  zoomOut(): void;
  fitTheArea(): void;
  pixelToPixel(): void;
}

export type VisualizerCanvasInterationsRef = React.MutableRefObject<VisualizerCanvasInterations | undefined>;

export interface VisualizerCanvasProps {
  context: VisualizerMetaContext;
  canvasInteractionsOut: VisualizerCanvasInterationsRef;
}

const AUDIO_INPUT_NOTIFICATION_KEY = "audioInputNotification";
type AudioNotificationState = "none" | "visible" | "complete";

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({context, canvasInteractionsOut}) => {

  // Basically we need to listen to all changes on the meta context
  // We need to be self contained, we don't want to have to rely on updating the dock layout
  // to get our updates, so that's why we listen directly
  // I want this also to be very explicit about when it needs to update
  // e.g. only when:
  //width: number;
  //height: number;
  //layersUseAudioInput: boolean;
  // changes


  const canvasParentRef = React.useRef<HTMLDivElement>(null);
  const [panningEnabled, setPanningEnabled] = React.useState(false);
  const zoomPanPinch = React.useRef<ReactZoomPanPinchContentRef>();
  const [firstResize, setFirstResize] = React.useState(true);
  const [audioInputStream, setAudioInputStream] = React.useState<MediaStream | null>(null);
  const [timePoint, setTimePoint] = React.useState<TimePoint>(
    context.timePoint);
  const [audioInputNotification, setAudioInputNotification] =
    React.useState<AudioNotificationState>(() => {
      const result = sessionStorage.getItem(AUDIO_INPUT_NOTIFICATION_KEY);
      if (result) {
        return result as AudioNotificationState;
      }
      return "none";
    });
  const canvas = context.canvas;

  const layerWidth = context.compiledLayerRoot.layer.width;
  const layerHeight = context.compiledLayerRoot.layer.height;

  const canShowAudioInputNotification =
    context.compiledLayerRoot.usesAudioInput && !audioInputStream && audioInputNotification === "none";
  React.useEffect(() => {
    if (canShowAudioInputNotification) {
      // We always set the session stored notificaiton to complete so it does not show again
      sessionStorage.setItem(AUDIO_INPUT_NOTIFICATION_KEY, "complete");

      setAudioInputNotification("visible");
      // Automatically close the notification after 5 seconds
      // This should only ever occur once for the lifetime of the app
      setTimeout(() => {
        setAudioInputNotification("complete");
      }, 5000);
    }
  }, [canShowAudioInputNotification]);

  const fitTheAreaInternal = (width: number | undefined, height: number | undefined, allowZoomIn: boolean) => {
    let scale = 1.0;
    if (width && height) {
      if (allowZoomIn || layerWidth > width || layerHeight > height) {
        scale = scaleToFit(layerWidth, layerHeight, width, height);
      }
    }

    zoomPanPinch.current?.centerView(scale, 0);
  };

  const {ref: resizeRef, width: screenWidth, height: screenHeight} = useResizeDetector<HTMLElement>({
    refreshMode: "debounce",
    refreshRate: 0,
    onResize: (width, height) => {
      setTimeout(() => {
        if (firstResize) {
          fitTheAreaInternal(width, height, false);
          setFirstResize(false);
          canvas.style.display = "inline";
        } else {
          zoomPanPinch.current?.centerView();
        }
      });
    }
  });

  React.useEffect(() => {
    const zoomIn = () => zoomPanPinch.current?.zoomIn();
    const zoomOut = () => zoomPanPinch.current?.zoomOut();
    const fitTheArea = () => fitTheAreaInternal(screenWidth, screenHeight, true);
    const pixelToPixel = () => zoomPanPinch.current?.centerView(1);

    canvasInteractionsOut.current = {
      zoomIn,
      zoomOut,
      fitTheArea,
      pixelToPixel
    };
  }, [zoomPanPinch.current, screenWidth, screenHeight, layerWidth, layerHeight, canvasInteractionsOut]);

  React.useEffect(() => {
    if (canvasParentRef.current) {
      canvasParentRef.current.appendChild(canvas);
      return () => {
        canvas.style.display = "none";
      };
    }
    return undefined;
  }, [canvas, canvasParentRef.current]);

  React.useEffect(() => {
    const {canvas, visualizer, renderTargets} = context;
    canvas.width = layerWidth;
    canvas.height = layerHeight;
    visualizer.resizeRenderTargets(renderTargets, layerWidth, layerHeight);
    fitTheAreaInternal(screenWidth, screenHeight, false);
  }, [context, layerWidth, layerHeight]);

  // Don't allow half pixel offsets
  React.useEffect(() => {
    if (zoomPanPinch.current?.instance.contentComponent) {
      const style = zoomPanPinch.current.instance.contentComponent.style;
      const observer = new MutationObserver(() => {
        style.transform = style.transform.replace(/\.5px/gum, "px");
      });

      observer.observe(zoomPanPinch.current?.instance.contentComponent,
        {
          attributes: true,
          attributeFilter: ["style"]
        });
      return () => {
        observer.disconnect();
      };
    }
    return undefined;
  }, [zoomPanPinch.current?.instance.contentComponent]);

  return <Box
    ref={resizeRef}
    width="100%"
    height="100%"
    sx={{backgroundColor: "#333"}}
    onPointerDownCapture={(e) => {
      if (e.button === 1) {
        setPanningEnabled(true);
      }
    }}
    onPointerUp={(e) => {
      if (e.button === 1) {
        setPanningEnabled(false);
      }
    }}>
    <TransformWrapper
      ref={(value) => {
        zoomPanPinch.current = value || undefined;
      }}
      minScale={0.01}
      panning={{velocityDisabled: true, disabled: !panningEnabled}}
      alignmentAnimation={{disabled: true}}
      velocityAnimation={{disabled: true}}
      customTransform={(x: number, y: number, scale: number) => `translate(${Math.round(x)}px, ${Math.round(y)}px) scale(${scale})`}
    >
      <TransformComponent>
        <Box width={`${layerWidth}px`} height={`${layerHeight}px`} ref={canvasParentRef}/>
      </TransformComponent>
    </TransformWrapper>
    <Box position="absolute" display="flex" alignItems="center" gap={1} top={0} right={0} m={0.5}>
      <VisualizerFpsCounter context={context} />
      <VisualizerTime
        timePoint={timePoint}
        onChanged={(newTimePoint) => {
          //setTimePoint(newTimePoint);
          //TODO(trevor): Always let the visualizer be the source of truth, and do everything through events
          //context.visualizer.timePoint = newTimePoint;
          //props.onChangedTimePoint(newTimePoint);
        }}/>
      <CustomTooltip
        open={audioInputNotification === "visible"}
        arrow
        placement="top"
        tooltip="One or more layers are requesting audio input, click to unmute">
        <TooltipIconButton
          tooltip={audioInputStream ? "Mute Audio Input" : "Unmute Audio Input"}
          onClick={async () => {
            const audioAnalyser = context.audioAnalyser;
            if (audioInputStream) {
              audioAnalyser.connectAudioSource(null);
              for (const track of audioInputStream.getTracks()) {
                track.stop();
              }
              setAudioInputStream(null);
            } else {
              const stream = await navigator.mediaDevices.getUserMedia({audio: true});
              audioAnalyser.connectAudioSource(stream);
              setAudioInputStream(stream);
            }
          }}>
          <Badge color="error" variant="dot" badgeContent={Number(context.compiledLayerRoot.usesAudioInput)}>
            {audioInputStream ? <MicIcon/> : <MicOffIcon/>}
          </Badge>
        </TooltipIconButton>
      </CustomTooltip>
    </Box>
  </Box>;
};
