import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Car, LayoutDashboard, ParkingCircle, ClipboardList, ChevronLeft, Search, Filter, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useRealtimeParking } from "@/hooks/useRealtimeParking";
import { updateBookingStatus } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import type { Booking } from "@/data/parkingData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BookingRecords = () => {
  const location = useLocation();
  const { bookings, error, isLoading, isRealtimeConnected } = useRealtimeParking();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);

  const sidebarLinks = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/slots", icon: ParkingCircle, label: "Slot Management" },
    { to: "/admin/bookings", icon: ClipboardList, label: "Booking Records" },
  ];

  const filteredBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        const normalizedSearch = searchTerm.toLowerCase();
        const matchesSearch =
          booking.vehicleNumber.toLowerCase().includes(normalizedSearch) ||
          booking.slotId.toLowerCase().includes(normalizedSearch) ||
          booking.id.toLowerCase().includes(normalizedSearch);
        const matchesStatus = filterStatus === "all" || booking.status === filterStatus;
        return matchesSearch && matchesStatus;
      }),
    [bookings, filterStatus, searchTerm],
  );

  const handleStatusChange = async (bookingId: string, status: Booking["status"]) => {
    setUpdatingBookingId(bookingId);

    try {
      await updateBookingStatus(bookingId, status);
      toast({
        title: "Booking Updated",
        description: `Booking ${bookingId} is now ${status}.`,
      });
    } catch (requestError) {
      toast({
        title: "Update Failed",
        description: requestError instanceof Error ? requestError.message : "Unable to update booking.",
        variant: "destructive",
      });
    } finally {
      setUpdatingBookingId(null);
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
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Booking Records
              </h1>
              <p className="text-muted-foreground">
                View and manage live parking booking records
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

          {error && (
            <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by vehicle, slot, or booking ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading live bookings...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead className="font-semibold">Booking ID</TableHead>
                    <TableHead className="font-semibold">Vehicle Number</TableHead>
                    <TableHead className="font-semibold">Slot ID</TableHead>
                    <TableHead className="font-semibold">Entry Time</TableHead>
                    <TableHead className="font-semibold">Exit Time</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-secondary/30 transition-colors">
                      <TableCell className="font-medium">{booking.id}</TableCell>
                      <TableCell className="font-mono text-sm">{booking.vehicleNumber}</TableCell>
                      <TableCell>{booking.slotId}</TableCell>
                      <TableCell>{booking.entryTime}</TableCell>
                      <TableCell>{booking.exitTime}</TableCell>
                      <TableCell className="min-w-36">
                        <Select
                          value={booking.status}
                          onValueChange={(value) => handleStatusChange(booking.id, value as Booking["status"])}
                          disabled={updatingBookingId === booking.id}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!isLoading && filteredBookings.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No booking records found</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Showing {filteredBookings.length} of {bookings.length} records
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingRecords;
