import { Outlet } from "react-router";
import { AppSidebar } from "@/app/components/AppSidebar";
import { AppHeader } from "@/app/components/AppHeader";
import BusinessGuard from "./BusinessGuard";

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <BusinessGuard>
          <Outlet />
          </BusinessGuard>
        </main>
      </div>
    </div>
  );
}