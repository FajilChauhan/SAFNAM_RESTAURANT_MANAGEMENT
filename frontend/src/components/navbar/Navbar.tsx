import { ChefHat, LayoutDashboard, Search, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/search", label: "Search", icon: Search },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export function Navbar() {
  return (
    <aside className="navbar">
      <div className="navbar__brand">
        <ChefHat size={24} />
        <span>Safnam</span>
      </div>
      <nav className="navbar__links">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="navbar__link">
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
