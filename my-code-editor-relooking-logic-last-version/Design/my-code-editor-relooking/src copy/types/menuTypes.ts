export interface MenuItem {
  label: string;
  shortcut?: string;
  action: string;
}

export interface MenuSection {
  label: string;
  items: MenuItem[];
}
