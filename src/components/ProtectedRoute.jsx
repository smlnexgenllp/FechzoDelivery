import { Navigate } from "react-router-dom";
import { usePartnerAuth } from "../context/PartnerAuthContext";

export default function PartnerProtectedRoute({ children }) {
  const { partner, loading } = usePartnerAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!partner) {
    return <Navigate to="/partner/login" replace />;
  }

  return children;
}
