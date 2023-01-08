import { defaultEmptyLayerJavaScript, LayerJavaScript } from "../core";

export const emptyJavaScriptLayer: LayerJavaScript = {
  ...defaultEmptyLayerJavaScript(),
  id: "empty javascript code",
  name: "empty javascript code",
  code: `
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

window.render = (layer, globals) => {
  canvas.width = globals.gResolution[0];
  canvas.height = globals.gResolution[1];

  ctx.beginPath();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return createImageBitmap(canvas);
};`
};
