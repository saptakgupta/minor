import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import ParkingLocationMap from "@/components/parking/ParkingLocationMap";
import ParkingMap from "@/components/parking/ParkingMap";
import SlotLegend from "@/components/parking/SlotLegend";
import StatCard from "@/components/parking/StatCard";
import { Button } from "@/components/ui/button";
import { useRealtimeParking } from "@/hooks/useRealtimeParking";
import { Car, CheckCircle, Clock, Filter, ParkingCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Availability = () => {
  const navigate = useNavigate();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [filterZone, setFilterZone] = useState<string>("all");
  const [filterFloor, setFilterFloor] = useState<string>("all");
  const {
    slots,
    stats,
    isLoading,
    error,
    isRealtimeConnected,
    lastUpdated,
    refresh,
  } = useRealtimeParking();

  const zones = useMemo(() => Array.from(new Set(slots.map((slot) => slot.zone))).sort(), [slots]);
  const floors = useMemo(
    () => Array.from(new Set(slots.map((slot) => slot.floor))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [slots],
  );

  const filteredSlots = useMemo(
    () =>
      slots.filter((slot) => {
        if (filterZone !== "all" && slot.zone !== filterZone) return false;
        if (filterFloor !== "all" && slot.floor !== filterFloor) return false;
        return true;
      }),
    [filterFloor, filterZone, slots],
  );

  useEffect(() => {
    if (!selectedSlot) return;

    const selected = slots.find((slot) => slot.id === selectedSlot);
    if (!selected || selected.status !== "available") {
      setSelectedSlot(null);
    }
  }, [selectedSlot, slots]);

  const handleSlotClick = (slotId: string) => {
    setSelectedSlot(slotId);
  };

  const handleBooking = () => {
    if (selectedSlot) {
      navigate(`/booking?slot=${selectedSlot}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <div className="mb-8 animate-fade-in">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Parking Availability
                </h1>
                <p className="text-muted-foreground">
                  Live parking map with backend-powered slot updates across zones and floors
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm">
                  {isRealtimeConnected ? (
                    <Wifi className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-amber-600" />
                  )}
                  <span className="text-muted-foreground">
                    {isRealtimeConnected ? "Realtime" : "Connecting"}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => refresh()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
            {lastUpdated && (
              <p className="mt-3 text-xs text-muted-foreground">
                Last update: {new Date(lastUpdated).toLocaleTimeString()}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Slots"
              value={stats.totalSlots}
              icon={ParkingCircle}
              color="primary"
            />
            <StatCard
              title="Available"
              value={stats.availableSlots}
              icon={CheckCircle}
              color="success"
            />
            <StatCard
              title="Occupied"
              value={stats.occupiedSlots}
              icon={Car}
              color="danger"
            />
            <StatCard
              title="Reserved"
              value={stats.reservedSlots}
              icon={Clock}
              color="warning"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
            <SlotLegend />

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filter:</span>
              </div>
              <Select value={filterZone} onValueChange={setFilterZone}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      Zone {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterFloor} onValueChange={setFilterFloor}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Floors</SelectItem>
                  {floors.map((floor) => (
                    <SelectItem key={floor} value={floor}>
                      Floor {floor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              Loading live parking map...
            </div>
          ) : (
            <>
              <ParkingLocationMap
                slots={filteredSlots}
                selectedSlot={selectedSlot}
                onSelectSlot={handleSlotClick}
              />
              <ParkingMap
                slots={filteredSlots}
                selectedSlot={selectedSlot}
                onSelectSlot={handleSlotClick}
              />
            </>
          )}

          {selectedSlot && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
              <div className="bg-card border border-border shadow-2xl rounded-2xl p-4 flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Car className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Selected Slot</p>
                    <p className="text-lg font-bold text-foreground">{selectedSlot}</p>
                  </div>
                </div>
                <Button variant="hero" onClick={handleBooking}>
                  Book Now
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Availability;
