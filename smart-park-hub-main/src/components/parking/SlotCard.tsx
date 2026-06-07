import { cn } from "@/lib/utils";
import { Car, Clock } from "lucide-react";

export type SlotStatus = "available" | "occupied" | "reserved";

interface SlotCardProps {
  id: string;
  status: SlotStatus;
  zone: string;
  floor: string;
  onClick?: () => void;
  selected?: boolean;
}

const statusConfig = {
  available: {
    label: "Available",
    className: "slot-available",
    dotColor: "bg-status-available",
  },
  occupied: {
    label: "Occupied",
    className: "slot-occupied",
    dotColor: "bg-status-occupied",
  },
  reserved: {
    label: "Reserved",
    className: "slot-reserved",
    dotColor: "bg-status-reserved",
  },
};

const SlotCard = ({ id, status, zone, floor, onClick, selected }: SlotCardProps) => {
  const config = statusConfig[status];

  return (
    <div
      onClick={status === "available" ? onClick : undefined}
      className={cn(
        "slot-card",
        config.className,
        selected && "ring-2 ring-primary ring-offset-2",
        status === "available" && "hover:scale-105"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-lg font-bold text-foreground">{id}</span>
        <div className={cn("w-3 h-3 rounded-full animate-pulse", config.dotColor)} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Car className="w-4 h-4" />
          <span>Zone {zone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Floor {floor}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border/50">
        <span
          className={cn(
            "text-xs font-semibold px-2 py-1 rounded-full",
            status === "available" && "bg-emerald-100 text-emerald-700",
            status === "occupied" && "bg-red-100 text-red-700",
            status === "reserved" && "bg-amber-100 text-amber-700"
          )}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
};

export default SlotCard;
