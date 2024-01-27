import Paper from "@mui/material/Paper";
import {CurveWithInput} from "../core/core";
import React from "react";

export interface CurveEditorProps {
  curve: CurveWithInput;
}

export const CurveEditor: React.FC<CurveEditorProps> = () => <Paper>
  Curve Editor
</Paper>;
