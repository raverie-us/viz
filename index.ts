
interface Group {
  type: "group";
  layers: (ShaderLayer | Group)[];
}

type ShaderTexture = {
  url: string;
};

type ShaderValue =
  ShaderTexture |
  boolean |
  number;

type ShaderLayerBlendMode =
  "effect" |
  "normal" |
  "darken" |
  "multiply" |
  "lighten" |
  "screen";

type ShaderLayerTimeMode =
  "normal" |
  "pingpong";

interface ShaderLayer {
  type: "shader";
  code: string;
  values: Record<string, ShaderValue>;
  blendMode: ShaderLayerBlendMode;
  opacity: number;
  timeScale: number;
  timeMode: ShaderLayerTimeMode;
}

const root: Group = {
  type: "group",
  layers: [
    {
      type: "shader",
      code: `
        uniform float centerWarp; // default: 0.4
        void main() {
          vec2 uv = vec2(v_pos.x, v_pos.y * iResolution.y / iResolution.x);
          float r = length(uv);
          float theta = atan(uv.y, uv.x);
          vec4 prev = texture2D(previousLayer, (v_pos.yx + vec2(1.0, 1.0)) * 0.5);
          gl_FragColor = fract(2.5 * theta / PI + 7.0 * pow(r, centerWarp) - iTime) < 0.5 ? vec4(1.0) : prev;
        }
      `,
      blendMode: "normal",
      opacity: 1,
      timeMode: "normal",
      timeScale: 1,
      values: {
        centerWarp: 0.4
      }
    },
    {
      type: "shader",
      code: `
        uniform float lines; // default: 3
        void main() {
          float radians = (v_pos.y * 0.5 + 0.5 + iTime) * (2.0 * 3.14159265359) * lines;
          float value = sin(radians);
          vec4 prev = texture2D(previousLayer, (v_pos.xy + vec2(1.0, 1.0)) * 0.5);
          gl_FragColor = vec4(vec3(value), 1.0) + prev;
        }
      `,
      blendMode: "normal",
      opacity: 1,
      timeMode: "normal",
      timeScale: 1,
      values: {
        lines: 3
      }
    },
    {
      type: "shader",
      code: `
        uniform float blue;
        void main() {
          gl_FragColor = vec4((v_pos + vec2(1.0, 1.0)) * 0.5, blue, 1.0);
        }
      `,
      blendMode: "normal",
      opacity: 1,
      timeMode: "normal",
      timeScale: 1,
      values: {
        blue: 0.5
      }
    }
  ]
};

type GLSLType = "float";
type TSType = number;
interface CompiledUniform {
  name: string;
  type: GLSLType;
  location: WebGLUniformLocation;
  defaultValue: TSType;
  minValue?: TSType;
  maxValue?: TSType;
}

interface ParsedComment {
  default?: TSType;
  min?: TSType;
  max?: TSType;
}

interface CompiledShaderLayer {
  type: "shader";
  shaderLayer: ShaderLayer;
  uniforms: CompiledUniform[];
  program: WebGLProgram;
  
  // Global uniforms (entirely possible to be null if they are unused)
  iResolution: WebGLUniformLocation | null;
  iTime: WebGLUniformLocation | null;
  previousLayer: WebGLUniformLocation | null;
}

interface CompiledGroup {
  type: "group";
  layers: (CompiledShaderLayer | CompiledGroup)[];
  timeSeconds: number;
}

interface RenderTarget {
  texture: WebGLTexture;
  buffer: WebGLFramebuffer;
}

const validateGLSLValue = (glslType: GLSLType, value: any): TSType  => {
  // Handle default values when undefined
  if (value === undefined) {
    switch (glslType) {
      case "float": return 0;
    }
  }

  switch (glslType) {
    case "float": return Number(value);
  }
  throw new Error(`Unexpected GLSL type '${glslType}'`);
}

