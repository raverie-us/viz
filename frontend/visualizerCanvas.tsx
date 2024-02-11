import {CompiledLayerRoot, defaultEmptyCompiledLayerRoot, RenderTargets} from "../core/core";
import React from "react";
import Box from "@mui/material/Box";
import {TransformWrapper, TransformComponent, ReactZoomPanPinchContentRef} from "react-zoom-pan-pinch";
import {useResizeDetector} from "react-resize-detector";
import {VisualizerFpsCounter} from "./visualizerFpsCounter";
import {computeTimePointNow, scaleToFit, TimePoint} from "./utility";
import {useStyles} from "./style";
import {TooltipIconButton} from "./tooltipIconButton";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import {CustomTooltip} from "./customTooltip";
import Badge from "@mui/material/Badge";
import {RaverieVisualizerCustom} from "./visualizerCustom";
import {RaverieAudioAnalyserLive} from "../core/browser";
import {VisualizerTime} from "./visualizerTime";
import { VisualGenerator } from "../core/generate";

export type PositionCallback = (xNormalized: number, yNormalized: number) => void;

export interface VisualizerComponents {
  visualizer: RaverieVisualizerCustom;
  generator: VisualGenerator;
  audioAnalyser: RaverieAudioAnalyserLive;
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  renderTargets: RenderTargets;
  defaultCompiledLayerRoot: CompiledLayerRoot;
  setPointerEvents: (onPosition: PositionCallback) => void;
  setCompiledLayerRoot: (compiledLayerRoot: CompiledLayerRoot) => void;
}

export interface VisualizerCanvasInterations {
  zoomIn(): void;
  zoomOut(): void;
  fitTheArea(): void;
  pixelToPixel(): void;
}

export interface VisualizerCanvasProps {
  width: number;
  height: number;
  layersUseAudioInput: boolean;
  visualizerComponents: VisualizerComponents;
  refOut: React.MutableRefObject<VisualizerCanvasInterations | undefined>;
  onChangedTimePoint: (newTimePoint: TimePoint) => void;
}

export const useVisualizer = (): VisualizerComponents => {
  const classes = useStyles();
  const [internals] = React.useState(() => {
    const canvas = document.createElement("canvas");
    const visualizer = new RaverieVisualizerCustom(canvas);
    const generator = new VisualGenerator(visualizer);
    const audioAnalyser = new RaverieAudioAnalyserLive();
    const renderTargets = visualizer.createRenderTargets(canvas.width, canvas.height);
    canvas.className = classes.focusOutline;
    canvas.style.backgroundColor = "#333";

    // This is modified when we attach / detach the canvas
    canvas.style.display = "none";

    const defaultCompiledLayerRoot = defaultEmptyCompiledLayerRoot();
    let root = defaultCompiledLayerRoot;

    let animationFrame = -1;
    const onUpdate = () => {
      animationFrame = requestAnimationFrame(onUpdate);
      if (visualizer.autoRender) {
        const timeMs = computeTimePointNow(visualizer.timePoint);
        audioAnalyser.updateVisualizerAudio(visualizer, timeMs);
        visualizer.render(root, timeMs, renderTargets);
      }
    };
    animationFrame = requestAnimationFrame(onUpdate);

    return {
      visualizer,
      generator,
      audioAnalyser,
      canvas,
      gl: visualizer.gl,
      renderTargets,
      defaultCompiledLayerRoot,
      setPointerEvents: (onPosition: PositionCallback) => {
        const onPointer = (e: PointerEvent) => {
          if (e.button === 0 && e.type === "pointerdown") {
            canvas.setPointerCapture(e.pointerId);
          } else if (!canvas.hasPointerCapture(e.pointerId)) {
            return;
          }

          if (e.buttons & 1) {
            const rect = canvas.getBoundingClientRect();
            const xNormalized = (e.clientX - rect.x) / rect.width * 2.0 - 1.0;
            const yNormalized = -((e.clientY - rect.y) / rect.height * 2.0 - 1.0);
            onPosition(xNormalized, yNormalized);
          }
        };

        canvas.onpointerdown = onPointer;
        canvas.onpointermove = onPointer;
        canvas.onpointerup = onPointer;
      },
      setCompiledLayerRoot: (compiledLayerRoot: CompiledLayerRoot) => {
        root = compiledLayerRoot;
      },
      cancelRendering: () => {
        cancelAnimationFrame(animationFrame);
      }
    };
  });

  React.useEffect(() => () => {
    internals.cancelRendering();
  }, [internals.cancelRendering]);

  return internals;
};

const AUDIO_INPUT_NOTIFICATION_KEY = "audioInputNotification";
type AudioNotificationState = "none" | "visible" | "complete";

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = (props) => {
  const canvasParentRef = React.useRef<HTMLDivElement>(null);
  const [panningEnabled, setPanningEnabled] = React.useState(false);
  const zoomPanPinch = React.useRef<ReactZoomPanPinchContentRef>();
  const [firstResize, setFirstResize] = React.useState(true);
  const [audioInputStream, setAudioInputStream] = React.useState<MediaStream | null>(null);
  const [timePoint, setTimePoint] = React.useState<TimePoint>(
    props.visualizerComponents.visualizer.timePoint);
  const [audioInputNotification, setAudioInputNotification] =
    React.useState<AudioNotificationState>(() => {
      const result = sessionStorage.getItem(AUDIO_INPUT_NOTIFICATION_KEY);
      if (result) {
        return result as AudioNotificationState;
      }
      return "none";
    });
  const canvas = props.visualizerComponents.canvas;

  const canShowAudioInputNotification =
    props.layersUseAudioInput && !audioInputStream && audioInputNotification === "none";
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
      if (allowZoomIn || props.width > width || props.height > height) {
        scale = scaleToFit(props.width, props.height, width, height);
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

    props.refOut.current = {
      zoomIn,
      zoomOut,
      fitTheArea,
      pixelToPixel
    };
  }, [zoomPanPinch.current, screenWidth, screenHeight, props.width, props.height, props.refOut]);

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
    const {canvas, visualizer, renderTargets} = props.visualizerComponents;
    canvas.width = props.width;
    canvas.height = props.height;
    visualizer.resizeRenderTargets(renderTargets, props.width, props.height);
    fitTheAreaInternal(screenWidth, screenHeight, false);
  }, [props.visualizerComponents, props.width, props.height]);

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
        <Box width={`${props.width}px`} height={`${props.height}px`} ref={canvasParentRef}/>
      </TransformComponent>
    </TransformWrapper>
    <Box position="absolute" display="flex" alignItems="center" gap={1} top={0} right={0} m={0.5}>
      <VisualizerFpsCounter visualizer={props.visualizerComponents.visualizer} />
      <VisualizerTime
        timePoint={timePoint}
        onChanged={(newTimePoint) => {
          setTimePoint(newTimePoint);
          props.visualizerComponents.visualizer.timePoint = newTimePoint;
          props.onChangedTimePoint(newTimePoint);
        }}/>
      <CustomTooltip
        open={audioInputNotification === "visible"}
        arrow
        placement="top"
        tooltip="One or more layers are requesting audio input, click to unmute">
        <TooltipIconButton
          tooltip={audioInputStream ? "Mute Audio Input" : "Unmute Audio Input"}
          onClick={async () => {
            const audioAnalyser = props.visualizerComponents.audioAnalyser;
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
          <Badge color="error" variant="dot" badgeContent={Number(props.layersUseAudioInput)}>
            {audioInputStream ? <MicIcon/> : <MicOffIcon/>}
          </Badge>
        </TooltipIconButton>
      </CustomTooltip>
    </Box>
  </Box>;
};
