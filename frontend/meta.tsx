import { MenuElement } from "./menuElement";
import { type PropertyGeneric } from "./propertyGrid";
import { setHasUnsavedChanges } from "./unload";
import { v4 as uuidv4 } from "uuid";

export interface MetaSelection {
  object: any;
  properties: PropertyGeneric[];
}

export interface MetaTab {
  context: MetaContext;
  tabId: string;
  tabType: MetaTabType;
  title: string;
  content: React.ReactElement;
}

export type MetaTabType = "main" | "code";

export class MetaTabEvent extends Event {
  public constructor(
    public tab: MetaTab) {
    super(Meta.OPEN_TAB);
  }
}

export class MetaContext {
  public readonly contextId = uuidv4();
  public tabs: MetaTab[] = [];

  public constructor(public readonly menuElements: MenuElement[]) {
    Meta.instance.contexts[this.contextId] = this;
  }

  protected onCloseTab(tabId: string) {
  }

  protected onCloseContext() {
    delete Meta.instance.contexts[this.contextId];
  }

  protected openMainTab(title: string, content: React.ReactElement): string {
    return Meta.instance.openTab(this, `meta(${this.contextId})`, title, content, "main");
  }

  protected openTab(uniqueName: string, title: string, content: React.ReactElement): string {
    return Meta.instance.openTab(this, `${uniqueName}_meta(${this.contextId})`, title, content, "code");
  }
}

export type MetaFileLoader<T extends MetaContext> = (file: File, importContext?: T | null) => Promise<T | null>;

interface MetaFileLoaderInfo {
  type: "mime" | "extension";
  value: string;
  loader: MetaFileLoader<MetaContext>;
}

export class Meta extends EventTarget {
  public static SELECTION_CHANGED = "sectionChanged";
  public static CONTEXT_CHANGED = "contextChanged";
  public static OPEN_TAB = "openTab";

  public selection: MetaSelection | null = null;
  public context: MetaContext | null = null;

  public contexts: Record<string, MetaContext> = {};
  public tabs: Record<string, MetaTab> = {};

  public static instance = new Meta();

  public readonly fileLoaders: MetaFileLoaderInfo[] = [];

  public openTab(
    context: MetaContext,
    tabId: string,
    title: string,
    content: React.ReactElement,
    tabType: MetaTabType): string {

    if (tabType === "main") {
      if (context.tabs.length !== 0) {
        throw new Error("Can only have one main tab, and it must be the first");
      }
    } else {
      if (context.tabs.length === 0) {
        throw new Error("The first tab must be the main tab");
      }
    }

    const metaTab: MetaTab = {
      context,
      tabId,
      tabType,
      title,
      content
    };
    if (!this.tabs[tabId]) {
      context.tabs.push(metaTab);
    }
    this.tabs[tabId] = metaTab;
    Meta.instance.dispatchEvent(new MetaTabEvent(metaTab));
    return tabId;
  }

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

  public async importFile(file: File, importContext?: MetaContext | null) {
    let newContext: MetaContext | null = null;
    for (const fileLoader of this.fileLoaders) {
      switch (fileLoader.type) {
        case "mime":
          if (fileLoader.value.endsWith("/*")) {
            if (file.type.startsWith(fileLoader.value.substring(0, fileLoader.value.length - 1))) {
              newContext = await fileLoader.loader(file, importContext);
            }
          } else if (file.type === fileLoader.value) {
            newContext = await fileLoader.loader(file, importContext);
          }
          break;
        case "extension":
          if (file.name.endsWith(`.${fileLoader.value}`)) {
            newContext = await fileLoader.loader(file, importContext);
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
