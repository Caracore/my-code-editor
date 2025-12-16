import { menuConfig } from "./menuConfig";
import { useState, useRef } from "react";
import MenuDropdown from "./MenuDropdown";
import "./TopMenu.css";

export default function TopMenu() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  // const closeTimeout = useRef<NodeJS.Timeout | null>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = (label: string) => {
    // Si un timer de fermeture existe → on l'annule
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setOpenMenu(label);
  };

  const handleMouseLeave = () => {
    // On lance un timer de 3 secondes avant de fermer
    closeTimeout.current = setTimeout(() => {
      setOpenMenu(null);
    }, 3000);
  };

  return (
    <div className="top-menu">
      {menuConfig.map((menu) => (
        <div
          key={menu.label}
          className="menu-item"
          onMouseEnter={() => handleMouseEnter(menu.label)}
          onMouseLeave={handleMouseLeave}
        >
          {menu.label}

          {openMenu === menu.label && <MenuDropdown items={menu.items} />}
        </div>
      ))}
    </div>
  );
}

// import { menuConfig } from "./menuConfig";
// import { useState } from "react";
// import MenuDropdown from "./MenuDropdown";
// import "./TopMenu.css";

// export default function TopMenu() {
//   const [openMenu, setOpenMenu] = useState<string | null>(null);

//   return (
//     <div className="top-menu">
//       {menuConfig.map((menu) => (
//         <div
//           key={menu.label}
//           className="menu-item"
//           onMouseEnter={() => setOpenMenu(menu.label)}
//           onMouseLeave={() => setOpenMenu(null)}
//         >
//           {menu.label}

//           {openMenu === menu.label && <MenuDropdown items={menu.items} />}
//         </div>
//       ))}
//     </div>
//   );
// }
