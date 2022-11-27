import {
  CompiledGroup,
  CompiledShaderLayer,
  CompiledUniformBase,
  CompiledUniformNumber,
  CompiledUniformSampler2D,
  Group,
  ShaderLayer,
  ShaderTexture,
  ShaderValue
} from "./interfaces.js";
export * from "./interfaces.js";

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
  compiledUniform: CompiledUniformBase;
  location: WebGLUniformLocation | null;
}

interface ProcessedUniformNumber extends ProcessedUniformBase {
  type: "int" | "float";
  compiledUniform: CompiledUniformNumber;
}

interface ProcessedUniformSampler2D extends ProcessedUniformBase {
  type: "sampler2D";
  compiledUniform: CompiledUniformSampler2D;
  cachedTexture?: WebGLTexture;
}

type ProcessedUniform = ProcessedUniformNumber | ProcessedUniformSampler2D;

interface NewUniform {
  type: GLSLType;
  name: string;
  afterUniform: string;
}

interface ProcessedShaderLayer {
  type: "shader";
  compiledShaderLayer: CompiledShaderLayer;
  uniforms: ProcessedUniform[];
  program: WebGLProgram | null;

  // Global uniforms (entirely possible to be null if they are unused)
  gResolution: WebGLUniformLocation | null;
  gTime: WebGLUniformLocation | null;
  gPreviousLayer: WebGLUniformLocation | null;
}

interface ProcessedGroup {
  type: "group";
  compiledGroup: CompiledGroup;
  layers: (ProcessedShaderLayer | ProcessedGroup)[];
  timeSeconds: number;
}

// This type contains all the possible attributes for all types
interface ProcessedComment {
  default?: any;
  min?: any;
  max?: any;
}

interface ProcessedShaderSuccess {
  shader: WebGLShader;
  compileErrors?: undefined;
}
interface ProcessedShaderFailed {
  shader: null;
  compileErrors: string;
}
type ProcessedShader = ProcessedShaderSuccess | ProcessedShaderFailed;

interface ProcessedProgram {
  program: WebGLProgram | null;
  compileErrors?: string;
  linkErrors?: string;
}

interface RenderTarget {
  texture: WebGLTexture;
  buffer: WebGLFramebuffer;
}

