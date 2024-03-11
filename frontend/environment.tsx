import React from "react";
import Box from "@mui/material/Box";
import { LayoutBase, DockLayout, TabData, LayoutData, PanelData, PanelBase } from "rc-dock";
import "./dockPanelTheme.less";
import { AppMenu } from "./appMenu";
import { openFile, cloneObject } from "./utility";
import { Meta, MetaContext, MetaTabEvent } from "./meta";
import { ObjectsView } from "./objectsView";
import { PropertiesView } from "./propertiesView";

const TAB_ID_WORKAREA = "workArea";
const TAB_ID_OBJECTS = "objects";
const TAB_ID_PROPERTIES = "properties";

const APP_BAR_HEIGHT = "30px";

const desktopLayout: LayoutBase = {
  dockbox: {
    id: "main",
    mode: "horizontal",
    children: [
      {
        id: TAB_ID_WORKAREA,
        size: 500,
        mode: "vertical",
        tabs: [],
        children: []
      },
      {
        id: "layerAndPropertiesBox",
        size: 200,
        mode: "vertical",
        children: [
          {
            id: "propertiesBox",
            size: 200,
            tabs: [
              {
                id: TAB_ID_PROPERTIES
              }
            ]
          },
          {
            id: "objectsPanel",
            size: 200,
            tabs: [
              {
                id: TAB_ID_OBJECTS
              }
            ]
          }
        ]
      }
    ]
  }
};

const mobileLayout: LayoutBase = {
  dockbox: {
    id: "main",
    mode: "vertical",
    children: [
      {
        id: TAB_ID_WORKAREA,
        size: 400,
        mode: "vertical",
        tabs: [],
        children: []
      },
      {
        id: "objectAndPropertiesBox",
        size: 200,
        tabs: [
          {
            id: TAB_ID_OBJECTS
          },
          {
            id: TAB_ID_PROPERTIES
          }
        ]
      },
    ]
  }
};

export const getMetaContextFromTarget = (target: HTMLElement | null): MetaContext | null => {
  const regex = /meta\(([^\)]+)\)/g;
  while (target) {
    const targetMatch = regex.exec(target.id);
    if (targetMatch) {
      const contextId = targetMatch[1];
      const context = Meta.instance.contexts[contextId];
      if (!context) {
        throw new Error("Found an html element with a meta context id that doesn't exist");
      }
      return context;
    }
    target = target.parentElement;
  }
  return null;
}

