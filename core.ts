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
interface CompiledUniformBase {
  name: string;
  location: WebGLUniformLocation;
  defaultValue: ShaderType;
}

interface CompiledUniformNumber extends CompiledUniformBase {
  type: "int" | "float";
  minValue?: ShaderType;
  maxValue?: ShaderType;
}

interface CompiledUniformSampler2D extends CompiledUniformBase {
  type: "sampler2D";
  cachedTexture?: WebGLTexture;
}

type CompiledUniform = CompiledUniformNumber | CompiledUniformSampler2D;

// This type contains all the possible attributes for all types
interface ParsedComment {
  default?: ShaderType;
  min?: ShaderType;
  max?: ShaderType;
}

interface CompiledShaderLayer {
  type: "shader";
  shaderLayer: ShaderLayer;
  uniforms: CompiledUniform[];
  program: WebGLProgram;

  // Global uniforms (entirely possible to be null if they are unused)
  gResolution: WebGLUniformLocation | null;
  gTime: WebGLUniformLocation | null;
  gPreviousLayer: WebGLUniformLocation | null;
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

const validateGLSLValue = (glslType: GLSLType, value: any): ShaderType => {
  // Handle default values when undefined
  if (value === undefined) {
    // tags: <types>
    switch (glslType) {
      case "int": return 0;
      case "float": return 0;
      case "sampler2D": return { url: "" };
    }
  }

  // tags: <types>
  switch (glslType) {
    case "int": return Math.floor(Number(value));
    case "float": return Number(value);
    case "sampler2D": {
      if (typeof value === "object" && value !== null) {
        if (!("url" in value)) {
          return { url: "" };
        }
        return value;
      } else {
        return { url: String(value) };
      }
    }
  }
  throw new Error(`Unexpected GLSL type '${glslType}'`);
}

export type GetTextureFunction = (url: string, gl: WebGL2RenderingContext) => WebGLTexture;

export class RaverieVisualizer {
  private width: number;
  private height: number;
  private readonly gl: WebGL2RenderingContext;
  private readonly renderTargets: [RenderTarget, RenderTarget];
  private readonly getTexture: GetTextureFunction;

  private compiledGroup: CompiledGroup | null = null;

  // For copying the final result to the back buffer
  private readonly copyProgram: WebGLProgram;
  private readonly textureToCopy: WebGLUniformLocation;

  public constructor(gl: WebGL2RenderingContext, getTexture: GetTextureFunction, width: number, height: number) {
    this.gl = gl;
    this.getTexture = getTexture;
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

    const createTexture = (width: number, height: number): WebGLTexture => {
      const texture = gl.createTexture();
      if (!texture) {
        throw new Error("Unable to create RenderTarget WebGLTexture");
      }
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
      if (!buffer) {
        throw new Error("Unable to create RenderTarget WebGLFramebuffer");
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
      const texture = createTexture(width, height);
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

  public compile(group: Group): void {
    this.compiledGroup = this.compileGroup(group);
  }

  private compileGroup(group: Group): CompiledGroup {
    const gl = this.gl;

    const compileShaderLayer = (shaderLayer: ShaderLayer): CompiledShaderLayer => {
      const program = this.createProgram(shaderLayer.code);

      const vertexPosAttrib = gl.getAttribLocation(program, 'pos');
      gl.enableVertexAttribArray(vertexPosAttrib);
      gl.vertexAttribPointer(vertexPosAttrib, 2, gl.FLOAT, false, 0, 0);

      // tags: <types>
      const uniformRegex = /uniform\s+(int|float|sampler2D)\s+([a-zA-Z_][a-zA-Z0-9_]*)(.*)/gum;

      const uniforms: CompiledUniform[] = [];

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

        const uniformBase: CompiledUniformBase = {
          name,
          location,
          defaultValue
        };

        // tags: <types>
        switch (type) {
          case "int":
          case "float":
            uniforms.push({
              ...uniformBase,
              type,
              minValue: validateGLSLValue(type, parsedComment.min),
              maxValue: validateGLSLValue(type, parsedComment.min)
            });
            break;
          case "sampler2D":
            uniforms.push({
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
        compiledGroup.layers.push(this.compileGroup(layer));
      }
    }
    return compiledGroup;
  }

  render(): void {
    if (!this.compiledGroup) {
      return;
    }
    const gl = this.gl;

    const renderShaderLayer = (
      compiledShaderLayer: CompiledShaderLayer,
      renderTarget: RenderTarget,
      previousLayerTexture: WebGLTexture) => {
      gl.useProgram(compiledShaderLayer.program);
      gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget.buffer);

      // Apply global uniforms
      gl.uniform2f(compiledShaderLayer.gResolution, this.width, this.height);
      gl.uniform1f(compiledShaderLayer.gTime, performance.now() / 1000);

      gl.uniform1i(compiledShaderLayer.gPreviousLayer, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, previousLayerTexture);

      // Apply layer uniforms
      let textureSamplerIndex = 1;
      for (const uniform of compiledShaderLayer.uniforms) {
        const value = compiledShaderLayer.shaderLayer.values[uniform.name];
        const validatedValue = validateGLSLValue(uniform.type, value);
        // tags: <types>
        switch (uniform.type) {
          case "int":
            gl.uniform1i(uniform.location, validatedValue as number);
            break;
          case "float":
            gl.uniform1f(uniform.location, validatedValue as number);
            break;
          case "sampler2D": {
            const shaderTexture = validatedValue as ShaderTexture;
            const texture = uniform.cachedTexture || this.getTexture(shaderTexture.url, gl);
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
    const renderRecursive = (compiledGroup: CompiledGroup) => {
      for (let i = compiledGroup.layers.length - 1; i >= 0; --i) {
        const layer = compiledGroup.layers[i];
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

    renderRecursive(this.compiledGroup);

    gl.useProgram(this.copyProgram);
    gl.uniform1i(this.textureToCopy, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.renderTargets[Number(!renderTargetIndex)].texture);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