const initializeWebGl = (canvas: HTMLCanvasElement): boolean => {
  const gl = canvas.getContext("webgl");
  if (!gl) {
    return false;
  }

  const vertexPosBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
  const vertices = [
    -1, -1, // Bottom left
    +1, -1, // Bottom right
    -1, +1, // Top left
    +1, +1, // Top right
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  const vertexShader = `
    attribute vec2 pos;
    varying vec2 v_pos;
    void main() {
        v_pos = pos;
        gl_Position = vec4(pos, 0, 1);
    }`;

  const fragmentShaderHeader = `
    precision highp float;
    const float PI = 3.1415926535897932384626433832795;
    varying vec2 v_pos;
    uniform sampler2D previousLayer;
    uniform vec2 iResolution;
    uniform float iTime;
    `;

  const fragmentShaderCopy = `
  precision highp float;
  varying vec2 v_pos;
  uniform sampler2D textureToCopy;
  void main() {
    gl_FragColor = texture2D(textureToCopy, (v_pos.yx + vec2(1.0, 1.0)) * 0.5);
  }
  `;

  const createShader = (str: string, type: GLenum) => {
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error("Unable to create WebGLShader");
    }
    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    console.log('Shader compile status:', status);
    const compilationLog = gl.getShaderInfoLog(shader);
    console.log('Shader compiler log:', compilationLog);
    return shader;
  }

  const createProgram = (vstr: string, fstr: string) => {
    const program = gl.createProgram();
    if (!program) {
      throw new Error("Unable to create WebGLProgram");
    }
    const vshader = createShader(vstr, gl.VERTEX_SHADER);
    const fshader = createShader(fstr, gl.FRAGMENT_SHADER);
    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);
    return program;
  }

  const createTexture = (width: number, height: number) => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return texture;
  }

  const createRenderTarget = (width: number, height: number): RenderTarget => {
    const buffer = gl.createFramebuffer();
    if (!buffer){
      throw new Error("Unable to create RenderTarget WebGLFramebuffer");
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
    const texture = createTexture(width, height);
    if (!texture){
      throw new Error("Unable to create RenderTarget WebGLTexture");
    }
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {
      texture: texture,
      buffer: buffer
    };
  }

  const compileShaderLayer = (shaderLayer: ShaderLayer): CompiledShaderLayer => {
    const finalFragmentShader = `${fragmentShaderHeader}\n${shaderLayer.code}`;
    const program = createProgram(vertexShader, finalFragmentShader);

    const vertexPosAttrib = gl.getAttribLocation(program, 'pos');
    gl.enableVertexAttribArray(vertexPosAttrib);
    gl.vertexAttribPointer(vertexPosAttrib, 2, gl.FLOAT, false, 0, 0);

    const uniformRegex = /uniform\s+(float)\s+([a-zA-Z_][a-zA-Z0-9_]*)(.*)/gum;
    
    const uniforms: CompiledUniform[] = [];

    for (;;) {
      const result = uniformRegex.exec(shaderLayer.code);
      if (!result) {
        break;
      }

      const name = result[2];
      const location = gl.getUniformLocation(program, name);

      // Its possible that the uniform was declared but never used (or commented out)
      if (!location) {
        break;
      }

      let parsedComment: ParsedComment = {};

      const afterUniform = result[3];
      const commentStart = afterUniform.indexOf("//");
      if (commentStart !== -1) {
        // Check if we can parse the comment as JSON (skip 2 characters for the //)
        const commentText = afterUniform.substring(commentStart + 2);
        const innerJson = commentText.replace(/[a-zA-Z_][a-zA-Z0-9_]*/gum, (found) => {
          if (found === "true" || found === "false") {
            return found;
          }
          return `"${found}"`;
        });

        const json = `{${innerJson}}`;
        try {
          parsedComment = JSON.parse(json);
        } catch {
        }
      }

      const type = result[1] as GLSLType;
      const defaultValue = validateGLSLValue(type, parsedComment.default);
      const minValue = validateGLSLValue(type, parsedComment.min);
      const maxValue = validateGLSLValue(type, parsedComment.max);

      uniforms.push({
        type,
        name,
        location,
        defaultValue,
        minValue,
        maxValue
      });
    }

    return {
      type: "shader",
      shaderLayer,
      uniforms,
      program,
      iResolution: gl.getUniformLocation(program, "iResolution"),
      iTime: gl.getUniformLocation(program, "iTime"),
      previousLayer: gl.getUniformLocation(program, "previousLayer"),
    }
  }

  const compileGroup = (group: Group): CompiledGroup => {
    const compiledGroup: CompiledGroup = {
      type: "group",
      layers: [],
      timeSeconds: 0
    };
    for (const layer of group.layers) {
      if (layer.type === "shader") {
        compiledGroup.layers.push(compileShaderLayer(layer));
      } else {
        // Recursively compile the child group
        compiledGroup.layers.push(compileGroup(layer));
      }
    }
    return compiledGroup;
  };

  const renderShaderLayer = (
    compiledShaderLayer: CompiledShaderLayer,
    renderTarget: RenderTarget,
    previousLayerTexture: WebGLTexture) => {
    gl.useProgram(compiledShaderLayer.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.buffer);
    
    // Apply global uniforms
    gl.uniform2f(compiledShaderLayer.iResolution, canvas.width, canvas.height);
    gl.uniform1f(compiledShaderLayer.iTime, performance.now() / 1000);

    gl.uniform1i(compiledShaderLayer.previousLayer, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, previousLayerTexture);
    
    // Apply layer uniforms
    for (const uniform of compiledShaderLayer.uniforms) {
      const value = compiledShaderLayer.shaderLayer.values[uniform.name];
      const validatedValue = validateGLSLValue(uniform.type, value);
      switch (uniform.type){
        case "float":
          gl.uniform1f(uniform.location, validatedValue as number);
          break;
        default: throw new Error(`Unexpected GLSL type '${uniform.type}'`)
      }
    }

    gl.clearColor(0, 0, 0.5, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  const compiledGroup = compileGroup(root);

  const renderTargets = [
    createRenderTarget(canvas.width, canvas.height),
    createRenderTarget(canvas.width, canvas.height),
  ]

  const copyProgram = createProgram(vertexShader, fragmentShaderCopy);
  const textureToCopy = gl.getUniformLocation(copyProgram, "textureToCopy");

  let renderTargetIndex = 0;
  const renderRecursive = (compiledGroup: CompiledGroup) => {
    for (let i = compiledGroup.layers.length - 1; i >= 0; --i) {
      const layer = compiledGroup.layers[i];
      if (layer.type === "shader") {
        renderShaderLayer(layer, renderTargets[renderTargetIndex], renderTargets[Number(!renderTargetIndex)].texture);
        renderTargetIndex = Number(!renderTargetIndex);
      } else {
        renderRecursive(layer);
      }
    }
  }

  const render = () => {
    renderRecursive(compiledGroup);

    gl.useProgram(copyProgram);
    gl.uniform1i(textureToCopy, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderTargets[Number(!renderTargetIndex)].texture);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  setInterval(render, 50);

  return true;
}


initializeWebGl(document.getElementsByTagName("canvas")[0])