import { Bell, Moon, Sun, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { MobileSidebar } from "./MobileSidebar";
import { authService } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function Header() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const navigate = useNavigate();

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
    
    // Show a toast when theme changes
    toast.success(`Switched to ${newTheme} theme`);
  };

  const handleLogout = () => {
    // Show loading toast
    const toastId = toast.loading("Logging out...");
    
    // Simulate a small delay for better UX
    setTimeout(() => {
      authService.logout();
      toast.success("Logged out successfully", { id: toastId });
      navigate('/login');
    }, 500);
  };

  return (
    <header className="border-b border-border bg-background h-16 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <MobileSidebar />
        <h1 className="text-xl font-semibold">Garage Management System</h1>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </Button>
        <Button variant="ghost" size="icon">
          <Bell size={20} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="rounded-full" size="icon">
              <Avatar>
                <AvatarImage src="/avatar.png" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Admin User</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
} 