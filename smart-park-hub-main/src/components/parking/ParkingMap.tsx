import type { ParkingSlot, SlotStatus } from "@/data/parkingData";
import { cn } from "@/lib/utils";
import { Car, MapPinned, Navigation } from "lucide-react";

interface ParkingMapProps {
  slots: ParkingSlot[];
  selectedSlot: string | null;
  onSelectSlot: (slotId: string) => void;
}

const statusStyles: Record<SlotStatus, string> = {
  available: "border-emerald-300 bg-emerald-50 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-100",
  occupied: "border-red-300 bg-red-50 text-red-800 opacity-75",
  reserved: "border-amber-300 bg-amber-50 text-amber-800 opacity-85",
};

const statusDotStyles: Record<SlotStatus, string> = {
  available: "bg-emerald-500",
  occupied: "bg-red-500",
  reserved: "bg-amber-500",
};

const statusLabels: Record<SlotStatus, string> = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
};

const sortSlots = (a: ParkingSlot, b: ParkingSlot) =>
  a.floor.localeCompare(b.floor, undefined, { numeric: true }) ||
  a.zone.localeCompare(b.zone) ||
  a.id.localeCompare(b.id, undefined, { numeric: true });

const ParkingMap = ({ slots, selectedSlot, onSelectSlot }: ParkingMapProps) => {
  const floors = Array.from(new Set(slots.map((slot) => slot.floor))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );

  if (!slots.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
        <MapPinned className="mx-auto mb-3 h-8 w-8 opacity-50" />
        <p>No parking slots match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {floors.map((floor) => {
        const floorSlots = slots.filter((slot) => slot.floor === floor).sort(sortSlots);
        const zones = Array.from(new Set(floorSlots.map((slot) => slot.zone))).sort();

        return (
          <section key={floor} className="rounded-xl border border-border bg-card p-4 shadow-sm md:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPinned className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Floor {floor}</h2>
                  <p className="text-sm text-muted-foreground">{floorSlots.length} slots across {zones.length} zones</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Live Map
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_120px_1fr]">
              <div className="grid gap-4 sm:grid-cols-2">
                {zones.slice(0, Math.ceil(zones.length / 2)).map((zone) => (
                  <ZoneBlock
                    key={zone}
                    zone={zone}
                    slots={floorSlots.filter((slot) => slot.zone === zone)}
                    selectedSlot={selectedSlot}
                    onSelectSlot={onSelectSlot}
                  />
                ))}
              </div>

              <div className="flex min-h-24 flex-col items-center justify-between rounded-lg border border-dashed border-border bg-secondary/40 px-3 py-4 text-center">
                <Navigation className="h-5 w-5 text-primary" />
                <div className="text-xs font-semibold uppercase text-muted-foreground">Drive Lane</div>
                <div className="h-10 w-px bg-border" />
                <div className="text-xs font-medium text-foreground">Entry / Exit</div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {zones.slice(Math.ceil(zones.length / 2)).map((zone) => (
                  <ZoneBlock
                    key={zone}
                    zone={zone}
                    slots={floorSlots.filter((slot) => slot.zone === zone)}
                    selectedSlot={selectedSlot}
                    onSelectSlot={onSelectSlot}
                  />
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

interface ZoneBlockProps {
  zone: string;
  slots: ParkingSlot[];
  selectedSlot: string | null;
  onSelectSlot: (slotId: string) => void;
}

const ZoneBlock = ({ zone, slots, selectedSlot, onSelectSlot }: ZoneBlockProps) => {
  const available = slots.filter((slot) => slot.status === "available").length;

  return (
    <div className="rounded-lg border border-border/70 bg-background p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Zone {zone}</h3>
          <p className="text-xs text-muted-foreground">{available} available</p>
        </div>
        <div className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
          {slots.length} bays
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot) => {
          const isAvailable = slot.status === "available";
          const isSelected = selectedSlot === slot.id;

          return (
            <button
              key={slot.id}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelectSlot(slot.id)}
              className={cn(
                "flex min-h-20 flex-col justify-between rounded-lg border-2 p-2 text-left transition-all",
                statusStyles[slot.status],
                isAvailable && "cursor-pointer",
                !isAvailable && "cursor-not-allowed",
                isSelected && "ring-2 ring-primary ring-offset-2",
              )}
              aria-label={`${slot.id}, ${statusLabels[slot.status]}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{slot.id}</span>
                <span className={cn("h-2.5 w-2.5 rounded-full", statusDotStyles[slot.status])} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <Car className="h-4 w-4" />
                <span>{statusLabels[slot.status]}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ParkingMap;
