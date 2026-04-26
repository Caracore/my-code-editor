import type { MenuItem } from "../../types/menuTypes";

export default function MenuDropdown({ items }: { items: MenuItem[] }) {
  return (
    <div className="menu-dropdown">
      {items.map((item) => (
        <div
          key={item.label}
          className="dropdown-item"
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent("menu-action", { detail: item.action }),
            )
          }
        >
          <span>{item.label}</span>
          {item.shortcut && <span className="shortcut">{item.shortcut}</span>}
        </div>
      ))}
    </div>
  );
}
