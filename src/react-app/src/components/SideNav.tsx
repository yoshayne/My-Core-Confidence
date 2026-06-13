import { NavLink } from "react-router-dom";
import { LayoutGrid, BarChart3, Dumbbell, User } from "lucide-react";

const tabs = [
  { to: "/", label: "Library", icon: LayoutGrid },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/profile", label: "Profile", icon: User },
];

export default function SideNav() {
  return (
    <nav className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-60 lg:flex-col lg:gap-8 lg:border-r lg:border-card-border lg:bg-bg-raise lg:px-4 lg:py-8">
      <div className="flex flex-col items-start gap-1 px-3">
        <span className="text-base font-extrabold tracking-[0.3em] text-text">CORE</span>
        <span className="text-xs font-extrabold tracking-[0.4em] text-blue">CONFIDENCE</span>
      </div>

      <div className="flex flex-col gap-1">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-button px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-blue/15 text-blue"
                  : "text-text-secondary hover:bg-card hover:text-text"
              }`
            }
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
