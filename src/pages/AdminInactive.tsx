import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function AdminInactive() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchRole = async () => {
      try {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        setRole(data?.role ?? null);
      } catch (e) {
        console.error("Failed to fetch role", e);
      } finally {
        setRoleLoading(false);
      }
    };
    fetchRole();
  }, [user, loading, navigate]);

  if (loading || roleLoading) {
    return <div className="p-8 text-center">Laddar...</div>;
  }

  if (role !== "admin") {
    return <div className="p-8 text-center text-red-600">Åtkomst nekad — admin krävs</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Inaktiva användare</h1>
      <p>Admin-check OK ✅ — logik kan byggas vidare härifrån.</p>
    </div>
  );
}
