export class TypedEvent<T> extends Event {
  public value: T;

  public constructor (type: string, value: T) {
    super(type);
    this.value = value;
  }
}

// Helper that just gives types to a return value (useful for inferred types)
export const pass = <T>(value: T): T => value;

export const sleep = (timeMs?: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, timeMs);
});

export const scaleToFit = (width: number, height: number, targetWidth: number, targetHeight: number) => {
  const widthRatio = width / targetWidth;
  const heightRatio = height / targetHeight;
  if (widthRatio > heightRatio) {
    return 1.0 / widthRatio;
  }
  return 1.0 / heightRatio;
};

export const cloneObject = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export interface TimePoint {
  baseTimeMs: number;
  offsetTimeMs: number;
  isFixed: boolean;
}

export const computeTimePointNow = (timePoint: TimePoint) => timePoint.isFixed
  ? timePoint.offsetTimeMs
  : performance.now() - timePoint.baseTimeMs + timePoint.offsetTimeMs;

type PromiseFunction<T> = (value: T | PromiseLike<T>) => void;

export class Deferred<T> implements Promise<T> {
  private resolveSelf: PromiseFunction<T> = undefined as any;

  private rejectSelf: PromiseFunction<T> = undefined as any;

  private promise: Promise<T>;

  public constructor () {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolveSelf = resolve;
      this.rejectSelf = reject;
    });
  }

  public then<TResult1 = T, TResult2 = never> (
    onfulfilled?: ((value: T) =>
    TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) =>
    TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  public catch<TResult = never> (onrejected?: ((reason: any) =>
  TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult> {
    return this.promise.then(onrejected);
  }

  public finally (onfinally?: (() => void) | undefined | null): Promise<T> {
    console.log(onfinally);
    throw new Error("Not implemented");
  }

  public resolve (val: T) {
    this.resolveSelf(val);
  }

  public reject (reason: any) {
    this.rejectSelf(reason);
  }

  public [Symbol.toStringTag]: "Promise" = "Promise";
}

// eslint-disable-next-line no-invalid-this
export const once = <T>(fn: (...args: any[]) => T) => {
  let result: T = undefined as any;
  return (...args: any[]) => {
    if (fn) {
      result = fn(...args);
      // eslint-disable-next-line no-param-reassign
      fn = null as any;
    }
    return result;
  };
};

export const mimeTypeFromDataUrl = (dataUrl: string) => {
  if (!dataUrl.startsWith("data:")) {
    return "";
  }
  return dataUrl.substring(dataUrl.indexOf(":") + 1, dataUrl.indexOf(";"));
};

export const fileToDataUrl = (blob: Blob) => {
  const reader = new FileReader();
  const defer = new Deferred<string>();

  reader.addEventListener("load", () => {
    defer.resolve(reader.result as string);
  }, false);

  reader.readAsDataURL(blob);
  return defer;
};

export const dataUrlToFile = async (dataUrl: string, fileName = "file") => {
  const mimeType = mimeTypeFromDataUrl(dataUrl);
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], fileName, {type: mimeType});
};

export const saveFileUrl = (fileName: string, url: string) => {
  const a = document.createElement("a");
  a.style.display = "none";
  document.body.appendChild(a);
  a.href = url;
  a.download = fileName;
  a.click();
  document.body.removeChild(a);
};

export const saveFile = (fileName: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  saveFileUrl(fileName, url);
  URL.revokeObjectURL(url);
};

export const openFiles = (accept: string, multiple = true): Promise<File[] | null> => {
  const input = document.createElement("input");
  input.style.display = "none";
  input.type = "file";
  input.multiple = multiple;
  input.accept = accept;
  document.body.appendChild(input);
  const promise = new Promise<File[] | null>((resolve) => {
    input.onchange = () => {
      if (input.files && input.files.length > 0) {
        resolve([...input.files]);
      } else {
        resolve(null);
      }
      input.remove();
    };
  });
  input.click();
  return promise;
};

export const openFile = async (accept: string): Promise<File | null> => {
  const files = await openFiles(accept, false);
  if (files && files[0]) {
    return files[0];
  }
  return null;
};
