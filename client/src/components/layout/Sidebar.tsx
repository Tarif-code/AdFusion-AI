import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

import { 
  Home, 
  PlusCircle, 
  BarChart, 
  MonitorPlay, 
  UserCircle, 
  Settings, 
  Bell, 
  LogOut,
  Share2
} from "lucide-react";

import { 
  SiFacebook, 
  SiGoogle, 
  SiSpotify 
} from "react-icons/si";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
}

export default function Sidebar() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: userData } = useQuery<{ user: User }>({
    queryKey: ['/api/auth/user'],
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const user = userData?.user;

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await apiRequest('POST', '/api/auth/logout', {});
      window.location.href = '/login';
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const menuItems = [
    { path: "/", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
    { path: "/create-ad-ai", label: "Create Ad with AI", icon: <PlusCircle className="w-5 h-5" /> },
    { path: "/campaigns", label: "My Campaigns", icon: <MonitorPlay className="w-5 h-5" /> },
    { path: "/analytics", label: "Analytics", icon: <BarChart className="w-5 h-5" /> },
    { path: "/integrations", label: "Integrations", icon: <Share2 className="w-5 h-5" /> },
  ];

  const platformItems = [
    { label: "Google Ads", icon: <SiGoogle className="w-5 h-5" /> },
    { label: "Facebook Ads", icon: <SiFacebook className="w-5 h-5" /> },
    { label: "Spotify Ads", icon: <SiSpotify className="w-5 h-5" /> },
  ];

  const settingsItems = [
    { label: "Account", icon: <UserCircle className="w-5 h-5" /> },
    { label: "Preferences", icon: <Settings className="w-5 h-5" /> },
    { label: "Notifications", icon: <Bell className="w-5 h-5" /> },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-sidebar border-r border-border fixed">
      <div className="p-5 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <MonitorPlay className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold">
            <span className="gradient-text">AdFusion</span> AI
          </h1>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4">
        <div className="space-y-8">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg transition-colors",
                  location === item.path 
                    ? "bg-secondary text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Ad Platforms
            </h3>

            {platformItems.map((item, index) => (
              <a 
                key={index} 
                href="#" 
                className="flex items-center px-3 py-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </a>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Settings
            </h3>

            {settingsItems.map((item, index) => (
              <a 
                key={index} 
                href="#" 
                className="flex items-center px-3 py-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            {user?.fullName ? user.fullName[0].toUpperCase() : "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName || "Guest User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || "guest@example.com"}</p>
          </div>
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}