export interface MenuElement {
  name: string;
  menuElements?: MenuElement[];
  onClick?: () => void;
};
