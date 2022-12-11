import { makeRaverieVisualizerForCanvas } from "./browser.js";
import { runTests } from "./test.js";

const visualizer = makeRaverieVisualizerForCanvas(document.getElementsByTagName("canvas")[0]);

runTests(visualizer);

const textarea = document.getElementsByTagName("textarea")[0];
const onJsonChanged = () => {
  const json = eval(`(${textarea.value})`);
  visualizer.compile(json);
}
textarea.oninput = onJsonChanged;
setTimeout(onJsonChanged);

const onUpdate = () => {
  requestAnimationFrame(onUpdate);
  visualizer.render();
};

onUpdate();
