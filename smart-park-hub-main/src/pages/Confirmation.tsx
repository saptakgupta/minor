import { useSearchParams, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Car, Clock, MapPin, ArrowRight, Download, Share2 } from "lucide-react";
import { useRealtimeParking } from "@/hooks/useRealtimeParking";
import { useAuth } from "@/hooks/useAuth";
import { createQrSvgDataUri } from "@/lib/qrCode";
import { toast } from "@/hooks/use-toast";

type ReceiptBaseDetails = {
  bookingId: string;
  slotId: string;
  vehicleNumber: string;
  entryTime: string;
  exitTime: string;
  duration: string;
  zone: string;
  floor: string;
  userId: string;
  userName: string;
  userEmail: string;
  verificationCode: string;
};

type ReceiptDetails = ReceiptBaseDetails & {
  qrPayload: string;
};

const fallbackText = (value: string | null | undefined, fallback = "N/A") => {
  const text = String(value || "").trim();
  return text || fallback;
};

const sanitizeQrValue = (value: string, maxLength: number) =>
  fallbackText(value)
    .replace(/[|\r\n]+/g, " ")
    .slice(0, maxLength);

const createVerificationCode = (parts: string[]) => {
  let hash = 2166136261;
  parts.join("|").split("").forEach((char) => {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  });

  return `SP-${(hash >>> 0).toString(36).toUpperCase().padStart(7, "0").slice(0, 8)}`;
};

const buildQrPayload = (details: ReceiptBaseDetails) =>
  [
    [details.bookingId, 18],
    [details.userId, 18],
    [details.userName, 22],
    [details.userEmail, 36],
    [details.vehicleNumber, 16],
    [details.slotId, 8],
    [details.entryTime, 10],
    [details.exitTime, 10],
    [`${details.duration}h`, 4],
    [details.verificationCode, 11],
  ]
    .map(([value, maxLength]) => sanitizeQrValue(String(value), Number(maxLength)))
    .join("|")
    .replace(/^/, "SPH1|");

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getReceiptRows = (details: ReceiptDetails) => [
  ["Booking ID", details.bookingId],
  ["Verification Code", details.verificationCode],
  ["Verified User", details.userName],
  ["User Email", details.userEmail],
  ["Vehicle", details.vehicleNumber],
  ["Slot Number", details.slotId],
  ["Location", `Zone ${details.zone}, Floor ${details.floor}`],
  ["Entry Time", details.entryTime],
  ["Exit Time", details.exitTime],
  ["Duration", `${details.duration} Hour(s)`],
];

