import {Theme, alpha, createTheme, getContrastRatio} from "@mui/material/styles";
import {makeStyles, createStyles} from "@mui/styles";

declare module '@mui/styles/defaultTheme' {
  interface DefaultTheme extends Theme {}
}

export const useStyles = makeStyles((theme: Theme) => {
  return createStyles({
    visualizerGroupTreeItem: {
      width: "33px !important",
      alignItems: "center"
    },
    visualizerShaderLayerTreeItem: {
      width: "0px",
      margin: "0px"
    },
    focusOutline: {
      "&:focus": {
        outline: "1px solid white",
        outlineOffset: "2px"
      }
    }
  });
}, {index: 1});

export const theme = createTheme({
  components: {
    MuiTextField: {
      defaultProps: {
        variant: "standard"
      }
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          paddingTop: "2px",
          paddingBottom: "2px"
        }
      }
    },
    MuiPopper: {
      defaultProps: {
        className: "viz"
      }
    },
    MuiDialog: {
      defaultProps: {
        className: "viz"
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          maxHeight: "35vh !important"
        }
      }
    }
  },
  palette: {
    mode: "dark"
  }
});
