import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ChartLegend } from "@/components/ui/chart";

declare global {
  interface Window {
    Chart: any;
  }
}

const timeRanges = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];

export default function PerformanceChart() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);
  const [timeRange, setTimeRange] = useState("month");
  
  // Normally this would fetch actual data based on the timeRange
  const { data: chartData } = useQuery({
    queryKey: ['/api/analytics/performance', timeRange],
    queryFn: async () => {
      // This would make an actual API call in production
      // For the MVP, return simulated data
      if (timeRange === "week") {
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          impressions: [12000, 15000, 18000, 15000, 21000, 25000, 22000],
          conversions: [600, 700, 900, 800, 1100, 1300, 1200]
        };
      } else if (timeRange === "month") {
        return {
          labels: ['Jan 1', 'Jan 8', 'Jan 15', 'Jan 22', 'Jan 29', 'Feb 5', 'Feb 12', 'Feb 19', 'Feb 26', 'Mar 5', 'Mar 12', 'Mar 19'],
          impressions: [12000, 19000, 15000, 28000, 25000, 32000, 30000, 25000, 27000, 35000, 40000, 38000],
          conversions: [500, 800, 700, 1200, 1500, 1700, 1400, 1600, 1800, 2000, 2100, 2300]
        };
      } else {
        return {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          impressions: [35000, 42000, 50000, 55000, 60000, 75000, 85000, 90000, 95000, 100000, 110000, 120000],
          conversions: [1800, 2100, 2500, 3000, 3500, 4000, 4500, 4700, 5000, 5200, 5500, 6000]
        };
      }
    },
  });

  useEffect(() => {
    if (!chartRef.current || !chartData || !window.Chart) return;
    
    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    // Create gradients
    const primaryGradient = ctx.createLinearGradient(0, 0, 0, 250);
    primaryGradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
    primaryGradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
    
    const accentGradient = ctx.createLinearGradient(0, 0, 0, 250);
    accentGradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
    accentGradient.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
    
    chartInstance.current = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Impressions',
            data: chartData.impressions,
            borderColor: 'hsl(var(--primary))',
            backgroundColor: primaryGradient,
            tension: 0.4,
            fill: true
          },
          {
            label: 'Conversions',
            data: chartData.conversions,
            borderColor: 'hsl(var(--accent))',
            backgroundColor: accentGradient,
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(75, 85, 99, 0.2)'
            },
            ticks: {
              color: 'hsl(var(--muted-foreground))',
              font: {
                family: 'Inter'
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(75, 85, 99, 0.2)'
            },
            ticks: {
              color: 'hsl(var(--muted-foreground))',
              font: {
                family: 'Inter'
              }
            }
          }
        }
      }
    });
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData]);

  return (
    <Card className="col-span-2">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Campaign Performance</h2>
          <div className="flex space-x-2">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? "secondary" : "ghost"}
                className={cn(
                  "text-sm",
                  timeRange === range.value && "bg-primary/20 text-primary"
                )}
                onClick={() => setTimeRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <canvas ref={chartRef} height="250"></canvas>
          <div className="mt-4 flex justify-center">
            <ChartLegend
              items={[
                { name: 'Impressions', color: 'hsl(var(--primary))' },
                { name: 'Conversions', color: 'hsl(var(--accent))' }
              ]}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