const pass = <T>(value: T): T => value;

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
    if (typeof value.url === "string") {
      return value;
    }
    return { url: "" };
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

  private readonly vertexShader: WebGLShader;

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

    const createRenderTarget = (width: number, height: number): RenderTarget => {
      const buffer = expect(gl.createFramebuffer(), "WebGLFramebuffer");
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

    // All effects currently use the same vertex shader
    const vertexShader = `#version 300 es
      in vec2 _gVeretxPosition;
      out vec2 gPosition;
      out vec2 gUV;
      void main() {
        gPosition = _gVeretxPosition;
        gUV = (_gVeretxPosition + vec2(1.0, 1.0)) * 0.5;
        gl_Position = vec4(_gVeretxPosition, 0.0, 1.0);
      }`;

    const processedVertexShader = this.createShader(vertexShader, gl.VERTEX_SHADER);
    this.vertexShader = expect(this.createShader(vertexShader, gl.VERTEX_SHADER).shader,
      processedVertexShader.compileErrors!);

    const fragmentShaderCopy = `
      uniform sampler2D textureToCopy;
      void main() {
        gFragColor = texture(textureToCopy, gUV);
      }`;
    const processedCopyProgram = this.createProgram(fragmentShaderCopy);
    if (processedCopyProgram.compileErrors) {
      throw new Error(`Copy program did not compile: ${processedCopyProgram.compileErrors}`);
    }
    if (processedCopyProgram.linkErrors) {
      throw new Error(`Copy program did not link: ${processedCopyProgram.linkErrors}`);
    }
    this.copyProgram = processedCopyProgram.program!;
    this.textureToCopy = expect(gl.getUniformLocation(this.copyProgram, "textureToCopy"), "textureToCopy");
  }

  private createShader(str: string, type: GLenum): ProcessedShader {
    const gl = this.gl;
    const shader = expect(gl.createShader(type), "WebGLShader");
    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    const compileStatus = gl.getShaderParameter(shader, gl.COMPILE_STATUS) as boolean;
    if (!compileStatus) {
      const compilationLog = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      return {
        shader: null,
        compileErrors: compilationLog || "Failed to compile"
      };
    }
    return { shader };
  }

  private createProgram(fragmentShader: string): ProcessedProgram {
    const gl = this.gl;
    const program = expect(gl.createProgram(), "WebGLProgram");

    const fragmentShaderHeader = `#version 300 es
      precision highp float;
      const float gPI = acos(-1.0);
      const float gPI2 = gPI * 2.0;
      in vec2 gPosition;
      in vec2 gUV;
      out vec4 gFragColor;
      uniform sampler2D gPreviousLayer;
      uniform vec2 gResolution;
      uniform float gTime;
    `;
    const processedFragmentShader =
      this.createShader(`${fragmentShaderHeader}\n${fragmentShader}`, gl.FRAGMENT_SHADER);
    if (!processedFragmentShader.shader) {
      return {
        program: null,
        compileErrors: processedFragmentShader.compileErrors,
      };
    }

    gl.attachShader(program, expect(this.vertexShader, "Vertex Shader"));
    gl.attachShader(program, processedFragmentShader.shader);
    gl.linkProgram(program);
    const linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS) as boolean;
    if (!linkStatus) {
      const programLog = gl.getProgramInfoLog(program);
      return {
        program,
        linkErrors: programLog || "Failed to link"
      };
    }
    return { program };
  }

  private createTexture(): WebGLTexture {
    const gl = this.gl;
    const texture = expect(gl.createTexture(), "WebGLTexture");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return texture;
  }

  public compile(group: Group, mode: "clone" | "modifyInPlace" = "clone"): CompiledGroup {
    // Let the user pick if we make a copy, because we're going to potentially
    // modify the group such as if we find new uniforms within the shaders
    this.processedGroup = this.compileGroup(mode === "clone"
      ? JSON.parse(JSON.stringify(group)) as Group
      : group);
    return this.processedGroup.compiledGroup;
  }

  private compileShaderLayer(shaderLayer: ShaderLayer): ProcessedShaderLayer {
    const gl = this.gl;
    const processedProgram = this.createProgram(shaderLayer.code);

    if (processedProgram.compileErrors) {
      console.warn(processedProgram.compileErrors);
    }
    if (processedProgram.linkErrors) {
      console.warn(processedProgram.linkErrors);
    }

    // It's possible that there was a compile/linker error and we got no program back
    const program = processedProgram.program;
    if (program) {
      const vertexPosAttrib = gl.getAttribLocation(program, '_gVeretxPosition');
      gl.enableVertexAttribArray(vertexPosAttrib);
      gl.vertexAttribPointer(vertexPosAttrib, 2, gl.FLOAT, false, 0, 0);
    }

    const getUniformLocation = (name: string) => program
      ? gl.getUniformLocation(program, name)
      : null;

    // tags: <types>
    const uniformRegex = /uniform\s+(int|float|sampler2D)\s+([a-zA-Z_][a-zA-Z0-9_]*)(.*)/gum;

    const newUniformNames: Record<string, true> = {};
    const newUniforms: NewUniform[] = [];
    for (; ;) {
      const result = uniformRegex.exec(shaderLayer.code);
      if (!result) {
        break;
      }
      const name = result[2];
      newUniformNames[name] = true;
      newUniforms.push({
        type: result[1] as GLSLType,
        name,
        afterUniform: result[3]
      });
    }

    // Make a copy of the old shader values that we pop from as we map old to new
    const oldShaderValues = shaderLayer.values.slice(0);

    const processedUniforms: ProcessedUniform[] = newUniforms.map<ProcessedUniform>((unprocessedUniform, uniformIndex) => {
      const { type, name, afterUniform } = unprocessedUniform;
      const location = getUniformLocation(name);

      let parsedComment: ProcessedComment = {};

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
          // Ignore the comment for now
        }
      }

      // We always first look by name
      let foundShaderValue: ShaderValue | null = null;
      for (let i = 0; i < oldShaderValues.length; ++i) {
        const oldShaderValue = oldShaderValues[i];
        if (oldShaderValue.name === name) {
          oldShaderValues.splice(i, 1);
          foundShaderValue = oldShaderValue;
          break;
        }
      }

      // If we didn't find it by name, we'll detect a potential rename by checking if there
      // is a uniform at the same previous index that is also of the same type and is *unused*
      if (foundShaderValue === null) {
        const oldShaderValueAtIndex = shaderLayer.values[uniformIndex] as ShaderValue | undefined;
        const isRename =
          oldShaderValueAtIndex &&
          oldShaderValueAtIndex.type === type &&
          !newUniformNames[oldShaderValueAtIndex.name];

        if (isRename) {
          foundShaderValue = oldShaderValueAtIndex;
        }
      }

      // tags: <types>
      switch (type) {
        case "int":
        case "float":
          return pass<ProcessedUniformNumber>({
            type,
            location,
            compiledUniform: {
              name,
              type,
              parsedComment,
              shaderValue: {
                name,
                type,
                value: validateGLSLNumber(type, foundShaderValue?.value)
              },
              defaultValue: validateGLSLNumber(type, parsedComment.default),
              minValue: validateGLSLNumber(type, parsedComment.min),
              maxValue: validateGLSLNumber(type, parsedComment.min),
            }
          });
        case "sampler2D":
          return pass<ProcessedUniformSampler2D>({
            type,
            location,
            compiledUniform: {
              name,
              type,
              parsedComment,
              shaderValue: {
                name,
                type,
                value: validateGLSLSampler2D(foundShaderValue?.value)
              },
              defaultValue: validateGLSLSampler2D(parsedComment.default),
            }
          });
        default: throw new Error(`Unexpected GLSL type '${type}'`)
      }
    });

    // Now that we've processed all the new uniforms and either
    // found their old shader values or made new ones, lets update the
    // shader values on the ShaderLayer to match. Note that this will
    // mutate the object, however it may be a copy of the user's ShaderLayer
    // depending on which option they passed into `compile`
    shaderLayer.values.length = 0;
    shaderLayer.values.push(...processedUniforms.map((processedUniform) =>
      processedUniform.compiledUniform.shaderValue));

    return {
      type: "shader",
      compiledShaderLayer: {
        type: "shader",
        shaderLayer,
        uniforms: processedUniforms.map((processedUniform) => processedUniform.compiledUniform),
        compileErrors: processedProgram.compileErrors,
        linkErrors: processedProgram.linkErrors,
      },
      uniforms: processedUniforms,
      program,
      gResolution: getUniformLocation("gResolution"),
      gTime: getUniformLocation("gTime"),
      gPreviousLayer: getUniformLocation("gPreviousLayer"),
    }
  }

  private compileGroup(group: Group): ProcessedGroup {
    const processedGroup: ProcessedGroup = {
      type: "group",
      compiledGroup: {
        type: "group",
        group,
        layers: []
      },
      layers: [],
      timeSeconds: 0
    };
    for (const layer of group.layers) {
      if (layer.type === "shader") {
        const processedShaderLayer = this.compileShaderLayer(layer);
        processedGroup.layers.push(processedShaderLayer);
        processedGroup.compiledGroup.layers.push(processedShaderLayer.compiledShaderLayer);
      } else {
        // Recursively compile the child group
        const processedChildGroup = this.compileGroup(layer);
        processedGroup.layers.push(processedChildGroup);
        processedGroup.compiledGroup.layers.push(processedChildGroup.compiledGroup);
      }
    }
    return processedGroup;
  }

  public render(): void {
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
      for (const processedUniform of processedShaderLayer.uniforms) {
        // Don't set uniforms that don't have locations. These can occur if we
        // found the uniform via a regex, but it was optimized out by the compiler
        if (!processedUniform.location) {
          continue;
        }

        const value = processedUniform.compiledUniform.shaderValue.value;
        // tags: <types>
        switch (processedUniform.type) {
          case "int":
          case "float": {
            const validatedValue = validateGLSLNumber(processedUniform.type, value);
            if (processedUniform.type === "int") {
              gl.uniform1i(processedUniform.location, validatedValue);
            } else {
              gl.uniform1f(processedUniform.location, validatedValue);
            }
            break;
          }
          case "sampler2D": {
            const validatedValue = validateGLSLSampler2D(value);
            const shaderTexture = validatedValue as ShaderTexture;
            let texture: WebGLTexture | null = null;
            if (processedUniform.cachedTexture) {
              texture = processedUniform.cachedTexture;
            } else {
              texture = this.createTexture();
              this.loadTexture(shaderTexture.url, texture, gl);
            }
            processedUniform.cachedTexture = texture;
            gl.activeTexture(gl.TEXTURE0 + textureSamplerIndex);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.uniform1i(processedUniform.location, textureSamplerIndex);
            ++textureSamplerIndex;
            break;
          }
          default: throw new Error(`Unexpected GLSL type '${(processedUniform as any).type}'`)
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
          // We only render the layer if it has a valid program (also don't swap buffers)
          // Treat this like it's an invisible layer
          if (layer.program) {
            renderShaderLayer(
              layer,
              this.renderTargets[renderTargetIndex],
              this.renderTargets[Number(!renderTargetIndex)].texture);

            renderTargetIndex = Number(!renderTargetIndex);
          }
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
