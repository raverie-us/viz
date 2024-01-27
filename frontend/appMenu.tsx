import React from "react";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import {SxProps, Theme, useTheme} from "@mui/material/styles";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import {useDebounce} from "@react-hook/debounce";

export interface AppMenuOption {
  name: string;
  onClick?: () => void;
  children?: AppMenuOption[];
}

export interface AppMenuProps {
  menus: AppMenuOption[];
  sx?: SxProps<Theme>;
}

interface AppMenuRootProps extends React.DOMAttributes<HTMLLIElement> {
  open: boolean;
  menu: AppMenuOption;
  onClose: () => void;
}

const AppMenuRoot: React.FC<AppMenuRootProps> = (props) => {
  const {open, menu, onClose, ...menuItemProps} = props;
  const ref = React.useRef<HTMLLIElement>(null);

  return <>
    <MenuItem ref={ref} onClick={menu.onClick} {...menuItemProps}>{menu.name}</MenuItem>
    <Popper
      anchorEl={ref.current}
      placement="bottom-start"
      open={open}
    >
      <Paper>
        {
          menu.children?.map((child, index) =>
            <MenuItem key={index} onClick={() => {
              if (child.onClick) {
                child.onClick();
                onClose();
              }
            }}>
              <Box pl={2} pr={2}>
                {child.name}
              </Box>
            </MenuItem>)
        }
      </Paper>
    </Popper>
  </>;
};

export const AppMenu: React.FC<AppMenuProps> = (props) => {
  const [openIndex, setOpenIndex] = React.useState(-1);
  const [hasFocus, setHasFocus] = useDebounce(false, 10);

  const close = () => {
    setOpenIndex(-1);
  };

  // For some reason, when we click a root menu item if the app bar already has focus it temporarily
  // loses it and gains it back almost immediately (not sure what in MUI is stealing focus)
  // We 'useDebounce' to ignore the rapid lose/gain so we can reliably close on blur.
  React.useEffect(() => {
    if (!hasFocus) {
      close();
    }
  }, [hasFocus]);

  const theme = useTheme();
  const menus = props.menus.map((menu, index) =>
    <AppMenuRoot
      key={index}
      menu={menu}
      open={openIndex === index}
      onClose={() => {
        close();
      }}
      onPointerDown={() => {
        if (openIndex === -1) {
          setOpenIndex(index);
        } else {
          close();
        }
      }}
      onPointerOver={() => {
        if (openIndex !== -1) {
          setOpenIndex(index);
        }
      }}/>);

  return <Box
    display="flex"
    sx={{
      backgroundColor: theme.palette.background.paper,
      ...(props.sx || {})
    }}
    onBlur={() => {
      setHasFocus(false);
    }}
    onFocus={() => {
      setHasFocus(true);
    }}>
    {menus}
  </Box>;
};
