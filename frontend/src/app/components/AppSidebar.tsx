import {
  LayoutDashboard,
  FileText,
  Users,
  Receipt,
  Settings,
  HelpCircle,
  Menu,
  X,
  UserPlus,
  ChevronDown,
  ChevronRight,
  FileSliders,
  Percent,
  Package
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavItemWithChildren extends NavItem {
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/app",
    icon: LayoutDashboard,
  },
  {
    title: "Factures",
    href: "/app/invoices",
    icon: FileText,
  },
  {
    title: "Clients",
    href: "/app/clients",
    icon: Users,
  },
  {
    title: "Dépenses",
    href: "/app/expenses",
    icon: Receipt,
  },
  {
  title: "Produits",
  href: "/app/products",
  icon: Package,
},
  {
  title: "Demandes",
  href: "/app/join-requests",
  icon: UserPlus,
},
];

const bottomNavItems: NavItemWithChildren[] = [
  {
    title: "Membres",
    href: "/app/members",
    icon: UserPlus,
  },
  {
    title: "Paramètres",
    href: "/app/settings",
    icon: Settings,
    children: [
      {
        title: "Facturation",
        href: "/app/settings/invoices",
        icon: FileSliders,
      },
      {
        title: "Taxes",
        href: "/app/settings/taxes",
        icon: Percent,
      },
    ],
  },
  {
    title: "Aide",
    href: "/app/help",
    icon: HelpCircle,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Ouvre le sous-menu automatiquement si on est sur une page settings
  const [settingsOpen, setSettingsOpen] = useState(
    location.pathname.startsWith("/app/settings")
  );

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50 bg-white border border-border"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-white transition-transform duration-200 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-white">B</span>
            </div>
            <span className="text-lg font-semibold text-foreground">
              Business<span className="text-primary">Manager</span>
            </span>
          </div>
        </div>

        {/* Navigation principale */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Navigation du bas */}
        <div className="border-t border-border p-4 space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;

            // Item avec sous-menu (Paramètres)
            if (item.children) {
              const isParentActive = location.pathname.startsWith("/app/settings");

              return (
                <div key={item.href}>
                  {/* Bouton parent */}
                  <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                      isParentActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </div>
                    {settingsOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>

                  {/* Sous-menu */}
                  {settingsOpen && (
                    <div className="mt-1 ml-4 space-y-1 border-l border-border pl-3">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = location.pathname === child.href;

                        return (
                          <Link
                            key={child.href}
                            to={child.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                              isChildActive
                                ? "bg-primary text-white"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <ChildIcon className="h-4 w-4" />
                            <span className="font-medium">{child.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Item normal (sans sous-menu)
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}