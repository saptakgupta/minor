import { useCallback, useEffect, useState } from "react";
import type { Booking, ParkingSlot } from "@/data/parkingData";
import type { SmartParkStats } from "@/lib/api";
import {
  fetchBookings,
  fetchSlots,
  fetchStats,
  subscribeParkingEvents,
} from "@/lib/api";

const emptyStats: SmartParkStats = {
  totalSlots: 0,
  availableSlots: 0,
  occupiedSlots: 0,
  reservedSlots: 0,
  activeBookings: 0,
};

export function useRealtimeParking() {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<SmartParkStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);

    try {
      const [nextSlots, nextBookings, nextStats] = await Promise.all([
        fetchSlots(),
        fetchBookings(),
        fetchStats(),
      ]);

      setSlots(nextSlots);
      setBookings(nextBookings);
      setStats(nextStats);
      setLastUpdated(new Date().toISOString());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load parking data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const unsubscribe = subscribeParkingEvents(
      (snapshot) => {
        setSlots(snapshot.slots);
        setBookings(snapshot.bookings);
        setStats(snapshot.stats);
        setLastUpdated(snapshot.timestamp);
        setIsLoading(false);
        setError(null);
        setIsRealtimeConnected(true);
      },
      () => {
        setIsRealtimeConnected(false);
      },
    );

    return unsubscribe;
  }, []);

  return {
    slots,
    bookings,
    stats,
    isLoading,
    error,
    isRealtimeConnected,
    lastUpdated,
    refresh,
  };
}
