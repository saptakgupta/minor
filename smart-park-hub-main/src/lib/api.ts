import type { Booking, ParkingSlot } from "@/data/parkingData";

export interface SmartParkStats {
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  activeBookings: number;
}

export interface RealtimeSnapshot {
  stats: SmartParkStats;
  slots: ParkingSlot[];
  bookings: Booking[];
  timestamp: string;
}

export interface CreateBookingPayload {
  slotId: string;
  vehicleNumber: string;
  entryTime: string;
  duration: string | number;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:3001/api").replace(/\/$/, "");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || "API request failed.");
  }

  return payload.data ?? payload;
}

export async function fetchStats() {
  return request<SmartParkStats>("/stats");
}

export async function fetchSlots() {
  return request<ParkingSlot[]>("/slots");
}

export async function fetchBookings() {
  return request<Booking[]>("/bookings");
}

export async function createBooking(payload: CreateBookingPayload) {
  return request<Booking>("/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSlot(slotId: string, payload: Partial<ParkingSlot>) {
  return request<ParkingSlot>(`/slots/${encodeURIComponent(slotId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateBookingStatus(bookingId: string, status: Booking["status"]) {
  return request<Booking>(`/bookings/${encodeURIComponent(bookingId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function subscribeParkingEvents(
  onSnapshot: (snapshot: RealtimeSnapshot) => void,
  onError?: () => void,
) {
  const source = new EventSource(`${API_BASE_URL}/events`);

  source.addEventListener("snapshot", (event) => {
    onSnapshot(JSON.parse((event as MessageEvent).data));
  });

  source.onerror = () => {
    onError?.();
  };

  return () => source.close();
}

