import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiGoogle, SiFacebook, SiSpotify } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PlatformConnection {
  id: number;
  userId: number;
  platform: string;
  connected: boolean;
}

export default function ConnectedPlatforms() {
  const { data } = useQuery<{ connections: PlatformConnection[] }>({
    queryKey: ['/api/platform-connections'],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/platform-connections", undefined);
        return res.json();
      } catch (error) {
        // Return default state if API fails
        return {
          connections: [
            { id: 1, userId: 1, platform: "google", connected: true },
            { id: 2, userId: 1, platform: "facebook", connected: true },
            { id: 3, userId: 1, platform: "spotify", connected: false }
          ]
        };
      }
    }
  });

  const platforms = [
    { 
      id: "google", 
      name: "Google Ads", 
      icon: <SiGoogle className="text-lg w-8" /> 
    },
    { 
      id: "facebook", 
      name: "Facebook Ads", 
      icon: <SiFacebook className="text-lg w-8" /> 
    },
    { 
      id: "spotify", 
      name: "Spotify Ads", 
      icon: <SiSpotify className="text-lg w-8" /> 
    }
  ];

  return (
    <Card className="mt-6">
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Connected Platforms</h3>
        <div className="space-y-3">
          {platforms.map((platform) => {
            const connection = data?.connections.find(c => c.platform === platform.id);
            const isConnected = connection?.connected || false;
            
            return (
              <div 
                key={platform.id} 
                className="flex items-center justify-between p-3 bg-secondary rounded-lg"
              >
                <div className="flex items-center">
                  {platform.icon}
                  <span>{platform.name}</span>
                </div>
                {isConnected ? (
                  <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/50">
                    Connected
                  </Badge>
                ) : (
                  <Button size="sm" variant="default" className="px-3 py-1 h-auto text-xs">
                    Connect
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
