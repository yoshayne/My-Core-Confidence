import type { ReactNode } from "react";
import SideNav from "./SideNav";
import BottomNav from "./BottomNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg lg:flex">
      <SideNav />
      <div className="flex-1 pb-24 lg:pb-10 lg:pl-60">{children}</div>
      <BottomNav />
    </div>
  );
}
