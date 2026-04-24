import {
  createClient,
  hasSupabaseServerEnv,
  SUPABASE_CONFIG_ERROR,
} from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function TestPage() {
  if (!hasSupabaseServerEnv()) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
        <h1 className="mb-4 text-3xl font-bold">Supabase & Shadcn Test</h1>
        <div>
          <p style={{ color: "red", fontSize: "1.25rem" }}>
            ❌ Supabase not configured
          </p>
          <pre
            style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "8px" }}
          >
            {SUPABASE_CONFIG_ERROR}
          </pre>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  // Try a simple query to verify the connection
  const { error } = await supabase.from("_test_connection").select("*").limit(1);

  // If we get a "relation does not exist" error, that means Supabase IS connected
  // (it reached the database, just no table exists yet — which is expected)
  const isConnected = !error || error.code === "42P01" || error.code === "PGRST116" || error.code === "PGRST205";

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1 className="text-3xl font-bold mb-4">Supabase & Shadcn Test</h1>
      {isConnected ? (
        <div className="space-y-4">
          <p className="text-green-600 text-xl font-medium">
            ✅ Connected to Supabase successfully!
          </p>
          <Button variant="default">Shadcn Button Working</Button>
        </div>
      ) : (
        <div>
          <p style={{ color: "red", fontSize: "1.25rem" }}>
            ❌ Connection failed
          </p>
          <pre style={{ background: "#f5f5f5", padding: "1rem", borderRadius: "8px" }}>
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
