import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Car, LayoutDashboard, ParkingCircle, ClipboardList, ChevronLeft, CheckCircle, Clock, Wifi, WifiOff } from "lucide-react";
import StatCard from "@/components/parking/StatCard";
import { cn } from "@/lib/utils";
import { useRealtimeParking } from "@/hooks/useRealtimeParking";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

const AdminDashboard = () => {
  const location = useLocation();
  const { slots, stats, bookings, error, isRealtimeConnected } = useRealtimeParking();

  const sidebarLinks = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/slots", icon: ParkingCircle, label: "Slot Management" },
    { to: "/admin/bookings", icon: ClipboardList, label: "Booking Records" },
  ];

  const pieData = [
    { name: "Available", value: stats.availableSlots, color: "#22c55e" },
    { name: "Occupied", value: stats.occupiedSlots, color: "#ef4444" },
    { name: "Reserved", value: stats.reservedSlots, color: "#f59e0b" },
  ];

  const barData = useMemo(() => {
    const zones = Array.from(new Set(slots.map((slot) => slot.zone))).sort();

    return zones.map((zone) => {
      const zoneSlots = slots.filter((slot) => slot.zone === zone);

      return {
        zone: `Zone ${zone}`,
        available: zoneSlots.filter((slot) => slot.status === "available").length,
        occupied: zoneSlots.filter((slot) => slot.status === "occupied").length,
        reserved: zoneSlots.filter((slot) => slot.status === "reserved").length,
      };
    });
  }, [slots]);

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
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Live overview of parking facility statistics and operations
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
              title="Active Bookings"
              value={stats.activeBookings}
              icon={Clock}
              color="warning"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4">Slot Occupancy</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 border border-border shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4">Zone-wise Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="zone" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="available" fill="#22c55e" name="Available" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="occupied" fill="#ef4444" name="Occupied" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="reserved" fill="#f59e0b" name="Reserved" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Recent Bookings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Booking ID</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Vehicle</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Slot</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Entry</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 5).map((booking) => (
                    <tr key={booking.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{booking.id}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{booking.vehicleNumber}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{booking.slotId}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{booking.entryTime}</td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "text-xs font-semibold px-2 py-1 rounded-full",
                            booking.status === "active" && "bg-emerald-100 text-emerald-700",
                            booking.status === "completed" && "bg-blue-100 text-blue-700",
                            booking.status === "cancelled" && "bg-red-100 text-red-700"
                          )}
                        >
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
