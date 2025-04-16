import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SiGoogle, SiFacebook } from 'react-icons/si';
import { Check, RefreshCw, Share2, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

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

interface CampaignPublisherProps {
  campaignId: number;
  campaignName: string;
}

export default function CampaignPublisher({ campaignId, campaignName }: CampaignPublisherProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch platforms connection status
  const { 
    data: platformsData, 
    isLoading: isLoadingStatus 
  } = useQuery({
    queryKey: ['/api/integrations/status'],
    retry: 1,
  });
  
  // Fetch existing platform campaigns
  const { 
    data: platformCampaignsData,
    isLoading: isLoadingPlatformCampaigns
  } = useQuery({
    queryKey: ['/api/campaigns', campaignId, 'platforms'],
    enabled: Boolean(campaignId),
  });
  
  // Publish campaign mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', `/api/integrations/campaigns/${campaignId}/publish`, 
        { platforms: selectedPlatforms }
      );
    },
    onSuccess: () => {
      toast({
        title: 'Campaign Published',
        description: `Campaign "${campaignName}" published successfully to selected platforms.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns', campaignId, 'platforms'] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Publication Failed',
        description: `Failed to publish campaign. Please check platform connections and try again.`,
        variant: 'destructive',
      });
      console.error('Error publishing campaign:', error);
    },
  });
  
  const platformsStatus: PlatformsStatus = platformsData?.platforms || {
    google: { connected: false, tokenExpired: false },
    facebook: { connected: false, tokenExpired: false },
  };
  
  const publishedPlatforms = platformCampaignsData?.platforms || [];
  
  const platforms = [
    {
      id: 'google',
      name: 'Google Ads',
      icon: <SiGoogle className="h-4 w-4 text-[#4285F4]" />,
      connected: platformsStatus.google.connected && !platformsStatus.google.tokenExpired,
      published: publishedPlatforms.includes('google'),
    },
    {
      id: 'facebook',
      name: 'Facebook Ads',
      icon: <SiFacebook className="h-4 w-4 text-[#1877F2]" />,
      connected: platformsStatus.facebook.connected && !platformsStatus.facebook.tokenExpired,
      published: publishedPlatforms.includes('facebook'),
    },
  ];
  
  const isLoading = isLoadingStatus || isLoadingPlatformCampaigns;
  const isPublishing = publishMutation.isPending;
  
  const handleSelectPlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };
  
  const handlePublish = () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: 'No Platforms Selected',
        description: 'Please select at least one platform to publish to.',
        variant: 'destructive',
      });
      return;
    }
    
    publishMutation.mutate();
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Publish Campaign
        </CardTitle>
        <CardDescription>
          Publish this campaign to external advertising platforms
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {platforms.map(platform => (
                <Badge 
                  key={platform.id}
                  variant={platform.published ? "default" : "outline"}
                  className="flex items-center gap-1"
                >
                  {platform.icon}
                  {platform.name}
                  {platform.published && <Check className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
            
            {publishedPlatforms.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                This campaign is published to {publishedPlatforms.length} platform(s). You can update or republish using the button below.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                This campaign is not published to any external platforms yet.
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Share2 className="mr-2 h-4 w-4" />
              {publishedPlatforms.length > 0 ? 'Update Publishing' : 'Publish Campaign'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish Campaign</DialogTitle>
              <DialogDescription>
                Select the platforms where you want to publish "{campaignName}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              {platforms.map(platform => (
                <div key={platform.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`platform-${platform.id}`}
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={() => handleSelectPlatform(platform.id)}
                    disabled={!platform.connected || isPublishing}
                  />
                  <label
                    htmlFor={`platform-${platform.id}`}
                    className={`text-sm font-medium leading-none flex items-center space-x-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${!platform.connected ? 'text-muted-foreground' : ''}`}
                  >
                    <span className="flex items-center gap-1">
                      {platform.icon}
                      {platform.name}
                    </span>
                    {platform.published && (
                      <Badge variant="outline" className="ml-2">
                        <Check className="h-3 w-3 mr-1" />
                        Published
                      </Badge>
                    )}
                  </label>
                </div>
              ))}
              
              {platforms.some(p => !p.connected) && (
                <Alert variant="warning" className="mt-4">
                  <AlertTitle>Connect Platforms</AlertTitle>
                  <AlertDescription className="text-sm">
                    Some platforms are not connected. Visit the{' '}
                    <a href="/integrations" className="underline hover:text-primary">
                      Integrations page
                    </a>{' '}
                    to connect them.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isPublishing}
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePublish}
                disabled={selectedPlatforms.length === 0 || isPublishing}
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Publish Campaign
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}