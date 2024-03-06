import React from "react";
import Box from "@mui/material/Box";
import { LayoutBase, DockLayout, TabData, PanelData } from "rc-dock";
import "./visualizerDockPanelTheme.less";
import { AppMenu } from "./appMenu";
import { openFile, saveFile, cloneObject, pass } from "./utility";
import { setHasUnsavedChanges } from "./unload";
import { Meta } from "./meta";

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
      : desktopLayout));


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

  const doImport = async (file: File) => {
    // Need to handle file import
    // Should be along the lines of:
    //  - First, did you drop it over a specific window, if so get the context and let the context handle it
    //  - If not, then let the current context handle it
    //  - If the context does not handle it, invoke a generic file import (may open a new context)
  };

  const doSave = async () => {
    // Ask the current context
  };

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

        for (const file of files) {
          await doImport(file);
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
                await doImport(file);
              }
            }
          },
          {
            name: "Save",
            onClick: async () => {
              await doSave();
              setHasUnsavedChanges(false);
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

        return (Meta.instance.context?.onLoadTab(tab.id) || null) as any as TabData;
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
