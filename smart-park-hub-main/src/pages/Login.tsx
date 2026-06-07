import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Car, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { AuthRole, AuthUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const getRoleHome = (role: AuthRole) => (role === "admin" ? "/admin" : "/availability");

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState<AuthRole>(() => (searchParams.get("role") === "admin" ? "admin" : "user"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  const getRedirectTarget = (authenticatedUser: AuthUser) => {
    const state = location.state as { from?: { pathname: string; search?: string } } | null;
    const from = state?.from;

    if (!from) {
      return getRoleHome(authenticatedUser.role);
    }

    const requestedPath = `${from.pathname}${from.search || ""}`;
    if (authenticatedUser.role === "admin") {
      return from.pathname.startsWith("/admin") ? requestedPath : "/admin";
    }

    return from.pathname.startsWith("/admin") ? "/availability" : requestedPath;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const authenticatedUser = login({ email, password, role });
      toast({
        title: "Signed in",
        description: `Welcome back, ${authenticatedUser.name}.`,
      });
      navigate(getRedirectTarget(authenticatedUser), { replace: true });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
          <section className="hidden lg:block">
            <Link to="/" className="mb-10 inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-md">
                <Car className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">SmartPark</span>
            </Link>

            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <LockKeyhole className="h-4 w-4" />
                Secure access
              </div>
              <h1 className="mb-5 text-4xl font-extrabold leading-tight text-foreground md:text-5xl">
                Separate access for drivers and parking admins
              </h1>
              <p className="text-lg text-muted-foreground">
                Drivers can reserve slots after signing in. Admins get a protected operations panel for slots and bookings.
              </p>
            </div>
          </section>

          <Card className="w-full rounded-xl border-border/70 shadow-xl">
            <CardHeader className="space-y-3">
              <Link to="/" className="flex items-center gap-2 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                  <Car className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">SmartPark</span>
              </Link>
              <div>
                <CardTitle>Sign in</CardTitle>
                <CardDescription>Choose your account type and continue.</CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: "user", label: "User", icon: UserRound },
                    { value: "admin", label: "Admin", icon: ShieldCheck },
                  ] as const).map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRole(item.value)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold transition-all",
                        role === item.value
                          ? "border-primary bg-primary text-primary-foreground shadow-md"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={role === "admin" ? "admin email" : "user email"}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete={role === "admin" ? "current-password" : "current-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter password"
                    required
                  />
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : `Sign in as ${role === "admin" ? "Admin" : "User"}`}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                New user?{" "}
                <Link to="/register" className="font-semibold text-primary hover:underline">
                  Create an account
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
