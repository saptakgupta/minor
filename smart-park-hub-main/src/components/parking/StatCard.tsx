import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: "primary" | "success" | "warning" | "danger";
}

const colorConfig = {
  primary: "from-primary/10 to-primary/5 border-primary/20",
  success: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
  warning: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
  danger: "from-red-500/10 to-red-500/5 border-red-500/20",
};

const iconColorConfig = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600",
  warning: "bg-amber-500/10 text-amber-600",
  danger: "bg-red-500/10 text-red-600",
};

const StatCard = ({ title, value, icon: Icon, trend, trendUp, color = "primary" }: StatCardProps) => {
  return (
    <div className={cn(
      "stat-card bg-gradient-to-br border",
      colorConfig[color]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className={cn(
              "text-sm font-medium mt-1",
              trendUp ? "text-emerald-600" : "text-red-600"
            )}>
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconColorConfig[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
