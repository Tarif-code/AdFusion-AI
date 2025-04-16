import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, ExternalLink, RefreshCw, XCircle } from "lucide-react";

// Define platform types
export type PlatformType = 'google' | 'facebook';

// Platform definition with custom details
interface PlatformDefinition {
  id: PlatformType;
  name: string;
  description: string;
  color: string;
  logo: React.ReactNode;
}

// Platform state for connected/token status
interface PlatformState {
  connected: boolean;
  tokenExpired: boolean;
}

interface PlatformIntegrationProps {
  platform: PlatformDefinition;
  state: PlatformState;
  onConnect: (platform: PlatformType) => void;
  onRefresh: (platform: PlatformType) => void;
}

export function PlatformIntegration({ 
  platform, 
  state, 
  onConnect, 
  onRefresh 
}: PlatformIntegrationProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      onConnect(platform.id);
    } catch (error) {
      console.error(`Error connecting to ${platform.name}:`, error);
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${platform.name}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      onRefresh(platform.id);
    } catch (error) {
      console.error(`Error refreshing ${platform.name} token:`, error);
      toast({
        title: "Refresh Failed",
        description: `Failed to refresh ${platform.name} connection. Please reconnect.`,
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {platform.logo}
            <CardTitle>{platform.name}</CardTitle>
          </div>
          {state.connected ? (
            state.tokenExpired ? (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
                <XCircle className="w-3 h-3 mr-1" />
                Token Expired
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            )
          ) : (
            <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-200">
              <XCircle className="w-3 h-3 mr-1" />
              Not Connected
            </Badge>
          )}
        </div>
        <CardDescription>{platform.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {state.connected
              ? state.tokenExpired
                ? `Your ${platform.name} connection has expired and needs to be refreshed.`
                : `You're connected to ${platform.name}. You can now publish campaigns to this platform.`
              : `Connect to ${platform.name} to publish campaigns and track performance.`
            }
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 bg-muted/20 p-4">
        {state.connected ? (
          state.tokenExpired ? (
            <Button 
              variant="default" 
              className="flex items-center gap-1" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Refresh Token
                </>
              )}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="flex items-center gap-1" 
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Reconnecting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Reconnect
                </>
              )}
            </Button>
          )
        ) : (
          <Button 
            variant="default" 
            className="flex items-center gap-1" 
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                Connect
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}