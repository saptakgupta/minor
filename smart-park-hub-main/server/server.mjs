import { createServer as createHttpServer } from "node:http";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { bookings, parkingSlots } from "../src/data/parkingData.ts";

if (existsSync(".env")) {
  loadEnvFile(".env");
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.resolve(__dirname, "../src/data/parkingData.ts");
const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number.parseInt(process.env.PORT || "3001", 10);
const BODY_LIMIT_BYTES = Number.parseInt(process.env.BODY_LIMIT_BYTES || "1048576", 10);
const RATE_LIMIT_WINDOW_MS = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);
const RATE_LIMIT_MAX = Number.parseInt(process.env.RATE_LIMIT_MAX || "120", 10);
const CORS_ORIGINS = (
  process.env.CORS_ORIGIN || "http://localhost:8080,http://127.0.0.1:8080,http://localhost:5173,https://*.vercel.app"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const SLOT_STATUSES = new Set(["available", "occupied", "reserved"]);
const BOOKING_STATUSES = new Set(["active", "completed", "cancelled"]);
const ALLOWED_DURATIONS = new Set([1, 2, 3, 4, 6, 8]);
const rateLimitStore = new Map();
const eventClients = new Set();

function getStats() {
  return {
    totalSlots: parkingSlots.length,
    availableSlots: parkingSlots.filter((slot) => slot.status === "available").length,
    occupiedSlots: parkingSlots.filter((slot) => slot.status === "occupied").length,
    reservedSlots: parkingSlots.filter((slot) => slot.status === "reserved").length,
    activeBookings: bookings.filter((booking) => booking.status === "active").length,
  };
}

function serializeData() {
  const slotRows = parkingSlots
    .map((slot) => `  { id: ${q(slot.id)}, status: ${q(slot.status)}, zone: ${q(slot.zone)}, floor: ${q(slot.floor)} },`)
    .join("\n");
  const bookingRows = bookings
    .map(
      (booking) =>
        `  { id: ${q(booking.id)}, vehicleNumber: ${q(booking.vehicleNumber)}, slotId: ${q(
          booking.slotId,
        )}, entryTime: ${q(booking.entryTime)}, exitTime: ${q(booking.exitTime)}, status: ${q(booking.status)} },`,
    )
    .join("\n");

  return `export type SlotStatus = "available" | "occupied" | "reserved";

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
${slotRows}
];

export const bookings: Booking[] = [
${bookingRows}
];

export const stats = ${JSON.stringify(getStats(), null, 2)};\n`;
}

async function persistData() {
  if (process.env.SMARTPARK_DISABLE_PERSIST === "1") {
    return;
  }

  await writeFile(DATA_FILE, serializeData(), "utf8");
}

async function commitData() {
  await persistData();
  broadcastRealtime();
}

function getSnapshot() {
  return {
    stats: getStats(),
    slots: parkingSlots,
    bookings,
    timestamp: new Date().toISOString(),
  };
}

function writeSseEvent(res, eventName, payload) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function broadcastRealtime(eventName = "snapshot") {
  const payload = getSnapshot();

  for (const client of eventClients) {
    writeSseEvent(client.res, eventName, payload);
  }
}

function q(value) {
  return JSON.stringify(value);
}

function normalizeId(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeVehicleNumber(value) {
  return normalizeString(value).toUpperCase().replace(/\s+/g, "");
}

function isValidVehicleNumber(value) {
  return /^[A-Z0-9-]{4,20}$/.test(value);
}

function createBookingId() {
  const existingIds = new Set(bookings.map((booking) => booking.id));

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const id = `BK${Date.now().toString().slice(-6)}${attempt ? attempt.toString().padStart(2, "0") : ""}`;
    if (!existingIds.has(id)) {
      return id;
    }
  }

  return `BK${randomUUID().slice(0, 8).toUpperCase()}`;
}

function parseEntryTime(value) {
  const time = normalizeString(value);
  const twentyFourHour = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (twentyFourHour) {
    return {
      hour: Number(twentyFourHour[1]),
      minute: Number(twentyFourHour[2]),
      display: time,
    };
  }

  const twelveHour = /^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i.exec(time);
  if (!twelveHour) {
    return null;
  }

  const period = twelveHour[3].toUpperCase();
  const rawHour = Number(twelveHour[1]);
  const hour = period === "AM" ? rawHour % 12 : (rawHour % 12) + 12;

  return {
    hour,
    minute: Number(twelveHour[2]),
    display: `${String(rawHour).padStart(2, "0")}:${twelveHour[2]} ${period}`,
  };
}

function formatDisplayTime(hour, minute) {
  const normalizedHour = ((hour % 24) + 24) % 24;
  const period = normalizedHour >= 12 ? "PM" : "AM";
  const hour12 = normalizedHour % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
}

function calculateExitTime(entryTime, duration) {
  return formatDisplayTime(entryTime.hour + duration, entryTime.minute);
}

function findSlot(id) {
  return parkingSlots.find((slot) => slot.id.toUpperCase() === normalizeId(id));
}

function findBooking(id) {
  return bookings.find((booking) => booking.id.toUpperCase() === normalizeId(id));
}

function getClientIp(req) {
  return (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").toString().split(",")[0].trim();
}

function isRateLimited(req) {
  if (RATE_LIMIT_MAX <= 0) {
    return false;
  }

  const ip = getClientIp(req);
  const now = Date.now();
  const current = rateLimitStore.get(ip);

  if (!current || now > current.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX;
}

function applySecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isCorsOriginAllowed(origin) {
  if (!origin) {
    return false;
  }

  return CORS_ORIGINS.some((allowedOrigin) => {
    if (allowedOrigin === "*" || allowedOrigin === origin) {
      return true;
    }

    if (!allowedOrigin.includes("*")) {
      return false;
    }

    const pattern = `^${allowedOrigin.split("*").map(escapeRegExp).join(".*")}$`;
    return new RegExp(pattern).test(origin);
  });
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  const allowAll = CORS_ORIGINS.includes("*");

  if (allowAll) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (isCorsOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendError(res, statusCode, message, details) {
  sendJson(res, statusCode, {
    error: {
      message,
      ...(details ? { details } : {}),
    },
  });
}

async function readJsonBody(req) {
  let size = 0;
  const chunks = [];

  for await (const chunk of req) {
    size += chunk.length;
    if (size > BODY_LIMIT_BYTES) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

function parseRoute(req) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const segments = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  return { url, segments };
}

function getApiIndex() {
  return {
    name: "SmartPark API",
    version: "1.0.0",
    endpoints: [
      "GET /api/health",
      "GET /api/events",
      "GET /api/stats",
      "GET /api/slots",
      "GET /api/slots/:id",
      "POST /api/slots",
      "PATCH /api/slots/:id",
      "DELETE /api/slots/:id",
      "GET /api/bookings",
      "GET /api/bookings/:id",
      "POST /api/bookings",
      "PATCH /api/bookings/:id",
      "DELETE /api/bookings/:id",
    ],
  };
}

function handleEvents(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store",
    Connection: "keep-alive",
  });

  const client = { res };
  eventClients.add(client);
  writeSseEvent(res, "snapshot", getSnapshot());

  const heartbeat = setInterval(() => {
    res.write("event: heartbeat\n");
    res.write(`data: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
  }, 15000);
  heartbeat.unref?.();

  req.on("close", () => {
    clearInterval(heartbeat);
    eventClients.delete(client);
  });
}

async function handleSlots(req, res, url, segments) {
  const slotId = segments[2];

  if (req.method === "GET" && !slotId) {
    const zone = url.searchParams.get("zone");
    const floor = url.searchParams.get("floor");
    const status = url.searchParams.get("status");

    const slots = parkingSlots.filter((slot) => {
      if (zone && zone !== "all" && slot.zone.toUpperCase() !== zone.toUpperCase()) return false;
      if (floor && floor !== "all" && slot.floor !== floor) return false;
      if (status && status !== "all" && slot.status !== status) return false;
      return true;
    });

    sendJson(res, 200, { data: slots, meta: { count: slots.length } });
    return;
  }

  if (req.method === "GET" && slotId) {
    const slot = findSlot(slotId);
    if (!slot) {
      sendError(res, 404, "Slot not found.");
      return;
    }

    sendJson(res, 200, { data: slot });
    return;
  }

  if (req.method === "POST" && !slotId) {
    const body = await readJsonBody(req);
    const id = normalizeId(body.id);
    const zone = normalizeString(body.zone).toUpperCase();
    const floor = normalizeString(body.floor);
    const status = body.status || "available";

    if (!id || !zone || !floor) {
      sendError(res, 400, "Slot id, zone, and floor are required.");
      return;
    }

    if (!SLOT_STATUSES.has(status)) {
      sendError(res, 400, "Invalid slot status.");
      return;
    }

    if (findSlot(id)) {
      sendError(res, 409, "Slot already exists.");
      return;
    }

    const slot = { id, status, zone, floor };
    parkingSlots.push(slot);
    await commitData();
    sendJson(res, 201, { data: slot });
    return;
  }

  if (req.method === "PATCH" && slotId) {
    const slot = findSlot(slotId);
    if (!slot) {
      sendError(res, 404, "Slot not found.");
      return;
    }

    const body = await readJsonBody(req);
    const nextStatus = body.status ?? slot.status;
    const nextZone = body.zone === undefined ? slot.zone : normalizeString(body.zone).toUpperCase();
    const nextFloor = body.floor === undefined ? slot.floor : normalizeString(body.floor);

    if (!SLOT_STATUSES.has(nextStatus)) {
      sendError(res, 400, "Invalid slot status.");
      return;
    }

    if (!nextZone || !nextFloor) {
      sendError(res, 400, "Zone and floor cannot be empty.");
      return;
    }

    slot.status = nextStatus;
    slot.zone = nextZone;
    slot.floor = nextFloor;
    await commitData();
    sendJson(res, 200, { data: slot });
    return;
  }

  if (req.method === "DELETE" && slotId) {
    const slotIndex = parkingSlots.findIndex((slot) => slot.id.toUpperCase() === normalizeId(slotId));
    if (slotIndex === -1) {
      sendError(res, 404, "Slot not found.");
      return;
    }

    const hasActiveBooking = bookings.some(
      (booking) => booking.slotId.toUpperCase() === normalizeId(slotId) && booking.status === "active",
    );
    if (hasActiveBooking) {
      sendError(res, 409, "Slot has an active booking and cannot be deleted.");
      return;
    }

    const [removedSlot] = parkingSlots.splice(slotIndex, 1);
    await commitData();
    sendJson(res, 200, { data: removedSlot });
    return;
  }

  sendError(res, 405, "Method not allowed.");
}

async function handleBookings(req, res, url, segments) {
  const bookingId = segments[2];

  if (req.method === "GET" && !bookingId) {
    const search = normalizeString(url.searchParams.get("search")).toLowerCase();
    const status = url.searchParams.get("status");

    const filteredBookings = bookings.filter((booking) => {
      const matchesSearch =
        !search ||
        booking.id.toLowerCase().includes(search) ||
        booking.vehicleNumber.toLowerCase().includes(search) ||
        booking.slotId.toLowerCase().includes(search);
      const matchesStatus = !status || status === "all" || booking.status === status;
      return matchesSearch && matchesStatus;
    });

    sendJson(res, 200, { data: filteredBookings, meta: { count: filteredBookings.length } });
    return;
  }

  if (req.method === "GET" && bookingId) {
    const booking = findBooking(bookingId);
    if (!booking) {
      sendError(res, 404, "Booking not found.");
      return;
    }

    sendJson(res, 200, { data: booking });
    return;
  }

  if (req.method === "POST" && !bookingId) {
    const body = await readJsonBody(req);
    const slotId = normalizeId(body.slotId);
    const vehicleNumber = normalizeVehicleNumber(body.vehicleNumber);
    const entryTime = parseEntryTime(body.entryTime);
    const duration = Number.parseInt(body.duration, 10);
    const slot = findSlot(slotId);

    if (!slotId || !vehicleNumber || !entryTime || Number.isNaN(duration)) {
      sendError(res, 400, "Slot id, vehicle number, entry time, and duration are required.");
      return;
    }

    if (!isValidVehicleNumber(vehicleNumber)) {
      sendError(res, 400, "Vehicle number must be 4 to 20 letters, numbers, or hyphens.");
      return;
    }

    if (!ALLOWED_DURATIONS.has(duration)) {
      sendError(res, 400, "Duration must be one of 1, 2, 3, 4, 6, or 8 hours.");
      return;
    }

    if (!slot) {
      sendError(res, 404, "Slot not found.");
      return;
    }

    if (slot.status !== "available") {
      sendError(res, 409, "Slot is not available for booking.");
      return;
    }

    const booking = {
      id: createBookingId(),
      vehicleNumber,
      slotId: slot.id,
      entryTime: entryTime.display,
      exitTime: calculateExitTime(entryTime, duration),
      status: "active",
    };

    bookings.unshift(booking);
    slot.status = "reserved";
    await commitData();
    sendJson(res, 201, { data: booking });
    return;
  }

  if (req.method === "PATCH" && bookingId) {
    const booking = findBooking(bookingId);
    if (!booking) {
      sendError(res, 404, "Booking not found.");
      return;
    }

    const body = await readJsonBody(req);
    const nextStatus = body.status ?? booking.status;

    if (!BOOKING_STATUSES.has(nextStatus)) {
      sendError(res, 400, "Invalid booking status.");
      return;
    }

    booking.status = nextStatus;

    const slot = findSlot(booking.slotId);
    if (slot && (nextStatus === "completed" || nextStatus === "cancelled")) {
      slot.status = "available";
    }
    if (slot && nextStatus === "active" && slot.status === "available") {
      slot.status = "reserved";
    }

    await commitData();
    sendJson(res, 200, { data: booking });
    return;
  }

  if (req.method === "DELETE" && bookingId) {
    const bookingIndex = bookings.findIndex((booking) => booking.id.toUpperCase() === normalizeId(bookingId));
    if (bookingIndex === -1) {
      sendError(res, 404, "Booking not found.");
      return;
    }

    const [removedBooking] = bookings.splice(bookingIndex, 1);
    const slot = findSlot(removedBooking.slotId);
    if (slot && removedBooking.status === "active") {
      slot.status = "available";
    }

    await commitData();
    sendJson(res, 200, { data: removedBooking });
    return;
  }

  sendError(res, 405, "Method not allowed.");
}

export async function handleApiRequest(req, res) {
  applySecurityHeaders(res);
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const { url, segments } = parseRoute(req);

    if (segments[0] !== "api") {
      sendError(res, 404, "Route not found.");
      return;
    }

    if (segments[1] === "events" && req.method === "GET") {
      handleEvents(req, res);
      return;
    }

    if (isRateLimited(req)) {
      sendError(res, 429, "Too many requests. Please try again later.");
      return;
    }

    if (segments.length === 1 && req.method === "GET") {
      sendJson(res, 200, getApiIndex());
      return;
    }

    if (segments[1] === "health" && req.method === "GET") {
      sendJson(res, 200, {
        status: "ok",
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (segments[1] === "stats" && req.method === "GET") {
      sendJson(res, 200, { data: getStats() });
      return;
    }

    if (segments[1] === "slots") {
      await handleSlots(req, res, url, segments);
      return;
    }

    if (segments[1] === "bookings") {
      await handleBookings(req, res, url, segments);
      return;
    }

    sendError(res, 404, "Route not found.");
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Internal server error." : error.message;
    sendError(res, statusCode, message);
  }
}

export function createSmartParkServer() {
  return createHttpServer(handleApiRequest);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const server = createSmartParkServer();

  server.listen(PORT, HOST, () => {
    console.log(`SmartPark API running at http://${HOST}:${PORT}/api`);
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
