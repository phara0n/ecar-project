import { Bell, Moon, Sun, User, LogOut, Settings, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { MobileSidebar } from "./MobileSidebar";
import { authService } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SettingsDialog } from "@/components/SettingsDialog";

export function Header() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  // Function to change language
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    toast.success(`Language changed to ${lng === 'en' ? 'English' : 'Français'}`);
  };

  return (
    <header className="border-b border-border bg-background h-16 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <MobileSidebar />
        <h1 className="text-xl font-semibold">{t('appTitle', 'Garage Management System')}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme} title={t('toggleTheme', 'Toggle theme')}>
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title={t('changeLanguage', 'Change language')}>
              <Languages size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changeLanguage('en')} disabled={i18n.resolvedLanguage === 'en'}>
              English
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('fr')} disabled={i18n.resolvedLanguage === 'fr'}>
              Français
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" title={t('notifications', 'Notifications')}>
          <Bell size={20} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger 
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <Avatar>
              <AvatarImage src="/avatar.png" alt="Admin" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('userMenu.adminLabel', 'Admin User')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleOpenSettings} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              {t('userMenu.profile', 'Profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleOpenSettings} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              {t('userMenu.settings', 'Settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              {t('userMenu.logout', 'Logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </header>
  );
} 