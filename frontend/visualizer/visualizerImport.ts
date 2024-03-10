import {readPsd, Layer as PsdLayer, Psd} from "ag-psd";
import {v4 as uuidv4} from "uuid";
import {defaultEmptyLayerGroup, defaultEmptyLayerRoot, Layer, LayerGroup, LayerRoot, LayerShader} from "../../core/core";
import {textureLayer} from "../../core/layers/texture";
import {fileToDataUrl} from "../utility";

const copyLayerProperties = (fromPsdLayer: PsdLayer, toLayer: Layer) => {
  toLayer.visible = !fromPsdLayer.hidden;
};

const psdLayerToVizLayer = (psd: Psd, psdLayer: PsdLayer): LayerShader => {
  const l = psdLayer.left || 0;
  const t = psdLayer.top || 0;
  const r = psdLayer.right || 0;
  const b = psdLayer.bottom || 0;

  const w = r - l;
  const h = b - t;

  const layerShader: LayerShader = {
    ...textureLayer,
    name: psdLayer.name || "Layer",
    id: uuidv4(),
    values: [
      {
        name: "textureInput",
        type: "sampler2D",
        value: {
          url: psdLayer.canvas!.toDataURL()
        }
      },
      {
        name: "position",
        type: "vec2",
        value: [l / w * 2 - 1, t / h * 2 - 1]
      },
      {
        name: "scale",
        type: "vec2",
        value: [w / psd.width, h / psd.height]
      }
    ]
  };

  copyLayerProperties(psdLayer, layerShader);
  return layerShader;
};

export const convertPSDToLayers = (psdBuffer: ArrayBuffer): LayerRoot => {
  const psd = readPsd(psdBuffer);

  const recurse = (psdLayer: PsdLayer): LayerShader | LayerGroup => {
    if (psdLayer.children) {
      const layerGroup = defaultEmptyLayerGroup();
      copyLayerProperties(psdLayer, layerGroup);

      // PSD layers are in reverse order from viz layers, so we use unshift instead
      for (const childLayer of psdLayer.children) {
        layerGroup.layers.unshift(recurse(childLayer));
      }
      return layerGroup;
    }
    return psdLayerToVizLayer(psd, psdLayer);
  };

  return {
    ...recurse(psd) as LayerGroup,
    width: psd.width,
    height: psd.height
  };
};

export const convertImageToLayers = async (imageFile: File): Promise<LayerRoot> => {
  const image = new Image();

  const dataUrlPromise = fileToDataUrl(imageFile);
  const loadPromise = new Promise<void>((resolve) => {
    image.onload = () => resolve();
  });

  image.src = URL.createObjectURL(imageFile);

  await loadPromise;
  const dataUrl = await dataUrlPromise;

  const newRoot: LayerRoot = {
    ...defaultEmptyLayerRoot(),
    width: image.naturalWidth,
    height: image.naturalHeight,
    layers: [
      {
        ...textureLayer,
        values: [
          {
            name: "textureInput",
            type: "sampler2D",
            value: {
              url: dataUrl
            }
          }
        ]
      }
    ]
  };
  return newRoot;
};
