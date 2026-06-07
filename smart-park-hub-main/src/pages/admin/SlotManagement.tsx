import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Car, LayoutDashboard, ParkingCircle, ClipboardList, ChevronLeft, Edit2, MoreVertical, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ParkingSlot } from "@/data/parkingData";
import { toast } from "@/hooks/use-toast";
import { updateSlot } from "@/lib/api";
import { useRealtimeParking } from "@/hooks/useRealtimeParking";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SlotManagement = () => {
  const location = useLocation();
  const { slots, error, isLoading, isRealtimeConnected } = useRealtimeParking();
  const [editingSlot, setEditingSlot] = useState<ParkingSlot | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [updatingSlotId, setUpdatingSlotId] = useState<string | null>(null);

  const sidebarLinks = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/slots", icon: ParkingCircle, label: "Slot Management" },
    { to: "/admin/bookings", icon: ClipboardList, label: "Booking Records" },
  ];

  const filteredSlots = useMemo(
    () => slots.filter((slot) => (filterStatus === "all" ? true : slot.status === filterStatus)),
    [filterStatus, slots],
  );

  const handleStatusChange = async (slotId: string, newStatus: ParkingSlot["status"]) => {
    setUpdatingSlotId(slotId);

    try {
      await updateSlot(slotId, { status: newStatus });
      toast({
        title: "Status Updated",
        description: `Slot ${slotId} is now ${newStatus}`,
      });
    } catch (requestError) {
      toast({
        title: "Update Failed",
        description: requestError instanceof Error ? requestError.message : "Unable to update slot.",
        variant: "destructive",
      });
    } finally {
      setUpdatingSlotId(null);
    }
  };

  const handleEditSave = async () => {
    if (!editingSlot) return;

    setUpdatingSlotId(editingSlot.id);

    try {
      await updateSlot(editingSlot.id, {
        zone: editingSlot.zone,
        floor: editingSlot.floor,
      });
      toast({
        title: "Slot Updated",
        description: `Changes saved for slot ${editingSlot.id}`,
      });
      setEditingSlot(null);
    } catch (requestError) {
      toast({
        title: "Update Failed",
        description: requestError instanceof Error ? requestError.message : "Unable to update slot.",
        variant: "destructive",
      });
    } finally {
      setUpdatingSlotId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-card border-r border-border hidden md:block">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-8 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Car className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">SmartPark</span>
          </Link>

          <nav className="space-y-2">
            {sidebarLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  location.pathname === link.to
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <link.icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-6 left-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8">
        <div className="md:hidden mb-6">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm text-muted-foreground">Back</span>
          </Link>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sidebarLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm transition-all",
                  location.pathname === link.to
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Slot Management
              </h1>
              <p className="text-muted-foreground">
                Manage live parking slots, update statuses, and configure zones
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm">
                {isRealtimeConnected ? (
                  <Wifi className="h-4 w-4 text-emerald-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-amber-600" />
                )}
                <span className="text-muted-foreground">{isRealtimeConnected ? "Realtime" : "Connecting"}</span>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Slots</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              Loading live slots...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="bg-card rounded-xl p-5 border border-border shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <ParkingCircle className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{slot.id}</p>
                        <p className="text-sm text-muted-foreground">
                          Zone {slot.zone} - Floor {slot.floor}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingSlot(slot)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit Slot
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Select
                        value={slot.status}
                        onValueChange={(value) => handleStatusChange(slot.id, value as ParkingSlot["status"])}
                        disabled={updatingSlotId === slot.id}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Available
                            </span>
                          </SelectItem>
                          <SelectItem value="occupied">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              Occupied
                            </span>
                          </SelectItem>
                          <SelectItem value="reserved">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              Reserved
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={!!editingSlot} onOpenChange={(open) => !open && setEditingSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Slot {editingSlot?.id}</DialogTitle>
          </DialogHeader>
          {editingSlot && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Zone</Label>
                <Input
                  value={editingSlot.zone}
                  onChange={(e) => setEditingSlot({ ...editingSlot, zone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Floor</Label>
                <Input
                  value={editingSlot.floor}
                  onChange={(e) => setEditingSlot({ ...editingSlot, floor: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSlot(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={!!updatingSlotId}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SlotManagement;
