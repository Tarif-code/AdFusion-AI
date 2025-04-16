import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Edit, BarChart3, MoreVertical, MoveUp, Image, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SiFacebook, SiGoogle, SiSpotify } from "react-icons/si";

interface Campaign {
  id: number;
  name: string;
  type: string;
  status: string;
  platforms: string[];
  performance: number;
  createdAt: string;
}

export default function CampaignTable() {
  const { data, isLoading } = useQuery<{ campaigns: Campaign[] }>({
    queryKey: ['/api/campaigns'],
    queryFn: async () => {
      // In a real implementation, this would fetch from the API
      // For the MVP, we'll simulate a response
      return {
        campaigns: [
          {
            id: 1,
            name: "Summer Sale Promo",
            type: "audio",
            status: "active",
            platforms: ["spotify", "google"],
            performance: 78,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            name: "New Product Launch",
            type: "visual",
            status: "active",
            platforms: ["facebook"],
            performance: 92,
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 3,
            name: "Fall Collection",
            type: "multi-format",
            status: "scheduled",
            platforms: ["google", "facebook", "spotify"],
            performance: 45,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      };
    }
  });

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
      <Card className="mt-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Campaigns</CardTitle>
            <Skeleton className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Recent Campaigns</CardTitle>
          <Button variant="link" className="text-primary hover:underline text-sm flex items-center">
            View All <span className="ml-1">→</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground">Campaign Name</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Platform</TableHead>
                <TableHead className="text-muted-foreground">Performance</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.campaigns.map(campaign => (
                <TableRow key={campaign.id} className="hover:bg-secondary/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded bg-primary/20 flex items-center justify-center">
                        {getTypeIcon(campaign.type)}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">Created {getRelativeTime(campaign.createdAt)}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {campaign.type === 'audio' && 'Audio Ad'}
                    {campaign.type === 'visual' && 'Visual Ad'}
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
                  <TableCell className="text-sm text-muted-foreground space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
