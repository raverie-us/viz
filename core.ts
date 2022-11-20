import { Group, ShaderLayer, ShaderTexture, ShaderType } from "./interfaces.js";
export * from "./interfaces.js"

// We don't want to rely on nodejs asserts or any other packages
const assert = (value: unknown, error: string): asserts value => {
  if (!value) {
    throw new Error(error);
  }
}
const expect = <T>(value: T | null | undefined, name: string): T => {
  if (!value) {
    throw new Error(`Expected to get: ${name}`);
  }
  return value;
}

// tags: <types>
type GLSLType = "int" | "float" | "sampler2D";

// tags: <types> (see below, the different uniform types)
interface ProcessedUniformBase {
  name: string;
  location: WebGLUniformLocation;
}

interface ProcessedUniformNumber extends ProcessedUniformBase {
  type: "int" | "float";
  defaultValue: number;
  minValue?: number;
  maxValue?: number;
}

interface ProcessedUniformSampler2D extends ProcessedUniformBase {
  type: "sampler2D";
  defaultValue: ShaderTexture;
  cachedTexture?: WebGLTexture;
}

type ProcessedUniform = ProcessedUniformNumber | ProcessedUniformSampler2D;

interface ProcessedShaderLayer {
  type: "shader";
  shaderLayer: ShaderLayer;
  uniforms: ProcessedUniform[];
  program: WebGLProgram;

  // Global uniforms (entirely possible to be null if they are unused)
  gResolution: WebGLUniformLocation | null;
  gTime: WebGLUniformLocation | null;
  gPreviousLayer: WebGLUniformLocation | null;
}

interface ProcessedGroup {
  type: "group";
  layers: (ProcessedShaderLayer | ProcessedGroup)[];
  timeSeconds: number;
}

// This type contains all the possible attributes for all types
interface ProcessedComment {
  default?: ShaderType;
  min?: ShaderType;
  max?: ShaderType;
}

interface RenderTarget {
  texture: WebGLTexture;
  buffer: WebGLFramebuffer;
}

// tags: <types>
const validateGLSLInt = (value: any): number =>
  value === undefined ? 0 : Math.floor(Number(value));

// tags: <types>
const validateGLSLFloat = (value: any): number =>
  value === undefined ? 0 : Number(value);

// tags: <types>
const validateGLSLNumber = (glslType: "int" | "float", value: any): number => 
  glslType === "int"
    ? validateGLSLInt(value)
    : validateGLSLFloat(value)

// tags: <types>
const validateGLSLSampler2D = (value: any): ShaderTexture => {
  if (value === undefined) {
    return { url: "" };
  }

  if (typeof value === "object" && value !== null) {
    if (!("url" in value)) {
      return { url: "" };
    }
    return value;
  } else {
    return { url: String(value) };
  }
}

export type LoadTextureFunction = (url: string, texture: WebGLTexture, gl: WebGL2RenderingContext) => any;

export class RaverieVisualizer {
  private width: number;
  private height: number;
  private readonly gl: WebGL2RenderingContext;
  private readonly renderTargets: [RenderTarget, RenderTarget];
  private readonly loadTexture: LoadTextureFunction;

  private processedGroup: ProcessedGroup | null = null;

  // For copying the final result to the back buffer
  private readonly copyProgram: WebGLProgram;
  private readonly textureToCopy: WebGLUniformLocation;

  public constructor(gl: WebGL2RenderingContext, loadTexture: LoadTextureFunction, width: number, height: number) {
    this.gl = gl;
    this.loadTexture = loadTexture;
    this.width = width;
    this.height = height;

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const vertexPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
    const vertices = [
      -1, -1, // Bottom left
      +1, -1, // Bottom right
      -1, +1, // Top left
      +1, +1, // Top right
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const fragmentShaderCopy = `
    uniform sampler2D textureToCopy;
    void main() {
      gFragColor = texture(textureToCopy, gUV);
    }
    `;

    const createRenderTarget = (width: number, height: number): RenderTarget => {
      const buffer = gl.createFramebuffer();
      if (!buffer) {
        throw new Error("Unable to create RenderTarget WebGLFramebuffer");
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
      const texture = this.createTexture();
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return {
        texture: texture,
        buffer: buffer
      };
    }

    this.renderTargets = [
      createRenderTarget(width, height),
      createRenderTarget(width, height),
    ]

    this.copyProgram = this.createProgram(fragmentShaderCopy);
    this.textureToCopy = expect(gl.getUniformLocation(this.copyProgram, "textureToCopy"), "textureToCopy");
  }

  private createProgram(fragmentShader: string) {
    const createShader = (str: string, type: GLenum) => {
      const shader = gl.createShader(type);
      if (!shader) {
        throw new Error("Unable to create WebGLShader");
      }
      gl.shaderSource(shader, str);
      gl.compileShader(shader);

      const compileStatus = gl.getShaderParameter(shader, gl.COMPILE_STATUS) as boolean;
      if (!compileStatus) {
        const compilationLog = gl.getShaderInfoLog(shader);
        console.error(`${type === gl.VERTEX_SHADER ? "Vertex" : "Fragment"} shader compiler log:`, compilationLog);
      }
      return shader;
    }

    const gl = this.gl;
    const program = gl.createProgram();
    if (!program) {
      throw new Error("Unable to create WebGLProgram");
    }

    // All effects currently use the same vertex shader
    const vertexShader = `#version 300 es
      in vec4 pos;
      out vec2 gPosition;
      out vec2 gUV;
      void main() {
        gPosition = pos.xy;
        gUV = (pos.xy + vec2(1.0, 1.0)) * 0.5;
        gl_Position = pos;
      }`;

    const vshader = createShader(vertexShader, gl.VERTEX_SHADER);

    const fragmentShaderHeader = `#version 300 es
      precision highp float;
      const float PI = 3.1415926535897932384626433832795;
      in vec2 gPosition;
      in vec2 gUV;
      out vec4 gFragColor;
      uniform sampler2D gPreviousLayer;
      uniform vec2 gResolution;
      uniform float gTime;
    `;
    const fshader = createShader(`${fragmentShaderHeader}\n${fragmentShader}`, gl.FRAGMENT_SHADER);
    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);
    const linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS) as boolean;
    if (!linkStatus) {
      const programLog = gl.getProgramInfoLog(program);
      console.error('Shader program/linking:', programLog);
    }
    return program;
  }

