import { defaultEmptyLayerShader, LayerShader } from "../core";

export const emptyShaderLayer: LayerShader = {
  ...defaultEmptyLayerShader(),
  id: "empty shader code",
  name: "empty shader code"
};
