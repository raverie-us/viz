import React from "react";
import { Meta, MetaContext, MetaSelection } from "./meta";
import { PropertyGrid } from "./propertyGrid";
import Box from "@mui/material/Box";
import {useRefresh} from "./useRefresh";

export const PropertiesView: React.FC = () => {
  const refresh = useRefresh();

  React.useEffect(() => {
    Meta.instance.addEventListener(Meta.VALUES_CHANGED, refresh);
    Meta.instance.addEventListener(Meta.STRUCTURE_CHANGED, refresh);
    Meta.instance.addEventListener(Meta.SELECTION_CHANGED, refresh);
    return () => {
      Meta.instance.removeEventListener(Meta.VALUES_CHANGED, refresh);
      Meta.instance.removeEventListener(Meta.STRUCTURE_CHANGED, refresh);
      Meta.instance.removeEventListener(Meta.SELECTION_CHANGED, refresh);
    };
  }, []);

  if (!Meta.instance.selection) {
    return null;
  }

  return <Box width="100%" height="100%" sx={{ overflowX: "hidden", overflowY: "auto" }} mb={1}>
    <PropertyGrid properties={Meta.instance.selection.type.properties} onChanged={() => {
      Meta.instance.context?.valuesChanged();
    }} />
  </Box>
};
