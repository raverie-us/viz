import React from "react";
import { Meta, MetaContext, MetaSelection } from "./meta";
import { PropertyGrid } from "./propertyGrid";
import Box from "@mui/material/Box";
import {useRefresh} from "./useRefresh";

export const PropertiesView: React.FC = () => {
  const [selection, setSelection] = React.useState<MetaSelection | null>(null);
  const refresh = useRefresh();

  React.useEffect(() => {
    const onValuesChanged = (() => {
      refresh();
    });
    const onSelectionChanged = (() => {
      setSelection(Meta.instance.selection);
    });

    Meta.instance.addEventListener(Meta.VALUES_CHANGED, onValuesChanged);
    Meta.instance.addEventListener(Meta.SELECTION_CHANGED, onSelectionChanged);
    return () => {
      Meta.instance.removeEventListener(Meta.VALUES_CHANGED, onValuesChanged);
      Meta.instance.removeEventListener(Meta.SELECTION_CHANGED, onSelectionChanged);
    };
  }, []);

  if (!selection) {
    return null;
  }

  return <Box width="100%" height="100%" sx={{ overflowX: "hidden", overflowY: "auto" }} mb={1}>
    <PropertyGrid properties={selection.type.properties} onChanged={() => {
      Meta.instance.context?.valuesChanged();
    }} />
  </Box>
};
