import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "info";
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
}: StatsCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "border-success/20 bg-success/5";
      case "warning":
        return "border-warning/20 bg-warning/5";
      case "info":
        return "border-info/20 bg-info/5";
      default:
        return "border-primary/20 bg-primary/5";
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case "success":
        return "text-success bg-success/10";
      case "warning":
        return "text-warning bg-warning/10";
      case "info":
        return "text-info bg-info/10";
      default:
        return "text-primary bg-primary/10";
    }
  };

  return (
    <Card
      className={cn(
        "h-full transition-all duration-200 hover:shadow-md",
        getVariantStyles()
      )}
    >
      <CardContent className="p-6 sm:p-8 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between h-full">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>

            <div className="h-5">
              {trend && (
                <div className="flex items-center text-sm">
                  <span
                    className={cn(
                      "font-medium",
                      trend.isPositive ? "text-success" : "text-destructive"
                    )}
                  >
                    {trend.isPositive ? "+" : ""}
                    {trend.value}%
                  </span>
                  <span className="text-muted-foreground ml-1">
                    from last month
                  </span>
                </div>
              )}
            </div>
          </div>

          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              getIconStyles()
            )}
          >
            <Icon className="w-7 h-7" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
