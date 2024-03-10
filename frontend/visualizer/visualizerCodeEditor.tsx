import {CompiledLayerCode} from "../../core/core";
import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import {cpp} from "@codemirror/lang-cpp";
import {linter} from "@codemirror/lint";
import debounce from "debounce";
import Box from "@mui/material/Box";
import useSize from "@react-hook/size";
import {darcula} from "@uiw/codemirror-theme-darcula";
import "./visualizerCodeEditor.less";

interface VisualizerCodeEditorProps {
  compiledLayerCode: CompiledLayerCode;
  onChanged: () => void;
}

export const VisualizerCodeEditor: React.FC<VisualizerCodeEditorProps> = (props) => {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [, height] = useSize(boxRef);

  const layer = props.compiledLayerCode.layer;
  const onCodeChanged = React.useCallback(debounce<(value: string, viewUpdate: any) => void>((value) => {
    layer.code = value;
    props.onChanged();
  }, 100), [layer, props.onChanged]);

  const errorLinter = linter((view) => (props.compiledLayerCode.errors || []).map((error) => {
    const lineNumber = error.line > view.state.doc.lines || error.line < 1 ? 1 : error.line;
    const line = view.state.doc.line(lineNumber);
    const text = line.text;
    let startOffset = text.length - text.trimStart().length;
    let endOffset = text.length - text.trimEnd().length;
    if (text.trim().length === 0) {
      startOffset = 0;
      endOffset = 0;
    }
    return {
      from: line.from + startOffset,
      to: line.to - endOffset,
      message: error.text,
      severity: "error"
    };
  }), {delay: 500});

  return <Box height="100%" ref={boxRef}>
    <CodeMirror
      key={layer.id}
      height={`${height}px`}
      value={layer.code}
      extensions={[errorLinter, cpp()]}
      theme={darcula}
      basicSetup={{
        foldGutter: false
      }}
      onChange={onCodeChanged}/>
  </Box>;
};
