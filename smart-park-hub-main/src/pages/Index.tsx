import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Car, MapPin, Clock, Shield, ArrowRight, Zap, Users, BarChart3 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useRealtimeParking } from "@/hooks/useRealtimeParking";

const Index = () => {
  const { stats } = useRealtimeParking();
  const features = [
    {
      icon: MapPin,
      title: "Real-time Availability",
      description: "View live parking slot status across all zones and floors instantly.",
    },
    {
      icon: Clock,
      title: "Quick Booking",
      description: "Reserve your spot in seconds with our streamlined booking process.",
    },
    {
      icon: Shield,
      title: "Secure Parking",
      description: "24/7 monitored parking with advanced security systems.",
    },
    {
      icon: Zap,
      title: "Smart Navigation",
      description: "Get guided to your reserved slot with turn-by-turn directions.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 overflow-hidden">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                B.Tech Minor Project
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
                Smart Parking
                <span className="gradient-text block">Management System</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Find, reserve, and park smarter with our intelligent parking solution. 
                Real-time availability, instant booking, and seamless experience.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/availability">
                  <Button variant="hero" size="xl">
                    Find Parking
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/availability">
                  <Button variant="outline" size="xl">
                    View Availability
                  </Button>
                </Link>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative animate-slide-up stagger-2">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-3xl opacity-50" />
              <div className="relative bg-card rounded-2xl p-8 shadow-2xl border border-border/50">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Total Slots", value: stats.totalSlots, color: "text-primary" },
                    { label: "Available", value: stats.availableSlots, color: "text-emerald-600" },
                    { label: "Occupied", value: stats.occupiedSlots, color: "text-red-500" },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center p-4 bg-secondary/50 rounded-xl">
                      <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-12 rounded-lg flex items-center justify-center text-xs font-medium ${
                        i % 3 === 0
                          ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-200"
                          : i % 3 === 1
                          ? "bg-red-100 text-red-700 border-2 border-red-200"
                          : "bg-amber-100 text-amber-700 border-2 border-amber-200"
                      }`}
                    >
                      <Car className="w-4 h-4" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose SmartPark?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our smart parking system combines cutting-edge technology with user-friendly design 
              to make parking hassle-free.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="stat-card animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 md:p-12 text-primary-foreground">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {[
                { icon: Car, value: "500+", label: "Daily Vehicles" },
                { icon: Users, value: "1000+", label: "Happy Users" },
                { icon: BarChart3, value: "99%", label: "Uptime" },
              ].map((stat) => (
                <div key={stat.label}>
                  <stat.icon className="w-8 h-8 mx-auto mb-4 opacity-80" />
                  <p className="text-4xl font-bold mb-2">{stat.value}</p>
                  <p className="text-primary-foreground/80">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Car className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">SmartPark</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Smart Parking Management System — B.Tech Minor Project
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
