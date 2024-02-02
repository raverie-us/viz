import * as fs from "node:fs";
import {
  Essentia as EssentiaUntyped,
  EssentiaModel,
  EssentiaWASM,
} from "essentia.js";
import EssentiaType from "essentia.js/dist/core_api";
const Essentia = EssentiaUntyped as typeof EssentiaType;
import * as tf from "@tensorflow/tfjs-node";
import * as childProcess from "node:child_process";
import * as util from "node:util";
import { NodeFileSystem } from "@tensorflow/tfjs-node/dist/io/file_system.js";
const exec = util.promisify(childProcess.exec);

//allin1 --out-dir /tmp/viz /tmp/viz/song.mp3

const essentia = new Essentia(EssentiaWASM);
const extractor = new EssentiaModel.EssentiaTFInputExtractor(
  EssentiaWASM,
  "musicnn",
  false
);

const modelTagOrder = {
  mood_happy: [true, false],
  mood_sad: [false, true],
  mood_relaxed: [false, true],
  mood_aggressive: [true, false],
  danceability: [true, false],
};
const modelNames = Object.keys(modelTagOrder);

const getZeroMatrix = (x: number, y: number) => {
  const matrix = new Array<number[]>(x);
  for (let f = 0; f < x; ++f) {
      matrix[f] = new Array<number>(y).fill(0);
  }
  return matrix;
}

const moodModels = await Promise.all(
  modelNames.map(async (modelName) => {
    const nfs = new NodeFileSystem(
      `models/${modelName}-musicnn-msd-2/model.json`
    );
    const model = new EssentiaModel.TensorflowMusiCNN(tf, nfs);
    await model.initialize();

    const fakeFeatures = {
      melSpectrum: getZeroMatrix(187, 96),
      frameSize: 187,
      melBandsSize: 96,
      patchSize: 187,
    };

    const fakeStart = Date.now();
    await model.predict(fakeFeatures, false);
    console.info(`${modelName}: Warm up inference took: ${Date.now() - fakeStart}`);
    model.modelName = modelName;
    return model;
  })
);

const MINIMUM_SEGMENT_DURATION = 10;
const MAXIMUM_SEGMENT_DURATION = 40;

interface SongSegment {
  start: number;
  end: number;
  label:
    | "start"
    | "end"
    | "intro"
    | "outro"
    | "break"
    | "bridge"
    | "inst"
    | "solo"
    | "verse"
    | "chorus";
}

type integer = number;

interface SongInfo {
  path: string;
  bpm: number;
  beats: number[];
  downbeats: number[];
  beat_positions: integer[];
  segments: SongSegment[];
}

const text = await fs.promises.readFile("/tmp/viz/song.json", "utf8");
const info = JSON.parse(text) as SongInfo;
console.log(info);

const snapTo = (toBeSnapped: number, snapPoints: number[]) => {
  let bestSnap = toBeSnapped;
  let bestSnapDistance = Number.MAX_VALUE;
  for (const snapPoint of snapPoints) {
    const distance = Math.abs(toBeSnapped - snapPoint);
    if (distance < bestSnapDistance) {
      bestSnapDistance = distance;
      bestSnap = snapPoint;
    }
  }
  return bestSnap;
};

// We should consider making a maximum segment duration (like 40 seconds or something)
// Rezz - Puzzle Box causes an intro for 60 seconds, maybe if we find a segment that's too long
// we divide it in half on an up-beat?
const cleanedSegments: SongSegment[] = [];
info.segments.forEach((segment, index) => {
  const duration = segment.end - segment.start;
  if (duration < MINIMUM_SEGMENT_DURATION) {
    const nextIndex = index + 1;
    console.log("Skipping segment (too short)", segment);
    if (nextIndex < info.segments.length) {
      info.segments[nextIndex].start = segment.start;
    } else if (index > 0) {
      info.segments[index - 1].end = segment.end;
    }
  } else if (duration > MAXIMUM_SEGMENT_DURATION) {
    const halfPoint = duration / 2 + segment.start;
    console.log("HALF POINT", halfPoint);
    const snapPoint = snapTo(halfPoint, info.downbeats);
    console.log("SNAP POINT", snapPoint);
    console.log("Splitting segment (too long)", segment, "half:", halfPoint, "snapped:", snapPoint);
    cleanedSegments.push({
      ...segment,
      end: snapPoint
    });
    cleanedSegments.push({
      ...segment,
      start: snapPoint
    });
  } else {
    cleanedSegments.push(segment);
  }
});

const twoValuesAverage = (arrayOfArrays: number[][]) => {
  let firstValues = [];
  let secondValues = [];

  arrayOfArrays.forEach((v) => {
      firstValues.push(v[0]);
      secondValues.push(v[1]);
  });

  const firstValuesAvg = firstValues.reduce((acc, val) => acc + val) / firstValues.length;
  const secondValuesAvg = secondValues.reduce((acc, val) => acc + val) / secondValues.length;

  return [firstValuesAvg, secondValuesAvg];
}

const parts = cleanedSegments.map(async (segment, index) => {
  const start = Number(segment.start) || 0;
  const end = Number(segment.end) || 0;
  const duration = end - start;
  const output = `/tmp/viz/parts/part_${index}.raw`;
  await exec(
    `ffmpeg -y -i /tmp/viz/song.mp3 -ss ${start} -t ${duration} -f f32le -ac 1 -ar 16000 ${output}`
  );
  const buffer = await fs.promises.readFile(output);
  const floats = new Float32Array(buffer.buffer);
  const features = extractor.computeFrameWise(floats, 256);

  const values = await Promise.all(moodModels.map(async (model) => {
    const predictions = await model.predict(features, true);
    const summarizedPredictions = twoValuesAverage(predictions);
    const modelName: string = model.modelName;
    const results = summarizedPredictions.filter((_, i) => modelTagOrder[modelName][i])[0];
    return `${modelName.replace(/mood_/g, "")}(${results.toFixed(2)})`;
  }));

  const desc = values.join("_");
  await exec(
    `ffmpeg -y -i /tmp/viz/song.mp3 -ss ${start} -t ${duration} -acodec pcm_s16le "/tmp/viz/analyzed/part_${index}_${desc}.wav"`
  );
});
await Promise.all(parts);

// ffmpeg -i /tmp/viz/song.mp3 -ss 5 -t 3 -acodec pcm_s16le -ac 1 -ar 16000 out.wav
