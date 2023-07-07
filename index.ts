import { RaverieVisualizerBrowser } from "./browser.js";
import { CompiledLayerRoot } from "./core.js";
import { runTests } from "./test.js";

const canvas = document.getElementsByTagName("canvas")[0];
const visualizer = new RaverieVisualizerBrowser(canvas);

const renderTargets = visualizer.createRenderTargets(canvas.width, canvas.height);

runTests(visualizer);

let root: CompiledLayerRoot | null = null;

const textarea = document.getElementsByTagName("textarea")[0];
const onJsonChanged = () => {
  if (textarea.value.trim()) {
    const json = eval(`(${textarea.value})`);
    root = visualizer.compile(json);
  }
}
textarea.oninput = onJsonChanged;
setTimeout(onJsonChanged);

const onUpdate = () => {
  requestAnimationFrame(onUpdate);
  if (root) {
    visualizer.render(root, performance.now(), renderTargets);
  }
};

onUpdate();
