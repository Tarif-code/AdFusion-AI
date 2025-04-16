import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { SiGoogle, SiFacebook } from 'react-icons/si';
import { PlatformIntegration, PlatformType } from './PlatformIntegration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface PlatformsStatus {
  google: {
    connected: boolean;
    tokenExpired: boolean;
  };
  facebook: {
    connected: boolean;
    tokenExpired: boolean;
  };
}

export default function IntegrationsManager() {
  const [activeTab, setActiveTab] = useState('connections');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch platforms status
  const { data: platformsData, isLoading, error } = useQuery({
    queryKey: ['/api/integrations/status'],
    retry: 1,
  });

  const platformsStatus: PlatformsStatus = platformsData?.platforms || {
    google: { connected: false, tokenExpired: false },
    facebook: { connected: false, tokenExpired: false }
  };

  // Define platform configurations
  const platforms = [
    {
      id: 'google' as PlatformType,
      name: 'Google Ads',
      description: 'Connect to Google Ads to create and manage search, display, and video campaigns.',
      color: '#4285F4',
      logo: <SiGoogle className="h-5 w-5 text-[#4285F4]" />,
    },
    {
      id: 'facebook' as PlatformType,
      name: 'Facebook Ads',
      description: 'Connect to Facebook Ads Manager to create and manage campaigns across Facebook, Instagram, and Messenger.',
      color: '#1877F2',
      logo: <SiFacebook className="h-5 w-5 text-[#1877F2]" />,
    }
  ];

  const handleConnect = async (platform: PlatformType) => {
    try {
      const { authUrl } = await apiRequest('GET', `/api/integrations/auth/${platform}`);
      
      // Open OAuth flow in new window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const oauthWindow = window.open(
        authUrl,
        `Connect to ${platform}`,
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // Poll for window to close and refresh status
      const checkWindowClosed = setInterval(() => {
        if (oauthWindow && oauthWindow.closed) {
          clearInterval(checkWindowClosed);
          queryClient.invalidateQueries({ queryKey: ['/api/integrations/status'] });
          toast({
            title: 'Connection Status',
            description: `Checking ${platform} connection status...`,
          });
        }
      }, 1000);
      
    } catch (error) {
      console.error(`Error initiating ${platform} OAuth flow:`, error);
      toast({
        title: 'Connection Failed',
        description: `Failed to connect to ${platform}. Please try again.`,
        variant: 'destructive',
      });
    }
  };
  
  const handleRefresh = async (platform: PlatformType) => {
    // For refresh, we just re-initiate the OAuth flow
    handleConnect(platform);
  };

  if (isLoading) {
    return (
      <div className="w-full p-8">
        <div className="flex flex-col space-y-4 w-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading integrations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load platform integrations. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Platform Integrations</h1>
          <p className="text-muted-foreground mb-6">
            Connect AdFusion AI to your advertising platforms to unlock powerful campaign management capabilities. Seamlessly integrate your Google Ads and Facebook Ads accounts to publish campaigns across platforms, monitor real-time performance metrics, and receive AI-powered optimization recommendations. Our intelligent system analyzes your campaign data to provide actionable insights and automatically suggests improvements to maximize your advertising ROI.
          </p>
        </div>

        <Tabs defaultValue="connections" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="connections">Platform Connections</TabsTrigger>
            <TabsTrigger value="settings">Integration Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {platforms.map((platform) => (
                <PlatformIntegration
                  key={platform.id}
                  platform={platform}
                  state={platformsStatus[platform.id]}
                  onConnect={handleConnect}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Settings</CardTitle>
                <CardDescription>
                  Configure global settings for all platform integrations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Advanced integration settings will be available soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}