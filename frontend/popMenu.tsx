import React from "react";
import { MenuElement } from "./menuElement";
import MenuItem from "@mui/material/MenuItem";
import Popper, { PopperPlacementType } from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import { useDebounce } from "@react-hook/debounce";
import { once } from "./utility";
import { capCase } from "./textTransforms";
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export interface PopSubMenuProps {
  anchorEl: HTMLElement | null;
  menuElements: MenuElement[];
  onClose: () => void;
  horizontalDir: "left" | "right";
  verticalDir: "up" | "down";
}

export interface PopMenuProps extends PopSubMenuProps {
  open: boolean;
}

interface PopMenuItemProps {
  menuElement: MenuElement;
  onAttemptOpen: () => void;
  onClose: () => void;
  open: boolean;
  horizontalDir: "left" | "right";
  verticalDir: "up" | "down";
}

const PopMenuItem: React.FC<PopMenuItemProps> =
({menuElement, onAttemptOpen, onClose, open, horizontalDir, verticalDir}) => {
  const ref = React.useRef<HTMLElement>(null);
  const [pointerOver, setPointerOver] = useDebounce(false, 200);

  React.useEffect(() => {
    if (pointerOver && menuElement.menuElements) {
      onAttemptOpen();
    }
  }, [pointerOver]);

  const icon = (() => {
    if (!menuElement.menuElements) {
      return null;
    }

    return horizontalDir === "left"
      ? <ChevronLeftIcon/>
      : <ChevronRightIcon/>
  })();

  return <Box position="relative" pl={1} pr={1}>
    <Box position="absolute" top="100%" pl={0.5} pr={0.5} sx={{
        [horizontalDir]: "0",
        transform: "translateY(-100%)",
        opacity: 0.3
      }}>
      {icon}
    </Box>
    <Box ref={ref} position="absolute" top="50%" sx={{[horizontalDir]: "0"}}/>
    <MenuItem
      onPointerDown={() => {
        if (menuElement.menuElements) {
          onAttemptOpen();
        }
        if (menuElement.onClick) {
          menuElement.onClick();
          onClose();
        }
      }}
      onPointerEnter={() => {
        setPointerOver(true);
      }}
      onPointerLeave={() => {
        setPointerOver(false);
      }}>
        {open && menuElement.menuElements && <PopSubMenu
          anchorEl={ref.current}
          menuElements={menuElement.menuElements}
          onClose={onClose}
          horizontalDir={horizontalDir}
          verticalDir={verticalDir}
        />}
        {capCase(menuElement.name)}
      </MenuItem>
    </Box>;
}

enum FocusState {
  WaitingForFirstFocus,
  Focused,
  LostFocus
}

const PopSubMenu: React.FC<PopSubMenuProps> =
({anchorEl, menuElements, onClose, horizontalDir, verticalDir, ...menuProps}) => {
  const [subMenuOpenIndex, setSubMenuOpenIndex] = React.useState(-1);
  const [firstAutoFocus, setFirstAutoFocus] = React.useState(false);
  const [focusState, setFocusState] = useDebounce(FocusState.WaitingForFirstFocus, 10);

  // For some reason, when we click a root menu item if the app bar already has focus it temporarily
  // loses it and gains it back almost immediately (not sure what in MUI is stealing focus)
  // We 'useDebounce' to ignore the rapid lose/gain so we can reliably close on blur.
  React.useEffect(() => {
    if (focusState === FocusState.LostFocus) {
      onClose();
    }
  }, [focusState]);

  if (!anchorEl) {
    return null;
  }

  const placement: PopperPlacementType = (() => {
    if (horizontalDir === "left") {
      if (verticalDir === "up") {
        return "top-end";
      } else {
        return "bottom-end";
      }
    } else {
      if (verticalDir === "up") {
        return "top-start";
      } else {
        return "bottom-start";
      }
    }
  })();

  return <Popper
    open={true}
    anchorEl={anchorEl}
    placement={placement}
    // Above tooltips
    sx={{zIndex: 1600}}
  >
    <Paper
      tabIndex={0}
      autoFocus
      ref={(e) => {
        if (!firstAutoFocus) {
          setFirstAutoFocus(true);
          e?.focus();
        }
      }}
      sx={{
        maxHeight: "35vh",
        overflowX: "hidden",
        overflowY: "auto"
      }}
      onBlur={() => {
        if (focusState === FocusState.Focused) {
          setFocusState(FocusState.LostFocus);
        }
      }}
      onFocus={() => {
        setFocusState(FocusState.Focused);
      }}>
      {menuElements.map((menuElement, index) => <PopMenuItem
        key={index}
        menuElement={menuElement}
        onAttemptOpen={() => {
          setSubMenuOpenIndex(index);
        }}
        onClose={onClose}
        open={subMenuOpenIndex === index}
        horizontalDir={horizontalDir}
        verticalDir={verticalDir}
      />)}
    </Paper>
  </Popper>;
}

export const PopMenu: React.FC<PopMenuProps> = (props) => {
  if (!props.anchorEl || !props.open) {
    return null;
  }
  return <PopSubMenu {...props} onClose={once(props.onClose)} />;
}
