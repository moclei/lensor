import shaders from './shaders';
interface Model {
  vertex: number[];
  indices: number[];
  textureCoords: number[];
}

interface Lens {
  a: number;
  b: number;
  Fx: number;
  Fy: number;
  scale: number;
}

interface Fov {
  x: number;
  y: number;
}

interface Options {
  width?: number;
  height?: number;
  model?: Model;
  lens?: Lens;
  fov?: Fov;
  image?: string;
  selector?: string;
  canvas: HTMLCanvasElement | null;
  vertexSrc?: string;
  fragmentSrc?: string;
  runner?: (dt: number) => void;
  animate?: boolean;
}

export interface Fisheye {
  options: Options;
  gl: WebGLRenderingContext;
  lens: Lens;
  fov: Fov;
  run: (animate: boolean, callback?: () => void) => void;
  getImage: (format?: string) => HTMLImageElement;
  setImage: (imageUrl: string, callback?: () => void) => void;
  setCanvasSource: (sourceCanvas: HTMLCanvasElement) => void;
  getCanvasDataUrl: () => string;
  getCanvas: () => HTMLCanvasElement;
}

const CONTEXT_TYPES: string[] = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];

function FisheyeGl(options: Options): Fisheye {
  // Defaults:
  options = options || {};

  options.width = options.width || 800;
  options.height = options.height || 600;

  var model: Model = options.model || {
    vertex: [
      -1.0, -1.0, 0.0,
      1.0, -1.0, 0.0,
      1.0, 1.0, 0.0,
      -1.0, 1.0, 0.0
    ],
    indices: [
      0, 1, 2,
      0, 2, 3,
      2, 1, 0,
      3, 2, 0
    ],
    textureCoords: [
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0
    ]
  };

  var lens: Lens = options.lens || {
    a: 1.0,
    b: 1.0,
    Fx: 0.0,
    Fy: 0.0,
    scale: 1.5
  };
  var fov: Fov = options.fov || {
    x: 1.0,
    y: 1.0
  }
  const image: string = options.image || "images/barrel-distortion.png";

  const selector: string = options.selector || "#canvas";
  const canvas: HTMLCanvasElement | null = options.canvas || null;
  const gl: WebGLRenderingContext = getGLContext(selector);

  const vertexSrc: string = loadFile(options.vertexSrc || "vertex");
  const fragmentSrc: string = loadFile(options.fragmentSrc || "fragment3");

  const program: WebGLProgram = compileShader(gl, vertexSrc, fragmentSrc)
  gl.useProgram(program);

  const aVertexPosition: number = gl.getAttribLocation(program, "aVertexPosition");
  const aTextureCoord: number = gl.getAttribLocation(program, "aTextureCoord");
  const uSampler: WebGLUniformLocation | null = gl.getUniformLocation(program, "uSampler");
  const uLensS: WebGLUniformLocation | null = gl.getUniformLocation(program, "uLensS");
  const uLensF: WebGLUniformLocation | null = gl.getUniformLocation(program, "uLensF");
  const uFov: WebGLUniformLocation | null = gl.getUniformLocation(program, "uFov");

  const texture: WebGLTexture | null = gl.createTexture();
  if (!texture) {
    throw new Error("texture is null");
  }

  let vertexBuffer: WebGLBuffer | null;
  let indexBuffer: WebGLBuffer | null;
  let textureBuffer: WebGLBuffer | null;

  function createBuffers() {

    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertex), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.textureCoords), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

  }

  createBuffers();

  function getGLContext(selector: string): WebGLRenderingContext {
    console.log("getGLContext");
    const canvas: HTMLCanvasElement | null = options.canvas

    if (!canvas) {
      throw new Error("there is no canvas on this page");
    }

    for (var i = 0; i < CONTEXT_TYPES.length; ++i) {
      let gl: WebGLRenderingContext | null;
      try {
        gl = canvas.getContext(CONTEXT_TYPES[i], { preserveDrawingBuffer: true }) as WebGLRenderingContext;
      } catch (e) {
        continue;
      }
      if (gl) return gl;
    }
    throw new Error("WebGL is not supported!");
  }

  function compileShader(gl: WebGLRenderingContext, vertexSrc: string, fragmentSrc: string): WebGLProgram {
    const vertexShader: WebGLShader | null = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) {
      throw new Error("vertexShader is null");
    }
    gl.shaderSource(vertexShader, vertexSrc);
    gl.compileShader(vertexShader);

    _checkCompile(vertexShader);

    const fragmentShader: WebGLShader | null = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) {
      throw new Error("fragmentShader is null");
    }
    gl.shaderSource(fragmentShader, fragmentSrc);
    gl.compileShader(fragmentShader);

    _checkCompile(fragmentShader);

    const program: WebGLProgram | null = gl.createProgram();
    if (!program) {
      throw new Error("program is null");
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    return program;

    function _checkCompile(shader: WebGLShader) {
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const shaderLogInfo = gl.getShaderInfoLog(shader);
        throw new Error(shaderLogInfo || "shader compile error");
      }
    }
  }

  function loadFile(url: string, callback?: (error: Error | null, responseText?: string) => void): string {
    if (shaders.hasOwnProperty(url)) {
      return shaders[url] as string;
    }

    var ajax = new XMLHttpRequest();

    if (callback) {
      ajax.addEventListener("readystatechange", on)
      ajax.open("GET", url, true);
      ajax.send(null);
    } else {
      ajax.open("GET", url, false);
      ajax.send(null);

      if (ajax.status == 200) {
        return ajax.responseText;
      }
    }
    return "";

    function on() {
      if (ajax.readyState === 4) {
        //complete requset
        if (ajax.status === 200) {
          //not error
          callback!(null, ajax.responseText);
        } else {
          callback!(new Error("fail to load!"));
        }
      }
    }
  }

  function loadImage(gl: WebGLRenderingContext, img: HTMLImageElement, callback?: (error: Error | null, texture: WebGLTexture) => void,): void {

    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating).
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating).
    //gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);

    if (callback) callback(null, texture!);
  }

  function loadImageFromUrl(gl: WebGLRenderingContext, url: string, callback?: () => void): void {
    const img: HTMLImageElement = new Image();
    img.addEventListener("load", function onload() {
      if (img) {
        loadImage(gl, img, callback);
        options.width = img.width;
        options.height = img.height;
        resize(
          options.width,
          options.height
        )
      }
    });
    img.src = url;
  }

  function run(animate: boolean, callback?: () => void) {
    if (animate === true) {
      // Animation mode: use requestAnimationFrame loop
      var f = window.requestAnimationFrame || (window as any).mozRequestAnimationFrame ||
        (window as any).webkitRequestAnimationFrame || (window as any).msRequestAnimationFrame;

      if (!f) {
        throw new Error("do not support 'requestAnimationFrame'");
      }

      let current: number | null = null;
      function on(t: number) {
        if (!current) current = t;
        var dt = t - current;
        current = t;
        options.runner!(dt);
        if (callback) callback();
        if (animate === true) f(on);
      }

      f(on);
    } else {
      // Single-frame mode: render synchronously
      options.runner!(0);
      if (callback) callback();
    }
  }

  function resize(w: number, h: number) {
    gl.viewport(0, 0, w, h);
    gl.canvas.width = w;
    gl.canvas.height = h;
  }

  options.runner = options.runner || function runner(dt: number) {
    // console.log('fisheyegl runner');

    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.enable(gl.DEPTH_TEST);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enableVertexAttribArray(aVertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(aTextureCoord);

    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.vertexAttribPointer(aTextureCoord, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uSampler, 0);

    gl.uniform3fv(uLensS, [lens.a, lens.b, lens.scale]);
    gl.uniform2fv(uLensF, [lens.Fx, lens.Fy]);
    gl.uniform2fv(uFov, [fov.x, fov.y]);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
  }

  function setImage(imageUrl: string, callback?: () => void) {
    loadImageFromUrl(gl, imageUrl, function onImageLoad() {

      run(options.animate!, callback);

    });
  }

  /**
   * Load a canvas directly as a texture source and render synchronously.
   * This bypasses the async Image loading entirely.
   */
  function setCanvasSource(sourceCanvas: HTMLCanvasElement): void {
    // Bind and upload the canvas directly to the WebGL texture
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // Update dimensions to match source canvas
    options.width = sourceCanvas.width;
    options.height = sourceCanvas.height;
    resize(options.width, options.height);

    // Render synchronously (single-frame mode)
    run(false);
  }

  setImage(image);

  // asynchronous!
  function getImage(format?: string): HTMLImageElement {

    var img = new Image();

    img.src = (gl.canvas as HTMLCanvasElement).toDataURL(format || 'image/jpeg');

    return img;

  }


  // asynchronous!
  function getCanvasDataUrl(): string {
    return (gl.canvas as HTMLCanvasElement).toDataURL('image/jpeg');
  }

  // asynchronous!
  function getCanvas(): HTMLCanvasElement {
    return (gl.canvas as HTMLCanvasElement);
  }


  // external API:
  return {
    options: options,
    gl: gl,
    lens: lens,
    fov: fov,
    run: run,
    getImage: getImage,
    setImage: setImage,
    setCanvasSource: setCanvasSource,
    getCanvasDataUrl: getCanvasDataUrl,
    getCanvas: getCanvas,
  }

}

// if (typeof (document) != 'undefined') {
//   console.log('FisheyeGl loaded');
//   window.FisheyeGl = FisheyeGl;
// }
export default FisheyeGl
// else
//   module.exports = FisheyeGl;
