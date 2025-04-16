import React from 'react';
import IntegrationsManager from '@/components/integrations/IntegrationsManager';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';

export default function IntegrationsPage() {
  return (
    <>
      <Helmet>
        <title>Platform Integrations - AdFusion AI</title>
      </Helmet>
      <div className="container mx-auto p-6">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col space-y-2">
            <Link href="/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors w-fit">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Platform Integrations</h1>
            <p className="text-muted-foreground">
              Connect and manage your advertising platform integrations
            </p>
          </div>
          
          <Separator />
          
          <IntegrationsManager />
        </div>
      </div>
    </>
  );
}