  private createTexture(): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error("Unable to create RenderTarget WebGLTexture");
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return texture;
  }

  public compile(group: Group): void {
    this.processedGroup = this.compileGroup(group);
  }

  private compileGroup(group: Group): ProcessedGroup {
    const gl = this.gl;

    const compileShaderLayer = (shaderLayer: ShaderLayer): ProcessedShaderLayer => {
      const program = this.createProgram(shaderLayer.code);

      const vertexPosAttrib = gl.getAttribLocation(program, 'pos');
      gl.enableVertexAttribArray(vertexPosAttrib);
      gl.vertexAttribPointer(vertexPosAttrib, 2, gl.FLOAT, false, 0, 0);

      // tags: <types>
      const uniformRegex = /uniform\s+(int|float|sampler2D)\s+([a-zA-Z_][a-zA-Z0-9_]*)(.*)/gum;

      const uniforms: ProcessedUniform[] = [];

      for (; ;) {
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

        let parsedComment: ProcessedComment = {};

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

        const uniformBase: ProcessedUniformBase = {
          name,
          location
        };

        // tags: <types>
        switch (type) {
          case "int":
          case "float":
            uniforms.push({
              ...uniformBase,
              type,
              defaultValue: validateGLSLNumber(type, parsedComment.default),
              minValue: validateGLSLNumber(type, parsedComment.min),
              maxValue: validateGLSLNumber(type, parsedComment.min),
            });
            break;
          case "sampler2D":
            uniforms.push({
              defaultValue: validateGLSLSampler2D(parsedComment.default),
              ...uniformBase,
              type
            });
            break;
        }
      }

      return {
        type: "shader",
        shaderLayer,
        uniforms,
        program,
        gResolution: gl.getUniformLocation(program, "gResolution"),
        gTime: gl.getUniformLocation(program, "gTime"),
        gPreviousLayer: gl.getUniformLocation(program, "gPreviousLayer"),
      }
    }

    const processedGroup: ProcessedGroup = {
      type: "group",
      layers: [],
      timeSeconds: 0
    };
    for (const layer of group.layers) {
      if (layer.type === "shader") {
        processedGroup.layers.push(compileShaderLayer(layer));
      } else {
        // Recursively compile the child group
        processedGroup.layers.push(this.compileGroup(layer));
      }
    }
    return processedGroup;
  }

  render(): void {
    if (!this.processedGroup) {
      return;
    }
    const gl = this.gl;

    const renderShaderLayer = (
      processedShaderLayer: ProcessedShaderLayer,
      renderTarget: RenderTarget,
      previousLayerTexture: WebGLTexture) => {
      gl.useProgram(processedShaderLayer.program);
      gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.buffer);

      // Apply global uniforms
      gl.uniform2f(processedShaderLayer.gResolution, this.width, this.height);
      gl.uniform1f(processedShaderLayer.gTime, performance.now() / 1000);

      gl.uniform1i(processedShaderLayer.gPreviousLayer, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, previousLayerTexture);

      // Apply layer uniforms
      let textureSamplerIndex = 1;
      for (const uniform of processedShaderLayer.uniforms) {
        const value = processedShaderLayer.shaderLayer.values[uniform.name];
        // tags: <types>
        switch (uniform.type) {
          case "int":
          case "float": {
            const validatedValue = validateGLSLNumber(uniform.type, value);
            if (uniform.type === "int") {
              gl.uniform1i(uniform.location, validatedValue);
            } else {
              gl.uniform1f(uniform.location, validatedValue);
            }
            break;
          }
          case "sampler2D": {
            const validatedValue = validateGLSLSampler2D(value);
            const shaderTexture = validatedValue as ShaderTexture;
            let texture: WebGLTexture | null = null;
            if (uniform.cachedTexture) {
              texture = uniform.cachedTexture;
            } else {
              texture = this.createTexture();
              this.loadTexture(shaderTexture.url, texture, gl);
            }
            uniform.cachedTexture = texture;
            gl.activeTexture(gl.TEXTURE0 + textureSamplerIndex);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(uniform.location, textureSamplerIndex);
            ++textureSamplerIndex;
            break;
          }
          default: throw new Error(`Unexpected GLSL type '${(uniform as any).type}'`)
        }
      }

      gl.clearColor(1, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    let renderTargetIndex = 0;
    const renderRecursive = (processedGroup: ProcessedGroup) => {
      for (let i = processedGroup.layers.length - 1; i >= 0; --i) {
        const layer = processedGroup.layers[i];
        if (layer.type === "shader") {
          renderShaderLayer(
            layer,
            this.renderTargets[renderTargetIndex],
            this.renderTargets[Number(!renderTargetIndex)].texture);

          renderTargetIndex = Number(!renderTargetIndex);
        } else {
          renderRecursive(layer);
        }
      }
    }

    renderRecursive(this.processedGroup);

    gl.useProgram(this.copyProgram);
    gl.uniform1i(this.textureToCopy, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.renderTargets[Number(!renderTargetIndex)].texture);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
