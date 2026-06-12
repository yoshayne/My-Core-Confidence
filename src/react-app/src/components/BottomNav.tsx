import { NavLink } from "react-router-dom";
import { LayoutGrid, BarChart3, Dumbbell, User } from "lucide-react";

const tabs = [
  { to: "/", label: "Library", icon: LayoutGrid },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-card-border bg-bg-raise">
      <div className="mx-auto flex max-w-md justify-between px-6 py-2">
        {tabs.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1 text-[10px] font-medium ${
                isActive ? "text-blue" : "text-text-dim"
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
