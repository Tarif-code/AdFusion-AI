import { useEffect } from "react";
import { useLocation } from "wouter";
import LoginForm from "@/components/auth/LoginForm";
import { useQuery } from "@tanstack/react-query";

export default function LoginPage() {
  const [, navigate] = useLocation();
  
  const { data, isLoading } = useQuery<{ user: any }>({
    queryKey: ['/api/auth/user'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Redirect if already logged in
  useEffect(() => {
    if (data?.user && !isLoading) {
      navigate("/");
    }
  }, [data, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}
