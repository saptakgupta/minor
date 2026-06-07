import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { AuthRole } from "@/lib/auth";

interface ProtectedRouteProps {
  allowedRoles: AuthRole[];
  children: ReactNode;
}

const getRoleHome = (role: AuthRole) => (role === "admin" ? "/admin" : "/availability");

const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
