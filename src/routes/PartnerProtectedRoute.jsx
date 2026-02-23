import { Navigate } from "react-router-dom";
import { usePartnerAuth } from "../context/PartnerAuthContext";

export default function PartnerProtectedRoute({ children }) {
  const { partner, loading } = usePartnerAuth();

  if (loading) return null; // or loader

  if (!partner) {
    return <Navigate to="/partner/login" replace />;
  }

  return children;
}
