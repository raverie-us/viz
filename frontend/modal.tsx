import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import {TooltipIconButton} from "./tooltipIconButton";
import React from "react";
import Typography from "@mui/material/Typography";
import {useStyles} from "./style";
import {Deferred} from "./utility";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";

export const MODALS_CHANGED = "modalsChanged";

export type ModalCallback = (button: ModalButton) => unknown;

export interface ModalButton {
  name: string;

  dismiss?: boolean;

  callback?: ModalCallback;

  submitOnEnter?: boolean;
}

export type RenderCallback = () => React.ReactNode;

export interface ModalOpenParameters {
  title?: string;
  titleImageUrl?: string;
  dismissable?: boolean;
  fullscreen?: boolean;
  buttons?: ModalButton[];
  render?: RenderCallback;
  onShown?: () => unknown;
}

export interface ModalProps extends ModalOpenParameters {
  id: number;
  defer: Deferred<ModalButton | undefined>;
}

export const allModals: ModalProps[] = [];
let modalIdCounter = 0;

const removeModalInternal = (id: number, resolveWithButton?: ModalButton) => {
  const index = allModals.findIndex((modal) => modal.id === id);
  if (index !== -1) {
    allModals[index].defer.resolve(resolveWithButton);
    allModals.splice(index, 1);
    window.dispatchEvent(new Event(MODALS_CHANGED));
  }
};

export const ModalComponent: React.FC<ModalProps> = (props) => {
  const theme = useTheme();
  const hasSubmitButton = Boolean(props.buttons && props.buttons.find((button) => button.submitOnEnter));
  const content = <div>
    <DialogContent>
      { props.children }
      <div ref={() => {
        if (props.onShown) {
          props.onShown();
        }
      }}>
        {props.render ? props.render() : null}
        <Box sx={{
          float: "right",
          marginTop: theme.spacing(2)
        }}>
          {
            (props.buttons || []).map((button) => <Button
              key={button.name}
              id={`button-${button.name}`}
              variant="contained"
              sx={{
                marginLeft: `${theme.spacing(1)} !important`
              }}
              onClick={() => {
                if (props.defer) {
                  props.defer.resolve(button);
                }
                if (button.callback) {
                  button.callback(button);
                }
                // Delay by one frame to avoid the <form> not attached warning.
                setTimeout(() => {
                  removeModalInternal(props.id);
                });
              }}
              color="primary"
              type={button.submitOnEnter ? "submit" : "button"}>
              {button.name}
            </Button>)
          }
        </Box>
      </div>
    </DialogContent>
  </div>;

  return <Dialog
    open={true}
    fullWidth={true}
    disableEscapeKeyDown={!props.dismissable}
    onClose={(event, reason) => {
      if (reason !== "backdropClick" || props.dismissable) {
        removeModalInternal(props.id);
      }
    }}
    fullScreen={props.fullscreen}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
  >
    <DialogTitle id="alert-dialog-title" style={{paddingBottom: 0}}>
      {props.title}
      {props.titleImageUrl
        ? <img height={48} src={props.titleImageUrl} alt={props.title}/>
        : null}
      {
        props.dismissable
          ? <TooltipIconButton
            tooltip="Close"
            tooltipPlacement="right"
            aria-label="close"
            sx={{
              position: "absolute",
              right: "0px",
              marginRight: `${theme.spacing(2)} !important`,
              float: "right",
              color: theme.palette.grey[500]
            }}
            onClick={() => removeModalInternal(props.id)}>
            <CloseIcon />
          </TooltipIconButton>
          : null
      }
    </DialogTitle>
    {
      hasSubmitButton
        ? <form onSubmit={(e) => e.preventDefault()}>{content}</form>
        : content
    }
  </Dialog>;
};

export const ModalContainer: React.FC = () => {
  const [
    modals,
    setModals
  ] = React.useState<ModalProps[]>(allModals);
  React.useEffect(() => {
    const onPopState = () => {
      for (const modal of [...allModals]) {
        if (modal.dismissable) {
          removeModalInternal(modal.id);
        }
      }
      window.dispatchEvent(new Event(MODALS_CHANGED));
    };

    const onModalsChanged = () => {
      setModals([...allModals]);
    };
    window.addEventListener(MODALS_CHANGED, onModalsChanged);
    return () => {
      window.removeEventListener(MODALS_CHANGED, onModalsChanged);
      removeEventListener("popstate", onPopState);
    };
  }, []);
  return <div>{modals.map((modal) => <ModalComponent key={modal.id} {...modal}/>)}</div>;
};

export class Modal {
  private id = modalIdCounter++;

  public async open (params: ModalOpenParameters): Promise<ModalButton | undefined> {
    const defer = new Deferred<ModalButton | undefined>();
    allModals.push({
      ...params,
      defer,
      id: this.id
    });
    window.dispatchEvent(new Event(MODALS_CHANGED));
    return defer;
  }

  public hide (resolveWithButton?: ModalButton) {
    removeModalInternal(this.id, resolveWithButton);
  }

  public static async messageBox (title: string, text: string): Promise<ModalButton | undefined> {
    const modal = new Modal();
    return modal.open({
      buttons: [
        {
          dismiss: true,
          name: "Close"
        }
      ],
      render: () => <Typography>{text}</Typography>,
      dismissable: true,
      title
    });
  }

  public static async confirm (title: string, textOrRender: string | RenderCallback): Promise<boolean> {
    const modal = new Modal();
    const result = await modal.open({
      buttons: [
        {
          dismiss: true,
          name: "Cancel"
        },
        {
          name: "Ok"
        }
      ],
      render: typeof textOrRender === "function"
        ? textOrRender
        : () => <Typography>{textOrRender}</Typography>,
      dismissable: true,
      title
    });
    return result ? result.name === "Ok" : false;
  }
}