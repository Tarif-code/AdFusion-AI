import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function IntegrationCallbackPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [platform, setPlatform] = useState<string>('');
  
  useEffect(() => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const platformParam = urlParams.get('platform');
    const error = urlParams.get('error');
    
    if (platformParam) {
      setPlatform(platformParam);
    }
    
    if (error) {
      setStatus('error');
    } else {
      setStatus('success');
    }
    
    // Close window if this is a popup
    if (window.opener) {
      // Send message to parent window
      window.opener.postMessage(
        {
          type: 'OAUTH_CALLBACK',
          platform: platformParam,
          status: error ? 'error' : 'success'
        },
        window.location.origin
      );
      
      // Close popup after a short delay
      setTimeout(() => {
        window.close();
      }, 2000);
    }
  }, []);
  
  const handleContinue = () => {
    setLocation('/integrations');
  };
  
  return (
    <>
      <Helmet>
        <title>Integration Authentication - AdFusion AI</title>
      </Helmet>
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Platform Integration</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center space-y-6">
            {status === 'loading' && (
              <>
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">Processing</h3>
                  <p className="text-muted-foreground">Completing authentication process...</p>
                </div>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-16 w-16 text-green-500" />
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">Connection Successful</h3>
                  <p className="text-muted-foreground">
                    {platform ? (
                      <>Your {platform} account has been successfully connected.</>
                    ) : (
                      <>Your account has been successfully connected.</>
                    )}
                  </p>
                </div>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="h-16 w-16 text-red-500" />
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">Connection Failed</h3>
                  <p className="text-muted-foreground">
                    {platform ? (
                      <>There was an error connecting to {platform}. Please try again.</>
                    ) : (
                      <>There was an error connecting to the platform. Please try again.</>
                    )}
                  </p>
                </div>
              </>
            )}
            
            {!window.opener && (
              <Button onClick={handleContinue} className="mt-6">
                Continue to Integrations
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}