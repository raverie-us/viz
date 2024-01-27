import Paper from "@mui/material/Paper";
import React from "react";
import {resizeImageFileIfNeededAsDataUrl} from "./imageResizer";
import {spinner} from "./spinner";
import {useStyles} from "./style";
import {TooltipIconButton} from "./tooltipIconButton";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import DeleteIcon from "@mui/icons-material/Delete";
import {mimeTypeFromDataUrl, fileToDataUrl} from "./utility";
import {encodeVideo} from "./videoEncode";
import {SxProps, Theme} from "@mui/material/styles";
import useTheme from "@mui/styles/useTheme";

const DEFAULT_SIZE_PIXELS = 128;

export interface MediaChooserBulkProps {
  id?: string;
  type: "image" | "video" | "media";
  width?: number;
  height?: number;
  reencode?: boolean;
  maxImageBytes?: number;
  sx?: SxProps<Theme>;
}

export interface MediaChooserProps extends MediaChooserBulkProps {
  multiple?: boolean;
  dataUrl: string | null;
  onMediasChosen: (dataUrls: string[]) => void;
}

export const MediaChooser = React.forwardRef<HTMLDivElement, MediaChooserProps>((props, ref) => {
  const width = props.width === undefined ? DEFAULT_SIZE_PIXELS : props.width;
  const height = props.height === undefined ? DEFAULT_SIZE_PIXELS : props.height;

  const fileInput = React.useRef<HTMLInputElement>(null);
  const theme = useTheme();

  const acceptMimeType = (() => {
    switch (props.type) {
      case "image":
        return "image/*";
      case "video":
        return "video/*";
      case "media":
        return "image/*, video/*";
    }
    throw new Error("Unexpected type");
  })();

  const detectedType = (() => {
    if (props.type === "media") {
      // If we cannot detect the type, for now we always assume it's an image
      if (!props.dataUrl) {
        return "image";
      }

      // This breaks down if the url is not a data url (will return "")
      const mimeType = mimeTypeFromDataUrl(props.dataUrl);
      if (mimeType.startsWith("video/")) {
        return "video";
      }
      if (mimeType.startsWith("image/")) {
        return "image";
      }
      return "image";
    }
    return props.type;
  })();

  const mediaStyle: React.CSSProperties = {
    pointerEvents: "none",
    width: "100%",
    height: "100%",
    position: "absolute",
    left: 0,
    top: 0,
    objectFit: "cover",
    transform: "scale3d(1.01, 1.01, 2)"
  };

  return <Paper
    variant="outlined"
    sx={{
      position: "relative",
      overflow: "hidden",
      "&:hover #mediaChooserIcon": {
        transition: "opacity 300ms",
        opacity: 1
      },
      ...(props.sx || {})
    }}
    style={{width, minWidth: width, maxWidth: width, height, minHeight: height, maxHeight: height}}
    ref={ref}
    component="div">
    <input
      id={props.id}
      title=" "
      ref={fileInput}
      multiple={props.multiple}
      accept={acceptMimeType}
      style={{
        width,
        minWidth: width,
        maxWidth: width,
        height,
        minHeight: height,
        maxHeight: height,
        position: "absolute",
        top: 0,
        left: 0,
        opacity: 0,
        cursor: "pointer"
      }}
      type="file"
      onChange={async (e) => {
        if (e.target.files && e.target.files.length > 0) {
          spinner.show();
          try {
            const dataUrls: string[] = [];
            const count = e.target.files.length;
            for (let i = 0; i < count; ++i) {
              spinner.setText(`Processing ${props.type} ${i}/${count}`);
              const file = e.target.files.item(i)!;
              if (props.reencode) {
                if (file.type.startsWith("video/")) {
                  const buffer = await encodeVideo(file);
                  dataUrls.push(await fileToDataUrl(new Blob([buffer], {type: "video/mp4"})));
                } else {
                  dataUrls.push(await resizeImageFileIfNeededAsDataUrl(file, props.maxImageBytes || Number.MAX_SAFE_INTEGER));
                }
              } else {
                dataUrls.push(await fileToDataUrl(file));
              }
            }
            props.onMediasChosen(dataUrls);
          } finally {
            spinner.hide();
            e.target.value = "";
          }
        }
      }}
    />
    {props.dataUrl === null
      ? <TooltipIconButton
        tooltip={`Add ${props.type}`}
        tooltipPlacement="bottom"
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)"
        }}
        onClick={() => {
          fileInput.current?.click();
        }}>
        {
          props.type === "image" || props.type === "media"
            ? <AddPhotoAlternateIcon />
            : <VideoLibraryIcon />
        }
      </TooltipIconButton>
      : <>
        {
          detectedType === "video"
            ? <video src={props.dataUrl} style={mediaStyle}
              muted autoPlay playsInline loop/>
            : <img src={props.dataUrl} style={mediaStyle}
              alt="Choose Image"/>
        }
        <TooltipIconButton
          tooltip={`Delete ${props.type}`}
          tooltipPlacement="bottom"
          id="mediaChooserIcon"
          sx={{
            transition: "opacity 300ms",
            opacity: 0,
            backgroundColor: `${theme.palette.background.paper} !important`,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }}
          onClick={() => {
            props.onMediasChosen([]);
          }}>
          <DeleteIcon />
        </TooltipIconButton>
      </>
    }
  </Paper>;
});