const createReceiptHtml = (details: ReceiptDetails, qrCodeSrc: string) => {
  const rows = getReceiptRows(details)
    .map(
      ([label, value]) => `
        <tr>
          <th>${escapeHtml(label)}</th>
          <td>${escapeHtml(value)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SmartPark Receipt ${escapeHtml(details.bookingId)}</title>
  <style>
    body { margin: 0; background: #f4f7fb; color: #111827; font-family: Arial, sans-serif; }
    .receipt { max-width: 720px; margin: 32px auto; background: #fff; border: 1px solid #d7dee9; border-radius: 12px; overflow: hidden; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12); }
    .header { background: #1d4ed8; color: #fff; padding: 24px; }
    .header p { margin: 6px 0 0; opacity: 0.88; }
    h1 { margin: 0; font-size: 28px; }
    .content { padding: 24px; }
    .verification { display: flex; gap: 20px; align-items: center; padding: 18px; border: 1px solid #dbe4ef; border-radius: 10px; background: #f8fafc; margin-bottom: 20px; }
    .verification img { width: 150px; height: 150px; padding: 8px; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; }
    .verification strong { display: block; margin-top: 6px; font-size: 20px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: left; }
    th { width: 42%; color: #64748b; font-size: 14px; font-weight: 600; }
    td { color: #111827; font-weight: 700; }
    .footer { padding: 18px 24px; color: #64748b; font-size: 13px; background: #f8fafc; }
    @media print { body { background: #fff; } .receipt { margin: 0; box-shadow: none; border: 0; } }
  </style>
</head>
<body>
  <main class="receipt">
    <section class="header">
      <h1>SmartPark Parking Receipt</h1>
      <p>Booking ${escapeHtml(details.bookingId)}</p>
    </section>
    <section class="content">
      <div class="verification">
        <img src="${escapeHtml(qrCodeSrc)}" alt="Verification QR" />
        <div>
          <div>Receipt Verification</div>
          <strong>${escapeHtml(details.verificationCode)}</strong>
          <p>Verified user: ${escapeHtml(details.userName)}</p>
        </div>
      </div>
      <table>
        <tbody>${rows}</tbody>
      </table>
    </section>
    <section class="footer">Use the QR code and verification code to cross-check this receipt with the booking details.</section>
  </main>
</body>
</html>`;
};

const getShareText = (details: ReceiptDetails) =>
  getReceiptRows(details)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");

const Confirmation = () => {
  const [searchParams] = useSearchParams();
  const slotId = searchParams.get("slot") || "";
  const vehicleNumber = searchParams.get("vehicle") || "";
  const entryTime = searchParams.get("time") || "";
  const exitTime = searchParams.get("exit") || "";
  const duration = searchParams.get("duration") || "";
  const { slots } = useRealtimeParking();
  const { user } = useAuth();

  const slot = slots.find((s) => s.id === slotId);
  const [bookingId] = useState(() => searchParams.get("booking") || `BK${Date.now().toString().slice(-6)}`);
  const durationHours = Number.parseInt(duration, 10) || 0;

  // Timer countdown (visual only)
  const [timeLeft, setTimeLeft] = useState(durationHours * 60 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const receiptDetails = useMemo<ReceiptDetails>(() => {
    const verificationCode = createVerificationCode([
      bookingId,
      user?.id || "",
      user?.email || "",
      vehicleNumber,
      slotId,
      entryTime,
      exitTime,
      duration,
    ]);

    const baseDetails: ReceiptBaseDetails = {
      bookingId: fallbackText(bookingId),
      slotId: fallbackText(slotId),
      vehicleNumber: fallbackText(vehicleNumber),
      entryTime: fallbackText(entryTime),
      exitTime: fallbackText(exitTime),
      duration: fallbackText(duration, "0"),
      zone: fallbackText(slot?.zone),
      floor: fallbackText(slot?.floor),
      userId: fallbackText(user?.id, "SIGNED-IN-USER"),
      userName: fallbackText(user?.name, "Verified User"),
      userEmail: fallbackText(user?.email, "N/A"),
      verificationCode,
    };

    return {
      ...baseDetails,
      qrPayload: buildQrPayload(baseDetails),
    };
  }, [
    bookingId,
    duration,
    entryTime,
    exitTime,
    slot?.floor,
    slot?.zone,
    slotId,
    user?.email,
    user?.id,
    user?.name,
    vehicleNumber,
  ]);

  const qrCodeSrc = useMemo(() => createQrSvgDataUri(receiptDetails.qrPayload), [receiptDetails.qrPayload]);

  const handleDownloadReceipt = () => {
    const receiptHtml = createReceiptHtml(receiptDetails, qrCodeSrc);
    const blob = new Blob([receiptHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeBookingId = receiptDetails.bookingId.replace(/[^a-z0-9-]/gi, "_");

    link.href = url;
    link.download = `smartpark-receipt-${safeBookingId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Receipt downloaded",
      description: `Saved receipt for booking ${receiptDetails.bookingId}.`,
    });
  };

  const handleShareDetails = async () => {
    const text = getShareText(receiptDetails);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `SmartPark Receipt ${receiptDetails.bookingId}`,
          text,
        });
        return;
      }

      await navigator.clipboard.writeText(text);
      toast({
        title: "Details copied",
        description: "Receipt details are ready to share.",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      toast({
        title: "Share failed",
        description: "Unable to share receipt details from this browser.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Success Message */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-muted-foreground">
              Your parking slot has been successfully reserved
            </p>
          </div>

          {/* Booking Card */}
          <Card className="mb-6 overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-r from-primary to-accent p-6 text-primary-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Booking ID</p>
                  <p className="text-2xl font-bold">{bookingId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">Slot Number</p>
                  <p className="text-2xl font-bold">{slotId}</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle</p>
                    <p className="font-semibold text-foreground">{vehicleNumber}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Entry Time</p>
                    <p className="font-semibold text-foreground">{entryTime}</p>
                    {exitTime && (
                      <p className="text-xs text-muted-foreground mt-1">Exit {exitTime}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-semibold text-foreground">
                      Zone {receiptDetails.zone}, Floor {receiptDetails.floor}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-semibold text-foreground">{receiptDetails.duration} Hour(s)</p>
                  </div>
                </div>
              </div>

              <div className="mb-6 rounded-xl border border-border bg-secondary/40 p-4">
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <img
                    src={qrCodeSrc}
                    alt={`Verification QR for booking ${receiptDetails.bookingId}`}
                    className="h-32 w-32 rounded-lg border border-border bg-white p-2"
                  />
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <p className="text-sm text-muted-foreground">Receipt Verification</p>
                    <p className="text-xl font-bold text-foreground">{receiptDetails.verificationCode}</p>
                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                      <div className="min-w-0">
                        <p className="text-muted-foreground">Verified User</p>
                        <p className="truncate font-semibold text-foreground">{receiptDetails.userName}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-muted-foreground">User Email</p>
                        <p className="truncate font-semibold text-foreground">{receiptDetails.userEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timer */}
              <div className="bg-secondary/50 rounded-xl p-6 text-center">
                <p className="text-sm text-muted-foreground mb-2">Time Remaining</p>
                <p className="text-4xl font-mono font-bold text-foreground tracking-wider">
                  {formatTime(timeLeft)}
                </p>
                <div className="w-full bg-secondary rounded-full h-2 mt-4">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${durationHours ? (timeLeft / (durationHours * 3600)) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center animate-slide-up stagger-2">
            <Button variant="outline" size="lg" onClick={handleDownloadReceipt}>
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
            <Button variant="outline" size="lg" onClick={handleShareDetails}>
              <Share2 className="w-4 h-4 mr-2" />
              Share Details
            </Button>
          </div>

          {/* Navigation */}
          <div className="mt-8 text-center">
            <Link to="/">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Back to Home
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Confirmation;
