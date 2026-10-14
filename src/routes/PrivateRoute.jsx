import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function PrivateRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Checking authentication...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }
  //   if (roles && !roles.includes(user.role)) {
  //   return <Navigate to="/" replace />;
  // }

  return <Outlet />;
}

export default PrivateRoute;