import { useMemo, useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import { Car, LocateFixed, MapPin } from "lucide-react";
import type { ParkingSlot, SlotStatus } from "@/data/parkingData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ParkingLocationMapProps {
  slots: ParkingSlot[];
  selectedSlot: string | null;
  onSelectSlot: (slotId: string) => void;
}

interface ZoneSummary {
  zone: string;
  position: LatLngExpression;
  slots: ParkingSlot[];
  available: ParkingSlot[];
  occupiedCount: number;
  reservedCount: number;
  dominantStatus: SlotStatus;
}

const facilityCenter: LatLngExpression = [18.5204, 73.8567];

const zoneCoordinates: Record<string, LatLngExpression> = {
  A: [18.52115, 73.8559],
  B: [18.52095, 73.85745],
  C: [18.51972, 73.85595],
  D: [18.51955, 73.85735],
};

const statusColors: Record<SlotStatus, { fill: string; stroke: string; className: string }> = {
  available: {
    fill: "#22c55e",
    stroke: "#15803d",
    className: "bg-emerald-500",
  },
  occupied: {
    fill: "#ef4444",
    stroke: "#b91c1c",
    className: "bg-red-500",
  },
  reserved: {
    fill: "#f59e0b",
    stroke: "#b45309",
    className: "bg-amber-500",
  },
};

const getGeneratedCoordinate = (zone: string, index: number): LatLngExpression => {
  const angle = (index / 8) * Math.PI * 2;
  const radius = 0.00125 + (zone.charCodeAt(0) % 3) * 0.00025;

  return [
    18.5204 + Math.sin(angle) * radius,
    73.8567 + Math.cos(angle) * radius,
  ];
};

const getDominantStatus = (summarySlots: ParkingSlot[]): SlotStatus => {
  if (summarySlots.some((slot) => slot.status === "available")) return "available";
  if (summarySlots.some((slot) => slot.status === "reserved")) return "reserved";
  return "occupied";
};

const FitMapToZones = ({ positions }: { positions: LatLngExpression[] }) => {
  const map = useMap();

  useEffect(() => {
    if (!positions.length) {
      map.setView(facilityCenter, 17);
      return;
    }

    const bounds = positions as LatLngBoundsExpression;
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 18 });
  }, [map, positions]);

  return null;
};

const ParkingLocationMap = ({ slots, selectedSlot, onSelectSlot }: ParkingLocationMapProps) => {
  const zoneSummaries = useMemo<ZoneSummary[]>(() => {
    const zones = Array.from(new Set(slots.map((slot) => slot.zone))).sort();

    return zones.map((zone, index) => {
      const zoneSlots = slots.filter((slot) => slot.zone === zone);
      const available = zoneSlots.filter((slot) => slot.status === "available");
      const occupiedCount = zoneSlots.filter((slot) => slot.status === "occupied").length;
      const reservedCount = zoneSlots.filter((slot) => slot.status === "reserved").length;

      return {
        zone,
        position: zoneCoordinates[zone] ?? getGeneratedCoordinate(zone, index),
        slots: zoneSlots,
        available,
        occupiedCount,
        reservedCount,
        dominantStatus: getDominantStatus(zoneSlots),
      };
    });
  }, [slots]);

  const selectedZone = useMemo(
    () => slots.find((slot) => slot.id === selectedSlot)?.zone ?? null,
    [selectedSlot, slots],
  );

  const positions = useMemo(() => zoneSummaries.map((summary) => summary.position), [zoneSummaries]);

  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Location Map</h2>
            <p className="text-sm text-muted-foreground">Zone-level view with live slot availability</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
          {(["available", "reserved", "occupied"] as SlotStatus[]).map((status) => (
            <span key={status} className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 capitalize">
              <span className={cn("h-2.5 w-2.5 rounded-full", statusColors[status].className)} />
              {status}
            </span>
          ))}
        </div>
      </div>

      <div className="grid min-h-[420px] lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="relative min-h-[420px]">
          <MapContainer
            center={facilityCenter}
            zoom={17}
            scrollWheelZoom
            className="h-[420px] min-h-[420px] w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitMapToZones positions={positions} />

            <CircleMarker
              center={facilityCenter}
              radius={9}
              pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.85, weight: 2 }}
            >
              <Tooltip direction="top" offset={[0, -8]} permanent>
                Entrance
              </Tooltip>
              <Popup>
                <div className="min-w-40">
                  <p className="font-semibold text-slate-900">Smart Park Hub</p>
                  <p className="mt-1 text-xs text-slate-600">Main entry and exit point</p>
                </div>
              </Popup>
            </CircleMarker>

            {zoneSummaries.map((summary) => {
              const colors = statusColors[summary.dominantStatus];
              const isSelectedZone = selectedZone === summary.zone;

              return (
                <CircleMarker
                  key={summary.zone}
                  center={summary.position}
                  radius={isSelectedZone ? 18 : 14}
                  pathOptions={{
                    color: colors.stroke,
                    fillColor: colors.fill,
                    fillOpacity: isSelectedZone ? 0.95 : 0.78,
                    weight: isSelectedZone ? 4 : 2,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -12]} permanent>
                    Zone {summary.zone}
                  </Tooltip>
                  <Popup>
                    <div className="w-56 space-y-3">
                      <div>
                        <p className="font-semibold text-slate-900">Zone {summary.zone}</p>
                        <p className="text-xs text-slate-600">
                          {summary.available.length} available of {summary.slots.length} slots
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
                          <strong className="block text-sm">{summary.available.length}</strong>
                          Free
                        </div>
                        <div className="rounded-md bg-amber-50 px-2 py-1 text-amber-700">
                          <strong className="block text-sm">{summary.reservedCount}</strong>
                          Held
                        </div>
                        <div className="rounded-md bg-red-50 px-2 py-1 text-red-700">
                          <strong className="block text-sm">{summary.occupiedCount}</strong>
                          Busy
                        </div>
                      </div>

                      {summary.available.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-slate-600">Quick select</p>
                          <div className="flex flex-wrap gap-2">
                            {summary.available.slice(0, 4).map((slot) => (
                              <Button
                                key={slot.id}
                                type="button"
                                size="sm"
                                variant={selectedSlot === slot.id ? "default" : "outline"}
                                className="h-8 px-2 text-xs"
                                onClick={() => onSelectSlot(slot.id)}
                              >
                                {slot.id}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="rounded-md bg-slate-100 px-2 py-1.5 text-xs text-slate-600">
                          No available slots in this zone.
                        </p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>

          {!zoneSummaries.length && (
            <div className="absolute inset-0 z-[500] flex items-center justify-center bg-background/80 p-6 text-center text-sm text-muted-foreground">
              No zones match the current filters.
            </div>
          )}
        </div>

        <div className="border-t border-border bg-secondary/30 p-4 lg:border-l lg:border-t-0">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <LocateFixed className="h-4 w-4 text-primary" />
            Zone Summary
          </div>

          <div className="space-y-3">
            {zoneSummaries.map((summary) => (
              <button
                key={summary.zone}
                type="button"
                disabled={!summary.available.length}
                onClick={() => summary.available[0] && onSelectSlot(summary.available[0].id)}
                className={cn(
                  "w-full rounded-lg border bg-card p-3 text-left transition-all",
                  selectedZone === summary.zone ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50",
                  !summary.available.length && "cursor-not-allowed opacity-70",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">Zone {summary.zone}</p>
                    <p className="text-xs text-muted-foreground">
                      {summary.available.length} available, {summary.slots.length} total
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Car className="h-5 w-5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ParkingLocationMap;
