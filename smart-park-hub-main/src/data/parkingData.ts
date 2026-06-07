export type SlotStatus = "available" | "occupied" | "reserved";

export interface ParkingSlot {
  id: string;
  status: SlotStatus;
  zone: string;
  floor: string;
}

export interface Booking {
  id: string;
  vehicleNumber: string;
  slotId: string;
  entryTime: string;
  exitTime: string;
  status: "active" | "completed" | "cancelled";
}

export const parkingSlots: ParkingSlot[] = [
  { id: "A-01", status: "available", zone: "A", floor: "1" },
  { id: "A-02", status: "reserved", zone: "A", floor: "1" },
  { id: "A-03", status: "occupied", zone: "A", floor: "1" },
  { id: "A-04", status: "reserved", zone: "A", floor: "1" },
  { id: "A-05", status: "reserved", zone: "A", floor: "1" },
  { id: "A-06", status: "occupied", zone: "A", floor: "1" },
  { id: "B-01", status: "reserved", zone: "B", floor: "1" },
  { id: "B-02", status: "available", zone: "B", floor: "1" },
  { id: "B-03", status: "occupied", zone: "B", floor: "1" },
  { id: "B-04", status: "available", zone: "B", floor: "1" },
  { id: "B-05", status: "reserved", zone: "B", floor: "1" },
  { id: "B-06", status: "occupied", zone: "B", floor: "1" },
  { id: "C-01", status: "available", zone: "C", floor: "2" },
  { id: "C-02", status: "occupied", zone: "C", floor: "2" },
  { id: "C-03", status: "available", zone: "C", floor: "2" },
  { id: "C-04", status: "available", zone: "C", floor: "2" },
  { id: "C-05", status: "occupied", zone: "C", floor: "2" },
  { id: "C-06", status: "reserved", zone: "C", floor: "2" },
  { id: "D-01", status: "available", zone: "D", floor: "2" },
  { id: "D-02", status: "available", zone: "D", floor: "2" },
  { id: "D-03", status: "occupied", zone: "D", floor: "2" },
  { id: "D-04", status: "available", zone: "D", floor: "2" },
  { id: "D-05", status: "available", zone: "D", floor: "2" },
  { id: "D-06", status: "occupied", zone: "D", floor: "2" },
];

export const bookings: Booking[] = [
  { id: "BK273694", vehicleNumber: "MP41CB4141", slotId: "B-01", entryTime: "14:00", exitTime: "08:00 PM", status: "active" },
  { id: "BK894513", vehicleNumber: "MP41MP4141", slotId: "A-05", entryTime: "14:54", exitTime: "10:54 PM", status: "active" },
  { id: "BK487556", vehicleNumber: "MP41CB4141", slotId: "A-02", entryTime: "12:12", exitTime: "08:12 PM", status: "active" },
  { id: "BK060731", vehicleNumber: "MP41C0007", slotId: "A-03", entryTime: "12:00", exitTime: "02:00 PM", status: "active" },
  { id: "BK001", vehicleNumber: "MH12AB1234", slotId: "A-02", entryTime: "09:00 AM", exitTime: "11:00 AM", status: "active" },
  { id: "BK002", vehicleNumber: "DL05CD5678", slotId: "A-06", entryTime: "10:30 AM", exitTime: "12:30 PM", status: "active" },
  { id: "BK003", vehicleNumber: "KA01EF9012", slotId: "B-03", entryTime: "08:00 AM", exitTime: "10:00 AM", status: "completed" },
  { id: "BK004", vehicleNumber: "TN02GH3456", slotId: "B-06", entryTime: "11:00 AM", exitTime: "01:00 PM", status: "active" },
  { id: "BK005", vehicleNumber: "UP16IJ7890", slotId: "C-02", entryTime: "09:30 AM", exitTime: "11:30 AM", status: "active" },
  { id: "BK006", vehicleNumber: "GJ03KL1234", slotId: "C-05", entryTime: "07:00 AM", exitTime: "09:00 AM", status: "completed" },
  { id: "BK007", vehicleNumber: "RJ14MN5678", slotId: "D-03", entryTime: "10:00 AM", exitTime: "12:00 PM", status: "active" },
  { id: "BK008", vehicleNumber: "MP09OP9012", slotId: "D-06", entryTime: "08:30 AM", exitTime: "10:30 AM", status: "cancelled" },
];

export const stats = {
  "totalSlots": 24,
  "availableSlots": 10,
  "occupiedSlots": 8,
  "reservedSlots": 6,
  "activeBookings": 9
};
