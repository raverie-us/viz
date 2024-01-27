import {fileToDataUrl, Deferred, mimeTypeFromDataUrl, once} from "./utility";

// Starting at a quality of 1 almost always produces a larger image
const QUALITY_OFFSET = 0.1;
const SIZE_QUALITY_INCREMENT = 0.2;

const supportsWebpNative = once(() => {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const dataUrl = canvas.toDataURL("image/webp");
  return dataUrl.startsWith("data:image/webp");
});

// Does not take into account padding, but it's close enough
const getDataUrlByteSize = (dataUrl: string) => Math.floor(3 / 4 * (dataUrl.length - dataUrl.indexOf("base64,")));

interface ResizeAttempt {
  sizeBytes: number;
  scaleAndQuality: number;
  width: number;
  height: number;
  dataUrl: string;
}

export const resizeImage = async (originalDataUrl: string, targetMaxSizeBytes: number) => {
  const originalSizeBytes = getDataUrlByteSize(originalDataUrl);

  // Early out if we are already under the target size
  if (originalSizeBytes <= targetMaxSizeBytes) {
    return originalDataUrl;
  }

  const image = new Image();
  const loadPromise = new Deferred<void>();
  image.onload = () => loadPromise.resolve();
  image.src = originalDataUrl;
  await loadPromise;

  const originalMimeType = mimeTypeFromDataUrl(originalDataUrl);

  const targetMimeType = supportsWebpNative() ? "image/webp" : originalMimeType;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to create canvas 2d context");
  }

  let best: ResizeAttempt = {
    sizeBytes: originalSizeBytes,
    scaleAndQuality: 1.0,
    width: image.naturalWidth,
    height: image.naturalHeight,
    dataUrl: originalDataUrl
  };

  console.log("Resizing large image:", best);
  console.log("Resizing target max bytes:", targetMaxSizeBytes);
  console.log("Resizing target mime type (browser supported):", targetMimeType);

  for (let scaleAndQuality = 1.0 - SIZE_QUALITY_INCREMENT; scaleAndQuality > SIZE_QUALITY_INCREMENT; scaleAndQuality -= SIZE_QUALITY_INCREMENT) {
    canvas.width = Math.floor(image.naturalWidth * scaleAndQuality);
    canvas.height = Math.floor(image.naturalHeight * scaleAndQuality);

    if (canvas.width === 0 || canvas.height === 0) {
      break;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const newDataUrl = canvas.toDataURL(targetMimeType, scaleAndQuality - QUALITY_OFFSET);
    const newSizeBytes = getDataUrlByteSize(newDataUrl);

    const newAttempt = {
      sizeBytes: newSizeBytes,
      scaleAndQuality,
      width: canvas.width,
      height: canvas.height,
      dataUrl: newDataUrl
    };

    if (newSizeBytes < best.sizeBytes) {
      best = newAttempt;
      console.log("Resizing attempt (better):", newAttempt);

      if (newSizeBytes <= targetMaxSizeBytes) {
        break;
      }
    } else {
      console.log("Resizing attempt (worse):", newAttempt);
    }
  }

  console.log("Resizing image result:", best);
  if (best.sizeBytes > targetMaxSizeBytes) {
    throw new Error(`We were unable to resize the image to be below the required ${targetMaxSizeBytes / 1024}KiB`);
  }
  return best.dataUrl;
};

export const resizeImageFileIfNeededAsDataUrl = async (imageFile: File, targetMaxSizeBytes: number): Promise<string> => {
  const imageDataUrl = await fileToDataUrl(imageFile);
  if (imageFile.size <= targetMaxSizeBytes) {
    return imageDataUrl;
  }
  return resizeImage(imageDataUrl, targetMaxSizeBytes);
};
