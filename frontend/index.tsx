import {theme} from "./style";
import CssBaseline from "@mui/material/CssBaseline";
import {ModalContainer} from "./modal";
import React from "react";
import ReactDOM from "react-dom";
import {ThemeProvider} from "@mui/material/styles";
import {TypedEvent} from "./utility";
import {EVENT_SPINNER_CHANGED, SpinnerInfo} from "./spinner";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {Toasts} from "./toasts";
import {DndProvider} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import {VisualizerScreen} from "./visualizerScreen";
import "./reactTransform.css";

const App: React.FC = () => {
  const [spinnerVisible, setSpinnerVisible] = React.useState(false);
  const [spinnerText, setSpinnerText] = React.useState("");

  //const isDroppable = (mimeType: string) => supportedImageTypes.includes(mimeType);

  React.useEffect(() => {
    //const onDrop = (event: DragEvent) => {
    //  if (!event.dataTransfer) {
    //    return;
    //  }
    //  const files = [...event.dataTransfer.files].
    //    filter((file) => isDroppable(file.type) && file.size !== 0).
    //    sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: "base"}));
    //  if (files.length !== 0) {
    //    window.dispatchEvent(new TypedEvent<File[]>(EVENT_FILE_DROP, files));
    //    event.preventDefault();
    //  }
    //};
    //window.addEventListener("drop", onDrop, true);
    //const onDragOver = (event: DragEvent) => {
    //  if (!event.dataTransfer) {
    //    return;
    //  }
    //  event.preventDefault();
    //  const item = event.dataTransfer.items[0];
    //  if (item) {
    //    if (item.kind !== "file" || !isDroppable(item.type)) {
    //      event.dataTransfer.dropEffect = "none";
    //    }
    //  }
    //};
    //window.addEventListener("dragover", onDragOver, true);

    const onSpinnerChanged = (e: Event) => {
      const event = e as TypedEvent<SpinnerInfo>;
      setSpinnerVisible(event.value.visible);
      setSpinnerText(event.value.text);
    };
    window.addEventListener(EVENT_SPINNER_CHANGED, onSpinnerChanged);
    return () => {
      window.removeEventListener(EVENT_SPINNER_CHANGED, onSpinnerChanged);
      //window.removeEventListener("drop", onDrop, true);
      //window.removeEventListener("dragover", onDragOver, true);
    };
  }, []);

  return <ThemeProvider theme={theme}>
  <DndProvider backend={HTML5Backend}>
    <CssBaseline />
    <ModalContainer/>
    {spinnerVisible
      ? <Box sx={{
        animation: "$fadeInOpacity 250ms ease-in",
        width: "100%",
        height: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        background: "rgba(60,60,60, 0.5)",
  
        // Above moveables at 1000, below modals at 1300
        zIndex: 1200,
        display: "flex",
        flexDirection: "column",
        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden"
      }}>
        <Box sx={{
          animation: "$fadeInOpacity 450ms ease-in"
          }}>
          <Box display="flex" justifyContent="center">
            <img src={require("./public/loading.gif").default} alt="Loading"/>
          </Box>
          <Typography variant="h5" noWrap textAlign="center" mt={1} sx={{textShadow: "0 0 10px black;"}}>
            {spinnerText}
          </Typography>
        </Box>
      </Box>
      : null
    }
    <Toasts/>
    <VisualizerScreen/>
    </DndProvider>
  </ThemeProvider>;
};

ReactDOM.render(<App/>, document.getElementById("root"));
