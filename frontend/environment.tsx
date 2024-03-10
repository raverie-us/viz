import React from "react";
import Box from "@mui/material/Box";
import { LayoutBase, DockLayout, TabData, LayoutData } from "rc-dock";
import "./visualizerDockPanelTheme.less";
import { AppMenu } from "./appMenu";
import { openFile, cloneObject } from "./utility";
import { Meta, MetaCreateTabEvent } from "./meta";

const TAB_ID_WORKAREA = "workArea";
const TAB_ID_LAYERS = "layers";
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
            id: "layersPanel",
            size: 200,
            tabs: [
              {
                id: TAB_ID_LAYERS
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
        id: "workArea",
        size: 400,
        mode: "vertical",
        children: [
          //{
          //  id: "canvasPanel",
          //  tabs: [
          //    {
          //      id: TAB_ID_CANVAS
          //    }
          //  ]
          //}
        ]
      },
      {
        id: "layerAndPropertiesBox",
        size: 200,
        tabs: [
          {
            id: TAB_ID_LAYERS
          },
          {
            id: TAB_ID_PROPERTIES
          }
        ]
      },
    ]
  }
};

export const Environment: React.FC = () => {
  const dockLayout = React.useRef<DockLayout>(null);
  const aspectRatio = window.innerWidth / window.innerHeight;
  const [layout, setLayout] = React.useState<LayoutBase>(() => cloneObject(
    aspectRatio > 1.0
      ? desktopLayout
      : mobileLayout));

  React.useEffect(() => {
    Meta.instance.addEventListener(Meta.CREATE_TAB, ((event: MetaCreateTabEvent) => {
      // event.mainWindow
      const layoutFull = {...layout};
      layoutFull.dockbox.children.push({
        tabs: [
          {
            id: event.tabId
          }
        ]
      });
      setLayout(layoutFull);
    }) as any);
  }, []);

  //const onEditCode = (layerShader: CompiledLayerCode) => {
  //  const dock = dockLayout.current;
  //  if (!dock) {
  //    return;
  //  }
  //  const id = layerShader.layer.id;
  //
  //  // If we don't already have a window for this id, then we need to open a temporary one
  //  const foundTab = dock.find(id) as TabData | null;
  //  if (foundTab) {
  //    dock.dockMove(foundTab, null, "front");
  //  } else {
  //    let foundTab: TabData | null = null;
  //    let foundHighestTabIndex = -1;
  //
  //    // Walk all possible code tabs
  //    for (const id of Object.keys(compiledLayerRoot.idToLayer)) {
  //      const found = dock.find(id) as TabData | null;
  //
  //      if (found && found.parent) {
  //        const tabIndex = found.parent.tabs.indexOf(found);
  //        if (tabIndex > foundHighestTabIndex) {
  //          foundTab = found;
  //          foundHighestTabIndex = tabIndex;
  //        }
  //      }
  //    }
  //
  //    const newTab = {id} as TabData;
  //
  //    if (foundTab) {
  //      dock.dockMove(newTab, foundTab, "after-tab");
  //    } else {
  //      const canvas = dock.find(TAB_ID_CANVAS);
  //      if (canvas && canvas.parent) {
  //        dock.dockMove(newTab, canvas.parent, "bottom");
  //      } else {
  //        dock.dockMove(newTab, TAB_ID_CANVAS, "bottom");
  //      }
  //    }
  //  }
  //};

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

        // TODO(trevor): Get the context of whatever window we dropped it over and activate it before calling doImport
        for (const file of files) {
          await Meta.instance.importFile(file, true);
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
                await Meta.instance.importFile(file, false);
              }
            }
          },
          {
            name: "Import",
            onClick: async () => {
              const file = await openFile(fileTypeAccept);
              if (file) {
                await Meta.instance.importFile(file, true);
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
      },
      {
        name: "View",
        menuElements: [
          {
            name: "Editor Layout",
            menuElements: [
              {
                name: "Reset to Desktop Layout",
                onClick: () => {
                  setLayout(cloneObject(desktopLayout));
                }
              },
              {
                name: "Reset to Mobile Layout",
                onClick: () => {
                  setLayout(cloneObject(mobileLayout));
                }
              },
            ]
          }
        ]
      }
    ]} />
    <DockLayout
      ref={dockLayout}
      onLayoutChange={(newLayout) => {
        setLayout(newLayout);
        console.log(newLayout);
      }}
      loadTab={(tab) => {
        console.log("LOAD TAB", tab.id);
        if (!tab.id) {
          throw new Error("Empty tab id");
        }

        if (tab.id === TAB_ID_WORKAREA) {
          return {
            id: tab.id,
            title: "Test",
            content: <></>
          };
        }

        if (tab.id === TAB_ID_LAYERS) {
          return {
            id: tab.id,
            title: "Layers",
            content: <></>
          };
        }

        if (tab.id === TAB_ID_PROPERTIES) {
          return {
            id: tab.id,
            title: "Properties",
            content: <Box width="100%" height="100%" sx={{ overflowX: "hidden", overflowY: "auto" }} mb={1}>
            </Box>
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
