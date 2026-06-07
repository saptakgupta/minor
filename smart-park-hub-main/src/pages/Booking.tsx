import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Car, Clock, MapPin, Calendar, Wifi, WifiOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createBooking } from "@/lib/api";
import { useRealtimeParking } from "@/hooks/useRealtimeParking";

const Booking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preSelectedSlot = searchParams.get("slot") || "";
  const { slots, isLoading, error, isRealtimeConnected } = useRealtimeParking();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    slotId: preSelectedSlot,
    vehicleNumber: "",
    entryTime: "",
    duration: "",
  });

  const availableSlots = slots.filter((s) => s.status === "available");
  const selectedSlotData = slots.find((s) => s.id === formData.slotId);

  useEffect(() => {
    if (!formData.slotId || isLoading) return;

    const selected = slots.find((slot) => slot.id === formData.slotId);
    if (!selected || selected.status !== "available") {
      setFormData((current) => ({ ...current, slotId: "" }));
      toast({
        title: "Slot no longer available",
        description: "Please choose another live slot.",
        variant: "destructive",
      });
    }
  }, [formData.slotId, isLoading, slots]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.slotId || !formData.vehicleNumber || !formData.entryTime || !formData.duration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const booking = await createBooking(formData);

      toast({
        title: "Booking Confirmed",
        description: `Slot ${booking.slotId} has been reserved.`,
      });

      const params = new URLSearchParams({
        booking: booking.id,
        slot: booking.slotId,
        vehicle: booking.vehicleNumber,
        time: booking.entryTime,
        exit: booking.exitTime,
        duration: formData.duration,
      });

      navigate(`/confirmation?${params.toString()}`);
    } catch (requestError) {
      toast({
        title: "Booking Failed",
        description: requestError instanceof Error ? requestError.message : "Unable to create booking.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8 animate-fade-in">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Book a Parking Slot
                </h1>
                <p className="text-muted-foreground">
                  Reserve from backend-verified live availability
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm">
                {isRealtimeConnected ? (
                  <Wifi className="h-4 w-4 text-emerald-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-amber-600" />
                )}
                <span className="text-muted-foreground">{isRealtimeConnected ? "Realtime" : "Connecting"}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="md:col-span-2 animate-slide-up">
              <CardHeader>
                <CardTitle>Booking Details</CardTitle>
                <CardDescription>
                  Enter your vehicle information and preferred parking time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="slot">Select Parking Slot</Label>
                    <Select
                      value={formData.slotId}
                      onValueChange={(value) => setFormData({ ...formData, slotId: value })}
                      disabled={isLoading || isSubmitting}
                    >
                      <SelectTrigger id="slot">
                        <SelectValue placeholder={isLoading ? "Loading live slots..." : "Choose a slot"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.map((slot) => (
                          <SelectItem key={slot.id} value={slot.id}>
                            {slot.id} - Zone {slot.zone}, Floor {slot.floor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicle">Vehicle Number</Label>
                    <Input
                      id="vehicle"
                      placeholder="e.g., MH12AB1234"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                      className="uppercase"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Entry Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.entryTime}
                      onChange={(e) => setFormData({ ...formData, entryTime: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Parking Duration</Label>
                    <Select
                      value={formData.duration}
                      onValueChange={(value) => setFormData({ ...formData, duration: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="duration">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Hour</SelectItem>
                        <SelectItem value="2">2 Hours</SelectItem>
                        <SelectItem value="3">3 Hours</SelectItem>
                        <SelectItem value="4">4 Hours</SelectItem>
                        <SelectItem value="6">6 Hours</SelectItem>
                        <SelectItem value="8">8 Hours (Full Day)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Booking..." : "Book Slot"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6 animate-slide-up stagger-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selected Slot</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSlotData ? (
                    <div className="space-y-4">
                      <div className="w-full aspect-square bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center border-2 border-primary/20">
                        <div className="text-center">
                          <Car className="w-12 h-12 text-primary mx-auto mb-2" />
                          <p className="text-2xl font-bold text-foreground">{selectedSlotData.id}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>Zone {selectedSlotData.zone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>Floor {selectedSlotData.floor}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-emerald-600 font-medium">Available</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Car className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>Select a live slot to preview</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-foreground mb-2">Booking Policy</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Free cancellation up to 30 mins before</li>
                    <li>Slot held for 15 mins after entry time</li>
                    <li>Extensions available on-site</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Booking;
