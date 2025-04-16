import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, MousePointer, ArrowRightLeft, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartLegend } from "@/components/ui/chart";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("30days");
  const [campaignFilter, setCampaignFilter] = useState("all");
  
  const { data: performanceData, isLoading: isPerformanceLoading } = useQuery({
    queryKey: ['/api/analytics/performance', timeRange, campaignFilter],
    queryFn: async () => {
      // In a real implementation, this would fetch from API
      return {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].slice(0, 
          timeRange === "7days" ? 7 : 
          timeRange === "30days" ? 10 : 12
        ),
        impressions: [35000, 42000, 50000, 55000, 60000, 75000, 85000, 90000, 95000, 100000, 110000, 120000].slice(0, 
          timeRange === "7days" ? 7 : 
          timeRange === "30days" ? 10 : 12
        ),
        clicks: [2100, 2500, 3000, 3300, 3600, 4500, 5100, 5400, 5700, 6000, 6600, 7200].slice(0, 
          timeRange === "7days" ? 7 : 
          timeRange === "30days" ? 10 : 12
        ),
        conversions: [420, 500, 600, 660, 720, 900, 1020, 1080, 1140, 1200, 1320, 1440].slice(0, 
          timeRange === "7days" ? 7 : 
          timeRange === "30days" ? 10 : 12
        )
      };
    }
  });

  const { data: platformData, isLoading: isPlatformLoading } = useQuery({
    queryKey: ['/api/analytics/platforms', timeRange, campaignFilter],
    queryFn: async () => {
      // In a real implementation, this would fetch from API
      return {
        labels: ["Google Ads", "Facebook Ads", "Spotify Ads"],
        impressions: [180000, 130000, 90000],
        clicks: [10800, 9100, 3600],
        conversions: [2160, 1820, 720]
      };
    }
  });

  const { data: demographicData, isLoading: isDemographicLoading } = useQuery({
    queryKey: ['/api/analytics/demographics', timeRange, campaignFilter],
    queryFn: async () => {
      // In a real implementation, this would fetch from API
      return {
        ageGroups: {
          labels: ["18-24", "25-34", "35-44", "45-54", "55+"],
          data: [25, 35, 20, 15, 5]
        },
        gender: {
          labels: ["Male", "Female", "Other"],
          data: [45, 48, 7]
        },
        devices: {
          labels: ["Mobile", "Desktop", "Tablet"],
          data: [65, 25, 10]
        }
      };
    }
  });

  const renderChart = (chartId: string, data: any, type: string = "line") => {
    // In production, this would render a chart using the Chart.js library
    return (
      <div className="relative h-80 w-full">
        {isPerformanceLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <>
            <div className="absolute inset-0">
              <canvas id={chartId} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">
                Chart visualization would render here in production
              </p>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Tabs defaultValue="overview" className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <CalendarDays className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={campaignFilter} onValueChange={setCampaignFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Campaigns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="1">Summer Sale Promo</SelectItem>
              <SelectItem value="2">New Product Launch</SelectItem>
              <SelectItem value="3">Fall Collection</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Impressions</p>
                <h3 className="text-2xl font-bold mt-1">428.7K</h3>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>12% from previous period</span>
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Unique Viewers</p>
                <h3 className="text-2xl font-bold mt-1">128.4K</h3>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>8% from previous period</span>
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Click-Through Rate</p>
                <h3 className="text-2xl font-bold mt-1">5.2%</h3>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>3% from previous period</span>
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <MousePointer className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Conversion Rate</p>
                <h3 className="text-2xl font-bold mt-1">2.1%</h3>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>5% from previous period</span>
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <ArrowRightLeft className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Overview Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {renderChart("performanceChart", performanceData)}
          <div className="mt-4">
            <ChartLegend
              items={[
                { name: "Impressions", color: "hsl(var(--chart-1))" },
                { name: "Clicks", color: "hsl(var(--chart-2))" },
                { name: "Conversions", color: "hsl(var(--chart-3))" }
              ]}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Platform Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {renderChart("platformChart", platformData, "bar")}
            <div className="mt-4">
              <ChartLegend
                items={[
                  { name: "Google Ads", color: "hsl(var(--chart-1))" },
                  { name: "Facebook Ads", color: "hsl(var(--chart-2))" },
                  { name: "Spotify Ads", color: "hsl(var(--chart-3))" }
                ]}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Audience Demographics</CardTitle>
          </CardHeader>
          <CardContent>
            {renderChart("demographicChart", demographicData, "pie")}
            <div className="mt-4">
              <ChartLegend
                items={[
                  { name: "18-24", color: "hsl(var(--chart-1))" },
                  { name: "25-34", color: "hsl(var(--chart-2))" },
                  { name: "35-44", color: "hsl(var(--chart-3))" },
                  { name: "45-54", color: "hsl(var(--chart-4))" },
                  { name: "55+", color: "hsl(var(--chart-5))" }
                ]}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Campaign Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          {renderChart("campaignComparisonChart", null, "bar")}
          <div className="mt-4">
            <ChartLegend
              items={[
                { name: "Summer Sale Promo", color: "hsl(var(--chart-1))" },
                { name: "New Product Launch", color: "hsl(var(--chart-2))" },
                { name: "Fall Collection", color: "hsl(var(--chart-3))" }
              ]}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
