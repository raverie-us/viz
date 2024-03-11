import { MenuElement } from "./menuElement";
import { type PropertyGeneric } from "./propertyGrid";
import { setHasUnsavedChanges } from "./unload";
import { v4 as uuidv4 } from "uuid";

export type MetaConstructor<T extends Object> = { new(): T };

export interface MetaType {
  classType: MetaConstructor<any>;
  properties: PropertyGeneric[];
};

export const instanceOfMetaType =
  <T extends Object,>(toCheck: MetaType | null | undefined, baseType: MetaConstructor<T>): boolean => {
    if (!toCheck) {
      return false;
    }
    return toCheck.classType === baseType || toCheck.classType.prototype instanceof baseType;
  }

export interface MetaSelection {
  object: any;
  context: MetaContext;
  type: MetaType;
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

export class MetaContext extends EventTarget {

  public readonly contextId = uuidv4();
  public tabs: MetaTab[] = [];
  public menuElements: MenuElement[] = [];

  public constructor() {
    super();
    Meta.instance.contexts[this.contextId] = this;
  }

  public structureChanged() {
    this.dispatchEvent(new Event(Meta.STRUCTURE_CHANGED));
    if (Meta.instance.context === this) {
      Meta.instance.dispatchEvent(new Event(Meta.STRUCTURE_CHANGED));
    }
  }

  public valuesChanged() {
    this.dispatchEvent(new Event(Meta.VALUES_CHANGED));
    if (Meta.instance.context === this) {
      Meta.instance.dispatchEvent(new Event(Meta.VALUES_CHANGED));
    }
  }

  public get objectsView(): React.ReactElement | null {
    return null;
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

  // Meta context events
  public static STRUCTURE_CHANGED = "structureChanged";
  public static VALUES_CHANGED = "valuesChanged";

  private selectionInternal: MetaSelection | null = null;
  private contextInternal: MetaContext | null = null;

  public contexts: Record<string, MetaContext> = {};
  public tabs: Record<string, MetaTab> = {};

  public static instance = new Meta();

  public readonly fileLoaders: MetaFileLoaderInfo[] = [];

  public selectionInstanceOfMetaType(baseType: MetaConstructor<any>): boolean {
    return instanceOfMetaType(this.selectionInternal?.type, baseType);
  }

  public selectionDynamicCast<T extends Object, TInterface = T>(baseType: MetaConstructor<T>): TInterface | null {
    if (this.selectionInternal && this.selectionInstanceOfMetaType(baseType)) {
      return this.selectionInternal.object as TInterface;
    }
    return null;
  }

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

  public get context(): MetaContext | null {
    return this.contextInternal;
  }

  public set context(context: MetaContext) {
    if (this.contextInternal === context) {
      return;
    }
    this.contextInternal = context;
    this.dispatchEvent(new Event(Meta.CONTEXT_CHANGED));
  }

  public get selection(): MetaSelection | null {
    return this.selectionInternal;
  }

  public set selection(selection: MetaSelection | null) {
    if (selection) {
      this.context = selection.context;
    }

    if (this.selectionInternal === selection || this.selectionInternal?.object === selection?.object) {
      return;
    }
    this.selectionInternal = selection;
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
      this.context = newContext;
    }
  };

  public async saveFile() {
    // Ask the current context
    setHasUnsavedChanges(false);
  };
}
