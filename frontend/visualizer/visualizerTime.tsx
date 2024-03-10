import React from "react";
import {NumberInput} from "../numberInput";
import {TimePoint, computeTimePointNow} from "../utility";

interface VisualizerTimeProps {
  timePoint: TimePoint;
  onChanged: (newTimePoint: TimePoint) => void;
}

const UPDATE_MS = 100;

export const VisualizerTime: React.FC<VisualizerTimeProps> = (props) => {
  const [currentTimeMs, setCurrentTimeMs] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeMs(computeTimePointNow(props.timePoint));
    }, UPDATE_MS);

    return () => {
      clearInterval(interval);
    };
  }, [props.timePoint]);

  return <NumberInput
    decimals={props.timePoint.isFixed ? undefined : 1}
    numericUpDown
    step={0.1}
    width="100px"
    value={currentTimeMs / 1000}
    onChange={(newValueSeconds, cleared) => {
      if (cleared) {
        props.onChanged({
          isFixed: false,
          baseTimeMs: performance.now(),
          offsetTimeMs: props.timePoint.offsetTimeMs
        });
      } else {
        props.onChanged({
          isFixed: true,
          baseTimeMs: performance.now(),
          offsetTimeMs: newValueSeconds * 1000
        });
      }
    }}
  />;
};
