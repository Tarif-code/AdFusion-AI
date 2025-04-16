import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, BarChart3, LineChart as LineChartIcon, PieChart, RefreshCw } from 'lucide-react';
import { SiGoogle, SiFacebook } from 'react-icons/si';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CampaignPerformanceProps {
  campaignId: number;
}

export default function CampaignPerformance({ campaignId }: CampaignPerformanceProps) {
  const [timeRange, setTimeRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch campaign performance data
  const { 
    data: performanceData,
    isLoading: isLoadingPerformance,
    error: performanceError,
    refetch: refetchPerformance
  } = useQuery({
    queryKey: ['/api/integrations/campaigns', campaignId, 'performance'],
    retry: 1,
  });
  
  // Fetch historical analytics data
  const { 
    data: analyticsData,
    isLoading: isLoadingAnalytics,
    error: analyticsError
  } = useQuery({
    queryKey: ['/api/integrations/campaigns', campaignId, 'analytics', { days: timeRange }],
    retry: 1,
  });
  
  const isLoading = isLoadingPerformance || isLoadingAnalytics;
  const hasError = performanceError || analyticsError;
  
  // Check if the campaign has been published to any platforms
  const publishedPlatforms = performanceData?.platforms || [];
  const historicalData = analyticsData?.data || [];
  
  // No data state
  if (!isLoading && !hasError && (!performanceData || publishedPlatforms.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>
            No performance data available yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Published</AlertTitle>
            <AlertDescription>
              This campaign has not been published to any external platforms yet. 
              Publish the campaign to start tracking performance.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>
            Loading performance data...
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Fetching performance data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if (hasError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>
            Unable to load performance data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was a problem fetching performance data. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Format metrics
  const formatMetric = (value: number, type: string) => {
    if (type === 'currency') {
      return `$${value.toFixed(2)}`;
    } else if (type === 'percentage') {
      return `${value.toFixed(2)}%`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };
  
  const platformIcons = {
    google: <SiGoogle className="h-4 w-4 text-[#4285F4]" />,
    facebook: <SiFacebook className="h-4 w-4 text-[#1877F2]" />
  };
  
  // Calculate totals
  const totals = performanceData?.totals || {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    spend: 0,
    ctr: 0,
    cpc: 0,
    conversionRate: 0
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>
              Performance metrics across all connected platforms
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {publishedPlatforms.map(platform => (
            <Badge 
              key={platform}
              variant="outline"
              className="flex items-center gap-1"
            >
              {platformIcons[platform]}
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Performance Trends</TabsTrigger>
            <TabsTrigger value="platforms">Platform Breakdown</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard 
                title="Impressions" 
                value={formatMetric(totals.impressions, 'number')} 
                change={totals.impressionsChange || 0} 
                icon={<LineChartIcon className="h-4 w-4" />}
              />
              <MetricCard 
                title="Clicks" 
                value={formatMetric(totals.clicks, 'number')} 
                change={totals.clicksChange || 0} 
                icon={<BarChart3 className="h-4 w-4" />}
              />
              <MetricCard 
                title="CTR" 
                value={formatMetric(totals.ctr, 'percentage')} 
                change={totals.ctrChange || 0} 
                icon={<PieChart className="h-4 w-4" />}
              />
              <MetricCard 
                title="Spend" 
                value={formatMetric(totals.spend / 100, 'currency')} 
                change={totals.spendChange || 0} 
                icon={<BarChart3 className="h-4 w-4" />}
              />
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Performance Trend</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={historicalData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="impressions" stroke="#8884d8" name="Impressions" />
                    <Line yAxisId="left" type="monotone" dataKey="clicks" stroke="#82ca9d" name="Clicks" />
                    <Line yAxisId="right" type="monotone" dataKey="spend" stroke="#ff7300" name="Spend ($)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="trends" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[300px]">
                <h3 className="text-lg font-medium mb-4">Click-Through Rate (CTR)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={historicalData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="ctr" stroke="#8884d8" name="CTR (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="h-[300px]">
                <h3 className="text-lg font-medium mb-4">Cost Per Click (CPC)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={historicalData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cpc" stroke="#82ca9d" name="CPC ($)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="h-[300px] mt-6">
              <h3 className="text-lg font-medium mb-4">Daily Performance</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={historicalData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="impressions" fill="#8884d8" name="Impressions" />
                  <Bar dataKey="clicks" fill="#82ca9d" name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="platforms" className="space-y-4">
            <div className="space-y-6">
              {publishedPlatforms.map(platform => {
                const platformData = performanceData?.platforms?.find(p => p.platform === platform);
                
                if (!platformData) return null;
                
                return (
                  <Card key={platform}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        {platformIcons[platform]}
                        <CardTitle className="text-base">
                          {platform.charAt(0).toUpperCase() + platform.slice(1)} Performance
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard 
                          title="Impressions" 
                          value={formatMetric(platformData.impressions, 'number')} 
                          change={platformData.impressionsChange || 0} 
                          variant="small"
                        />
                        <MetricCard 
                          title="Clicks" 
                          value={formatMetric(platformData.clicks, 'number')} 
                          change={platformData.clicksChange || 0} 
                          variant="small"
                        />
                        <MetricCard 
                          title="CTR" 
                          value={formatMetric(platformData.ctr, 'percentage')} 
                          change={platformData.ctrChange || 0} 
                          variant="small"
                        />
                        <MetricCard 
                          title="Spend" 
                          value={formatMetric(platformData.spend / 100, 'currency')} 
                          change={platformData.spendChange || 0} 
                          variant="small"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  variant?: 'default' | 'small';
}

function MetricCard({ title, value, change = 0, icon, variant = 'default' }: MetricCardProps) {
  const isPositive = change > 0;
  const isNeutral = change === 0;
  
  return (
    <div className={`bg-muted/40 rounded-lg p-4 ${variant === 'small' ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`font-medium ${variant === 'small' ? 'text-sm' : 'text-base'}`}>{title}</h3>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className={`font-bold ${variant === 'small' ? 'text-lg' : 'text-2xl'}`}>{value}</span>
        {typeof change !== 'undefined' && (
          <div className="flex items-center mt-1">
            <span
              className={`text-xs ${
                isNeutral
                  ? 'text-gray-500'
                  : isPositive
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}
            >
              {isPositive ? '+' : ''}
              {change.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">vs previous</span>
          </div>
        )}
      </div>
    </div>
  );
}