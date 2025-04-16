import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { MonitorPlay, Menu, X, Home, PlusCircle, BarChart, LogOut, Share2 } from "lucide-react";
import { SiFacebook, SiGoogle, SiSpotify } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
}

export default function MobileNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();
  
  const { data: userData } = useQuery<{ user: User }>({
    queryKey: ['/api/auth/user'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      window.location.href = '/login';
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was a problem logging out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const menuItems = [
    { path: "/", label: "Dashboard", icon: <Home className="mr-2" /> },
    { path: "/create-ad", label: "Create New Ad", icon: <PlusCircle className="mr-2" /> },
    { path: "/campaigns", label: "My Campaigns", icon: <MonitorPlay className="mr-2" /> },
    { path: "/analytics", label: "Analytics", icon: <BarChart className="mr-2" /> },
    { path: "/integrations", label: "Integrations", icon: <Share2 className="mr-2" /> },
  ];

  const platformItems = [
    { label: "Google Ads", icon: <SiGoogle className="mr-2" /> },
    { label: "Facebook Ads", icon: <SiFacebook className="mr-2" /> },
    { label: "Spotify Ads", icon: <SiSpotify className="mr-2" /> },
  ];

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-sidebar border-b border-border z-50">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <MonitorPlay className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold">
            <span className="gradient-text">AdFusion</span> AI
          </h1>
        </div>
        <button 
          onClick={toggleMenu} 
          className="text-foreground"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      
      {/* Mobile menu */}
      <div className={cn(
        "bg-sidebar border-b border-border p-4",
        menuOpen ? "block" : "hidden"
      )}>
        <nav className="space-y-3">
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "block px-3 py-2 rounded-lg transition-colors flex items-center",
                location === item.path 
                  ? "bg-secondary text-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          
          {/* Mobile Platform Links */}
          <div className="border-t border-border pt-3 mt-3">
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Ad Platforms
            </span>
            {platformItems.map((item, index) => (
              <a 
                key={index} 
                href="#" 
                className="block px-3 py-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex items-center"
              >
                {item.icon}
                {item.label}
              </a>
            ))}
          </div>
          
          <div className="border-t border-border pt-3 mt-3">
            <div className="px-3 py-2 mb-2">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent mr-2">
                  {userData?.user?.fullName ? userData.user.fullName[0].toUpperCase() : "A"}
                </div>
                <div>
                  <p className="text-sm font-medium">{userData?.user?.fullName || "Guest User"}</p>
                  <p className="text-xs text-muted-foreground">{userData?.user?.email || "guest@example.com"}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="block w-full px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
