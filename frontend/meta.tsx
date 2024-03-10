import { MenuElement } from "./menuElement";
import { type PropertyGeneric } from "./propertyGrid";
import { setHasUnsavedChanges } from "./unload";
import { v4 as uuidv4 } from "uuid";

export interface MetaSelection {
  object: any;
  properties: PropertyGeneric[];
}

export class MetaCreateTabEvent extends Event {
  public constructor(public title: string, public content: React.ReactElement, public mainWindow: boolean, public tabId: string) {
    super(Meta.CREATE_TAB);
  }
}

export class MetaContext {
  private tabs: string[] = [];

  public constructor(title: string, content: React.ReactElement, public readonly menuElements: MenuElement[]) {
    this.createTabInternal(title, content, true);
  }

  protected onCloseTab(tabId: string) {
  }

  protected onCloseContext() {
  }

  protected createTab(title: string, content: React.ReactElement): string {
    return this.createTabInternal(title, content, false);
  }

  private createTabInternal(title: string, content: React.ReactElement, mainWindow: boolean): string {
    const tabId = uuidv4();
    this.tabs.push(tabId);
    Meta.instance.dispatchEvent(new MetaCreateTabEvent(
      title,
      content,
      mainWindow,
      tabId));
    return tabId;
  }
}

export type MetaFileLoader<T extends MetaContext> = (file: File, importContext?: T) => Promise<T | null>;

interface MetaFileLoaderInfo {
  type: "mime" | "extension";
  value: string;
  loader: MetaFileLoader<MetaContext>;
}

export class Meta extends EventTarget {
  public static SELECTION_CHANGED = "sectionChanged";
  public static CONTEXT_CHANGED = "contextChanged";
  public static CREATE_TAB = "createTab";

  public selection: MetaSelection | null = null;
  public context: MetaContext | null = null;

  public static instance = new Meta();

  public readonly fileLoaders: MetaFileLoaderInfo[] = [];

  public setContext(context: MetaContext) {
    if (this.context === context) {
      return;
    }
    this.context = context;
    this.dispatchEvent(new Event(Meta.CONTEXT_CHANGED));
  }

  public setSelection(selection: MetaSelection, context: MetaContext) {
    this.setContext(context);

    if (this.selection === selection || this.selection?.object === selection.object) {
      return;
    }
    this.dispatchEvent(new Event(Meta.SELECTION_CHANGED));
  }

  public registerFileType<T extends MetaContext>(mimeType: string, loader: MetaFileLoader<T>) {
    this.fileLoaders.push({
      type: "mime",
      value: mimeType,
      loader: loader as any
    });
  }

  public registerFileExtension<T extends MetaContext>(extension: string, loader: MetaFileLoader<T>) {
    if (extension.startsWith(".")) {
      throw new Error("Only register the extension characters, do not start with dot.");
    }
    this.fileLoaders.push({
      type: "extension",
      value: extension,
      loader: loader as any
    });
  }

  public async importFile(file: File, importIntoCurrentContext: boolean) {
    // Need to handle file import
    // Should be along the lines of:
    //  - First, did you drop it over a specific window, if so get the context and let the context handle it
    //  - If not, then let the current context handle it
    //  - If the context does not handle it, invoke a generic file import (may open a new context)

    let newContext: MetaContext | null = null;
    for (const fileLoader of this.fileLoaders) {
      switch (fileLoader.type) {
        case "mime":
          if (fileLoader.value.endsWith("/*")) {
            if (file.type.startsWith(fileLoader.value.substring(0, fileLoader.value.length - 1))) {
              newContext = await fileLoader.loader(file);
            }
          } else if (file.type === fileLoader.value) {
            newContext = await fileLoader.loader(file);
          }
          break;
        case "extension":
          if (file.name.endsWith(`.${fileLoader.value}`)) {
            newContext = await fileLoader.loader(file);
          }
          break;
      }
    }

    if (newContext) {
      this.setContext(newContext);
    }
  };

  public async saveFile() {
    // Ask the current context
    setHasUnsavedChanges(false);
  };
}
