import { Bell, User, LogOut, Settings } from "lucide-react";
import { SearchInput } from "@/app/components/SearchInput";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import BusinessSwitcher from './BusinessSwitcher';
import { useAuth } from "@/app/context/AuthContext";
import { useNavigate } from "react-router-dom";

export function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user
    ? `${user.firstname?.[0] ?? ""}${user.lastname?.[0] ?? ""}`.toUpperCase()
    : "?";

  const fullName = user ? `${user.firstname} ${user.lastname}` : "...";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-4 md:px-8">
      {/* Search bar */}
      <div className="flex-1 max-w-md hidden md:block">
        <SearchInput placeholder="Search invoice, client..." />
      </div>

      {/* Spacer mobile */}
      <div className="md:hidden w-12" aria-hidden="true"></div>

      {/* User actions */}
      <div className="flex items-center gap-2 md:gap-4">
        <BusinessSwitcher />

        {/* User profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Menu du compte de ${fullName}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-white" aria-hidden="true">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-medium" aria-hidden="true">
                  {fullName}
                </p>
                <p className="text-xs text-muted-foreground" aria-hidden="true">
                  {user?.email ?? ""}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => navigate("/profile/edit")}>
              <User className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Edit Profile</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate("/app/settings/invoices")}>
              <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}