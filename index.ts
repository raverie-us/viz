
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
          gl_FragColor = fract(2.5 * theta / PI + 7.0 * pow(r, centerWarp) - iTime) < 0.5 ? vec4(1.0) : vec4(0.0,0.0,0.0,1.0);
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
          gl_FragColor = vec4(vec3(value), 1.0);
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
  shaderLayer: ShaderLayer;
  uniforms: CompiledUniform[];
  program: WebGLProgram;
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
    uniform vec2 iResolution;
    uniform float iTime;
    `;

  const fsCopy = `
  precision highp float;
  varying vec2 v_pos;
  uniform sampler2D texture;
  void main() {
    gl_FragColor = texture2D(texture, (v_pos.yx + vec2(1.0, 1.0)) * 0.5);
  }
  `;

  const createShader = (str: string, type: GLenum) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    console.log('Shader compile status:', status);
    const compilationLog = gl.getShaderInfoLog(shader);
    console.log('Shader compiler log:', compilationLog);
    return shader;
  }

  const createProgram = (vstr: string, fstr: string) => {
    const program = gl.createProgram()!;
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

  const createFramebuffer = (width: number, height: number) => {
    const buffer = gl.createFramebuffer();
    //bind framebuffer to texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
    const texture = createTexture(width, height);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return {
      texture: texture,
      buffer: buffer
    };
  }

  const compileShaderLayer = (shaderLayer: ShaderLayer): CompiledShaderLayer => {
    const program = createProgram(vertexShader, `${fragmentShaderHeader}\n${shaderLayer.code}`);

    const uniformRegex = /uniform\s+(float)\s+([a-zA-Z_][a-zA-Z0-9_]*)(.*)/gum;
    
    const uniforms: CompiledUniform[] = [];

    for (;;) {
      const result = uniformRegex.exec(shaderLayer.code);
      if (!result) {
        break;
      }

      const name = result[2];
      const location = gl.getUniformLocation(program, name);

      if (!location) {
        throw new Error(`Unable to find uniform of name '${name}'`);
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
      shaderLayer,
      uniforms,
      program
    }
  }


  const compiledShaderLayer = compileShaderLayer(root.layers[0] as ShaderLayer);
  const program = compiledShaderLayer.program;

  const vertexPosAttrib = gl.getAttribLocation(program, 'pos');
  gl.enableVertexAttribArray(vertexPosAttrib);
  gl.vertexAttribPointer(vertexPosAttrib, 2, gl.FLOAT, false, 0, 0);

  const iResolution = gl.getUniformLocation(program, 'iResolution');
  const iTime = gl.getUniformLocation(program, 'iTime');


  const lines = gl.getUniformLocation(program, 'lines');

  const fb = createFramebuffer(canvas.width, canvas.height);


  const programCopy = createProgram(vertexShader, fsCopy);

  setInterval(() => {
    gl.useProgram(program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb.buffer);
    gl.uniform2f(iResolution, canvas.width, canvas.height);
    gl.uniform1f(iTime, performance.now() / 1000);
    gl.uniform1f(lines, 3);
    gl.clearColor(0, 0, 0.5, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.useProgram(programCopy);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, 50);

  return true;
}


initializeWebGl(document.getElementsByTagName("canvas")[0])