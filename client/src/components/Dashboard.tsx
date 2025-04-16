import { MonitorPlay, Eye, MousePointer, ArrowRightLeft } from "lucide-react";
import StatCard from "./dashboard/StatCard";
import PerformanceChart from "./dashboard/PerformanceChart";
import QuickActions from "./dashboard/QuickActions";
import ConnectedPlatforms from "./dashboard/ConnectedPlatforms";
import CampaignTable from "./dashboard/CampaignTable";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { data: userData } = useQuery<{ user: { fullName: string } }>({
    queryKey: ['/api/auth/user'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const userName = userData?.user?.fullName?.split(' ')[0] || 'there';
  
  const stats = [
    {
      title: "Active Campaigns",
      value: "12",
      icon: <MonitorPlay className="h-5 w-5" />,
      change: { value: "16%", positive: true },
      iconColor: "bg-primary/20 text-primary"
    },
    {
      title: "Impressions",
      value: "289.4K",
      icon: <Eye className="h-5 w-5" />,
      change: { value: "23%", positive: true },
      iconColor: "bg-blue-400/20 text-blue-400"
    },
    {
      title: "Click Rate",
      value: "4.2%",
      icon: <MousePointer className="h-5 w-5" />,
      change: { value: "8%", positive: true },
      iconColor: "bg-green-400/20 text-green-400"
    },
    {
      title: "Conversion Rate",
      value: "1.7%",
      icon: <ArrowRightLeft className="h-5 w-5" />,
      change: { value: "3%", positive: false },
      iconColor: "bg-purple-400/20 text-purple-400"
    }
  ];

  return (
    <div>
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {userName}!</h1>
        <p className="text-muted-foreground">Here's how your ad campaigns are performing today.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            change={stat.change}
            iconColor={stat.iconColor}
          />
        ))}
      </div>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PerformanceChart />
        <div className="flex flex-col space-y-6">
          <QuickActions />
          <ConnectedPlatforms />
        </div>
      </div>

      {/* Recent Campaigns */}
      <CampaignTable />
    </div>
  );
}
