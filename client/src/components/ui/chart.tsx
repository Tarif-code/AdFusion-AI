import { cn } from "@/lib/utils";

interface ChartLegendProps {
  items: {
    name: string;
    color: string;
  }[];
  className?: string;
}

export function ChartLegend({ items, className }: ChartLegendProps) {
  return (
    <div className={cn("flex flex-wrap gap-4 items-center justify-center", className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm text-muted-foreground">{item.name}</span>
        </div>
      ))}
    </div>
  );
}
