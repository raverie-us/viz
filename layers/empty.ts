import { defaultEmptyLayerShader, LayerShader } from "../core";

export const emptyLayer: LayerShader = {
  ...defaultEmptyLayerShader(),
  id: "empty",
  name: "empty"
};
