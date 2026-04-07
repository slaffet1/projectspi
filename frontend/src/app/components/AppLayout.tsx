import { Outlet } from "react-router";
import { AppSidebar } from "@/app/components/AppSidebar";
import { AppHeader } from "@/app/components/AppHeader";
import BusinessGuard from "./BusinessGuard";

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      {/* Skip link — permet aux utilisateurs clavier de sauter la sidebar */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:text-sm focus:font-medium"
      >
        Aller au contenu principal
      </a>

      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 md:p-8"
          aria-label="Contenu principal"
          tabIndex={-1}
        >
          <BusinessGuard>
            <Outlet />
          </BusinessGuard>
        </main>
      </div>
    </div>
  );
}