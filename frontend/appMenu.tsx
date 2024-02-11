import React from "react";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import {SxProps, Theme, useTheme} from "@mui/material/styles";
import {useDebounce} from "@react-hook/debounce";
import { MenuElement } from "./menuElement";
import { PopMenu } from "./popMenu";

export interface AppMenuProps {
  menuElements: MenuElement[];
  sx?: SxProps<Theme>;
}

interface AppMenuRootProps extends React.DOMAttributes<HTMLLIElement> {
  open: boolean;
  menu: MenuElement;
  onClose: () => void;
}

const AppMenuRoot: React.FC<AppMenuRootProps> = ({open, menu, onClose, ...menuItemProps}) => {
  const ref = React.useRef<HTMLLIElement>(null);

  return <>
    <MenuItem ref={ref} onClick={menu.onClick} {...menuItemProps}>{menu.name}</MenuItem>
    {menu.menuElements && <PopMenu
      anchorEl={ref.current}
      horizontalDir="right"
      verticalDir="down"
      onClose={onClose}
      open={open}
      menuElements={menu.menuElements}
    />}
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
  const menus = props.menuElements.map((menu, index) =>
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
