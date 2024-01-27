import {spinner} from "./spinner";

export const h264Mp4EncoderPromise = import("h264-mp4-encoder");

export const encodeVideo = async (file: File) => {
  // TODO(trevor): Maybe make these configurable
  const framesPerSecond = 30;
  const quantizationParameter = 30;
  const speed = 5;
  const groupOfPictures = 40;
  const temporalDenoise = true;
  const maxSize = 1920;

  spinner.show();

  try {
    const video = document.createElement("video");
    video.muted = true;
    video.autoplay = false;
    video.loop = false;
    video.controls = false;
    video.playsInline = true;
    video.style.display = "none";
    document.body.append(video);

    const videoLoadedPromise = new Promise<void>((resolve, reject) => {
      video.oncanplaythrough = () => resolve();
      video.onerror = (event) => reject(event);
    });

    const url = URL.createObjectURL(file);
    video.src = url;
    await videoLoadedPromise;

    const HME = await h264Mp4EncoderPromise;
    const encoder = await HME.createH264MP4Encoder();

    encoder.quantizationParameter = quantizationParameter;
    encoder.speed = speed;
    encoder.groupOfPictures = groupOfPictures;
    encoder.temporalDenoise = temporalDenoise;

    let width = video.videoWidth;
    let height = video.videoHeight;
    const maxDimension = Math.max(width, height);
    if (maxDimension > maxSize) {
      const scale = maxSize / maxDimension;
      width = Math.floor(width * scale);
      height = Math.floor(height * scale);
    }

    width = Math.floor(width / 2) * 2;
    height = Math.floor(height / 2) * 2;

    encoder.width = width;
    encoder.height = height;
    encoder.frameRate = framesPerSecond;
    encoder.initialize();

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    const frameTime = 1 / framesPerSecond;

    for (let time = 0; time < video.duration; time += frameTime) {
      const seekPromise = new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      spinner.setText(`Encoding Video... (${Math.floor(time / video.duration * 100)}%)`);
      video.currentTime = time;
      await seekPromise;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      encoder.addFrameRgba(ctx.getImageData(0, 0, encoder.width, encoder.height).data);
    }

    encoder.finalize();
    const videoBuffer = encoder.FS.readFile(encoder.outputFilename);

    encoder.delete();
    URL.revokeObjectURL(url);
    video.remove();

    return videoBuffer;
  } finally {
    spinner.hide();
  }
};
