import Snackbar from "@mui/material/Snackbar";
import SnackbarContent from "@mui/material/SnackbarContent";
import Grow from "@mui/material/Grow";
import React from "react";
import {TypedEvent} from "./utility";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";

const EVENT_SHOW_TOAST = "showToast";

const TOAST_IMAGE_WIDTH = 64;

export interface ToastInfo {
  message: React.ReactNode;
  type: ToastType;
}

export enum ToastType {
  Custom = "custom",
  Success = "success",
  Info = "info",
  Warning = "warning",
  Error = "error",
}

export const showToast = (message: React.ReactNode, imageSrc?: string | null, type?: ToastType) => {
  if (imageSrc) {
    showToast(
      <Box pr={`${TOAST_IMAGE_WIDTH}px`}>
        {message}
        <img
          style={{
            width: TOAST_IMAGE_WIDTH,
            objectFit: "cover",
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)"
          }}
          src={imageSrc}
          alt={typeof message === "string" ? message : "Toast Image"}
        />
      </Box>
    );
    return;
  }

  window.dispatchEvent(new TypedEvent<ToastInfo>(EVENT_SHOW_TOAST, {
    message,
    type: type || ToastType.Custom
  }));
};

export const Toasts: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [message, setMessage] = React.useState<React.ReactNode>("");
  const [type, setType] = React.useState<ToastType>(ToastType.Custom);
  const [counter, setCounter] = React.useState(0);

  React.useEffect(() => {
    const onToast = (e: Event) => {
      const event = e as TypedEvent<ToastInfo>;
      setIsOpen(true);
      setMessage(event.value.message);
      setType(event.value.type);
      setCounter(counter + 1);
    };

    window.addEventListener(EVENT_SHOW_TOAST, onToast);
    return () => window.removeEventListener(EVENT_SHOW_TOAST, onToast);
  }, [counter]);

  return <Snackbar
    key={counter}
    anchorOrigin={{horizontal: "right", vertical: "bottom"}}
    TransitionComponent={Grow}
    open={isOpen}
    autoHideDuration={4000}
    onClose={() => {
      setIsOpen(false);
    }}
  >
    {
      type === ToastType.Custom
        ? <SnackbarContent message={message} sx={{
          overflow: "hidden",
          position: "relative",
          backgroundColor: "primary.main",
          color: "white" // TODO(trevor): Why doesn't contrast text work?
        }}/>
        : <Alert severity={type}>{message}</Alert>
    }
  </Snackbar>;
};
