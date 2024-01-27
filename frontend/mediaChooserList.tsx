import React from "react";
import Grid from "@mui/material/Grid";
import {MediaChooser, MediaChooserBulkProps, MediaChooserProps} from "./mediaChooser";
import {useDrag, useDrop} from "react-dnd";

export interface MediaChooserListProps extends MediaChooserBulkProps {
  urls: string[];
  onMediasChosen: (urls: string[]) => void;
}

interface MediaChooserDraggableProps extends MediaChooserProps {
  urls: string[];
  onMediasArranged: (dataUrls: string[]) => void;
}

type DropDirection = "before" | "after";

interface DragMedia {
  url: string | null;
}

export const MediaChooserDraggable: React.FC<MediaChooserDraggableProps> =
({urls, onMediasArranged, dataUrl, onMediasChosen, ...mediaChooserProps}) => {
  const [dropDirection, setDropDirection] = React.useState<DropDirection>("before");
  const ref = React.useRef<HTMLDivElement>(null);
  const [{opacity}, dragRef] = useDrag(() => ({
    type: "media",
    canDrag: dataUrl !== null,
    item: {url: dataUrl},
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.5 : 1
    })
  }), [dataUrl]);
  dragRef(ref);

  const [{isOver}, dropRef] = useDrop(() => ({
    accept: "media",
    drop: (item: DragMedia, monitor) => {
      if (monitor.isOver({shallow: true})) {
        const target = dataUrl;
        const sourceToBeMoved = item;

        // We can't move the empty media selector
        if (!sourceToBeMoved.url) {
          return;
        }

        // Don't allow moving over itself
        if (target === sourceToBeMoved.url) {
          return;
        }

        const newUrls = [...urls];
        const sourceIndex = newUrls.indexOf(sourceToBeMoved.url);
        if (sourceIndex === -1) {
          throw new Error("Cannot find source drag media");
        }
        // Remove the source since we're moving it
        newUrls.splice(sourceIndex, 1);

        if (target) {
          const targetIndex = newUrls.indexOf(target);
          if (targetIndex === -1) {
            throw new Error("Cannot find target drop media");
          }
          const insertIndex = targetIndex + (dropDirection === "before" ? 0 : 1);

          // Insert the layer either above or below the target
          newUrls.splice(insertIndex, 0, sourceToBeMoved.url);
        } else {
          // Otherwise, we're inserting at the end
          newUrls.push(sourceToBeMoved.url);
        }
        onMediasArranged(newUrls);
      }
    },
    hover: (item, monitor) => {
      // We use first element because the ref is an `li` which contains all its children, but we
      // only want to measure the element itself so we grab the first child div (tree element content)
      const boundingRect = ref.current!.firstElementChild!.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset()!;
      const hoverClientX = clientOffset.x - boundingRect.left;
      const width = boundingRect.width;

      const hoverMiddleX = width * (1 / 2);

      // If we're dropping onto the last empty upload image, then we always insert before
      setDropDirection(hoverClientX < hoverMiddleX || dataUrl === null
        ? "before"
        : "after");
    },
    collect: (monitor) => ({
      isOver: monitor.getItem() && monitor.getItem().url !== dataUrl && monitor.isOver({shallow: true})
    })
  }), [dropDirection, dataUrl, ref.current]);
  dropRef(ref);

  let boxShadow = undefined;
  if (isOver) {
    const boxShadowCss = "6px 0px 6px -3px rgba(0,0,0, 0.75)";
    boxShadow = dropDirection === "before" ? `-${boxShadowCss}` : boxShadowCss;
  }

  return <MediaChooser
    {...mediaChooserProps}
    ref={ref}
    sx={{
      opacity,
      boxShadow
    }}
    multiple
    dataUrl={dataUrl}
    onMediasChosen={onMediasChosen} />;
};

export const MediaChooserList: React.FC<MediaChooserListProps> = ({urls, onMediasChosen, ...mediaChooserProps}) =>
  <Grid container spacing={2}>
    {
      [...urls, null].map((dataUrl, index) => <Grid key={index} item>
        <MediaChooserDraggable
          {...mediaChooserProps}
          urls={urls}
          multiple
          dataUrl={dataUrl}
          onMediasChosen={(newDataUrls) => {
            const newUrls = [...urls];
            newUrls.splice(index, 1, ...newDataUrls);
            onMediasChosen(newUrls);
          }}
          onMediasArranged={onMediasChosen}/>
      </Grid>)
    }
  </Grid>;
