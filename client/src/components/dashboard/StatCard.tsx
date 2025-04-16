import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change: {
    value: string;
    positive: boolean;
  };
  iconColor?: string;
}

export default function StatCard({ title, value, icon, change, iconColor = "bg-primary/20 text-primary" }: StatCardProps) {
  return (
    <Card className="p-5 border border-border">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-muted-foreground text-sm">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div className={cn("p-2 rounded-lg", iconColor)}>
          {icon}
        </div>
      </div>
      <div className={cn(
        "flex items-center text-sm",
        change.positive ? "text-green-500" : "text-red-500"
      )}>
        {change.positive 
          ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12 7a1 1 0 01-1 1H9v3a1 1 0 01-2 0V8H5a1 1 0 010-2h2V3a1 1 0 112 0v3h2a1 1 0 011 1z" clipRule="evenodd" />
            </svg>
          : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
        }
        <span>{change.value} from last month</span>
      </div>
    </Card>
  );
}
