import type { MenuItem } from "../../types/menuTypes";
import "./MenuDropDown.css";

interface MenuDropdownProps {
    items: MenuItem[];
    onAction?: (action: string) => void;
    onClose?: () => void;
}

export default function MenuDropdown({ items, onAction, onClose }: MenuDropdownProps) {
    const handleClick = (item: MenuItem) => {
        if (!item.action) return;
        // Local handler (for window controls etc.)
        onAction?.(item.action);
        // Global event for other listeners (existing pattern in the app)
        window.dispatchEvent(
            new CustomEvent("menu-action", { detail: item.action }),
        );
        onClose?.();
    };

    return (
        <div className="menu-dropdown" role="menu">
            {items.map((item, idx) => {
                if (item.label === "__sep__") {
                    return <div key={`sep-${idx}`} className="menu-dropdown__sep" />;
                }
                return (
                    <div
                        key={`${item.label}-${idx}`}
                        className="menu-dropdown__item"
                        role="menuitem"
                        onClick={() => handleClick(item)}
                    >
                        <span className="menu-dropdown__label">{item.label}</span>
                        {item.shortcut && (
                            <span className="menu-dropdown__shortcut">{item.shortcut}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}