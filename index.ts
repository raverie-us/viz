import {initialize} from "./core.js";

const canvas = document.getElementsByTagName("canvas")[0];
const gl = canvas.getContext("webgl");
if (!gl) {
  throw new Error("Unable to initialze WebGl");
}

const render = initialize(gl, canvas.width, canvas.height);

const onUpdate = () => {
    requestAnimationFrame(onUpdate);
    render();
};

onUpdate();