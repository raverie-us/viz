import {RaverieVisualizerBrowser} from "../core/browser";
import {TimePoint} from "./utility";

export class RaverieVisualizerCustom extends RaverieVisualizerBrowser {
  public autoRender = true;

  public timePoint: TimePoint = {
    isFixed: false,
    baseTimeMs: performance.now(),
    offsetTimeMs: 0
  };
}
