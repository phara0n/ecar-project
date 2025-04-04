import { Link, useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  Users, 
  Car, 
  FileText, 
  Settings, 
  LogOut,
  Calendar,
  Wrench 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authService } from "@/lib/api";
import { toast } from "sonner";

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: BarChart3,
  },
  {
    title: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    title: "Vehicles",
    href: "/vehicles",
    icon: Car,
  },
  {
    title: "Services",
    href: "/services",
    icon: Wrench,
  },
  {
    title: "Appointments",
    href: "/appointments",
    icon: Calendar,
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: FileText,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const navigate = useNavigate();

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
    <div className={cn("pb-12 bg-sidebar text-sidebar-foreground w-64 border-r border-sidebar-border", className)}>
      <div className="py-4 px-3 flex items-center justify-center">
        <h2 className="text-2xl font-bold">ECAR Admin</h2>
      </div>
      <Separator className="bg-sidebar-border" />
      <div className="space-y-1 py-4 px-2">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className="w-full justify-start"
            asChild
          >
            <Link to={item.href} className="flex items-center gap-2 px-2 text-sidebar-foreground">
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          </Button>
        ))}
      </div>
      <div className="px-3 mt-auto">
        <Separator className="bg-sidebar-border my-4" />
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
} 