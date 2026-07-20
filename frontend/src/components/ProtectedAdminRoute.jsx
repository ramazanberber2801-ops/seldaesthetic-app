import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedAdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] px-5 py-10">
        <div className="mx-auto max-w-md rounded-3xl border border-[#EBE5DC] bg-white p-6 text-sm text-[#6B655B]">
          Kontrollerer admin-tilgang …
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login?mode=login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/profil" replace />;
  }

  // Temporary compatibility for the existing Admin page component.
  // Access is still decided only by the verified Supabase admin role above.
  sessionStorage.setItem("seld_admin", "1");

  return children;
}
