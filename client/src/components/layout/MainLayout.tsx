import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import MobileNavbar from "./MobileNavbar";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRouter } from "wouter";

interface MainLayoutProps {
  children: ReactNode;
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [, navigate] = useLocation();
  
  // Check if user is authenticated
  const { data, isLoading, error } = useQuery<{ user: User }>({
    queryKey: ['/api/auth/user'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Redirect to login if not authenticated
  if (error && !isLoading) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <MobileNavbar />
      
      <main className="flex-1 lg:ml-64 pt-4 lg:pt-0">
        <div className="p-4 lg:p-8 mt-14 lg:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
