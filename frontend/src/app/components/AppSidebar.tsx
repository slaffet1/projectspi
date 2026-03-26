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
  Package,
  FileSignature,
  Building2,
  UsersRound,
  ClipboardList,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// ─── Navigation structure ─────────────────────────────────────────────────────

const navGroups: NavGroup[] = [
  {
    label: "Général",
    items: [
      { title: "Dashboard",  href: "/app",           icon: LayoutDashboard },
    ],
  },
  {
    label: "Ventes",
    items: [
      { title: "Devis",      href: "/app/quotes",    icon: FileSignature },
      { title: "Factures",   href: "/app/invoices",  icon: FileText },
      { title: "Clients",    href: "/app/clients",   icon: Users },
    ],
  },
  {
    label: "Achats",
    items: [
      { title: "Produits",   href: "/app/products",  icon: Package },
      { title: "Dépenses",   href: "/app/expenses",  icon: Receipt },
    ],
  },
  {
    label: "Équipe",
    items: [
      { title: "Entreprises",  href: "/app/businesses",    icon: Building2 },
      { title: "Membres",      href: "/app/members",       icon: UsersRound },
      { title: "Demandes",     href: "/app/join-requests", icon: ClipboardList },
    ],
  },
];

const bottomItems: NavItem[] = [
  {
    title: "Paramètres",
    href:  "/app/settings",
    icon:  Settings,
    children: [
      { title: "Facturation", href: "/app/settings/invoices", icon: FileSliders },
      { title: "Taxes",       href: "/app/settings/taxes",    icon: Percent },
    ],
  },
  { title: "Aide", href: "/app/help", icon: HelpCircle },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function AppSidebar() {
  const location = useLocation();
  const [isOpen,       setIsOpen]       = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(
    location.pathname.startsWith("/app/settings")
  );

  const isActive = (href: string) =>
    href === "/app"
      ? location.pathname === "/app"
      : location.pathname.startsWith(href);

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50 bg-white border border-border"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
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
        <div className="flex h-16 items-center border-b border-border px-6 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-white">B</span>
            </div>
            <span className="text-lg font-semibold text-foreground">
              Business<span className="text-primary">Manager</span>
            </span>
          </div>
        </div>

        {/* Scrollable nav area */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              {/* Group label */}
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </p>

              {/* Group items */}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon   = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                        active
                          ? "bg-primary text-white"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div className="border-t border-border px-3 py-4 space-y-0.5 shrink-0">
          {bottomItems.map((item) => {
            const Icon = item.icon;

            // Settings with children
            if (item.children) {
              const parentActive = location.pathname.startsWith("/app/settings");

              return (
                <div key={item.href}>
                  <button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                      parentActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    {settingsOpen
                      ? <ChevronDown className="h-3.5 w-3.5" />
                      : <ChevronRight className="h-3.5 w-3.5" />
                    }
                  </button>

                  {settingsOpen && (
                    <div className="mt-1 ml-4 space-y-0.5 border-l border-border pl-3">
                      {item.children.map((child) => {
                        const ChildIcon    = child.icon;
                        const childActive  = location.pathname === child.href;

                        return (
                          <Link
                            key={child.href}
                            to={child.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                              childActive
                                ? "bg-primary text-white"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <ChildIcon className="h-4 w-4 shrink-0" />
                            <span className="font-medium">{child.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Normal item
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}