export const Environment: React.FC = () => {
  const dockLayout = React.useRef<DockLayout>(null);
  const aspectRatio = window.innerWidth / window.innerHeight;
  const [layout, setLayout] = React.useState<LayoutBase>(() => cloneObject(
    aspectRatio > 1.0
      ? desktopLayout
      : mobileLayout));

  React.useEffect(() => {
    const onOpenTab = ((event: MetaTabEvent) => {
      const dock = dockLayout.current;
      if (!dock) {
        return;
      }
      const tab = event.tab;

      if (tab.tabType === "main") {
        const workArea = dock.find(TAB_ID_WORKAREA) as PanelData;
        const newTab = { id: tab.tabId } as TabData;
        dock.dockMove(newTab, workArea, "middle");
      } else {
        // If we don't already have a window for this id, then we need to open a temporary one
        const foundTab = dock.find(tab.tabId) as TabData | null;
        if (foundTab) {
          dock.dockMove(foundTab, null, "front");
        } else {
          let foundTab: TabData | null = null;
          let foundHighestTabIndex = -1;

          // Walk all possible tabs of the same type
          for (const metaTab of tab.context.tabs) {
            if (metaTab.tabType === tab.tabType) {
              const found = dock.find(metaTab.tabId) as TabData | null;
              if (found && found.parent) {
                const tabIndex = found.parent.tabs.indexOf(found);
                if (tabIndex > foundHighestTabIndex) {
                  foundTab = found;
                  foundHighestTabIndex = tabIndex;
                }
              }
            }
          }

          const newTab = { id: tab.tabId } as TabData;

          if (foundTab) {
            dock.dockMove(newTab, foundTab, "after-tab");
          } else {
            const canvas = dock.find(tab.context.contextId);
            if (canvas && canvas.parent) {
              dock.dockMove(newTab, canvas.parent, "bottom");
            } else {
              dock.dockMove(newTab, tab.context.contextId, "bottom");
            }
          }
        }
      }
    }) as any;
    Meta.instance.addEventListener(Meta.OPEN_TAB, onOpenTab);
    return () => {
      Meta.instance.removeEventListener(Meta.OPEN_TAB, onOpenTab);
    };
  }, []);

  //React.useEffect(() => {
  //  if (editCodeForSelectedLayer && selectedLayer && (selectedLayer.type === "shader" || selectedLayer.type === "js")) {
  //    // We have to delay this by one frame because we update the
  //    // layout when the selected layer changes, and this will get overwritten
  //    const editCodeTimeout = setTimeout(() => {
  //      onEditCode(selectedLayer);
  //      setEditCodeForSelectedLayer(false);
  //    });
  //
  //    return () => {
  //      clearInterval(editCodeTimeout);
  //    };
  //  }
  //  return undefined;
  //}, [editCodeForSelectedLayer, selectedLayer]);


  const fileTypeAccept = ".rvis, .viz, .psd, image/vnd.adobe.photoshop, image/*";
  const canImport = (file?: File | null | undefined) => {
    if (!file || file.size === 0) {
      return false;
    }
    return file.type === "image/vnd.adobe.photoshop" ||
      file.type.startsWith("image/") ||
      file.name.endsWith(".viz") ||
      file.name.endsWith(".rvis");
  }

  React.useEffect(() => {
    const onDrop = async (event: DragEvent) => {
      if (!event.dataTransfer) {
        return;
      }
      const files = [...event.dataTransfer.files].
        filter(canImport).
        sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));

      if (files.length !== 0) {
        event.preventDefault();

        const importContext = getMetaContextFromTarget(event.target as HTMLElement);
        for (const file of files) {
          await Meta.instance.importFile(file, importContext);
        }
      }
    };
    window.addEventListener("drop", onDrop, true);
    const onDragOver = (event: DragEvent) => {
      if (!event.dataTransfer) {
        return;
      }
      event.preventDefault();
    };
    window.addEventListener("dragover", onDragOver, true);

    return () => {
      window.removeEventListener("drop", onDrop, true);
      window.removeEventListener("dragover", onDragOver, true);
    };
  }, []);


  return <Box display="contents">
    <AppMenu sx={{ height: APP_BAR_HEIGHT }} menuElements={[
      {
        name: "File",
        menuElements: [
          {
            name: "Open",
            onClick: async () => {
              const file = await openFile(fileTypeAccept);
              if (file) {
                await Meta.instance.importFile(file);
              }
            }
          },
          {
            name: "Import",
            onClick: async () => {
              const file = await openFile(fileTypeAccept);
              if (file) {
                await Meta.instance.importFile(file, Meta.instance.context);
              }
            }
          },
          {
            name: "Save",
            onClick: async () => {
              await Meta.instance.saveFile();
            }
          },
        ]
      }
    ]} />
    <DockLayout
      ref={dockLayout}
      onLayoutChange={(newLayout) => {
        setLayout(newLayout);
      }}
      loadTab={(tab) => {
        if (!tab.id) {
          throw new Error("Empty tab id");
        }

        if (tab.id === TAB_ID_OBJECTS) {
          return {
            id: tab.id,
            title: "Layers / Objects",
            content: <ObjectsView/>
          };
        }

        if (tab.id === TAB_ID_PROPERTIES) {
          return {
            id: tab.id,
            title: "Properties",
            content: <PropertiesView/>
          };
        }

        const metaTab = Meta.instance.tabs[tab.id];
        return {
          id: tab.id,
          title: metaTab.title,
          content: metaTab.content
        };
      }}
      afterPanelLoaded={(savedPanel, loadedPanel) => {
        if (savedPanel.id === TAB_ID_WORKAREA) {
          loadedPanel.panelLock = {
            panelStyle: "main",
          }
        }
      }}
      layout={layout}
      style={{
        width: "100%",
        height: `calc(100% - ${APP_BAR_HEIGHT})`
      }}
    />
  </Box>;
};
