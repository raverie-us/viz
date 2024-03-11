import React from "react";
import { Meta } from "./meta";

export const ObjectsView: React.FC = () => {
  const [objectsView, setObjectsView] = React.useState<React.ReactElement | null>(null);

  React.useEffect(() => {
    const onContextChanged = (() => {
      setObjectsView(Meta.instance.context?.objectsView || null);
    });

    Meta.instance.addEventListener(Meta.CONTEXT_CHANGED, onContextChanged);
    return () => {
      Meta.instance.removeEventListener(Meta.CONTEXT_CHANGED, onContextChanged);
    };
  }, []);

  return objectsView;
};
