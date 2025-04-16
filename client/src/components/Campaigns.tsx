import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Download, 
  Filter, 
  PlusCircle, 
  Search, 
  Edit, 
  BarChart3, 
  Trash2, 
  MoveUp, 
  Image, 
  Layers, 
  PauseCircle, 
  PlayCircle
} from "lucide-react";
import { SiFacebook, SiGoogle, SiSpotify } from "react-icons/si";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
  id: number;
  name: string;
  type: string;
  status: string;
  platforms: string[];
  performance: number;
  createdAt: string;
}

export default function Campaigns() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery<{ campaigns: Campaign[] }>({
    queryKey: ['/api/campaigns'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const filteredCampaigns = data?.campaigns
    .filter(campaign => 
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (statusFilter === "all" || campaign.status === statusFilter)
    ) || [];

  const handleStatusChange = async (campaignId: number, newStatus: string) => {
    try {
      await apiRequest("PUT", `/api/campaigns/${campaignId}`, { status: newStatus });
      
      // Invalidate and refetch campaigns
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      
      toast({
        title: "Status updated",
        description: `Campaign status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Failed to update status",
        description: "There was an error updating the campaign status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCampaign = async (campaignId: number) => {
    if (!confirm("Are you sure you want to delete this campaign?")) {
      return;
    }
    
    try {
      await apiRequest("DELETE", `/api/campaigns/${campaignId}`, undefined);
      
      // Invalidate and refetch campaigns
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      
      toast({
        title: "Campaign deleted",
        description: "The campaign has been successfully deleted.",
      });
    } catch (error) {
      toast({
        title: "Failed to delete",
        description: "There was an error deleting the campaign.",
        variant: "destructive",
      });
    }
  };

  // Helper function to get icon by campaign type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'audio':
        return <MoveUp className="text-primary" />;
      case 'visual':
        return <Image className="text-blue-500" />;
      case 'multi-format':
        return <Layers className="text-purple-500" />;
      default:
        return <MoveUp className="text-primary" />;
    }
  };

  // Helper function to format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Helper function to get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/50">Active</Badge>;
      case 'paused':
        return <Badge variant="outline" className="bg-amber-500/20 text-amber-500 border-amber-500/50">Paused</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-amber-500/20 text-amber-500 border-amber-500/50">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-500 border-blue-500/50">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <Skeleton className="h-10 w-36" />
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Campaigns</CardTitle>
              <div className="flex space-x-2">
                <Skeleton className="h-10 w-36" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Skeleton className="h-10 w-full sm:w-1/2 lg:w-1/3" />
                <Skeleton className="h-10 w-full sm:w-1/3 lg:w-1/4" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Link href="/create-ad">
          <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Campaign
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Campaigns</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative w-full sm:w-1/2 lg:w-1/3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search campaigns..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Tabs 
                defaultValue="all" 
                value={statusFilter} 
                onValueChange={setStatusFilter}
                className="w-full sm:w-auto"
              >
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="paused">Paused</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {filteredCampaigns.length === 0 ? (
              <div className="border border-dashed border-border rounded-lg p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your search or filter to find what you're looking for." 
                    : "Get started by creating your first campaign."}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Link href="/create-ad">
                    <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create New Campaign
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-muted-foreground">Campaign Name</TableHead>
                      <TableHead className="text-muted-foreground">Type</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Platform</TableHead>
                      <TableHead className="text-muted-foreground">Performance</TableHead>
                      <TableHead className="text-muted-foreground">Created</TableHead>
                      <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCampaigns.map(campaign => (
                      <TableRow key={campaign.id} className="hover:bg-secondary/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded bg-primary/20 flex items-center justify-center">
                              {getTypeIcon(campaign.type)}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium">{campaign.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {campaign.type === 'audio' && 'Audio Ad'}
                          {campaign.type === 'visual' && 'Visual Ad'}
                          {campaign.type === 'text' && 'Text Ad'}
                          {campaign.type === 'multi-format' && 'Multi-format'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(campaign.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            {campaign.platforms.includes('google') && <SiGoogle className="text-muted-foreground" />}
                            {campaign.platforms.includes('facebook') && <SiFacebook className="text-muted-foreground" />}
                            {campaign.platforms.includes('spotify') && <SiSpotify className="text-muted-foreground" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-16 h-2 bg-secondary rounded-full mr-2">
                              <div 
                                className={`h-full rounded-full ${
                                  campaign.performance >= 70 ? 'bg-green-500' : 
                                  campaign.performance >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                }`} 
                                style={{ width: `${campaign.performance}%` }}
                              />
                            </div>
                            <span className="text-xs">{campaign.performance}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {getRelativeTime(campaign.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  width="16" 
                                  height="16" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="12" cy="5" r="1" />
                                  <circle cx="12" cy="19" r="1" />
                                </svg>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <BarChart3 className="mr-2 h-4 w-4" />
                                <span>View Analytics</span>
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              {campaign.status === 'active' ? (
                                <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, 'paused')}>
                                  <PauseCircle className="mr-2 h-4 w-4" />
                                  <span>Pause Campaign</span>
                                </DropdownMenuItem>
                              ) : campaign.status === 'paused' ? (
                                <DropdownMenuItem onClick={() => handleStatusChange(campaign.id, 'active')}>
                                  <PlayCircle className="mr-2 h-4 w-4" />
                                  <span>Activate Campaign</span>
                                </DropdownMenuItem>
                              ) : null}
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem 
                                onClick={() => handleDeleteCampaign(campaign.id)}
                                className="text-red-500 focus:bg-red-500/10"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
